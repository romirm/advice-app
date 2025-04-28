import { useState } from "react";
import InputBox from "../components/InputBox";
import { getAdvice } from "../gemini/GeminiFunctions";

interface Perspective {
  name: string;
  advice: string;
}

interface AdviceResponse {
  perspectives: Perspective[];
}

const Home = () => {
  const [advice, setAdvice] = useState<AdviceResponse | null>(null);

  const handleSend = async (message: string) => {
    try {
      const result = await getAdvice(message);
      setAdvice(result);
    } catch (error) {
      console.error("Error fetching advice:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-bold">Welcome to the Advice App</h1>

      <InputBox onSend={handleSend} />

      {advice?.perspectives && advice.perspectives.length > 0 && (
        <div className="mt-6 p-4 rounded-xl shadow-inner w-[837px]">
          <h2 className="text-xl font-bold mb-2">Advice:</h2>
          {advice.perspectives.map((perspectiveObj) => (
            <div key={perspectiveObj.name} className="mb-4">
              <h3 className="font-semibold capitalize">{perspectiveObj.name}</h3>
              <p>{perspectiveObj.advice}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;