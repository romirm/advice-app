import { useState, useRef, useEffect } from "react";

interface InputBoxProps {
  onSend: (message: string) => void;
}

const InputBox = ({ onSend }: InputBoxProps) => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

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

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;
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
    <div className="flex justify-center">
  <div className="relative w-[837px] h-[155px] bg-white dark:bg-neutral-900 shadow-lg border border-gray-300 dark:border-neutral-700 rounded-xl p-4">
    <textarea
      ref={messageInputRef}
      placeholder="Send a message..."
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyDown={handleKeyDown}
      rows={1}
      className="w-full h-full pr-12 resize-none overflow-hidden rounded-md bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-neutral-100 placeholder-gray-500 dark:placeholder-gray-400 px-4 py-3 text-sm outline-none"
    />
    <button
      onClick={handleSend}
      className="absolute bottom-6 right-6 p-0 w-10 h-10 rounded-full transition-colors"
    >
      <svg
        viewBox="0 0 24 24"
        className="w-10 h-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="12"
          className="fill-black dark:fill-white"
        />
        {isLoading ? (
          <svg
            className="absolute top-1.5 left-1.5 animate-spin h-7 w-7"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16 8 8 0 01-8-8z"
            />
          </svg>
        ) : (
          <path
            d="M8 12h8m0 0l-4-4m4 4l-4 4"
            stroke="white"
            className="dark:stroke-black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  </div>
</div>
  );
};

export default InputBox;
