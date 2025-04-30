import { genAI } from "./GeminiConfig.ts";

export async function getAdvice(problem: string): Promise<Record<string, string>> {
  const prompt = `
  Given the following problem: "${problem}",
  
  Generate advice from each of the following perspectives:
  - Logical
  - Empathetic
  - Strategic
  
  Return your response as **pure JSON** in the exact format below.
  Do not include any markdown, code fences, or additional explanation.
  
  {
    "perspectives": [
      {
        "name": "Logical",
        "advice": "..."
      },
      {
        "name": "Empathetic",
        "advice": "..."
      },
      {
        "name": "Strategic",
        "advice": "..."
      }
    ]
  }
  `;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    console.log("Raw Gemini Response:", text);

    text = text.trim();

    if (text.startsWith("```")) {
      text = text.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
    }

    const advice = JSON.parse(text);

    return advice;
  } catch (error) {
    console.error("Failed to generate advice:", error);
    throw error;
  }
}