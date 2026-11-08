import { useState, useRef, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetOpenaiConversation,
  useCreateOpenaiConversation,
  getGetOpenaiConversationQueryKey,
  getListMemoriesQueryKey,
  getListOpenaiConversationsQueryKey,
  OpenaiMessage,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Menu, ChevronDown, X, CornerUpLeft, Mic, MicOff, Volume2, VolumeX, Paperclip } from "lucide-react";
import { Markdown } from "./markdown";
import { MessageBubble } from "./message-bubble";
import { GeometricBackground } from "./geometric-bg";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";
import { brandAsset } from "@/lib/brand-assets";

const MODELS = [
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", badge: "Fast" },
  { id: "gemini-3-flash-preview", label: "Gemini 3 Flash", badge: "Preview" },
] as const;

type ModelId = (typeof MODELS)[number]["id"];
type AcademicContext = "school" | "college" | "university";

const CONTEXT_PROMPTS: Record<AcademicContext, string[]> = {
  school: [
    "Explain photosynthesis in simple steps for a school student.",
    "Help me solve 3/4 + 2/5 step by step.",
    "Create a short practice quiz about fractions.",
    "Help me plan revision for my next science exam.",
    "Explain the difference between a noun and a verb with examples.",
    "Help me outline a school essay about environmental protection.",
  ],
  college: [
    "Explain Newton's laws with intermediate-level examples.",
    "Walk me through solving a quadratic equation, showing each step.",
    "Create exam practice questions about organic chemistry.",
    "Help me build a revision plan for my intermediate exams.",
    "Help me strengthen an argument about renewable energy for an essay.",
    "Explain how loops work in programming with a practical example.",
  ],
  university: [
    "Suggest a focused research question about social media and student learning.",
    "Explain a university-level concept and identify its key assumptions.",
    "Show me a useful structure for a literature review on renewable energy.",
    "Explain how to improve clarity and argument structure in academic writing.",
    "Create a focused study plan for my upcoming university exam.",
    "Explain a suitable research method for studying student learning outcomes.",
  ],
};

const SUGGESTED_PROMPTS_EN = [
  { variants: ["I just finished matric — what should I do next?", "I passed my 10th class, where do I go from here?", "What are my options after matric in Pakistan?"] },
  { variants: ["Which colleges are best for FSc Pre-Medical in Lahore?", "Top intermediate colleges for Pre-Engineering in Karachi?", "Best government colleges for FSc in Pakistan?"] },
  { variants: ["What is the difference between FSc, ICS, and FA?", "Which intermediate program should I choose after matric?", "I want to do engineering — should I take FSc or ICS?"] },
  { variants: ["What are NUST admission requirements for Computer Science?", "How do I get into NUST for CS?", "What entry test do I need for NUST NET?"] },
  { variants: ["Which universities in Pakistan offer BS Computer Science?", "Compare FAST, NUST, COMSATS, and LUMS for CS", "Top CS universities in Pakistan for 2024?"] },
  { variants: ["What scholarships are available for Pakistani students?", "How to apply for an HEC scholarship?", "Which universities offer need-based financial aid?"] },
  { variants: ["What is the MDCAT exam and how do I prepare?", "How to get into Aga Khan University for medicine?", "What marks do I need for King Edward Medical University?"] },
  { variants: ["What engineering universities are best in Pakistan?", "Compare GIKI, UET, and NED for engineering?", "What is the entry test for GIKI?"] },
  { variants: ["How is merit calculated for public universities?", "What FSc marks do I need for UET Lahore?", "Explain how merit lists work in Pakistan"] },
  { variants: ["What is the fee structure at LUMS?", "How much does a semester at COMSATS cost?", "Which universities have the lowest fees in Pakistan?"] },
  { variants: ["I don't know what field to study — can you help me decide?", "How do I choose between engineering and medicine?", "What careers are in demand in Pakistan right now?"] },
  { variants: ["What is the CSS exam and how do I start preparing?", "How to apply for government jobs after graduation?", "What are the best career paths after a BS degree?"] },
];

