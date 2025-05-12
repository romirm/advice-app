import { genAI } from "./GeminiConfig.ts";
import type { AdviceResponse } from "../pages/Home.tsx";

export async function getAdvice(problem: string): Promise<AdviceResponse> {
  const prompt = `
  Given the following problem: "${problem}",
  
  Generate advice from each of the following perspectives:
  - Logical: Focus on facts, reason, and objective analysis. Identify patterns, inconsistencies, and cause-effect relationships.
  - Empathetic: Focus on emotions, human relationships, and personal well-being. Consider how the situation affects feelings and connections.
  - Strategic: Focus on long-term goals, planning, and optimal approaches. Consider different pathways to success and potential obstacles.
  
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

export interface Message {
  role: "user" | "ai";
  content: string;
}

export async function getContinuedAdvice(
  perspective: string, 
  history: Message[], 
  message: string
): Promise<string> {
  const contextMessages = history.map(msg => 
    `${msg.role === "user" ? "User" : "AI"}: ${msg.content}`
  ).join("\n");
  
  const perspectiveTraits = {
    "Logical": "analytical, rational, factual, objective, evidence-based, systematic thinking",
    "Empathetic": "compassionate, understanding, emotional, supportive, caring, relationship-focused",
    "Strategic": "goal-oriented, future-focused, practical, tactical, resource-aware, opportunity-seeking"
  };

  const traitDescription = perspectiveTraits[perspective as keyof typeof perspectiveTraits] || 
    "balanced, thoughtful, and helpful";

  const prompt = `
  You are an advisor with a ${perspective} perspective. Your responses should be ${traitDescription}.
  
  ${perspective === "Logical" ? 
    "Focus on facts, logic, and objective analysis. Identify patterns and cause-effect relationships." : 
    perspective === "Empathetic" ? 
    "Focus on emotions, relationships, and personal well-being. Consider how the situation affects feelings." :
    "Focus on long-term goals, optimal approaches, and strategic planning. Consider different pathways to success."}
  
  Previous conversation:
  ${contextMessages}
  
  User's new message: ${message}
  
  Respond from your ${perspective} perspective, maintaining the same tone and approach throughout.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error(`Failed to generate ${perspective} advice:`, error);
    return `(Unable to generate ${perspective} advice. Please try again.)`;
  }
}