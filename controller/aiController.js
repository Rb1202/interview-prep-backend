const { GoogleGenAI } = require("@google/genai");
const {
  conceptExplainPrompt,
  questionAnswerPrompt,
} = require("../utils/prompts");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

//@desc Generate interview questions and answeres using Gemini
//@route POST/api/ai/generate-questions
//@access Private

const generateInterviewQuestions = async (req, res) => {
  try {
    const { role, experience, topicsToFocus, numberOfQuestions } = req.body;

    if (!role || !experience || !topicsToFocus || !numberOfQuestions) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const prompt = questionAnswerPrompt(
      role,
      experience,
      topicsToFocus,
      numberOfQuestions
    );

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    let rawText = response.text;

    // Clean it: Remove ```json and ``` from beginning and end
    const cleanedText = rawText
      .replace(/^```json\s*/, "") //remove starting ``` json
      .replace(/```$/, "") //remove ending ```
      .trim();

    //Now safe to parse
    const data = JSON.parse(cleanedText);
    res.status(200).json(data);
  } catch (error) {
    // Check if it's a quota/rate limit error
    let errorMessage = error.message;
    let statusCode = 500;
    
    if (error.message && (error.message.includes("quota") || error.message.includes("429"))) {
      statusCode = 429; // Too Many Requests
      errorMessage = "API quota exceeded. Please wait a moment and try again, or check your Google AI Studio billing plan.";
    }
    
    res.status(statusCode).json({
      message: "Failed to generate questions",
      error: errorMessage,
    });
  }
};

//@desc Generate explain a interview question
//@route POST/api/ai/generate-explanation
//@access Private
const generateConceptExplanation = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const prompt = conceptExplainPrompt(question);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    let rawText = response.text;
    
    if (!rawText) {
      console.error("No text in response:", JSON.stringify(response, null, 2));
      return res.status(500).json({
        message: "Failed to generate explanation",
        error: "No text received from AI model",
      });
    }
    
    //Clean it:Remove ```json and  ``` from beginning and end
    const cleanedText = rawText
      .replace(/^```json\s*/, "") //remove starting ``` json
      .replace(/```$/, "") //remove ending ```
      .trim();

    //Now safe to parse
    const data = JSON.parse(cleanedText);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error generating explanation:", error);
    console.error("Error message:", error.message);
    
    // Check if it's a quota/rate limit error
    let errorMessage = error.message;
    let statusCode = 500;
    let retryAfter = null;
    
    if (error.message && error.message.includes("quota")) {
      statusCode = 429; // Too Many Requests
      errorMessage = "API quota exceeded. Please wait a moment and try again, or check your Google AI Studio billing plan.";
      
      // Try to extract retry delay from error
      try {
        const errorObj = JSON.parse(error.message);
        if (errorObj?.error?.details) {
          const retryInfo = errorObj.error.details.find(d => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo");
          if (retryInfo?.retryDelay) {
            retryAfter = retryInfo.retryDelay;
          }
        }
      } catch (e) {
        // If parsing fails, check for retry delay in message
        const retryMatch = error.message.match(/Please retry in ([\d.]+)s/);
        if (retryMatch) {
          retryAfter = Math.ceil(parseFloat(retryMatch[1]));
        }
      }
    } else if (error.message && error.message.includes("429")) {
      statusCode = 429;
      errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
    }
    
    res.status(statusCode).json({
      message: "Failed to generate explanation",
      error: errorMessage,
      retryAfter: retryAfter,
      ...(retryAfter && { 
        retryMessage: `Please try again in ${retryAfter} seconds.` 
      }),
    });
  }
};

module.exports = { generateInterviewQuestions, generateConceptExplanation };