const SUGGESTED_PROMPTS_UR = [
  { variants: ["میں نے ابھی میٹرک مکمل کی — اب میں کیا کروں؟", "میں نے 10ویں جماعت پاس کر لی، اب کیا کروں؟", "پاکستان میں میٹرک کے بعد میرے کیا آپشنز ہیں؟"] },
  { variants: ["لاہور میں FSc پری میڈیکل کے لیے بہترین کالج؟", "کراچی میں پری انجینئرنگ کے لیے بہترین کالج؟", "پاکستان میں FSc کے بہترین سرکاری کالج؟"] },
  { variants: ["FSc، ICS اور FA میں کیا فرق ہے؟", "میٹرک کے بعد کون سا پروگرام منتخب کروں؟", "انجینئرنگ کرنا ہے — FSc یا ICS؟"] },
  { variants: ["NUST میں CS داخلے کی شرائط کیا ہیں؟", "NUST میں CS کے لیے کیسے داخلہ لوں؟", "NUST NET کے لیے کون سا ٹیسٹ چاہیے؟"] },
  { variants: ["پاکستان میں BS CS کون سی یونیورسٹیاں پیش کرتی ہیں؟", "CS کے لیے FAST، NUST، COMSATS اور LUMS کا موازنہ", "پاکستان کی بہترین CS یونیورسٹیاں؟"] },
  { variants: ["پاکستانی طلباء کے لیے کون سے وظائف ہیں؟", "HEC وظیفے کے لیے کیسے درخواست دوں؟", "کون سی یونیورسٹیاں ضرورت پر مبنی امداد پیش کرتی ہیں؟"] },
  { variants: ["MDCAT کیا ہے اور تیاری کیسے کروں؟", "آغا خان یونیورسٹی میں طب کے لیے کیسے داخلہ لوں؟", "King Edward Medical University کے لیے کتنے نمبر چاہئیں؟"] },
  { variants: ["پاکستان میں بہترین انجینئرنگ یونیورسٹیاں کون سی ہیں؟", "انجینئرنگ کے لیے GIKI، UET اور NED کا موازنہ؟", "GIKI کا داخلہ ٹیسٹ کیا ہے؟"] },
  { variants: ["سرکاری یونیورسٹیوں کے لیے میرٹ کیسے حساب ہوتی ہے؟", "UET لاہور کے لیے FSc میں کتنے نمبر چاہئیں؟", "پاکستان میں میرٹ لسٹ کیسے کام کرتی ہے؟"] },
  { variants: ["LUMS کی فیس کا ڈھانچہ کیا ہے؟", "COMSATS میں ایک سمسٹر کتنا مہنگا ہے؟", "پاکستان میں سب سے کم فیس والی یونیورسٹیاں؟"] },
  { variants: ["مجھے نہیں پتا کون سا شعبہ پڑھوں — مدد کریں؟", "انجینئرنگ اور طب میں سے کیسے چنوں؟", "پاکستان میں ابھی کون سے شعبے زیادہ مانگ میں ہیں؟"] },
  { variants: ["CSS امتحان کیا ہے اور تیاری کیسے شروع کروں؟", "گریجویشن کے بعد سرکاری نوکری کے لیے کیسے درخواست دوں؟", "BS ڈگری کے بعد بہترین کیریئر کے راستے؟"] },
];

function pickVariant(variants: readonly string[]) {
  return variants[Math.floor(Math.random() * variants.length)];
}

interface ChatAreaProps {
  conversationId: number | null;
  onOpenSidebar: () => void;
  onConversationCreated?: (id: number) => void;
}

