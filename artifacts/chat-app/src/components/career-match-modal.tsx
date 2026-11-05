import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, FileText, ImageIcon, Loader2, Briefcase, Send, ChevronLeft, Sparkles, X, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Markdown } from "@/components/markdown";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXT_LABEL = "PDF, PNG, JPG, DOCX";
const MAX_MB = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;

interface UploadedFile {
  name: string;
  type: string;
  data: string;
  size: number;
}

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

function fileIcon(type: string) {
  if (type.startsWith("image/")) return <ImageIcon className="w-3.5 h-3.5" />;
  return <FileText className="w-3.5 h-3.5" />;
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

async function streamSSE(
  url: string,
  body: object,
  headers: Record<string, string>,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
) {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  } catch {
    onError("CV analysis is unavailable because the API server is not connected.");
    return;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    onError(err.error ?? "Request failed");
    return;
  }
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const parsed = JSON.parse(line.slice(6));
        if (parsed.error) { onError(parsed.error); return; }
        if (parsed.done) { onDone(); return; }
        if (parsed.content) onChunk(parsed.content);
      } catch { /* skip */ }
    }
  }
  onDone();
}

/* ─── Full-panel Career Match (renders in the main chat area) ─── */
interface CareerMatchPanelProps {
  onClose: () => void;
}

export function CareerMatchPanel({ onClose }: CareerMatchPanelProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [followUp, setFollowUp] = useState("");
  const [replying, setReplying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, replying]);

  const addFiles = useCallback(async (incoming: FileList | File[]) => {
    setError(null);
    const next: UploadedFile[] = [];
    for (const f of Array.from(incoming)) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        setError(`"${f.name}" is not allowed. Use ${ALLOWED_EXT_LABEL}.`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        setError(`"${f.name}" exceeds the ${MAX_MB} MB limit.`);
        continue;
      }
      const data = await toBase64(f);
      next.push({ name: f.name, type: f.type, data, size: f.size });
    }
    setFiles((prev) => [...prev, ...next]);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = (idx: number) => setFiles((p) => p.filter((_, i) => i !== idx));

  const analyse = async () => {
    if (!files.length || analysing) return;
    setAnalysing(true);
    setError(null);
    setChatHistory([]);
    let aiText = "";
    const headers: Record<string, string> = {};
    if (user?.id) headers["x-user-id"] = user.id;
    await streamSSE(
      "/api/career-match",
      { files: files.map((f) => ({ name: f.name, type: f.type, data: f.data })) },
      headers,
      (chunk) => { aiText += chunk; setChatHistory([{ role: "model", content: aiText }]); },
      () => setAnalysing(false),
      (msg) => { setError(msg); setAnalysing(false); },
    );
  };

  const sendFollowUp = async () => {
    if (!followUp.trim() || replying) return;
    const userMsg = followUp.trim();
    setFollowUp("");
    setReplying(true);
    const newHistory: ChatMessage[] = [...chatHistory, { role: "user", content: userMsg }];
    setChatHistory(newHistory);
    const geminiHistory = newHistory.slice(0, -1).map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));
    let aiText = "";
    const headers: Record<string, string> = {};
    if (user?.id) headers["x-user-id"] = user.id;
    await streamSSE(
      "/api/career-match/chat",
      { history: geminiHistory, message: userMsg },
      headers,
      (chunk) => { aiText += chunk; setChatHistory([...newHistory, { role: "model", content: aiText }]); },
      () => setReplying(false),
      (msg) => { setError(msg); setReplying(false); },
    );
  };

  const hasChat = chatHistory.length > 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header — matches ChatArea toolbar style */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
          title="Back to chat"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="p-1.5 rounded-xl bg-violet-500/10 text-violet-500">
          <Briefcase className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-foreground leading-tight">Career Match</h2>
          <p className="text-[11px] text-muted-foreground">Upload your academic records to find your best career path</p>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto w-full">
          {!hasChat ? (
            <div className="space-y-5">
              {/* Hero text */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-500/10 mb-4">
                  <Briefcase className="w-7 h-7 text-violet-500" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Find Your Best Career Match</h3>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
                  Upload your transcripts, CV, or mark sheets — our AI will analyse your academic background and recommend the career paths that suit you best in Pakistan's job market.
                </p>
              </div>

              {/* Drop zone */}
              <div
                onDrop={onDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 py-14 px-6",
                  dragOver
                    ? "border-violet-500 bg-violet-500/5 scale-[1.01]"
                    : "border-border/50 hover:border-violet-500/50 hover:bg-violet-500/3",
                )}
              >
                <div className={cn("p-4 rounded-full transition-colors", dragOver ? "bg-violet-500/15" : "bg-muted/60")}>
                  <Upload className={cn("w-6 h-6 transition-colors", dragOver ? "text-violet-500" : "text-muted-foreground")} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">
                    {dragOver ? "Drop files here" : "Drag & drop your files here"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-2">
                    {ALLOWED_EXT_LABEL} · Max {MAX_MB} MB per file · Upload as many files as you need
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.docx,application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
              </div>

              {/* File list */}
              {files.length > 0 && (
                <ul className="space-y-2">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 rounded-xl bg-muted/40 border border-border/40 px-3 py-2.5 text-xs">
                      <span className="text-violet-500">{fileIcon(f.type)}</span>
                      <span className="flex-1 truncate font-medium text-foreground">{f.name}</span>
                      <span className="text-muted-foreground/60 shrink-0">{formatBytes(f.size)}</span>
                      <button
                        onClick={() => removeFile(i)}
                        className="text-muted-foreground/50 hover:text-destructive transition-colors ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {error && (
                <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2.5">{error}</p>
              )}

              {files.length > 0 && (
                <button
                  onClick={analyse}
                  disabled={analysing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-60 text-white text-sm font-semibold py-3.5 transition-colors shadow-sm"
                >
                  {analysing
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing your documents…</>
                    : <><Briefcase className="w-4 h-4" /> Find My Best Career Match</>}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-2xl px-5 py-4 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-violet-500/10 text-foreground ml-16"
                      : "bg-muted/50 text-foreground",
                  )}
                >
                  {msg.role === "model"
                    ? <Markdown content={msg.content} />
                    : <p>{msg.content}</p>}
                </div>
              ))}
              {(analysing || replying) && chatHistory[chatHistory.length - 1]?.role !== "model" && (
                <div className="bg-muted/50 rounded-2xl px-5 py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {error && (
                <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">{error}</p>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Footer input — only shown after first analysis */}
      {hasChat && (
        <div className="border-t border-border/40 px-6 py-4 shrink-0">
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="flex gap-2">
              <input
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendFollowUp()}
                placeholder="Ask a follow-up — salary, skills, further study, freelancing…"
                disabled={replying || analysing}
                className="flex-1 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50"
              />
              <button
                onClick={sendFollowUp}
                disabled={!followUp.trim() || replying || analysing}
                className="p-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => { setFiles([]); setChatHistory([]); setError(null); }}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors mx-auto"
            >
              <ChevronLeft className="w-3 h-3" /> Upload different files
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CareerMatchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 text-xs font-medium text-foreground transition hover:bg-muted"
    >
      <Upload className="h-3.5 w-3.5" />
      Upload CV / Academic Records
    </button>
  );
}
