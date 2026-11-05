import { useState, useRef, useCallback } from "react";
import { Copy, CornerUpLeft, Pencil, RefreshCw, Check, Star, ThumbsUp, X, Volume2, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "./markdown";
import { ContextMenu, type ContextMenuItem } from "./context-menu";
import { useTouchMenu } from "@/hooks/use-touch-menu";
import { useLanguage } from "@/hooks/use-language";
import type { OpenaiMessage } from "@workspace/api-client-react";

interface MessageBubbleProps {
  message: OpenaiMessage;
  replyTarget?: OpenaiMessage | null;
  generationTime?: number;
  onReply: () => void;
  onEdit?: () => void;
  onRegenerate?: () => void;
  isLatestAssistant?: boolean;
  isNew?: boolean;
  voiceMode?: boolean;
  onSpeak?: (text: string) => void;
  onReadLine?: (text: string) => void;
}

function ActionBtn({
  icon: Icon,
  onClick,
  label,
  active,
}: {
  icon: React.ElementType;
  onClick: (e: React.MouseEvent) => void;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      onMouseDown={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      title={label}
      className={cn(
        "w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 text-muted-foreground",
        active
          ? "text-emerald-500 bg-emerald-50"
          : "hover:bg-muted hover:text-foreground active:scale-90",
      )}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

function ReviewDialog({
  content,
  excerpt,
  onClose,
}: {
  content: string;
  excerpt?: string;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    try {
      const userId = (() => {
        try { return JSON.parse(localStorage.getItem("zei_user") ?? "{}").id ?? ""; } catch { return ""; }
      })();
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({
          messageContent: content,
          selectedLine: excerpt || undefined,
          rating,
          note: note.trim() || undefined,
        }),
      });
    } catch { /* non-blocking */ }
    setSubmitted(true);
    setTimeout(onClose, 1600);
  };

  const displayText = excerpt || content;
  const isExcerpt = Boolean(excerpt);

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center animate-in fade-in duration-150"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card/98 backdrop-blur-md border border-border/50 rounded-2xl shadow-2xl p-6 w-[360px] max-w-[92vw] animate-in zoom-in-95 duration-150 relative">
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <ThumbsUp className="w-8 h-8 text-primary" />
            <p className="text-sm font-medium text-foreground">{t.thanksForReview}</p>
            <p className="text-xs text-muted-foreground text-center">{t.feedbackHelps}</p>
          </div>
        ) : (
          <>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-semibold text-foreground mb-1 pr-6">
              {isExcerpt ? t.rateExcerpt : t.rateResponse}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {isExcerpt ? t.reviewingSpecific : t.reviewHelp}
            </p>

            <div className="mb-4 max-h-28 overflow-y-auto rounded-xl border border-border/40 bg-muted/30 px-3 py-2">
              <p className="text-[11px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">
                {isExcerpt ? t.selectedExcerpt : t.responsePreview}
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {displayText.length > 400 ? displayText.slice(0, 400) + "…" : displayText}
              </p>
            </div>

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
              placeholder={t.addNote}
              rows={3}
              className="w-full resize-none rounded-xl border border-border/50 bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/50 mb-4 transition-colors"
            />

            <button
              onClick={handleSubmit}
              disabled={rating === 0}
              className="w-full py-2 text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t.submitReviewBtn2}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function readAloud(text: string) {
  window.speechSynthesis.cancel();
  const clean = text.replace(/[*#_`~>]/g, " ").replace(/\s+/g, " ").trim();
  const utt = new SpeechSynthesisUtterance(clean);
  window.speechSynthesis.speak(utt);
}

export function MessageBubble({
  message,
  replyTarget,
  generationTime,
  onReply,
  onEdit,
  onRegenerate,
  isLatestAssistant,
  isNew = false,
  voiceMode,
  onSpeak,
  onReadLine,
}: MessageBubbleProps) {
  const { t } = useLanguage();
  const isUser = message.role === "user";
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [reviewExcerpt, setReviewExcerpt] = useState<string | undefined>();

  const isTouchDevice =
    typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !bubbleRef.current || e.buttons !== 0) return;
    const rect = bubbleRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: ny * -5, y: nx * 5 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleCopy = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(message.content).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = message.content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const sel = window.getSelection()?.toString().trim() ?? "";
    setSelectedText(sel);
    setCtxMenu({ x: e.clientX, y: e.clientY });
  };

  const handleBubbleClick = () => {
    if (!voiceMode || !onSpeak) return;
    const sel = window.getSelection()?.toString().trim();
    if (sel) return;
    onSpeak(message.content);
  };

  const handleReadSelection = () => {
    const text = selectedText || message.content;
    if (onReadLine) onReadLine(text);
    else readAloud(text);
  };

  const { onTouchStart, onTouchMove } = useTouchMenu({
    onOpen: (x, y) => setCtxMenu({ x, y }),
  });

  const userMenuItems: ContextMenuItem[] = [
    { label: t.copyMessage, icon: Copy, onClick: () => handleCopy() },
    { label: t.editMessage, icon: Pencil, onClick: () => onEdit?.() },
    { separator: true } as ContextMenuItem,
    {
      label: selectedText ? t.readSelection : t.readMessage,
      icon: Volume2,
      onClick: handleReadSelection,
    },
  ];

  const aiMenuItems: ContextMenuItem[] = [
    { label: t.copyResponse, icon: Copy, onClick: () => handleCopy() },
    ...(onRegenerate && isLatestAssistant
      ? [{ label: t.regenerateResponse, icon: RefreshCw, onClick: () => onRegenerate() }]
      : []),
    { separator: true } as ContextMenuItem,
    {
      label: selectedText ? t.readSelection : t.readResponse,
      icon: Volume2,
      onClick: handleReadSelection,
    },
    {
      label: selectedText ? t.reviewExcerptLabel : t.giveReview,
      icon: Star,
      onClick: () => {
        setReviewExcerpt(selectedText || undefined);
        setShowReview(true);
      },
    },
  ];

  return (
    <>
      <div
        className={cn(
          "flex items-end gap-2",
          isUser ? "justify-end" : "justify-start",
          isNew && "msg-bubble-enter",
        )}
      >
        {!isUser && <img src="/zei-mark.png" alt="Zaheen Student.AI" className="mb-1 h-7 w-7 shrink-0 rounded-full border border-border bg-white p-1 object-contain" />}
        <div className={cn("flex flex-col gap-1 max-w-[88%] md:max-w-[80%]", isUser && "items-end")}>

          {/* Reply reference */}
          {replyTarget && (
            <div
              className={cn(
                "flex items-start gap-1.5 px-3 py-1.5 rounded-xl border text-xs",
                "text-muted-foreground bg-muted/40 max-w-full",
                isUser ? "rounded-br-none ml-6" : "rounded-bl-none mr-6",
              )}
            >
              <CornerUpLeft className="w-3 h-3 mt-0.5 shrink-0 text-primary/50" />
              <span className="truncate">
                {replyTarget.content.slice(0, 90)}
                {replyTarget.content.length > 90 ? "…" : ""}
              </span>
            </div>
          )}

          {/* Bubble + action toolbar */}
          <div className="group relative">

            {/* Action toolbar — floats above on hover */}
            <div
              className={cn(
                "absolute bottom-full mb-1.5 z-20 flex items-center gap-0.5 px-1.5 py-1",
                "rounded-xl bg-background/95 backdrop-blur-sm border border-border/60 shadow-lg",
                "transition-all duration-150 pointer-events-auto",
                "opacity-100 md:opacity-0 md:translate-y-1",
                "md:group-hover:opacity-100 md:group-hover:translate-y-0",
                isUser ? "right-0" : "left-0",
              )}
            >
              <ActionBtn icon={copied ? Check : Copy} onClick={(e) => handleCopy(e)} label={isUser ? t.copyMessage : t.copyResponse} active={copied} />
              <ActionBtn
                icon={CornerUpLeft}
                onClick={(e) => { e.stopPropagation(); onReply(); }}
                label={t.replyingTo}
              />
              {isUser && onEdit && (
                <ActionBtn
                  icon={Pencil}
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  label={t.editMessage}
                />
              )}
              {!isUser && onRegenerate && isLatestAssistant && (
                <ActionBtn
                  icon={RefreshCw}
                  onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
                  label={t.regenerateResponse}
                />
              )}
              <ActionBtn
                icon={Volume2}
                onClick={(e) => { e.stopPropagation(); if (onReadLine) onReadLine(message.content); else readAloud(message.content); }}
                label={isUser ? t.readMessage : t.readResponse}
              />
              {!isUser && (
                <ActionBtn
                  icon={Star}
                  onClick={(e) => { e.stopPropagation(); setReviewExcerpt(undefined); setShowReview(true); }}
                  label={t.giveReview}
                />
              )}
            </div>

            {/* Bubble */}
            <div
              ref={bubbleRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onContextMenu={handleContextMenu}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onClick={handleBubbleClick}
              style={{
                transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition:
                  tilt.x === 0 && tilt.y === 0
                    ? "transform 0.45s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease"
                    : "transform 0.08s ease-out",
                boxShadow:
                  tilt.x !== 0 || tilt.y !== 0
                    ? isUser
                      ? "0 8px 28px -6px rgba(0,0,0,0.18)"
                      : "0 8px 28px -6px rgba(0,0,0,0.09)"
                    : undefined,
                cursor: voiceMode ? "pointer" : "default",
              }}
              className={cn(
                "px-4 md:px-5 py-3 rounded-2xl leading-relaxed text-sm md:text-base select-text",
                voiceMode && "ring-1 ring-primary/20 hover:ring-primary/40 transition-shadow",
                isUser
                  ? "bg-primary text-primary-foreground rounded-br-sm shadow-sm"
                  : "bg-card/90 backdrop-blur-sm border shadow-sm rounded-bl-sm",
              )}
            >
              {voiceMode && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] mb-1.5 px-1.5 py-0.5 rounded-md",
                    isUser
                      ? "bg-white/10 text-white/60"
                      : "bg-primary/8 text-primary/50",
                  )}
                >
                  <Volume2 className="w-2.5 h-2.5" />
                  {t.clickToHearLabel}
                </span>
              )}
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <Markdown content={message.content} />
              )}
            </div>
          </div>

          {/* Generation time */}
          {!isUser && generationTime != null && (
            <p className="text-[10px] text-muted-foreground/45 px-1 tracking-wide mt-0.5">
              {t.generatedIn(generationTime)}
            </p>
          )}
        </div>
        {isUser && <div className="mb-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-muted text-foreground"><UserRound className="h-3.5 w-3.5" /></div>}
      </div>

      {/* Right-click context menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={isUser ? userMenuItems : aiMenuItems}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* Review dialog */}
      {showReview && (
        <ReviewDialog
          content={message.content}
          excerpt={reviewExcerpt}
          onClose={() => { setShowReview(false); setReviewExcerpt(undefined); }}
        />
      )}
    </>
  );
}
