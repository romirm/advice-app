import { useState } from "react";
import InputBox from "../components/InputBox";
import { getAdvice } from "../gemini/GeminiFunctions";

interface Perspective {
  name: string;
  advice: string;
}

export interface AdviceResponse {
  perspectives: Perspective[];
}

const Home = () => {
  const [advice, setAdvice] = useState<AdviceResponse | null>(null);

  const handleSend = async (message: string) => {
    try {
      const result = await getAdvice(message);
      if (result?.perspectives && Array.isArray(result.perspectives)) {
        setAdvice(result);
      } else {
        console.warn("No valid perspectives returned.");
        setAdvice(null);
      }
    } catch (error) {
      console.error("Error fetching advice:", error);
    }
  };

  const renderAdviceCards = () => {
    if (!advice?.perspectives || advice.perspectives.length === 0) return null;

    return advice.perspectives.map((p) => (
      <div
        key={p.name}
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow hover:shadow-lg transition"
      >
        <h3 className="text-indigo-400 text-lg font-medium capitalize mb-1">{p.name}</h3>
        <p className="text-zinc-200 leading-relaxed">{p.advice}</p>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-12 flex flex-col items-center gap-10">
      <h1 className="text-4xl font-bold tracking-tight">Welcome to <span className="text-indigo-400">Aptly</span></h1>
      <p className="text-zinc-400 text-lg text-center max-w-2xl">
      </p>

      <InputBox onSend={handleSend} />

      {advice?.perspectives?.length > 0 && (
        <div className="w-full max-w-3xl mt-4 space-y-4">
          <h2 className="text-2xl font-semibold mb-2 border-b border-zinc-700 pb-2">Advice Perspectives</h2>
          {renderAdviceCards()}
        </div>
      )}
    </div>
  );
};

export default Home;
