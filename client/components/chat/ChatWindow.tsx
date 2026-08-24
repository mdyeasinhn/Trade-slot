"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, CreditCard, Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatMoney, formatTime, getTimezoneLabel } from "@/lib/format";
import { getOrCreateSenderId } from "@/lib/utils";
import { sendChatMessageAction } from "@/lib/actions/chat";
import type { ChatReply, ChatAction, ChatActionOption } from "@/lib/api/types";

interface Message {
  role: "user" | "assistant";
  content: string;
  actions?: ChatAction[];
  timestamp: Date;
}

export function ChatWindow({ traderId }: { traderId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [senderId] = useState(() => getOrCreateSenderId());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    const newMessages = [
      ...messages,
      { role: "user" as const, content: userMessage, timestamp: new Date() },
    ];
    setMessages(newMessages);

    try {
      const result = await sendChatMessageAction(traderId, senderId, userMessage);
      if (result.success && result.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.data!.text,
            actions: result.data!.actions,
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.error || "Something went wrong. Please try again.",
            timestamp: new Date(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to send message. Please check your connection.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionSelect = async (action: ChatAction, value: string) => {
    setIsLoading(true);
    try {
      const result = await sendChatMessageAction(traderId, senderId, value);
      if (result.success && result.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.data.text,
            actions: result.data.actions,
            timestamp: new Date(),
          },
        ]);
      }
    } catch {
      // Error handled by sendChatMessageAction
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentLink = (url: string) => {
    window.location.href = url;
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b">
        <h1 className="text-lg font-semibold">Book a Slot</h1>
        <p className="text-sm text-muted-foreground">Chat with our assistant to find and book a time slot</p>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>Start a conversation to find available slots</p>
            </div>
          )}
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} onActionSelect={handleActionSelect} onPayment={handlePaymentLink} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Separator />
      <div className="p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function MessageBubble({
  message,
  onActionSelect,
  onPayment,
}: {
  message: Message;
  onActionSelect: (action: ChatAction, value: string) => void;
  onPayment: (url: string) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "justify-end")}>
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2",
          isUser ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.actions && message.actions.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.actions.map((action, actionIndex) => (
              <ActionRenderer
                key={actionIndex}
                action={action}
                onSelect={onActionSelect}
                onPayment={onPayment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionRenderer({
  action,
  onSelect,
  onPayment,
}: {
  action: ChatAction;
  onSelect: (action: ChatAction, value: string) => void;
  onPayment: (url: string) => void;
}) {
  switch (action.type) {
    case "slot_choice":
      return (
        <div className="space-y-2">
          {action.options?.map((option: ChatActionOption) => (
            <Button
              key={option.value}
              variant="outline"
              className="w-full justify-start"
              onClick={() => onSelect(action, option.value)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span>{option.label}</span>
              {option.description && <span className="ml-2 text-xs text-muted-foreground">{option.description}</span>}
            </Button>
          ))}
        </div>
      );

    case "payment_link":
      return (
        <Button
          onClick={() => action.url && onPayment(action.url!)}
          className="w-full"
          size="lg"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Pay Now
        </Button>
      );

    case "text_prompt":
      return (
        <div className="space-y-2">
          {action.options?.map((option: ChatActionOption) => (
            <Button
              key={option.value}
              variant="outline"
              className="w-full justify-start"
              onClick={() => onSelect(action, option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      );

    default:
      return null;
  }
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}