export function ChatArea({ conversationId, onOpenSidebar, onConversationCreated }: ChatAreaProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { language, setLanguage, t } = useLanguage();
  const [academicContext, setAcademicContext] = useState<AcademicContext>(() => {
    const saved = localStorage.getItem("zei_academic_context");
    return saved === "school" || saved === "university" ? saved : "college";
  });

  const [inputValue, setInputValue] = useState("");
  const [demoMessages, setDemoMessages] = useState<OpenaiMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelId>("gemini-3.1-flash-lite");
  const [modelOpen, setModelOpen] = useState(false);
  const [promptChainNextIndex, setPromptChainNextIndex] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<OpenaiMessage | null>(null);
  const [generationTimes, setGenerationTimes] = useState<Map<number, number>>(new Map());

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [streamComplete, setStreamComplete] = useState(false);

  const autoFilledValueRef = useRef<string | null>(null);
  const seenMessageIds = useRef<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 160);
  };
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamStartRef = useRef<number | null>(null);
  const pendingGenTimeRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  const createConversation = useCreateOpenaiConversation();

  const { data: conversation, isLoading } = useGetOpenaiConversation(
    conversationId as number,
    {
      query: {
        enabled: !!conversationId && conversationId > 0,
        queryKey: getGetOpenaiConversationQueryKey(conversationId as number),
      },
    },
  );

  const demoMode = typeof conversationId === "number" && conversationId < 0;
  useEffect(() => {
    localStorage.setItem("zei_academic_context", academicContext);
  }, [academicContext]);

  useEffect(() => {
    if (!demoMode || !conversationId) { setDemoMessages([]); return; }
    try { setDemoMessages(JSON.parse(localStorage.getItem(`zei_demo_messages_${conversationId}`) || "[]") as OpenaiMessage[]); }
    catch { setDemoMessages([]); }
  }, [conversationId, demoMode]);

  const prompts = useMemo(() => language === "ur"
    ? SUGGESTED_PROMPTS_UR.slice(0, 6).map((item) => pickVariant(item.variants))
    : CONTEXT_PROMPTS[academicContext], [academicContext, language]);

  const scrollToBottom = (smooth = false) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
      setShowScrollBtn(false);
    }
  };

  useEffect(() => { scrollToBottom(); }, [conversation?.messages, streamedContent]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    if (!conversation?.messages || pendingGenTimeRef.current === null) return;
    const msgs = conversation.messages;
    const lastAssistant = [...msgs].reverse().find((m) => m.role === "assistant");
    if (lastAssistant && !generationTimes.has(lastAssistant.id)) {
      const elapsed = pendingGenTimeRef.current;
      pendingGenTimeRef.current = null;
      setGenerationTimes((prev) => new Map(prev).set(lastAssistant.id, elapsed));
    }
  }, [conversation?.messages]);

  useEffect(() => {
    if (!streamComplete) return;
    const msgs = conversation?.messages ?? [];
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg?.role === "assistant") {
      setStreamedContent("");
      setStreamComplete(false);
    }
  }, [conversation?.messages, streamComplete]);

  const authHeaders = (): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (user?.id) h["x-user-id"] = user.id;
    return h;
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    stopSpeaking();
    const clean = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
    recordingStreamRef.current = null;
    setIsRecording(false);
  };

  const handleMicToggle = async () => {
    if (isRecording) { stopRecording(); return; }
    if (isTranscribing) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      toast({ title: t.micNotSupported, description: t.micNotSupportedDesc, variant: "destructive" });
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      const name: string = err?.name ?? "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        toast({ title: t.micBlocked, description: t.micBlockedDesc, variant: "destructive" });
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        toast({ title: t.micNotFound, description: t.micNotFoundDesc, variant: "destructive" });
      } else {
        toast({ title: t.micUnavailable, description: err?.message ?? t.micNotSupportedDesc, variant: "destructive" });
      }
      return;
    }

    stopSpeaking();
    recordingStreamRef.current = stream;
    audioChunksRef.current = [];

    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg", "audio/mp4"]
      .find((t) => MediaRecorder.isTypeSupported(t)) ?? "";

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;

      const chunks = audioChunksRef.current;
      if (chunks.length === 0) return;

      const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
      if (blob.size < 1000) return;

      setIsTranscribing(true);
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (user?.id) headers["x-user-id"] = user.id;

        const res = await fetch("/api/transcribe", {
          method: "POST",
          headers,
          body: JSON.stringify({ audio: base64, mimeType: mimeType || "audio/webm" }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string; message?: string };
          if (res.status === 429) {
            throw new Error(body.message ?? "Too many requests — please wait a moment and try again.");
          }
          throw new Error(body.message ?? t.transcriptionFailed);
        }
        const { text } = await res.json() as { text: string };

        if (!text.trim()) {
          toast({ title: t.nothingHeard, description: t.nothingHeardDesc, variant: "destructive" });
          return;
        }

        if (voiceMode && conversationId) {
          setInputValue("");
          doSend(text.trim(), conversationId);
        } else if (voiceMode) {
          createConversation.mutate({ data: {} }, {
            onSuccess: (newConv: { id: number }) => {
              queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
              onConversationCreated?.(newConv.id);
              setPendingPrompt(text.trim());
              setInputValue("");
            },
          });
        } else {
          setInputValue(text.trim());
        }
      } catch (err: any) {
        toast({ title: t.transcriptionFailed, description: err?.message ?? t.transcriptionFailedDesc, variant: "destructive" });
      } finally {
        setIsTranscribing(false);
      }
    };

    recorder.start();
    setIsRecording(true);

    setTimeout(() => {
      if (mediaRecorderRef.current?.state === "recording") stopRecording();
    }, 60_000);
  };

  const doSend = async (message: string, convId: number) => {
    if (convId < 0) {
      const next = [...demoMessages, { id: Date.now(), conversationId: convId, role: "user", content: message, createdAt: new Date().toISOString() } as OpenaiMessage];
      setDemoMessages(next);
      localStorage.setItem(`zei_demo_messages_${convId}`, JSON.stringify(next));
      toast({ title: "Saved in this browser", description: "AI replies need a configured backend. Your message was not sent to an AI service." });
      return;
    }
    stopSpeaking();
    setIsStreaming(true);
    setStreamedContent("");
    streamStartRef.current = performance.now();

    queryClient.setQueryData(getGetOpenaiConversationQueryKey(convId), (old: any) => {
      if (!old) return old;
      return {
        ...old,
        messages: [
          ...old.messages,
          { id: Date.now(), conversationId: convId, role: "user", content: message, createdAt: new Date().toISOString() },
        ],
      };
    });

    try {
      const response = await fetch(`/api/openai/conversations/${convId}/messages`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ content: message, model: selectedModel, language }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error((errBody as { error?: string }).error ?? `Server error ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const json = JSON.parse(line.slice(6));
            if (json.content) {
              fullResponse += json.content;
              setStreamedContent((prev) => prev + json.content);
            }
            if (json.done) {
              if (streamStartRef.current !== null) {
                pendingGenTimeRef.current = (performance.now() - streamStartRef.current) / 1000;
                streamStartRef.current = null;
              }
              queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(convId) });
              queryClient.invalidateQueries({ queryKey: getListMemoriesQueryKey() });
              queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
              if (voiceMode && fullResponse) speakText(fullResponse);
            }
            if (json.error) toast({ variant: "destructive", title: t.error, description: json.error });
          }
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : t.somethingWrong;
      toast({ variant: "destructive", title: t.failedToSend, description: msg });
      setStreamedContent("");
      setStreamComplete(false);
    } finally {
      setIsStreaming(false);
      setStreamComplete(true);
      queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(convId) });
      setPromptChainNextIndex((prev) => {
        if (prev !== null) {
          const next = prompts[prev];
          setInputValue(next);
          autoFilledValueRef.current = next;
          return (prev + 1) % prompts.length;
        }
        return null;
      });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isStreaming || createConversation.isPending) return;
    const msg = inputValue.trim();
    setInputValue("");
    setReplyingTo(null);
    if (!conversationId) {
      handlePromptClickNoConv(msg, 0);
      return;
    }
    doSend(msg, conversationId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handlePromptClickNoConv = (text: string, index: number) => {
    setPromptChainNextIndex((index + 1) % prompts.length);
    autoFilledValueRef.current = null;
    createConversation.mutate({ data: {} }, {
      onSuccess: (newConv: { id: number }) => {
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
        localStorage.setItem("zei_pending_prompt", text);
        onConversationCreated?.(newConv.id);
      },
      onError: () => {
        const id = -Date.now();
        const item = { id, title: text.slice(0, 42), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        const stored = JSON.parse(localStorage.getItem("zei_demo_conversations") || "[]") as typeof item[];
        localStorage.setItem("zei_demo_conversations", JSON.stringify([item, ...stored]));
        queryClient.setQueryData(getListOpenaiConversationsQueryKey(), (current: any) => [item, ...(Array.isArray(current) ? current : [])]);
        localStorage.setItem("zei_pending_prompt", text);
        onConversationCreated?.(id);
      },
    });
  };

  useEffect(() => {
    const prompt = localStorage.getItem("zei_pending_prompt");
    if (!prompt) return;
    localStorage.removeItem("zei_pending_prompt");
    if (conversationId) doSend(prompt, conversationId);
    else handlePromptClickNoConv(prompt, 0);
  }, [conversationId]);

  const handlePromptClickInConv = (text: string, index: number) => {
    setPromptChainNextIndex((index + 1) % prompts.length);
    autoFilledValueRef.current = null;
    setInputValue("");
    setTimeout(() => doSend(text, conversationId!), 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (autoFilledValueRef.current !== null && val !== autoFilledValueRef.current) {
      autoFilledValueRef.current = null;
      setPromptChainNextIndex(null);
    }
  };

  const handleReply = (msg: OpenaiMessage) => {
    setReplyingTo(msg);
    textareaRef.current?.focus();
  };

  const handleEdit = (msg: OpenaiMessage) => {
    setInputValue(msg.content);
    textareaRef.current?.focus();
  };

  const handleRegenerate = async () => {
    if (!conversationId || isStreaming) return;
    try {
      const res = await fetch(`/api/openai/conversations/${conversationId}/messages/last`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(t.regenerateFailed);
      const { lastUserMessage } = await res.json();
      queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(conversationId) });
      if (lastUserMessage) doSend(lastUserMessage, conversationId);
    } catch {
      toast({ variant: "destructive", title: t.regenerateFailed, description: t.regenerateFailedDesc });
    }
  };

  const activeModel = MODELS.find((m) => m.id === selectedModel) ?? MODELS[0];
  const messages = demoMode ? demoMessages : conversation?.messages ?? [];
  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  if (!conversationId) {
    return (
      <div className="flex-1 flex flex-col h-full relative bg-background">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <GeometricBackground opacity={0.6} />
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 76% 74% at 50% 46%, rgba(0,0,0,.008) 15%, rgba(255,255,255,.82) 100%)" }}
          />
        </div>

        <div className="relative z-10 flex items-center px-4 pt-safe pt-4 md:hidden" style={{ isolation: 'isolate' }}>
          <button onClick={onOpenSidebar} className="p-2 -ml-1 rounded-xl hover:bg-muted/60 transition-colors">
            <Menu className="w-5 h-5 text-foreground/70" />
          </button>
        </div>

        <div className="relative z-10 flex flex-col items-center flex-1 text-center px-5 pb-8 pt-5 md:pt-10 overflow-y-auto">
          <div className="ai-welcome-content w-full max-w-3xl mx-auto">
            <img src={brandAsset("zei-mark.png")} alt="Zaheen Student.AI" className="w-12 h-12 md:w-14 md:h-14 object-contain mx-auto mb-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-2">{t.welcomeSubtitle}</p>
            <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground">What would you like to learn today?</h1>
            <p className="mt-3 mx-auto max-w-xl text-sm md:text-base leading-relaxed text-muted-foreground">{t.welcomeDesc}</p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Choose your academic level">
              <span className="mr-1 text-xs font-medium text-muted-foreground">I'm studying at</span>
              {(["school", "college", "university"] as AcademicContext[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  aria-pressed={academicContext === level}
                  onClick={() => setAcademicContext(level)}
                  className={cn("rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40", academicContext === level ? "border-primary/30 bg-primary text-primary-foreground shadow-sm" : "border-border bg-card/80 text-foreground/70 hover:border-primary/30 hover:bg-primary/5")}
                >
                  {level}
                </button>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-2 text-left sm:grid-cols-2 lg:grid-cols-3">
              {prompts.map((prompt, i) => (
                <button
                  key={`${academicContext}-${i}`}
                  onClick={() => handlePromptClickNoConv(prompt, i)}
                  disabled={createConversation.isPending}
                  className="study-prompt group min-h-[92px] rounded-xl border border-border/70 bg-card/90 p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-primary">{["Homework help", "Math & science", "Exam preparation", "English & writing", "Research support", "Explain a concept"][i]}</span>
                  <span className="block text-xs leading-relaxed text-foreground/75">{prompt}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="workspace-compose mt-5 flex items-end gap-2 rounded-2xl border border-border/80 bg-card p-2 pl-4 text-left shadow-lg shadow-primary/5 transition focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={t.inputPlaceholder}
                rows={1}
                className="min-w-0 flex-1 min-h-[2.5rem] max-h-40 resize-none border-0 bg-transparent px-0 py-2 text-sm leading-relaxed shadow-none focus-visible:ring-0"
                disabled={createConversation.isPending}
              />
              <button type="button" onClick={() => window.dispatchEvent(new Event("zei:open-upload-cv"))} title="Upload CV or academic records" aria-label="Upload academic document" className="composer-tool h-10 w-10 shrink-0 rounded-xl border border-border/60 text-muted-foreground transition hover:border-primary/25 hover:bg-primary/5 hover:text-primary">
                <Paperclip className="mx-auto h-4 w-4" />
              </button>
              <button type="button" onClick={handleMicToggle} disabled={isTranscribing || createConversation.isPending} title={isRecording ? t.stop : isTranscribing ? t.loading : t.voice} aria-label={isRecording ? t.stop : t.voice} className={cn("composer-tool h-10 w-10 shrink-0 rounded-xl border transition", isRecording ? "border-red-400/60 bg-red-500/10 text-red-500 animate-pulse" : "border-border/60 text-muted-foreground hover:border-primary/25 hover:bg-primary/5 hover:text-primary")}>
                {isTranscribing ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : isRecording ? <MicOff className="mx-auto h-4 w-4" /> : <Mic className="mx-auto h-4 w-4" />}
              </button>
              <Button type="submit" size="icon" className="workspace-send h-10 w-10 shrink-0 rounded-xl text-white shadow-md shadow-primary/20" disabled={!inputValue.trim() || createConversation.isPending}>
                {createConversation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="ml-0.5 h-4 w-4" />}
              </Button>
            </form>
            <p className="mt-2 text-[10px] text-muted-foreground">Press Enter to send · Shift + Enter for a new line</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background relative overflow-hidden">
        <GeometricBackground opacity={0.5} />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary/50" />
          <p className="text-sm text-muted-foreground animate-pulse">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative bg-background">
      {/* Background contained so overflow-hidden doesn't affect scroll children */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <GeometricBackground opacity={0.3} />
      </div>

      {/* Top bar — solid bg on mobile so backdrop-blur can't break z-index stacking */}
      <div className="relative z-20 flex items-center justify-between px-3 md:px-4 py-2 border-b border-border/40 bg-background md:bg-background/80 md:backdrop-blur-sm shrink-0" style={{ isolation: 'isolate' }}>
        <button onClick={onOpenSidebar} className="md:hidden p-2 -ml-1 rounded-xl hover:bg-muted/60 transition-colors">
          <Menu className="w-5 h-5 text-foreground/70" />
        </button>
        <div className="hidden md:block" />

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="academic-context">Academic level</label>
          <select id="academic-context" value={academicContext} onChange={(event) => setAcademicContext(event.target.value as AcademicContext)} className="block h-8 w-[82px] sm:w-[104px] rounded-lg border border-border/60 bg-card px-1.5 sm:px-2 text-[10px] sm:text-[11px] font-medium text-foreground/75 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10">
            <option value="school">School</option>
            <option value="college">College</option>
            <option value="university">University</option>
          </select>
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              title={t.stop}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-red-400/50 bg-red-50/80 text-red-500 text-xs font-medium animate-in fade-in duration-150 hover:bg-red-100/80 transition-colors dark:bg-red-950/30 dark:border-red-500/40 dark:hover:bg-red-950/50"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.stop}</span>
            </button>
          )}

          <button
            onClick={() => { setVoiceMode((v) => !v); if (isSpeaking) stopSpeaking(); }}
            title={voiceMode ? t.voiceOn : t.voice}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-medium",
              voiceMode
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border/60 bg-card/80 hover:bg-card text-foreground/60 hover:text-foreground",
            )}
          >
            {isSpeaking ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : voiceMode ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{voiceMode ? t.voiceOn : t.voice}</span>
          </button>

          <button
            onClick={() => setLanguage(language === "en" ? "ur" : "en")}
            title={language === "en" ? "Switch to Urdu / اردو" : "Switch to English"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border/60 bg-card/80 hover:bg-card transition-all text-xs font-medium text-foreground/70 hover:text-foreground"
          >
            <span className="text-base leading-none">{language === "en" ? "🇵🇰" : "🇬🇧"}</span>
            <span>{language === "en" ? "اردو" : "EN"}</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setModelOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-card/80 hover:bg-card transition-all text-xs font-medium text-foreground/70 hover:text-foreground"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 shrink-0" />
              <span className="hidden sm:inline">{activeModel.label}</span>
              <span className="sm:hidden">{activeModel.badge}</span>
              <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform", modelOpen && "rotate-180")} />
            </button>

            {modelOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setModelOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 z-40 w-52 bg-card border border-border/60 rounded-2xl shadow-lg overflow-hidden py-1">
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedModel(m.id); setModelOpen(false); }}
                      className={cn("w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors", selectedModel === m.id && "bg-muted/40")}
                    >
                      <span className="flex items-center gap-2">
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", selectedModel === m.id ? "bg-emerald-400" : "bg-muted-foreground/30")} />
                        {m.label}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{m.badge}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 md:px-8 py-4 md:py-6 z-10" ref={scrollRef} onScroll={handleScroll} style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'none' }}>
        <div className="max-w-2xl mx-auto space-y-5 pb-6">
          {/* Welcome intro */}
          <div className="flex justify-start">
            <div className="max-w-[88%] md:max-w-[80%] px-4 md:px-5 py-3.5 rounded-2xl rounded-bl-sm bg-card/90 backdrop-blur-sm border shadow-sm text-sm md:text-base leading-relaxed space-y-2">
              <p>
                {t.welcomeIntro1} <span className="font-semibold">Zaheen Student</span> {t.welcomeIntro1b}
              </p>
              <p>
                {t.welcomeIntro2a} <span className="font-medium">{t.welcomeIntro2b}</span> {t.welcomeIntro2c}
              </p>
              <p className="text-muted-foreground text-xs pt-1">
                {t.welcomeIntro3}{" "}
                <a
                  href="https://zesign916.wixstudio.com/faisal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
                >
                  {t.founderWebsite}
                </a>.
              </p>
            </div>
          </div>

          {/* Suggested prompts — only when no messages yet */}
          {messages.length === 0 && !isStreaming && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {prompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handlePromptClickInConv(prompt, i)}
                  disabled={isStreaming}
                  className="group text-left px-3.5 py-2.5 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm hover:bg-card hover:border-border hover:shadow-sm transition-all text-xs text-foreground/60 hover:text-foreground disabled:opacity-50"
                >
                  <span className="flex items-start gap-1.5">
                    <img src={brandAsset("zei-mark.png")} alt="" className="w-3 h-3 mt-0.5 shrink-0 object-contain opacity-40 group-hover:opacity-70 transition-opacity" />
                    <span className="leading-snug">{prompt}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg: OpenaiMessage) => {
            const isNew = !seenMessageIds.current.has(msg.id);
            if (isNew) seenMessageIds.current.add(msg.id);
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isNew={isNew}
                generationTime={generationTimes.get(msg.id)}
                onReply={() => handleReply(msg)}
                onEdit={msg.role === "user" ? () => handleEdit(msg) : undefined}
                onRegenerate={msg.role === "assistant" ? handleRegenerate : undefined}
                isLatestAssistant={msg.id === lastAssistantId}
                voiceMode={voiceMode}
                onSpeak={speakText}
                onReadLine={speakText}
              />
            );
          })}

          {/* Streaming placeholder */}
          {(isStreaming || streamComplete) && streamedContent && (
            <div className="flex justify-start msg-bubble-enter">
              <div className="max-w-[88%] md:max-w-[80%] px-4 md:px-5 py-3 rounded-2xl rounded-bl-sm bg-card/90 backdrop-blur-sm border shadow-sm leading-relaxed text-sm md:text-base">
                <Markdown content={streamedContent} />
                {isStreaming && (
                  <span className="inline-block w-1 h-4 ml-1 bg-primary/40 animate-pulse align-middle rounded-full" />
                )}
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {isStreaming && !streamedContent && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="px-4 py-3.5 rounded-2xl rounded-bl-sm bg-card/90 backdrop-blur-sm border shadow-sm">
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-foreground/25"
                      style={{ animation: "typingBounce 1.2s ease-in-out infinite", animationDelay: `${i * 0.18}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reply banner */}
      {replyingTo && (
        <div className="relative z-10 px-3 md:px-6 pt-2 shrink-0">
          <div className="max-w-2xl mx-auto flex items-center gap-2 bg-muted/60 border border-border/50 rounded-xl px-3 py-2">
            <CornerUpLeft className="w-3.5 h-3.5 shrink-0 text-primary/60" />
            <span className="flex-1 text-xs text-muted-foreground truncate">
              <span className="font-medium text-foreground/70">
                {replyingTo.role === "user" ? t.you : "Zaheen Student"}:{" "}
              </span>
              {replyingTo.content.slice(0, 100)}
              {replyingTo.content.length > 100 ? "…" : ""}
            </span>
            <button onClick={() => setReplyingTo(null)} className="p-0.5 rounded-md hover:bg-muted transition-colors shrink-0">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Scroll-to-bottom button */}
      <div
        className="relative z-20 flex justify-center pointer-events-none"
        style={{ marginBottom: showScrollBtn ? "-0.5rem" : 0 }}
      >
        <button
          onClick={() => scrollToBottom(true)}
          className="pointer-events-auto"
          style={{
            opacity: showScrollBtn ? 1 : 0,
            transform: showScrollBtn ? "translateY(0) scale(1)" : "translateY(8px) scale(0.92)",
            transition: "opacity 0.22s ease, transform 0.22s cubic-bezier(0.22,1,0.36,1)",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.35rem 0.9rem 0.35rem 0.75rem",
            borderRadius: "9999px",
            fontSize: "0.75rem",
            fontWeight: 600,
            background: "hsl(var(--foreground))",
            color: "hsl(var(--background))",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            border: "none",
            cursor: showScrollBtn ? "pointer" : "default",
            pointerEvents: showScrollBtn ? "auto" : "none",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
          Latest
        </button>
      </div>

      {/* Input */}
      <div className="relative z-10 px-3 md:px-6 pb-safe pb-4 pt-2 bg-gradient-to-t from-background via-background/98 to-transparent shrink-0">
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="workspace-compose flex items-end gap-2 bg-card/95 backdrop-blur-sm border shadow-md rounded-2xl p-2 pl-4 focus-within:ring-2 ring-primary/20 transition-all focus-within:border-primary/40"
          >
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={t.inputPlaceholder}
              rows={1}
              className="min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 py-2 resize-none min-h-[2.5rem] max-h-40 text-sm md:text-base leading-relaxed"
              disabled={isStreaming}
            />
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("zei:open-upload-cv"))}
              title="Upload CV or academic records"
              className="w-10 h-10 md:w-11 md:h-11 shrink-0 flex items-center justify-center rounded-xl border border-border/50 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleMicToggle}
              disabled={isStreaming || isTranscribing}
              title={isRecording ? t.stop : isTranscribing ? t.loading : t.voice}
              className={cn(
                "w-10 h-10 md:w-11 md:h-11 shrink-0 flex items-center justify-center rounded-xl border transition-all",
                isRecording
                  ? "bg-red-500/10 border-red-400/60 text-red-500 animate-pulse"
                  : isTranscribing
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "border-border/50 bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60",
                "disabled:opacity-40 disabled:cursor-not-allowed",
              )}
            >
              {isTranscribing
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : isRecording
                  ? <MicOff className="w-4 h-4" />
                  : <Mic className="w-4 h-4" />
              }
            </button>

            <Button
              type="submit"
              size="icon"
              className="workspace-send rounded-xl w-10 h-10 md:w-11 md:h-11 shrink-0 transition-transform active:scale-95 text-white"
              disabled={!inputValue.trim() || isStreaming}
            >
              {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
            </Button>
          </form>
          <div className="flex justify-center mt-2">
            <p className="text-[10px] tracking-wide flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 border border-primary/15 text-primary/60">
              <img src={brandAsset("zei-mark.png")} alt="" className="w-2.5 h-2.5 object-contain opacity-70" />
              {t.footerText}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        .msg-bubble-enter {
          animation: msgSlideIn 0.22s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes msgSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
