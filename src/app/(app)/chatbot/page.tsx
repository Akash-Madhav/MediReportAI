'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { chatbot } from '@/ai/flows/chatbot';
import { Loader2, User, Bot } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Part } from 'genkit/content';

interface ChatMessage {
  role: 'user' | 'model';
  content: Part[];
}

export default function ChatbotPage() {
  const { displayUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content: [{ text: "Hello! I'm your AI Medical Assistant. I can answer basic health questions. How can I help you today? Please remember, for any serious concerns, you should consult a doctor." }],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: [{ text: input }],
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatbot({ messages: newMessages });
      const botMessage: ChatMessage = {
        role: 'model',
        content: [{ text: response }],
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error with chatbot:', error);
      const errorMessage: ChatMessage = {
        role: 'model',
        content: [{ text: 'Sorry, I encountered an error. Please try again.' }],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
    const getInitials = (name: string | null) => {
        if (!name) return 'U';
        const names = name.split(' ');
        if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.charAt(0).toUpperCase();
    }


  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-6rem)] gap-4">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          AI Medical Assistant
        </h1>
        <p className="text-muted-foreground">
          Ask general health questions.
        </p>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-4 ${
                message.role === 'user' ? 'justify-end' : ''
              }`}
            >
              {message.role === 'model' && (
                <Avatar className="h-9 w-9 border">
                   <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-md rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.content.map(c => c.text).join('')}</p>
              </div>
               {message.role === 'user' && displayUser && (
                <Avatar className="h-9 w-9 border">
                    <AvatarImage src={displayUser.photoURL || undefined} />
                   <AvatarFallback>{getInitials(displayUser.displayName)}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
           {isLoading && (
            <div className="flex items-start gap-4">
                <Avatar className="h-9 w-9 border">
                   <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3 flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin"/>
                </div>
            </div>
          )}
        </CardContent>
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question, e.g., 'What are the symptoms of a common cold?'"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              Send
            </Button>
          </form>
           <p className="text-xs text-muted-foreground mt-2 text-center">
            Disclaimer: This chatbot is for informational purposes only and is not a substitute for professional medical advice.
          </p>
        </div>
      </Card>
    </div>
  );
}
