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
      <h1 className="text-3xl font-bold">Welcome to Aptly!</h1>
      <InputBox />
    </div>
  );
};

export default Home;