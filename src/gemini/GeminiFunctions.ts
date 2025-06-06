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

  // Check if we've already asked enough questions (5 or more)
  if (Object.keys(currentContext).length >= 5) {
    console.log("INFO: Reached 3+ context entries, automatically proceeding to advice");
    return {
      hasEnoughInfo: true,
      reasoning: "Sufficient information has been gathered to provide advice. (reached 5+ context entries)"
    };
  }

  const prompt = `
  Given the following question: "${question}"
  
  Current context:
  ${contextString || "No additional context provided yet."}
  
  Your task is to determine if you have enough information to provide highly relevant, actionable advice for this user's specific situation, especially for interpersonal or relationship conflicts.

  If not, generate 1-5 follow-up questions that are as specific, concrete, and context-aware as possible. For each question:

  - Directly reference specific people, actions, events, or phrases from the user's input or context. Use the user's own words or details in your questions.
  - Ask about concrete actions, motivations, intentions, outcomes, or emotional reactions. For example: "When you mentioned [specific event], what did you do next?" or "How did [person] respond when you said [specific phrase]?"
  - If possible, hypothesize about missing details or likely scenarios based on the context, and ask clarifying questions about them.
  - Cover different angles: what the user has already tried, what the other party did, what outcome the user wants, and what obstacles exist.
  - Avoid any vague, generic, or repetitive questions. Do not ask for demographic/background info unless it is essential.
  - Each question must be unique, non-repetitive, and help uncover the most important missing information for tailored advice.

  IMPORTANT: Your goal is to act like a professional advisor, drilling down into the user's real-life context. The questions should help you get to the heart of the issue as quickly and specifically as possible, using the user's own words and details, and always tailoring it towards resolving interpersonal conflicts.
  
  Return your response as **pure JSON** in the exact format below:
  {
    "hasEnoughInfo": false,
    "followUpQuestions": [
      "Example: What is the main source of disagreement or tension between you and the other person?",
      "Example: How have you and the other party tried to resolve this so far?",
      "Example: What outcome would you ideally like to see in this relationship?"
    ],
    "reasoning": "Explanation of why these specific details are needed to provide tailored advice for resolving interpersonal conflict."
  }
  
  OR, if there's already enough information:
  {
    "hasEnoughInfo": true,
    "reasoning": "Explanation of why the current information is sufficient."
  }
  
  Limit follow-up questions to 1-5 of the most important, context-specific missing pieces of information, but do not generate unnecessary questions.
  Make sure the follow-up questions are highly tailored to the user's unique situation and problem, with a focus on interpersonal or relationship issues if applicable.
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
  Generate three distinct pieces of advice, each from a personalized and relevant perspective suited to the context. If the situation involves interpersonal or relationship conflict, prioritize advice that helps the user understand, navigate, and resolve these conflicts. Keep each of them around 2-3 sentences and the same length, fairly high-level but still reflecting the unique advice from that perspective.
  Your task is to first infer what roles or people would naturally have differing views on this situation 
  (e.g., a close friend, a professional expert, a family member, or a mediator), exclude religious or spiritual viewpoints unless they are explicitly relevant based on the problem description.
  and then generate advice that reflects their unique background, priorities, and relationship to the person experiencing the problem, with a focus on resolving interpersonal issues if relevant.
  Return your response as **pure JSON** in the exact format below.
  Do not include any markdown, code fences, or additional explanation.
  Only include the role or relationship (If you choose Legal Counsel for example don't name it Legal Counsel perspective only Legal Counsel as the name)

  {
  "perspectives": [
    {
      "name": "<Role or Relationship>",
      "advice": "..."
    },
    {
      "name": "<Role or Relationship>",
      "advice": "..."
    },
    {
      "name": "<Role or Relationship>",
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