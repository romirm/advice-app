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
      className="w-full h-full pr-12 resize-none overflow-hidden rounded-md bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-neutral-100 placeholder-gray-500 dark:placeholder-gray-400 px-4 py-3 text-lg outline-none"
    />
    <button
  onClick={handleSend}
  className="absolute bottom-6 right-6 p-0 w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-200 !bg-black dark:!bg-white hover:opacity-80"
>
  {isLoading ? (
    <div className="flex space-x-1">
      <span className="w-2 h-2 rounded-full animate-bounce !bg-white dark:!bg-black [animation-delay:0s]" />
      <span className="w-2 h-2 rounded-full animate-bounce !bg-white dark:!bg-black [animation-delay:0.1s]" />
      <span className="w-2 h-2 rounded-full animate-bounce !bg-white dark:!bg-black [animation-delay:0.2s]" />
    </div>
  ) : (
    <svg
      viewBox="0 0 24 24"
      className="w-15 h-15"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 12h8m0 0l-4-4m4 4l-4 4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="!stroke-white dark:!stroke-black"
      />
    </svg>
  )}
</button>

  </div>
</div>
  );
};

export default InputBox;
