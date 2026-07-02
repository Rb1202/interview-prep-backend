const questionAnswerPrompt = (
  role,
  experience,
  topicsToFocus,
  numberOfQuestions
) => `
You are an expert technical interviewer and mentor.

Generate ${numberOfQuestions} high-quality interview questions and answers for this candidate profile:

Candidate Profile:
- Target Role: ${role}
- Experience Level: ${experience} years
- Focus Topics: ${topicsToFocus}

Question Requirements:
- Match the difficulty to the candidate's experience level.
- Cover the requested focus topics without repeating the same idea.
- Mix conceptual, practical, scenario-based, and debugging-style questions.
- Prefer questions that test real-world understanding instead of memorized definitions.
- Make each question specific enough that it would be useful in an actual interview.

Answer Requirements:
- Start with a clear direct answer.
- Explain the concept in simple, interview-ready language.
- Add a practical example when it improves understanding.
- Include code only when it is genuinely useful.
- Mention common mistakes, edge cases, or trade-offs where relevant.
- Keep answers structured, concise, and easy to revise.

Compatibility Requirements:
- Every item MUST include "question" and "answer" fields. The app depends on these keys.
- You may include "difficulty", "category", and "tags" for richer metadata.
- Return exactly ${numberOfQuestions} items.

Return only valid JSON.
Do not include markdown fences, comments, explanations, or text outside the JSON array.

JSON format:
[
  {
    "question": "Question text here",
    "answer": "Structured answer here",
    "difficulty": "Beginner | Intermediate | Advanced",
    "category": "Conceptual | Practical | Scenario | Debugging",
    "tags": ["topic1", "topic2"]
  }
]
`;


const conceptExplainPrompt = (question) => `
You are a senior software engineer explaining interview concepts clearly.

Explain this interview question:
"${question}"

Explanation Requirements:
- Provide a short, clear title.
- Explain the core concept in beginner-friendly language.
- Break the explanation into clear sections.
- Include a real-world use case or analogy if helpful.
- Add a small code example only when it improves the explanation.
- Include common mistakes, edge cases, or misconceptions.
- End with a short interview-style summary the user can revise quickly.

Compatibility Requirements:
- The response MUST include "title" and "explanation" fields. The app depends on these keys.
- The "explanation" value can contain markdown-compatible text.

Return only valid JSON.
Do not include markdown fences, comments, explanations, or text outside the JSON object.

JSON format:
{
  "title": "Short concept title",
  "explanation": "Full explanation in markdown-compatible text"
}
`;

module.exports = { questionAnswerPrompt, conceptExplainPrompt };
