'use client';

import { useState, useRef, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Send, X, Loader2, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { assistant } from "@/ai/flows/assistant";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'model';
  content: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { displayUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await assistant({ messages: newMessages });
      const botMessage: Message = { role: 'model', content: response };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Assistant error:", error);
      const errorMessage: Message = { role: 'model', content: "Sorry, I'm having trouble connecting. Please try again later." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <div className="fixed bottom-6 left-6 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="w-80 h-[28rem] bg-card rounded-lg shadow-2xl flex flex-col origin-bottom-left"
            >
              <header className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <Bot className="h-6 w-6 text-primary" />
                  <h3 className="font-semibold text-lg">AI Assistant</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </header>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                   <div className="text-center text-muted-foreground pt-16">
                     <Bot className="h-10 w-10 mx-auto mb-2"/>
                     <p>Ask me about the app or general health topics!</p>
                   </div>
                )}
                {messages.map((msg, index) => (
                  <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'model' && <Bot className="h-5 w-5 text-primary shrink-0 mt-1" />}
                    <div className={cn("p-3 rounded-lg max-w-xs text-sm", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                      {msg.content}
                    </div>
                    {msg.role === 'user' && <UserIcon className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />}
                  </div>
                ))}
                {loading && (
                    <div className="flex items-start gap-3 justify-start">
                        <Bot className="h-5 w-5 text-primary shrink-0 mt-1" />
                        <div className="p-3 rounded-lg bg-muted">
                            <Loader2 className="h-5 w-5 animate-spin"/>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSubmit} className="p-4 border-t flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={loading}
                />
                <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 20 }}
        >
          <Button
            size="icon"
            className="rounded-full w-14 h-14 shadow-lg"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Chatbot"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
          </Button>
        </motion.div>
      </div>
    </>
  );
}
