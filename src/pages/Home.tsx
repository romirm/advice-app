import { useState, useEffect } from "react";
import InputBox from "../components/InputBox";
import { getAdvice, getContinuedAdvice, Message } from "../gemini/GeminiFunctions";
import { QueryHistoryItem } from "../utils/localQueryHistory";

interface Perspective {
  name: string;
  advice: string;
}

export interface AdviceResponse {
  perspectives: Perspective[];
}

interface HomeProps {
  initialQuery?: QueryHistoryItem | null;
  onSaveQuery?: (
    question: string, 
    perspectives: Perspective[], 
    selectedPerspective?: string | null, 
    conversation?: Message[]
  ) => Promise<string | null>;
  onUpdateConversation?: (
    queryId: string,
    selectedPerspective: string,
    conversation: Message[]
  ) => Promise<void>;
}

const Home = ({ initialQuery = null, onSaveQuery, onUpdateConversation }: HomeProps) => {
  const [advice, setAdvice] = useState<AdviceResponse | null>(null);
  const [mode, setMode] = useState<"multi" | "single">("multi");
  const [selectedPerspective, setSelectedPerspective] = useState<string | null>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userQuestion, setUserQuestion] = useState<string>("");
  const [queryId, setQueryId] = useState<string | null>(null);

  // Load initial query if provided
  useEffect(() => {
    if (initialQuery) {
      setUserQuestion(initialQuery.question);
      
      if (initialQuery.perspectives) {
        setAdvice({
          perspectives: initialQuery.perspectives
        });
      }
      
      if (initialQuery.selectedPerspective && initialQuery.conversation?.length > 0) {
        setSelectedPerspective(initialQuery.selectedPerspective);
        setHistory(initialQuery.conversation);
        setMode("single");
        setQueryId(initialQuery.id);
      }
    }
  }, [initialQuery]);

  // Multi-perspective advice mode
  const handleSend = async (message: string) => {
    setUserQuestion(message);
    setIsLoading(true);
    try {
      const result = await getAdvice(message);
      setAdvice(result);
      
      // Save to history if enabled
      if (onSaveQuery) {
        const newQueryId = await onSaveQuery(message, result.perspectives);
        setQueryId(newQueryId || null);
      }
    } catch (error) {
      console.error("Error fetching advice:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Single perspective deep conversation mode
  const handleSingleSend = async (message: string) => {
    if (!selectedPerspective) return;
    setIsLoading(true);
    
    const newHistory = [...history, { role: "user" as const, content: message }];
    setHistory(newHistory);
    
    try {
      const aiText = await getContinuedAdvice(selectedPerspective, newHistory, message);
      const updatedHistory = [...newHistory, { role: "ai" as const, content: aiText }];
      setHistory(updatedHistory);
      
      // Update conversation in history if enabled
      if (onUpdateConversation && queryId) {
        await onUpdateConversation(
          queryId,
          selectedPerspective,
          updatedHistory
        );
      }
    } catch (err) {
      setHistory([...newHistory, { role: "ai" as const, content: "(Request failed)" }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting a perspective for deep conversation
  const handleSelectPerspective = async (perspective: Perspective) => {
    setMode("single");
    setSelectedPerspective(perspective.name);
    
    const initialHistory = [
      { role: "user" as const, content: userQuestion },
      { role: "ai" as const, content: perspective.advice },
    ];
    
    setHistory(initialHistory);
    
    // Update history with selected perspective if enabled
    if (onSaveQuery && queryId) {
      await onUpdateConversation?.(
        queryId,
        perspective.name,
        initialHistory
      );
    } else if (onSaveQuery && advice) {
      // Create new entry with selected perspective
      const newQueryId = await onSaveQuery(
        userQuestion, 
        advice.perspectives,
        perspective.name,
        initialHistory
      );
      setQueryId(newQueryId || null);
    }
  };

  // Return to multi-perspective mode
  const handleBack = () => {
    setMode("multi");
    setSelectedPerspective(null);
    setHistory([]);
  };

  // Get perspective color
  const getPerspectiveColor = (name: string) => {
    switch (name) {
      case "Logical":
        return "text-blue-600";
      case "Empathetic":
        return "text-red-600";
      case "Strategic":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-bold">Welcome to Aptly!</h1>

      {/* Input area */}
      {mode === "multi" && (
        <div className="w-[837px]">
          <InputBox onSend={handleSend} />
          {isLoading && (
            <div className="mt-4 text-center text-gray-500">
              <div>Generating advice...</div>
            </div>
          )}
        </div>
      )}

      {/* Single perspective conversation mode */}
      {mode === "single" && (
        <div className="w-[837px]">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <span className={`font-semibold text-lg ${getPerspectiveColor(selectedPerspective || '')}`}>
                {selectedPerspective} Perspective
              </span>
            </div>
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={handleBack}>
              Back to All Perspectives
            </button>
          </div>
          
          {/* Conversation history */}
          <div className="bg-gray-50 rounded p-4 mb-4 min-h-[200px] max-h-[400px] overflow-y-auto">
            {history.map((msg, idx) => (
              <div 
                key={idx} 
                className={`p-2 ${
                  msg.role === "user" 
                    ? "text-right" 
                    : "text-left"
                }`}
              >
                <div className="font-medium">{msg.role === "user" ? "You" : selectedPerspective}</div>
                <div>{msg.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="p-2 text-left">
                <div className="font-medium">{selectedPerspective}</div>
                <div>...</div>
              </div>
            )}
          </div>
          
          {/* Input box */}
          <InputBox onSend={handleSingleSend} />
        </div>
      )}

      {/* Multi-perspective advice display */}
      {mode === "multi" && advice && advice.perspectives && advice.perspectives.length > 0 && (
        <div className="mt-2 p-5 w-[837px] border">
          <h2 className="text-xl font-bold mb-4">Advice from Different Perspectives:</h2>
          <div>
            {advice.perspectives.map((perspectiveObj) => (
              <div 
                key={perspectiveObj.name} 
                className="p-4 mb-4 border-b"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-semibold text-lg capitalize ${getPerspectiveColor(perspectiveObj.name)}`}>
                    {perspectiveObj.name}
                  </h3>
                  <button
                    className="px-3 py-1 bg-blue-500 text-black font-medium rounded"
                    onClick={() => handleSelectPerspective(perspectiveObj)}
                  >
                    Continue
                  </button>
                </div>
                <p>{perspectiveObj.advice}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;