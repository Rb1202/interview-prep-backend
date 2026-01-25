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
    res.status(500).json({
      message: "Failed to generate questions",
      error: error.message,
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

    console.log("Calling AI with prompt length:", prompt.length);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    console.log("Response type:", typeof response);
    console.log("Response keys:", Object.keys(response || {}));
    
    // Try different ways to access the text
    let rawText = null;
    if (response && response.text) {
      rawText = response.text;
    } else if (response && typeof response === 'string') {
      rawText = response;
    } else if (response && response.response && response.response.text) {
      rawText = response.response.text;
    } else {
      console.error("Unexpected response structure:", JSON.stringify(response, null, 2));
      return res.status(500).json({
        message: "Failed to generate explanation",
        error: "Unexpected response format from AI model",
        details: "Response structure: " + JSON.stringify(Object.keys(response || {})),
      });
    }
    
    if (!rawText) {
      console.error("No text in response:", JSON.stringify(response, null, 2));
      return res.status(500).json({
        message: "Failed to generate explanation",
        error: "No text received from AI model",
      });
    }
    
    console.log("Raw text received, length:", rawText.length);
    
    //Clean it:Remove ```json and  ``` from beginning and end
    const cleanedText = rawText
      .replace(/^```json\s*/, "") //remove starting ``` json
      .replace(/```$/, "") //remove ending ```
      .trim();

    console.log("Cleaned text length:", cleanedText.length);
    console.log("First 200 chars:", cleanedText.substring(0, 200));

    //Now safe to parse
    const data = JSON.parse(cleanedText);
    console.log("Successfully parsed JSON");
    res.status(200).json(data);
  } catch (error) {
    console.error("Error generating explanation:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Failed to generate explanation",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

module.exports = { generateInterviewQuestions, generateConceptExplanation };
