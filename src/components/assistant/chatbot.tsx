'use client';
import { useState, useRef, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Send, X, Loader2, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { assistant } from "@/ai/flows/assistant";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";

type Message = {
    role: 'user' | 'model';
    content: string;
};

export function Chatbot() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
             if (messages.length === 0) {
                setMessages([
                    { role: 'model', content: "Hello! I'm MediBot. How can I help you today? You can ask me about your reports or general health topics." }
                ]);
            }
        }
    }, [isOpen, messages]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !user) return;

        const userMessage: Message = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            // We only send the history that doesn't include the initial greeting
            const history = newMessages.filter(m => m.content !== "Hello! I'm MediBot. How can I help you today? You can ask me about your reports or general health topics.");
            
            const response = await assistant({ userId: user.uid, messages: history });
            const botMessage: Message = { role: 'model', content: response };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: Message = { role: 'model', content: "Sorry, something went wrong. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    size="icon"
                    className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
                </Button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-24 right-6 z-50 w-full max-w-sm"
                    >
                        <div className="bg-card border rounded-lg shadow-xl flex flex-col h-[60vh]">
                            <header className="p-4 border-b flex items-center gap-3">
                                <Bot className="h-6 w-6 text-primary" />
                                <h3 className="font-semibold text-lg">AI Assistant</h3>
                            </header>

                            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                                {messages.map((msg, index) => (
                                    <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                         {msg.role === 'model' && (
                                            <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                                                <AvatarFallback><Bot size={20}/></AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div
                                            className={cn(
                                                "p-3 rounded-lg max-w-xs md:max-w-sm text-sm",
                                                msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'
                                            )}
                                        >
                                            {msg.content}
                                        </div>
                                         {msg.role === 'user' && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback><UserIcon size={20}/></AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                ))}
                                {loading && (
                                     <div className="flex items-start gap-3 justify-start">
                                        <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                                            <AvatarFallback><Bot size={20}/></AvatarFallback>
                                        </Avatar>
                                        <div className="p-3 rounded-lg max-w-xs bg-muted rounded-bl-none">
                                            <Loader2 className="h-5 w-5 animate-spin" />
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
                                    placeholder="Ask about your reports..."
                                    className="flex-1 p-2 border rounded-md focus:ring-primary focus:border-primary text-sm"
                                />
                                <Button type="submit" size="icon" disabled={loading}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
