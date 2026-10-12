import { useEffect, useMemo, useState } from "react";
import { Bot, ChevronDown, MessageCircle, Sparkles, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import type { PublicFeatureKey } from "@shared/feature-visibility";

const DEFAULT_EXAMPLES = [
  "How do I apply to become a courier?",
  "What documents do drivers need?",
  "When will customer bookings open?",
];

const featureAwareExamples = (visibility?: Partial<Record<PublicFeatureKey, boolean>>) => {
  const examples = [...DEFAULT_EXAMPLES];
  if (visibility?.fleet_registration) examples.splice(2, 0, "How can I register my fleet?");
  return examples.slice(0, 4);
};

export function PublicAssistant({ visibility }: { visibility?: Partial<Record<PublicFeatureKey, boolean>> }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi, I’m the Mzansi Couriers assistant. I can explain courier onboarding, driver requirements, and what is currently open to the public.",
    },
  ]);
  const assistant = trpc.ai.publicAssistant.useMutation({
    onSuccess: (result) => {
      setMessages((current) => [...current, { role: "assistant", content: result.answer }]);
    },
    onError: () => {
      setMessages((current) => [...current, { role: "assistant", content: "I’m temporarily unavailable. Please use Support or the courier application for help." }]);
    },
  });
  const analytics = trpc.ai.publicAssistantAnalytics.useMutation();
  const examples = useMemo(() => featureAwareExamples(visibility), [visibility]);

  const openAssistant = () => {
    setOpen(true);
    void analytics.mutateAsync({ event: "opened" }).catch(() => undefined);
  };

  useEffect(() => {
    const timer = window.setTimeout(openAssistant, 650);
    return () => window.clearTimeout(timer);
  }, []);

  const sendMessage = (content: string) => {
    const nextMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    void analytics.mutateAsync({ event: "prompt_submitted" }).catch(() => undefined);
    const assistantMessages = nextMessages.filter((message): message is Extract<Message, { role: "user" | "assistant" }> => message.role !== "system");
    assistant.mutate({ messages: assistantMessages.map(({ role, content: text }) => ({ role, content: text })) });
  };

  return (
    <aside className="fixed bottom-3 right-3 z-[60] max-w-[calc(100vw-1.5rem)] sm:bottom-6 sm:right-6" aria-label="Mzansi Couriers AI assistant">
      {open ? (
        <div className="w-[min(calc(100vw-1.5rem),360px)] max-h-[min(430px,calc(100vh-1.5rem))] overflow-hidden rounded-2xl border border-emerald-950/15 bg-card shadow-2xl shadow-emerald-950/20">
          <div className="flex items-center justify-between bg-emerald-950 px-3 py-2.5 text-white sm:px-4 sm:py-3">
            <div className="flex min-w-0 items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/20"><Bot className="h-4 w-4 text-emerald-200" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold">Mzansi Assistant</p><p className="text-[11px] text-emerald-100/75">Public information only</p></div></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Minimise assistant" className="rounded-md p-1.5 text-emerald-100 transition hover:bg-white/10 hover:text-white"><ChevronDown className="h-4 w-4" /></button>
          </div>
          <AIChatBox
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={assistant.isPending}
            height="min(30vh, 220px)"
            placeholder="Ask about courier onboarding…"
            emptyStateMessage="Ask about the Mzansi courier network"
            suggestedPrompts={examples}
            className="rounded-none border-0 shadow-none"
          />
          <p className="border-t bg-muted/30 px-3 py-1.5 text-[10px] leading-4 text-muted-foreground sm:px-4 sm:py-2">The assistant follows the features Admin has made public. It cannot access accounts, private parcels, or Admin controls.</p>
        </div>
      ) : (
        <button type="button" onClick={openAssistant} className="group flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/25 transition hover:-translate-y-0.5 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2" aria-label="Open Mzansi Couriers assistant">
          <MessageCircle className="h-5 w-5" /><span>Ask Mzansi</span><Sparkles className="h-3.5 w-3.5 text-emerald-200 transition group-hover:rotate-12" />
        </button>
      )}
    </aside>
  );
}
