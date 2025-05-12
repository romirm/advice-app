import { useState, useRef } from "react";

interface InputBoxProps {
  onSend: (message: string) => void;
}

const InputBox = ({ onSend }: InputBoxProps) => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsLoading(true);
    await onSend(message);
    setMessage("");
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-lg">
      <textarea
        placeholder="Ask for advice..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        ref={messageInputRef}
        rows={4}
        className="w-full text-base bg-transparent text-white placeholder-zinc-400 resize-none outline-none"
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={handleSend}
          disabled={isLoading}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition 
            ${isLoading
              ? "bg-zinc-600 cursor-not-allowed text-white"
              : "bg-indigo-500 hover:bg-indigo-400 text-white"
            }`}
        >
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            "↑"
          )}
        </button>
      </div>
    </div>
  );
};

export default InputBox;
