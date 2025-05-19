import { genAI } from "./GeminiConfig.ts";
import type { AdviceResponse } from "../pages/Home.tsx";

export interface Message {
  role: "user" | "ai";
  content: string;
}

export interface InformationAssessment {
  hasEnoughInfo: boolean;
  followUpQuestions?: string[];
  reasoning?: string;
}


export async function assessInformationNeeds(
  question: string,
  currentContext: Record<string, string> = {}
): Promise<InformationAssessment> {
  const contextString = Object.entries(currentContext)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
  
  console.log("Current context being assessed:", currentContext);
  console.log("Context entries count:", Object.keys(currentContext).length);

  // Check if we've already asked enough questions (3 or more)
  if (Object.keys(currentContext).length >= 3) {
    console.log("INFO: Reached 3+ context entries, automatically proceeding to advice");
    return {
      hasEnoughInfo: true,
      reasoning: "Sufficient information has been gathered to provide advice."
    };
  }

  const prompt = `
  Given the following question: "${question}"
  
  Current context:
  ${contextString || "No additional context provided yet."}
  
  Determine if there is enough information to provide meaningful advice on this question.
  Consider what important contextual information is missing that would significantly improve the quality of advice.
  
  IMPORTANT: If you already have some basic information or the question is straightforward, lean towards saying there is enough info.
  Only ask for more information if it's absolutely critical to providing relevant advice.
  
  Return your response as **pure JSON** in the exact format below:
  
  {
    "hasEnoughInfo": false,
    "followUpQuestions": [
      "What is your age?",
      "What are your career interests?",
      "What is your financial situation?"
    ],
    "reasoning": "Explanation of why this information is needed to provide good advice"
  }
  
  OR, if there's already enough information:
  
  {
    "hasEnoughInfo": true,
    "reasoning": "Explanation of why the current information is sufficient"
  }
  
  Limit follow-up questions to 2-5 of the MOST important missing pieces of information.
  Make sure the follow-up questions are specific and directly related to the user's situation.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    if (text.startsWith("```")) {
      text = text.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(text);
    console.log("Information assessment result:", parsed);
    return parsed;
  } catch (error) {
    console.error("Failed to assess information needs:", error);
    // If there's an error, just return hasEnoughInfo: true to prevent being stuck
    return {
      hasEnoughInfo: true,
      reasoning: "Error assessing information needs, proceeding with available information."
    };
  }
}

export async function getAdvice(problem: string, context: Record<string, string> = {}): Promise<AdviceResponse> {
  const contextString = Object.entries(context)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
  
  console.log("=== Getting Advice ===");
  console.log("Problem:", problem);
  console.log("contextString:", contextString);
  const prompt = `
  Given the following situation: "${problem}".
  Additional context: ${contextString || "No additional context provided."}
  Generate three distinct pieces of advice, each from a personalized and relevant perspective suited to the context. Keep each of them around 2-3 sentences and the same length, fairly high-level but still reflecting the unique advice from that perspective.
  Your task is to first infer what roles or people would naturally have differing views on this situation 
  (e.g., a close friend, a professional expert, a family member), exclude religious or spiritual viewpoints unless they are explicitly relevant based on the problem description.
  and then generate advice that reflects their unique background, priorities, and relationship to the person experiencing the problem.
  Return your response as **pure JSON** in the exact format below.
  Do not include any markdown, code fences, or additional explanation.
  
  {
  "perspectives": [
    {
      "name": "<Perspective 1 Name> (<Role or Relationship>)",
      "advice": "..."
    },
    {
      "name": "<Perspective 2 Name> (<Role or Relationship>)",
      "advice": "..."
    },
    {
      "name": "<Perspective 3 Name> (<Role or Relationship>)",
      "advice": "..."
    }
  ]
  }
  `;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    console.log("Sending prompt to Gemini...");
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
  
  Format your response in a clear, structured way with EXACTLY this format:
  1. A brief introduction (1 sentence only)
  2. 2-3 key points as bullet points, each starting with "- " (dash followed by space) on its own line
  3. A brief conclusion or action step (1 sentence only)
  
  Example format:
  Brief introduction sentence.
  
  - First key point with specific advice.
  - Second key point with specific advice.
  - Third key point with specific advice.
  
  Brief conclusion or next step.
  
  IMPORTANT: Each bullet point MUST start with "- " on its own line. Do not use "*" or other bullet point styles.
  Keep your response concise and direct while maintaining your ${perspective} perspective.
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