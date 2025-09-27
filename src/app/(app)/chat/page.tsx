'use client';
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Send, User, Bot } from "lucide-react";
import { chatWithAi } from "@/ai/flows/chat-with-ai";

interface Message {
    role: 'user' | 'model';
    content: string;
}

export default function ChatPage() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Greet the user on component mount
    useEffect(() => {
        setMessages([{ role: 'model', content: "Hello! I'm your AI Assistant. How can I help you today?"}])
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);


    const handleSend = async () => {
        if (!input.trim() || !user) return;

        const userMessage: Message = { role: 'user', content: input };
        const newMessages: Message[] = [...messages, userMessage];
        
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const aiResponse = await chatWithAi({
                messages: newMessages,
            });

            setMessages(prev => [...prev, { role: 'model', content: aiResponse }]);

        } catch (error) {
            console.error("AI chat failed:", error);
            setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)]">
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-headline tracking-tight">
                    Chat with AI
                </h1>
                <p className="text-muted-foreground">
                    Ask questions and get answers from your AI assistant.
                </p>
            </div>
            
            <Card className="flex-1 flex flex-col">
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                             {msg.role === 'model' && (
                                <div className="p-2 rounded-full bg-primary text-primary-foreground">
                                    <Bot className="h-5 w-5" />
                                </div>
                            )}
                            <div className={`rounded-lg p-4 max-w-xl ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                             {msg.role === 'user' && (
                                <div className="p-2 rounded-full bg-muted text-foreground">
                                    <User className="h-5 w-5" />
                                </div>
                            )}
                        </div>
                    ))}
                     {loading && (
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-full bg-primary text-primary-foreground">
                                <Bot className="h-5 w-5" />
                            </div>
                            <div className="rounded-lg p-4 max-w-xl bg-muted flex items-center">
                                <Loader2 className="h-5 w-5 animate-spin"/>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>
                <div className="p-4 border-t">
                    <div className="relative">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
                            placeholder="e.g., 'What are the side effects of paracetamol?'"
                            className="pr-12"
                            disabled={loading}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
