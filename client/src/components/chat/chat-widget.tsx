import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/hooks/use-chat";
import { MessageSquare, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
  role: "doctor" | "patient";
}

export function ChatWidget({ role }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, isLoading, sendMessage } = useChat();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  console.log(messages);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (message.trim()) {
      sendMessage(message, role);
      setMessage("");
    }
  };

  return (
    <>
      {/* Chat Widget */}
      <div
        className={cn(
          "fixed bottom-0 right-0 w-80 bg-white rounded-t-lg shadow-lg transform transition-transform duration-300 ease-in-out z-40 md:right-4",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="bg-primary text-white p-3 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">AI Health Assistant</h3>
            <Button
              variant="ghost"
              size="icon"
              className="text-white h-6 w-6"
              onClick={toggleChat}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-3 h-80 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "p-3 rounded-lg mb-2 max-w-[80%]",
                msg.role === "user"
                  ? "bg-primary text-white ml-auto"
                  : "bg-neutral-light mr-auto text-black"
              )}
            >
              {msg.content}
            </div>
          ))}
          {isLoading && (
            <div className="bg-neutral-light p-3 rounded-lg mb-2 mr-auto max-w-[80%] animate-pulse">
              Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t border-neutral-light p-3">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Chat Toggle Button */}
      <Button
        onClick={toggleChat}
        className={cn(
          "fixed bottom-4 right-4 p-3 rounded-full shadow-lg z-50 hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200",
          isOpen ? "bg-primary-dark" : "bg-primary"
        )}
        size="icon"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageSquare className="h-5 w-5" />
        )}
      </Button>
    </>
  );
}
