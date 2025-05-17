import React, { createContext, useState } from "react";
import { apiRequest } from "./queryClient";

const openai_api = import.meta.env.VITE_REACT_APP_OPENAI_API;
const nigga = import.meta.env.VITE_NIGGA;

console.log(openai_api);

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string, role?: string) => Promise<void>;
  clearMessages: () => void;
}

export const ChatContext = createContext<ChatContextType>({
  messages: [],
  isLoading: false,
  sendMessage: async () => {
    throw new Error("ChatContext not initialized");
  },
  clearMessages: () => {
    throw new Error("ChatContext not initialized");
  },
});

interface ChatProviderProps {
  children: React.ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your health assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string, role: string = "user") => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user" as const,
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openai_api}`,
          },
          body: JSON.stringify({
            model: "gpt-4.1",
            messages: [
              {
                role: "user",
                content: content,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("OpenAI API error: " + (await response.text()));
      }

      const result = await response.json();
      console.log("OpenAI API response:", result);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.choices[0].message.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message to the chatbot:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }

    // const data = await response.json();

    // return data.choices[0].message.content;
  };

  const clearMessages = () => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: "Hello! I'm your health assistant. How can I help you today?",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <ChatContext.Provider
      value={{ messages, isLoading, sendMessage, clearMessages }}
    >
      {children}
    </ChatContext.Provider>
  );
}
