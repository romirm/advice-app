import { useState, useRef } from "react"

const InputBox = () => {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null)

  const handleSend = () => {
    if (!message.trim()) return
    setIsLoading(true)
    setTimeout(() => {
      console.log("Sent:", message)
      setMessage("")
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="relative w-[837px] h-[155px] bg-white shadow-lg border border-gray-300 rounded-xl p-4">
      <textarea
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        ref={messageInputRef}
        className="w-full h-full text-lg text-black bg-transparent outline-none resize-none z-10 relative"
      />
      <div className="absolute right-4 top-4 z-20">
        <button
          className={`w-8 h-10 flex items-center justify-center text-lg font-semibold rounded-full transition  
            ${isLoading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gray-900 hover:bg-gray-700 cursor-pointer"
            }`}
          onClick={handleSend}
          disabled={isLoading}
        >
          {isLoading ? "..." : "↑"}
        </button>
      </div>
    </div>
  )
}

export default InputBox