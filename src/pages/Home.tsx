import { useState, useEffect } from "react";
import InputBox from "../components/InputBox";
import { getAdvice, getContinuedAdvice, Message, assessInformationNeeds } from "../gemini/GeminiFunctions";
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
    conversation?: Message[],
    context?: Record<string, string>
  ) => Promise<string | null>;
  onUpdateConversation?: (
    queryId: string,
    selectedPerspective: string,
    conversation: Message[]
  ) => Promise<void>;
}

const Home = ({ initialQuery = null, onSaveQuery, onUpdateConversation }: HomeProps) => {
  const [advice, setAdvice] = useState<AdviceResponse | null>(null);
  const [mode, setMode] = useState<"multi" | "single" | "gathering">("multi");
  const [selectedPerspective, setSelectedPerspective] = useState<string | null>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userQuestion, setUserQuestion] = useState<string>("");
  const [queryId, setQueryId] = useState<string | null>(null);
  const [displayedTitle, setDisplayedTitle] = useState<JSX.Element | string>("");
  const [displayedSubtitle, setDisplayedSubtitle] = useState<string>("");


  // New states for information gathering
  const [userContext, setUserContext] = useState<Record<string, string>>({});
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gatheringHistory, setGatheringHistory] = useState<Message[]>([]);
  const [infoAssessmentReasoning, setInfoAssessmentReasoning] = useState<string>("");
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
      // Load context if available
      if (initialQuery.context) {
        setUserContext(initialQuery.context);
      }
    }
  }, [initialQuery]);

  useEffect(() => {
    const plainText = "Welcome to ";
    const styledText = "Aptly!";
    const colors = ["text-red-500", "text-orange-500", "text-yellow-500", "text-green-500", "text-blue-500", "text-purple-500"];

    let i = 0;
    let interval: NodeJS.Timeout;

    interval = setInterval(() => {
      if (i <= plainText.length) {
        setDisplayedTitle(plainText.slice(0, i));
      } else if (i <= plainText.length + styledText.length) {
        const index = i - plainText.length;
        const visibleStyled = styledText.slice(0, index);
        const coloredLetters = visibleStyled.split("").map((char, idx) => (
          <span key={idx} className={colors[idx % colors.length]}>
            {char}
          </span>
        ));

        setDisplayedTitle(
          <>
            {plainText}
            {coloredLetters}
          </>
        );
      } else {
        clearInterval(interval);
        animateSubtitle(); // Start subtitle after title
      }
      i++;
    }, 80);

    return () => clearInterval(interval);
  }, []);

  const animateSubtitle = () => {
    const subtitleText = "Discover advice from multiple perspectives.";
    let j = 0;

    const subtitleInterval = setInterval(() => {
      setDisplayedSubtitle(subtitleText.slice(0, j));
      if (j >= subtitleText.length) {
        clearInterval(subtitleInterval);
      }
      j++;
    }, 30);
  };
  const handleInitialQuestion = async (message: string) => {
    setUserQuestion(message);
    setIsLoading(true);
    console.log("=== Initial Question ===");
    console.log("Question:", message);

    try {
      // Check if we need more information
      console.log("Assessing information needs...");
      const assessment = await assessInformationNeeds(message);
      console.log("Initial assessment result:", assessment);

      if (assessment.hasEnoughInfo) {
        // If we have enough info, proceed to advice generation
        console.log("Information assessment: Enough information to proceed directly to advice");
        const result = await getAdvice(message);
        console.log("Advice generated:", result);
        setAdvice(result);
        if (onSaveQuery) {
          const newQueryId = await onSaveQuery(message, result.perspectives, null, undefined, {});
          setQueryId(newQueryId || null);
        }
      } else {
        // If we need more info, start the gathering phase
        console.log("Information assessment: Need more information");
        console.log("Follow-up questions:", assessment.followUpQuestions);

        setMode("gathering");
        setFollowUpQuestions(assessment.followUpQuestions || []);
        setCurrentQuestionIndex(0);
        setInfoAssessmentReasoning(assessment.reasoning || "");

        // Add the initial question to the gathering history
        // Create separate bubbles for explanation and question
        const initialHistory = [
          { role: "user" as const, content: message },
          {
            role: "ai" as const,
            content: `I'd like to understand your situation better to provide the most relevant advice. ${assessment.reasoning}`
          },
          {
            role: "ai" as const,
            content: assessment.followUpQuestions?.[0] || "What additional information can you provide?"
          }
        ];

        setGatheringHistory(initialHistory);
      }
    } catch (error) {
      console.error("Error in initial assessment:", error);
      // In case of error, proceed directly to advice generation
      try {
        console.log("Error in assessment, proceeding directly to advice generation");
        const result = await getAdvice(message);
        setAdvice(result);
        if (onSaveQuery) {
          const newQueryId = await onSaveQuery(message, result.perspectives, null, undefined, {});
          setQueryId(newQueryId || null);
        }
      } catch (adviceError) {
        console.error("Failed to generate advice after assessment error:", adviceError);
      }
    } finally {
      setIsLoading(false);
    }
  };
  // Handle answering a follow-up question
  const handleFollowUpAnswer = async (answer: string) => {
    setIsLoading(true);

    // Store the answer in context
    const currentQuestion = followUpQuestions[currentQuestionIndex];
    const updatedContext = {
      ...userContext,
      [currentQuestion]: answer
    };
    setUserContext(updatedContext);
    console.log("=== Information Gathering Update ===");
    console.log("Added answer to context:", { question: currentQuestion, answer });
    console.log("Updated context:", updatedContext);
    console.log("Context entries count:", Object.keys(updatedContext).length);

    // Update gathering history
    const updatedHistory = [
      ...gatheringHistory,
      { role: "user" as const, content: answer }
    ];

    // Check if we have more questions
    if (currentQuestionIndex < followUpQuestions.length - 1) {
      // Move to next question
      const nextIndex = currentQuestionIndex + 1;
      const nextQuestion = followUpQuestions[nextIndex];
      console.log("Moving to next question:", { index: nextIndex, question: nextQuestion });
      updatedHistory.push({
        role: "ai" as const,
        content: nextQuestion
      });

      setGatheringHistory(updatedHistory);
      setCurrentQuestionIndex(nextIndex);
      setIsLoading(false);
    } else {
      // We've collected all the information, now generate advice
      try {
        // Set a maximum of 5 context entries to prevent endless loops
        if (Object.keys(updatedContext).length >= 5) {
          console.log("Maximum context entries (5) reached, forcing proceed to advice");
          const result = await getAdvice(userQuestion, updatedContext);
          setAdvice(result);
          setMode("multi");

          if (onSaveQuery) {
            const newQueryId = await onSaveQuery(
              userQuestion,
              result.perspectives,
              null,
              undefined,
              updatedContext
            );
            setQueryId(newQueryId || null);
          }
        } else {
          // Final assessment to see if we need even more information
          console.log("Running final information needs assessment");
          const finalAssessment = await assessInformationNeeds(userQuestion, updatedContext);

          console.log("Final assessment result:", finalAssessment);

          // Force proceed to advice if we've already collected at least 2 pieces of information
          const contextSize = Object.keys(updatedContext).length;
          if (finalAssessment.hasEnoughInfo || contextSize >= 2) {
            console.log(`Proceeding to advice: hasEnoughInfo=${finalAssessment.hasEnoughInfo}, contextSize=${contextSize}`);

            // Generate advice with the context we've gathered
            const result = await getAdvice(userQuestion, updatedContext);
            setAdvice(result);
            setMode("multi");

            if (onSaveQuery) {
              const newQueryId = await onSaveQuery(
                userQuestion,
                result.perspectives,
                null,
                undefined,
                updatedContext
              );
              setQueryId(newQueryId || null);
            }
          } else {
            // We need even more information, but with a lower threshold
            // Limit to max 1 more question
            console.log("Need more information, but limiting to 1 more question");
            const limitedQuestions = (finalAssessment.followUpQuestions || []).slice(0, 1);

            console.log("Limited follow-up questions:", limitedQuestions);

            setFollowUpQuestions(limitedQuestions);
            setCurrentQuestionIndex(0);
            setInfoAssessmentReasoning(finalAssessment.reasoning || "");

            if (finalAssessment.reasoning) {
              updatedHistory.push({
                role: "ai" as const,
                content: `I need a bit more information. ${finalAssessment.reasoning}`
              });
            }

            updatedHistory.push({
              role: "ai" as const,
              content: limitedQuestions[0] || "Is there anything else important about your situation?"
            });

            setGatheringHistory(updatedHistory);
          }
        }
      } catch (error) {
        console.error("Error generating advice after info gathering:", error);
        // In case of error, proceed to advice generation anyway with what we have
        try {
          console.log("Error in follow-up assessment, proceeding to advice with current context");
          const result = await getAdvice(userQuestion, updatedContext);
          setAdvice(result);
          setMode("multi");

          if (onSaveQuery) {
            const newQueryId = await onSaveQuery(
              userQuestion,
              result.perspectives,
              null,
              undefined,
              updatedContext
            );
            setQueryId(newQueryId || null);
          }
        } catch (secondError) {
          console.error("Second error trying to generate advice:", secondError);
          updatedHistory.push({
            role: "ai" as const,
            content: "I'm having trouble processing this information. Let's try a different approach."
          });
          setGatheringHistory(updatedHistory);
          setMode("multi");
        } finally {
          setIsLoading(false);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const logContextUpdate = (context: Record<string, string>, label = "Context Update") => {
    console.log(`=== ${label} ===`);
    console.log("Context entries:", Object.keys(context).length);
    console.log("Context data:", context);

    // Create a formatted string for better visibility in console
    const formattedContext = Object.entries(context)
      .map(([key, value], index) => `  ${index + 1}. "${key}": "${value}"`)
      .join("\n");

    console.log("Formatted context:\n" + formattedContext);
  };

  // Add this to handleSkipGathering
  const handleSkipGathering = async () => {
    setIsLoading(true);
    logContextUpdate(userContext, "Skipping to Advice with Context");

    try {
      const result = await getAdvice(userQuestion, userContext);
      console.log("Skip to advice - generated result:", result);
      setAdvice(result);
      setMode("multi");

      if (onSaveQuery) {
        const newQueryId = await onSaveQuery(
          userQuestion,
          result.perspectives,
          null,
          undefined,
          userContext
        );
        setQueryId(newQueryId || null);
      }
    } catch (error) {
      console.error("Error skipping to advice:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Restart information gathering
  const handleRestartGathering = () => {
    setUserContext({});
    setCurrentQuestionIndex(0);
    setGatheringHistory([
      { role: "user" as const, content: userQuestion },
      {
        role: "ai" as const,
        content: `I'd like to understand your situation better. ${infoAssessmentReasoning}`
      },
      {
        role: "ai" as const,
        content: followUpQuestions[0] || "What would you like to share about your situation?"
      }
    ]);
  };
  const handleSend = async (message: string) => {
    handleInitialQuestion(message);
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
      const newQueryId = await onSaveQuery(userQuestion, advice.perspectives, perspective.name, initialHistory, userContext);
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
  const renderChatMessage = (msg: Message, idx: number, perspective?: string) => {
    return (
      <div key={idx} className={`my-4 ${msg.role === "user" ? "ml-auto" : "mr-auto"}`}>
        <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[80%] rounded-2xl p-4 
              ${msg.role === "user"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : `bg-gray-100 dark:bg-neutral-800 text-black dark:text-white ${perspective ? `border-l-4 ${getPerspectiveBorderColor(perspective)}` : ""}`
              }`
            }
          >
            {msg.role === "user" ? (
              <div>{msg.content}</div>
            ) : (
              <div className="whitespace-pre-line text-left">
                {msg.content.split('\n').map((line, i) => {
                  if (line.startsWith('- ')) {
                    return (
                      <div key={i} className="ml-2 mt-1 flex">
                        <span className="mr-2">•</span>
                        <span>{line.substring(2)}</span>
                      </div>
                    );
                  } else {
                    return <div key={i}>{line}</div>;
                  }
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getPerspectiveBorderColor = (name: string) => {
    switch (name) {
      case "Logical": return "border-blue-600";
      case "Empathetic": return "border-red-600";
      case "Strategic": return "border-green-600";
      default: return "border-gray-600";
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen px-4 py-12 text-center bg-transparent text-gray-900 dark:text-white transition-colors">
      <div className="w-full px-6">
        <h1 className="text-4xl font-bold h-16">
          {displayedTitle}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg h-6">
          {displayedSubtitle}
        </p>

        {mode === "multi" && !advice?.perspectives && (
          <div className="mt-8">
            <InputBox onSend={handleSend} />
            {isLoading && (
              <div className="mt-8 text-center">
                <div className="inline-block animate-spin rounded-full border-t-4 border-blue-500 border-opacity-50 h-12 w-12"></div>
                <p className="mt-4 text-gray-500 dark:text-gray-400">Analyzing your question...</p>
              </div>
            )}
          </div>
        )}
        {mode === "gathering" && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <span className="font-semibold text-xl text-indigo-600">
                Understanding Your Situation
              </span>
              <div>
                <button
                  className="px-4 py-2 text-sm bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 mr-3"
                  onClick={handleRestartGathering}
                >
                  Restart
                </button>
                <button
                  className="px-4 py-2 text-sm bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-100"
                  onClick={handleSkipGathering}
                >
                  Skip to Advice
                </button>
              </div>
            </div>

            <div className="bg-transparent rounded-lg mb-6 min-h-[300px] max-h-[500px] overflow-y-auto">
              {gatheringHistory.map((msg, idx) => renderChatMessage(msg, idx))}

              {isLoading && (
                <div className="flex justify-start my-4">
                  <div className="bg-gray-100 dark:bg-neutral-800 rounded-2xl p-4 text-black dark:text-white max-w-[80%]">
                    <div className="flex space-x-2">
                      <span className="w-2 h-2 rounded-full animate-bounce bg-gray-400 dark:bg-gray-500 [animation-delay:0s]" />
                      <span className="w-2 h-2 rounded-full animate-bounce bg-gray-400 dark:bg-gray-500 [animation-delay:0.1s]" />
                      <span className="w-2 h-2 rounded-full animate-bounce bg-gray-400 dark:bg-gray-500 [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <InputBox
                onSend={handleFollowUpAnswer}
                placeholder="Type your answer here..."
              />

              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-left">
                <p>Question {currentQuestionIndex + 1} of {followUpQuestions.length}</p>
              </div>
            </div>
          </div>
        )}
        {mode === "single" && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <span className={`font-semibold text-xl ${getPerspectiveColor(selectedPerspective || '')}`}>
                {selectedPerspective}
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
                  <div className="text-gray-800 dark:text-gray-100">
                    {msg.role === "user" ? msg.content : (
                      <div className="whitespace-pre-line">
                        {msg.content.split('\n').map((line, i) => {
                          if (line.startsWith('- ')) {
                            return (
                              <div key={i} className="ml-2 mt-1 flex">
                                <span className="mr-2">•</span>
                                <span>{line.substring(2)}</span>
                              </div>
                            );
                          } else {
                            return <div key={i}>{line}</div>;
                          }
                        })}
                      </div>
                    )}
                  </div>
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

        {mode === "multi" && advice?.perspectives && advice.perspectives.length > 0 && (
          <div className="mt-12 w-full">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-left">
              Advice from Different Perspectives
            </h2>

            {Object.keys(userContext).length > 0 && (
              <div className="mb-6 p-5 bg-gray-50 dark:bg-gray-800 rounded-lg text-left border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-3">Your Information</h3>
                <ul className="space-y-2">
                  {Object.entries(userContext).map(([question, answer]) => (
                    <li key={question} className="flex flex-col">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{question}</span>
                      <span className="text-gray-800 dark:text-gray-200">{answer}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-row gap-6 overflow-x-auto pb-4">
              {advice.perspectives.map((perspectiveObj) => (
                <div
                  key={perspectiveObj.name}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 flex flex-col justify-between"
                >
                  <div>
                    <h3 className={`text-lg font-semibold mb-3 ${getPerspectiveColor(perspectiveObj.name)}`}>
                      {perspectiveObj.name}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-left">
                      {perspectiveObj.advice}
                    </p>
                  </div>
                  <div className="mt-5 text-right">
                    <button
                      className={`px-4 py-2 rounded-lg text-sm font-medium 
                        ${perspectiveObj.name === "Logical"
                          ? "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800"
                          : perspectiveObj.name === "Empathetic"
                            ? "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800"
                            : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800"
                        }`
                      }
                      onClick={() => handleSelectPerspective(perspectiveObj)}
                    >
                      Continue
                    </button>
                  </div>
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
