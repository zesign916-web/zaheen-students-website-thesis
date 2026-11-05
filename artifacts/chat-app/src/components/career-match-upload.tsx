import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, FileText, ImageIcon, Loader2, Briefcase, Send, ChevronDown } from "lucide-react";
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
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
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
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

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

export function CareerMatchUpload() {
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
    const arr = Array.from(incoming);
    const next: UploadedFile[] = [];
    for (const f of arr) {
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

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

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
      (chunk) => {
        aiText += chunk;
        setChatHistory([{ role: "model", content: aiText }]);
      },
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
      (chunk) => {
        aiText += chunk;
        setChatHistory([...newHistory, { role: "model", content: aiText }]);
      },
      () => setReplying(false),
      (msg) => { setError(msg); setReplying(false); },
    );
  };

  const hasChat = chatHistory.length > 0;

  return (
    <div className="mt-8 rounded-2xl border-2 border-dashed border-border/60 p-6 bg-background/40">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
          <Briefcase className="w-4 h-4" />
        </div>
        <h2 className="text-base font-bold text-foreground">Career Match</h2>
        <span className="text-[10px] font-medium bg-violet-500/10 text-violet-500 px-2 py-0.5 rounded-full">AI</span>
      </div>
      <p className="text-xs text-muted-foreground mb-5 pl-[2.625rem]">
        Upload your Academic Records to find the best match for your career!
      </p>

      {!hasChat && (
        <>
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 py-8 px-4",
              dragOver
                ? "border-violet-500 bg-violet-500/5 scale-[1.01]"
                : "border-border/50 hover:border-violet-500/50 hover:bg-violet-500/3",
            )}
          >
            <div className={cn("p-3 rounded-full transition-colors", dragOver ? "bg-violet-500/15" : "bg-muted/60")}>
              <Upload className={cn("w-5 h-5 transition-colors", dragOver ? "text-violet-500" : "text-muted-foreground")} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {dragOver ? "Drop files here" : "Drag & drop or click to upload"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {ALLOWED_EXT_LABEL} · Max {MAX_MB} MB per file
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

          {files.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {files.map((f, i) => (
                <li key={i} className="flex items-center gap-2.5 rounded-lg bg-muted/40 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">{fileIcon(f.type)}</span>
                  <span className="flex-1 truncate font-medium text-foreground">{f.name}</span>
                  <span className="text-muted-foreground/60 shrink-0">{formatBytes(f.size)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    className="text-muted-foreground/50 hover:text-destructive transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p className="mt-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          {files.length > 0 && (
            <button
              onClick={analyse}
              disabled={analysing}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-60 text-white text-sm font-semibold py-2.5 transition-colors"
            >
              {analysing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analysing your documents…</>
              ) : (
                <><Briefcase className="w-4 h-4" /> Find My Best Career Match</>
              )}
            </button>
          )}
        </>
      )}

      {hasChat && (
        <div className="space-y-3">
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-violet-500/10 text-foreground ml-8"
                    : "bg-muted/50 text-foreground",
                )}
              >
                {msg.role === "model" ? (
                  <Markdown content={msg.content} />
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            ))}
            {(analysing || replying) && chatHistory[chatHistory.length - 1]?.role !== "model" && (
              <div className="bg-muted/50 rounded-xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <input
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendFollowUp()}
              placeholder="Ask a follow-up — salary, skills, further study…"
              disabled={replying || analysing}
              className="flex-1 rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50"
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
            <ChevronDown className="w-3 h-3" /> Upload different files
          </button>
        </div>
      )}
    </div>
  );
}
