import { useState, useEffect, useRef, useCallback } from "react";
import { Sidebar } from "@/components/sidebar";
import { ChatArea } from "@/components/chat-area";
import { CareerMatchPanel } from "@/components/career-match-modal";
import { useListOpenaiConversations } from "@workspace/api-client-react";

const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 520;
const DEFAULT_SIDEBAR_WIDTH = 288;

export default function ChatPage() {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [careerMatchOpen, setCareerMatchOpen] = useState(false);
  const isResizing = useRef(false);
  const { data: conversations } = useListOpenaiConversations();
  const localConversations = (() => {
    try { return JSON.parse(localStorage.getItem("zei_demo_conversations") || "[]") as Array<{ id: number; title?: string | null; updatedAt?: string }>; }
    catch { return []; }
  })();
  const allConversations = [...localConversations, ...(conversations ?? []).filter(conversation => !localConversations.some(item => item.id === conversation.id))];

  useEffect(() => {
    const openUpload = () => setCareerMatchOpen(true);
    window.addEventListener("zei:open-upload-cv", openUpload);
    return () => window.removeEventListener("zei:open-upload-cv", openUpload);
  }, []);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, startWidth + e.clientX - startX));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizing.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [sidebarWidth]);

  useEffect(() => {
    const ids = new Set(allConversations.map((conversation) => conversation.id));
    const isStale = activeConversationId !== null && !ids.has(activeConversationId);
    if (activeConversationId === null || isStale) {
      if (allConversations.length > 0) {
        const sorted = [...allConversations].sort((a, b) =>
          new Date(b.updatedAt ?? "").getTime() - new Date(a.updatedAt ?? "").getTime()
        );
        setActiveConversationId(sorted[0].id);
      } else {
        setActiveConversationId(null);
      }
    }
  }, [allConversations, activeConversationId]);

  const handleSelect = (id: number | null) => {
    setActiveConversationId(id);
    setSidebarOpen(false);
    setCareerMatchOpen(false);
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden" style={{ height: '100dvh' }}>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 md:static md:z-auto md:translate-x-0
          transition-transform duration-300 ease-in-out shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ width: sidebarWidth }}
      >
        <Sidebar
          activeId={activeConversationId}
          onSelect={handleSelect}
          onClose={() => setSidebarOpen(false)}
          onCareerMatch={() => setCareerMatchOpen(true)}
        />
      </div>

      {/* Resize handle — desktop only */}
      <div
        className="hidden md:flex w-1.5 shrink-0 cursor-col-resize items-center justify-center group relative z-10 hover:bg-primary/10 transition-colors"
        onMouseDown={handleResizeMouseDown}
      >
        <div className="w-0.5 h-10 rounded-full bg-border group-hover:bg-primary/50 transition-colors" />
      </div>

      <main className="flex-1 flex flex-col min-w-0 bg-background/50 relative" style={{ minWidth: 0 }}>
        {careerMatchOpen ? (
          <CareerMatchPanel onClose={() => setCareerMatchOpen(false)} />
        ) : (
          <div key={activeConversationId ?? "empty"} className="zt-fade flex flex-col flex-1 min-h-0">
            <ChatArea
              conversationId={activeConversationId}
              onOpenSidebar={() => setSidebarOpen(true)}
              onConversationCreated={setActiveConversationId}
            />
          </div>
        )}
      </main>
    </div>
  );
}
