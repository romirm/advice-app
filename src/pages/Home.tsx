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
  const [displayedText, setDisplayedText] = useState<string>("");

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateDarkModeClass = () => {
      if (darkModeMediaQuery.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    updateDarkModeClass();
    darkModeMediaQuery.addEventListener('change', updateDarkModeClass);
    return () => darkModeMediaQuery.removeEventListener('change', updateDarkModeClass);
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setUserQuestion(initialQuery.question);
      if (initialQuery.perspectives) {
        setAdvice({ perspectives: initialQuery.perspectives });
      }
      if (initialQuery.selectedPerspective && initialQuery.conversation?.length > 0) {
        setSelectedPerspective(initialQuery.selectedPerspective);
        setHistory(initialQuery.conversation);
        setMode("single");
        setQueryId(initialQuery.id);
      }
    }
  }, [initialQuery]);

  useEffect(() => {
    const plainText = "Welcome to ";
    const styledText = "Aptly!";
    const fullText = plainText + styledText;
    let i = 0;
    let interval: NodeJS.Timeout;

    // eslint-disable-next-line prefer-const
    interval = setInterval(() => {
      if (i <= plainText.length) {
        setDisplayedText(fullText.slice(0, i));
      } else if (i <= fullText.length) {
        setDisplayedText(
          <>
            {plainText}
            <span className="text-indigo-600">{fullText.slice(plainText.length, i)}</span>
          </>
        );
      } else {
        clearInterval(interval);
      }
      i++;
    }, 80);

    return () => clearInterval(interval);
  }, []);

  const handleSend = async (message: string) => {
    setUserQuestion(message);
    setIsLoading(true);
    try {
      const result = await getAdvice(message);
      setAdvice(result);
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

  const handleSingleSend = async (message: string) => {
    if (!selectedPerspective) return;
    setIsLoading(true);
    const newHistory = [...history, { role: "user" as const, content: message }];
    setHistory(newHistory);
    try {
      const aiText = await getContinuedAdvice(selectedPerspective, newHistory, message);
      const updatedHistory = [...newHistory, { role: "ai" as const, content: aiText }];
      setHistory(updatedHistory);
      if (onUpdateConversation && queryId) {
        await onUpdateConversation(queryId, selectedPerspective, updatedHistory);
      }
    } catch {
      setHistory([...newHistory, { role: "ai" as const, content: "(Request failed)" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPerspective = async (perspective: Perspective) => {
    setMode("single");
    setSelectedPerspective(perspective.name);
    const initialHistory = [
      { role: "user" as const, content: userQuestion },
      { role: "ai" as const, content: perspective.advice },
    ];
    setHistory(initialHistory);
    if (onSaveQuery && queryId) {
      await onUpdateConversation?.(queryId, perspective.name, initialHistory);
    } else if (onSaveQuery && advice) {
      const newQueryId = await onSaveQuery(userQuestion, advice.perspectives, perspective.name, initialHistory);
      setQueryId(newQueryId || null);
    }
  };

  const handleBack = () => {
    setMode("multi");
    setSelectedPerspective(null);
    setHistory([]);
  };

  const getPerspectiveColor = (name: string) => {
    switch (name) {
      case "Logical": return "text-blue-600";
      case "Empathetic": return "text-red-600";
      case "Strategic": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen px-4 py-12 text-center bg-transparent text-gray-900 dark:text-white transition-colors">
      <div className="w-full max-w-3xl">
        <h1 className="text-4xl font-bold h-16">
          {displayedText}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
          Discover advice from multiple perspectives.
        </p>

        {mode === "multi" && (
          <div className="mt-8">
            <InputBox onSend={handleSend} />
            {isLoading && <div className="mt-4 text-center text-gray-500 dark:text-gray-400">Generating advice...</div>}
          </div>
        )}

        {mode === "single" && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <span className={`font-semibold text-xl ${getPerspectiveColor(selectedPerspective || '')}`}>
                {selectedPerspective} Perspective
              </span>
              <button
                className="px-3 py-1 text-sm bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 rounded border border-gray-300 dark:border-gray-500"
                onClick={handleBack}
              >
                Back to All Perspectives
              </button>
            </div>

            <div className="bg-transparent rounded p-4 mb-4 min-h-[200px] max-h-[400px] overflow-y-auto text-left">
              {history.map((msg, idx) => (
                <div key={idx} className={`p-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                  <div className="font-medium text-gray-700 dark:text-gray-300">{msg.role === "user" ? "You" : selectedPerspective}</div>
                  <div className="text-gray-800 dark:text-gray-100">{msg.content}</div>
                </div>
              ))}
              {isLoading && (
                <div className="p-2 text-left text-gray-600 dark:text-gray-400">
                  <div className="font-medium">{selectedPerspective}</div>
                  <div>...</div>
                </div>
              )}
            </div>

            <InputBox onSend={handleSingleSend} />
          </div>
        )}

        {mode === "multi" && advice?.perspectives?.length > 0 && (
          <div className="mt-12 bg-transparent rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Advice from Different Perspectives
            </h2>
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {advice.perspectives.map((perspectiveObj) => (
                <div key={perspectiveObj.name} className="py-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-lg font-semibold capitalize ${getPerspectiveColor(perspectiveObj.name)}`}>
                      {perspectiveObj.name}
                    </h3>
                    <button
                      className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-sm rounded border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-100 font-medium"
                      onClick={() => handleSelectPerspective(perspectiveObj)}
                    >
                      Continue
                    </button>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-left">{perspectiveObj.advice}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
