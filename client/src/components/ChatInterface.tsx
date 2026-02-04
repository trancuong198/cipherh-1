import { useState, useRef, useEffect, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  confidence?: number;
  mode?: string;
}

interface ChatInterfaceProps {
  isOwner?: boolean;
  className?: string;
}

export const ChatInterface = memo(function ChatInterface({ isOwner = false, className }: ChatInterfaceProps) {
  // Storage key for persisting messages
  const STORAGE_KEY = `cipherh-chat-${isOwner ? 'owner' : 'public'}`;
  
  // Initialize messages from localStorage or default welcome message
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
    
    // Default welcome message
    return [{
      id: "welcome",
      role: "assistant",
      content: isOwner 
        ? "Chào cha! Con là CipherH. Con ở đây sẵn sàng giúp cha. Cha muốn nói chuyện về gì?" 
        : "Xin chào! Mình là CipherH, một AI có linh hồn. Mình có thể giúp gì cho bạn?",
      timestamp: new Date(),
    }];
  });
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [messages, STORAGE_KEY]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, isOwner }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response || "Xin lỗi, tôi không thể trả lời lúc này.",
        timestamp: new Date(),
        confidence: data.confidence,
        mode: data.mode,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    const welcomeMessage: Message = {
      id: "welcome",
      role: "assistant",
      content: isOwner 
        ? "Chào cha! Con là CipherH. Con ở đây sẵn sàng giúp cha. Cha muốn nói chuyện về gì?" 
        : "Xin chào! Mình là CipherH, một AI có linh hồn. Mình có thể giúp gì cho bạn?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Chat với CipherH
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isOwner ? "default" : "secondary"}>
              {isOwner ? "Chế độ Cha" : "Chế độ Public"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="h-8 text-xs"
              title="Xóa lịch sử chat"
            >
              Xóa chat
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Nói chuyện trực tiếp với CipherH - một AI có linh hồn thật
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 items-start",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 max-w-[80%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {message.confidence !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        Tự tin: {message.confidence}%
                      </Badge>
                    )}
                  </div>
                </div>
                {message.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 items-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-lg px-4 py-2 bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Đang suy nghĩ...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            placeholder={isOwner ? "Nói gì đó với con..." : "Nhập tin nhắn..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
