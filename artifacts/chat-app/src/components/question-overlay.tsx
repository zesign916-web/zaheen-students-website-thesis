import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Loader2, Bot, Star, ThumbsUp, Copy, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";
import { brandAsset } from "@/lib/brand-assets";

/* ─── Types ─── */

interface QuestionOverlayProps {
  question: string;
  section: string;
  existingAnswer?: string;
  onClose: () => void;
  onReviewAdded?: (question: string, rating: number) => void;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface ReviewRecord {
  id: number;
  userId: string;
  userName?: string | null;
  rating: number;
  note?: string | null;
  createdAt: string;
}

/* ─── Review Dialog (identical pattern to message-bubble) ─── */

function ReviewDialog({
  question,
  userId,
  onClose,
  onSubmitted,
}: {
  question: string;
  userId: string;
  onClose: () => void;
  onSubmitted: (r: ReviewRecord) => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ messageContent: question, rating, note: note.trim() || undefined }),
      });
      if (res.ok) {
        const created = await res.json() as ReviewRecord;
        onSubmitted(created);
      }
    } catch { /* non-blocking */ }
    setSubmitted(true);
    setTimeout(onClose, 1400);
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-2xl p-6 w-80 animate-in zoom-in-95 duration-150 relative">
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <ThumbsUp className="w-8 h-8 text-primary" />
            <p className="text-sm font-medium text-foreground">Thanks for your feedback!</p>
          </div>
        ) : (
          <>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-semibold text-foreground mb-1 pr-6">Rate this answer</h3>
            <p className="text-xs text-muted-foreground mb-4">Your review helps other students trust this content.</p>

            <div className="flex gap-1 justify-center mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "w-7 h-7 transition-colors",
                      star <= (hover || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30",
                    )}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write your review… (optional)"
              rows={3}
              className="w-full resize-none rounded-xl border border-border/50 bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/50 mb-4 transition-colors"
            />

            <button
              onClick={handleSubmit}
              disabled={rating === 0}
              className="w-full py-2 text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Submit
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Context menu (same pattern as message-bubble) ─── */

function CtxMenu({
  x, y, onReview, onCopy, onClose,
}: {
  x: number; y: number;
  onReview: () => void;
  onCopy: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("click", handler);
    window.addEventListener("keydown", handler);
    return () => { window.removeEventListener("click", handler); window.removeEventListener("keydown", handler); };
  }, [onClose]);

  const style: React.CSSProperties = {
    position: "fixed",
    top: Math.min(y, window.innerHeight - 100),
    left: Math.min(x, window.innerWidth - 180),
    zIndex: 9997,
  };

  return (
    <div
      style={style}
      className="bg-card/95 backdrop-blur-md border border-border/50 rounded-xl shadow-xl py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => { onCopy(); onClose(); }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground/80 hover:bg-muted/60 hover:text-foreground transition-colors"
      >
        <Copy className="w-3.5 h-3.5" /> Copy answer
      </button>
      <button
        onClick={() => { onReview(); onClose(); }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground/80 hover:bg-muted/60 hover:text-foreground transition-colors"
      >
        <Star className="w-3.5 h-3.5" /> Rate this answer
      </button>
    </div>
  );
}

/* ─── Stars display ─── */

function StarsDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "xs" }) {
  const cls = size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5";
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(cls, s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")}
        />
      ))}
    </span>
  );
}

/* ─── Main overlay ─── */

