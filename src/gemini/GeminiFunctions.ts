import { genAI } from "./GeminiConfig.ts";

export async function getAdvice(problem: string): Promise<Record<string, string>> {
  const prompt = `
Given the following problem: "${problem}",
generate advice from these perspectives:
- Logical
- Empathetic
- Strategic

Return the response in pure JSON format, without any explanation or formatting.
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