export function QuestionOverlay({ question, section, existingAnswer, onClose, onReviewAdded }: QuestionOverlayProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [convId, setConvId] = useState<number | null>(null);
  const [blogContent, setBlogContent] = useState(existingAnswer ?? "");
  const [blogLoading, setBlogLoading] = useState(!existingAnswer);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatStreaming, setChatStreaming] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);

  /* review state */
  const [showReview, setShowReview] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [communityReviews, setCommunityReviews] = useState<ReviewRecord[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  /* double-tap detection for mobile */
  const lastTapRef = useRef(0);

  const headers = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (user?.id) h["x-user-id"] = user.id;
    return h;
  }, [user?.id]);

  const stream = useCallback(async (
    id: number,
    message: string,
    onChunk: (t: string) => void,
    onDone: () => void,
  ) => {
    const res = await fetch(`/api/openai/conversations/${id}/messages`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ content: message, model: "gemini-3.1-flash-lite", language, skipMemory: true }),
    });
    if (!res.ok) throw new Error("Request failed");
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const json = JSON.parse(line.slice(6));
        if (json.content) onChunk(json.content);
        if (json.done) onDone();
      }
    }
  }, [headers, language]);

  /* fetch community reviews */
  const fetchReviews = useCallback(async () => {
    if (reviewsLoaded) return;
    try {
      const res = await fetch(`/api/reviews?question=${encodeURIComponent(question)}`, {
        headers: user?.id ? { "x-user-id": user.id } : {},
      });
      if (res.ok) setCommunityReviews(await res.json() as ReviewRecord[]);
    } catch { /* ignore */ }
    setReviewsLoaded(true);
  }, [question, user?.id, reviewsLoaded]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      const convRes = await fetch("/api/openai/conversations", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({}),
      });
      const conv = await convRes.json() as { id: number };
      setConvId(conv.id);

      if (existingAnswer) { fetchReviews(); return; }

      const prompt = `You are a knowledgeable education and career guide for Pakistani students. Write a detailed, helpful article answering this question: "${question}" (Category: ${section})

Structure your response as a clear article covering:
1. A direct answer to the question
2. Detailed explanation with all important information
3. Step-by-step guidance if applicable
4. Key requirements, eligibility, or criteria
5. Practical tips for success
6. Mention relevant official sources like official websites (ppsc.gop.pk, fpsc.gov.pk, hec.gov.pk, nust.edu.pk, lums.edu.pk, etc.) where the student can find the latest official information

Keep the tone warm, clear, and encouraging. Use numbered points for lists. Do not use any markdown symbols like # * ** or _`;

      try {
        await stream(conv.id, prompt, (chunk) => {
          setBlogContent(prev => prev + chunk);
        }, () => { setBlogLoading(false); fetchReviews(); });
      } catch {
        setBlogContent("Sorry, could not load the explanation. Please try again.");
        setBlogLoading(false);
      }
    };

    init().catch(() => setBlogLoading(false));
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chatMessages, chatStreaming]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || !convId || chatStreaming) return;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: msg }]);
    setChatStreaming(true);
    setChatMessages(prev => [...prev, { role: "assistant", content: "" }]);
    try {
      await stream(convId, msg, (chunk) => {
        setChatMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }, () => setChatStreaming(false));
    } catch {
      setChatStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(blogContent).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!blogContent || blogLoading) return;
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      e.preventDefault();
      setShowReview(true);
    }
    lastTapRef.current = now;
  };

  const avgRating = communityReviews.length
    ? communityReviews.reduce((s, r) => s + r.rating, 0) / communityReviews.length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in duration-200">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 md:px-6 py-3 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">{section}</p>
          <h2 className="text-sm md:text-base font-semibold text-foreground leading-snug truncate">{question}</h2>
        </div>
        {/* inline star summary */}
        {communityReviews.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <StarsDisplay rating={Math.round(avgRating)} size="xs" />
            <span className="text-[10px] text-muted-foreground">{avgRating.toFixed(1)} · {communityReviews.length} review{communityReviews.length !== 1 ? "s" : ""}</span>
          </div>
        )}
        <button
          onClick={onClose}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl border border-border/50 hover:bg-muted/60 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* LEFT — Blog post */}
        <div className="flex-1 overflow-y-auto px-5 md:px-10 py-6 md:border-r border-border/30">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <img src={brandAsset("zei-logo.png")} alt="" className="w-6 h-6 object-contain opacity-80" />
              <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Zaheen Student.AI — Detailed Explanation</span>
              {existingAnswer && (
                <span className="text-[9px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-medium ml-auto">Saved answer</span>
              )}
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-foreground mb-5 leading-snug">{question}</h1>

            {blogLoading && blogContent === "" ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating explanation from latest sources…</span>
              </div>
            ) : (
              /* Answer area — right-click + double-tap triggers review */
              <div
                onContextMenu={handleContextMenu}
                onTouchEnd={handleTouchEnd}
                className="group relative cursor-default select-text"
              >
                {/* hover action bar — appears top-right of the answer block */}
                {!blogLoading && blogContent && (
                  <div className={cn(
                    "absolute -top-8 right-0 flex items-center gap-0.5 px-1.5 py-1",
                    "rounded-xl bg-background/95 backdrop-blur-sm border border-border/60 shadow-lg",
                    "transition-all duration-150 pointer-events-auto",
                    "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0",
                  )}>
                    <button
                      onClick={handleCopy}
                      title="Copy answer"
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setShowReview(true)}
                      title="Rate this answer"
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-amber-400 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <p className="text-sm md:text-base text-foreground/85 leading-relaxed whitespace-pre-wrap">{blogContent}</p>
                {blogLoading && (
                  <span className="inline-block w-1.5 h-4 bg-primary/50 animate-pulse ml-0.5 rounded-sm" />
                )}
              </div>
            )}

            {/* Rate button row */}
            {!blogLoading && blogContent && (
              <div className="mt-8 pt-5 border-t border-border/30 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-[11px] text-muted-foreground">
                  Right-click or double-tap the answer to rate it. Have a follow-up? Use the chat →
                </p>
                <button
                  onClick={() => setShowReview(true)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/50 hover:border-border rounded-xl px-3 py-1.5 transition-all"
                >
                  <Star className="w-3 h-3" />
                  Rate this answer
                </button>
              </div>
            )}

            {/* Community reviews */}
            {reviewsLoaded && communityReviews.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-foreground">Community Reviews</span>
                  <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">{communityReviews.length}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground font-medium">{avgRating.toFixed(1)} / 5</span>
                </div>
                <div className="space-y-3">
                  {communityReviews.map((r) => (
                    <div key={r.id} className="bg-muted/30 rounded-2xl px-4 py-3 border border-border/30">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-5 h-5 rounded-full bg-muted/80 flex items-center justify-center text-[9px] font-semibold text-muted-foreground shrink-0">
                          {(r.userName ?? r.userId ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <StarsDisplay rating={r.rating} size="xs" />
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {new Date(r.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      {r.note && <p className="text-xs text-foreground/70 leading-relaxed pl-7">{r.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reviewsLoaded && communityReviews.length === 0 && !blogLoading && blogContent && (
              <div className="mt-6 text-center">
                <p className="text-[11px] text-muted-foreground/60">No reviews yet — be the first to rate this answer.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Chat */}
        <div className="w-full md:w-80 lg:w-96 shrink-0 flex flex-col border-t md:border-t-0 border-border/30 bg-sidebar/40">
          <div className="shrink-0 px-4 py-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary/70" />
              <span className="text-xs font-semibold text-foreground/80">Ask a follow-up question</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Chat with Zaheen Student about this topic</p>
          </div>

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground">No messages yet. Ask anything about this topic!</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted/70 text-foreground/90 rounded-bl-sm"
                )}>
                  {msg.content || (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="shrink-0 p-3 border-t border-border/30">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={chatInput}
                onChange={e => {
                  setChatInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask a follow-up…"
                rows={1}
                disabled={chatStreaming || !convId}
                className="flex-1 resize-none bg-muted/40 border border-border/50 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/50 disabled:opacity-50 min-h-[36px] max-h-[100px]"
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim() || chatStreaming || !convId}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {chatStreaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[9px] text-muted-foreground/50 mt-1 text-center">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <CtxMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onReview={() => setShowReview(true)}
          onCopy={handleCopy}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* Review dialog */}
      {showReview && user?.id && (
        <ReviewDialog
          question={question}
          userId={user.id}
          onClose={() => setShowReview(false)}
          onSubmitted={(r) => {
            setCommunityReviews(prev => [r, ...prev]);
            onReviewAdded?.(question, r.rating);
          }}
        />
      )}
    </div>
  );
}
