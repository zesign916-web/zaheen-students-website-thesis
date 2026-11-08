import { useState, useRef } from "react";
import { useLocation } from "wouter";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useDeleteOpenaiConversation,
  useListMemories,
  useDeleteMemory,
  getListOpenaiConversationsQueryKey,
  getListMemoriesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, Brain, Trash2, ChevronDown, Loader2, LogOut, X, Settings, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { brandAsset } from "@/lib/brand-assets";
import { SettingsDialog } from "@/components/settings-dialog";
import { useLanguage } from "@/hooks/use-language";
import { ContextMenu, type ContextMenuItem } from "@/components/context-menu";
import { useTouchMenu } from "@/hooks/use-touch-menu";
import { CareerMatchButton } from "@/components/career-match-modal";

interface SidebarProps {
  activeId: number | null;
  onSelect: (id: number | null) => void;
  onClose?: () => void;
  onCareerMatch?: () => void;
}

function LogoutConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-card border border-border/70 rounded-2xl shadow-xl p-6 w-72 animate-in zoom-in-95 duration-150">
        <div className="flex flex-col items-center text-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-4 h-4 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t.confirmLogout}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t.signBackIn}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-xs rounded-xl border border-border/60 text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 text-xs rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            {t.logout}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConvItemProps {
  conv: { id: number; title?: string | null };
  activeId: number | null;
  renamingId: number | null;
  renameValue: string;
  renameInputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (id: number) => void;
  onRenameChange: (v: string) => void;
  onRenameKeyDown: (e: React.KeyboardEvent, id: number) => void;
  onRenameBlur: (id: number) => void;
  onRenameClick: (e: React.MouseEvent) => void;
  onCommitRename: (id: number) => void;
  onDelete: (id: number) => void;
  onContextMenu: (e: React.MouseEvent, conv: { id: number; title?: string | null }) => void;
  onTouchOpen: (conv: { id: number; title?: string | null }, x: number, y: number) => void;
  untitledLabel: string;
}

function ConvItem({
  conv, activeId, renamingId, renameValue, renameInputRef,
  onSelect, onRenameChange, onRenameKeyDown, onRenameBlur, onRenameClick,
  onCommitRename, onDelete, onContextMenu, onTouchOpen, untitledLabel,
}: ConvItemProps) {
  const { onTouchStart, onTouchMove } = useTouchMenu({
    onOpen: (x, y) => onTouchOpen(conv, x, y),
  });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => renamingId !== conv.id && onSelect(conv.id)}
      onKeyDown={e => e.key === "Enter" && renamingId !== conv.id && onSelect(conv.id)}
      onContextMenu={(e) => onContextMenu(e, conv)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl transition-all group cursor-pointer select-none",
        activeId === conv.id
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
      )}
    >
      <MessageSquare className={cn("w-3.5 h-3.5 shrink-0 transition-colors", activeId === conv.id ? "text-primary" : "text-muted-foreground/50")} />

      {renamingId === conv.id ? (
        <input
          ref={renameInputRef}
          className="flex-1 min-w-0 bg-background border border-border rounded px-1.5 py-0.5 text-xs md:text-sm outline-none focus:ring-1 focus:ring-primary"
          value={renameValue}
          onChange={e => onRenameChange(e.target.value)}
          onKeyDown={e => onRenameKeyDown(e, conv.id)}
          onBlur={() => onRenameBlur(conv.id)}
          onClick={onRenameClick}
          autoFocus
        />
      ) : (
        <span className="flex-1 min-w-0 truncate text-xs md:text-sm" style={{ maxWidth: "130px" }}>
          {conv.title || untitledLabel}
        </span>
      )}

      <div className="flex items-center gap-0.5 shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {renamingId === conv.id ? (
          <button
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-muted/60"
            onClick={e => { e.stopPropagation(); onCommitRename(conv.id); }}
            aria-label="Save rename"
          >
            <Check className="w-3 h-3 text-primary" />
          </button>
        ) : (
          <button
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-muted/60"
            onClick={e => { e.stopPropagation(); onRenameClick(e); onSelect(conv.id); }}
            aria-label="Rename"
          >
            <Pencil className="w-3 h-3 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        )}
        <button
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-destructive/10"
          onClick={e => { e.stopPropagation(); onDelete(conv.id); }}
          aria-label="Delete"
        >
          <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive transition-colors" />
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ activeId, onSelect, onClose, onCareerMatch }: SidebarProps) {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isMemoriesOpen, setIsMemoriesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; convId: number; convTitle: string | null } | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const { data: conversations, isLoading: loadingConversations } = useListOpenaiConversations();
  const { data: memories, isLoading: loadingMemories } = useListMemories();
  const demoConversations = (() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem("zei_demo_conversations") || "[]");
      return Array.isArray(stored) ? stored as Array<{ id: number; title?: string | null }> : [];
    } catch { return []; }
  })();
  const apiConversations = Array.isArray(conversations) ? conversations : [];
  const visibleConversations = [...demoConversations, ...apiConversations.filter(conversation => !demoConversations.some(item => item.id === conversation.id))];
  const visibleMemories = Array.isArray(memories) ? memories : [];

  const createConversation = useCreateOpenaiConversation();
  const deleteConversation = useDeleteOpenaiConversation();
  const deleteMemory = useDeleteMemory();

  const handleCreateChat = () => {
    createConversation.mutate({ data: {} }, {
      onSuccess: (newConv: { id: number }) => {
        onSelect(newConv.id);
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
      },
      onError: () => {
        const id = -Date.now();
        const item = { id, title: "New conversation", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        const stored = JSON.parse(localStorage.getItem("zei_demo_conversations") || "[]") as typeof item[];
        localStorage.setItem("zei_demo_conversations", JSON.stringify([item, ...stored]));
        queryClient.setQueryData(getListOpenaiConversationsQueryKey(), (current: any) => [item, ...(Array.isArray(current) ? current.filter((conversation: { id: number }) => conversation.id !== id) : [])]);
        onSelect(id);
      }
    });
  };

  const handleDeleteChat = (id: number) => {
    if (id < 0) {
      const stored = JSON.parse(localStorage.getItem("zei_demo_conversations") || "[]") as Array<{ id: number }>;
      localStorage.setItem("zei_demo_conversations", JSON.stringify(stored.filter((conversation) => conversation.id !== id)));
      queryClient.setQueryData(getListOpenaiConversationsQueryKey(), (current: any) => Array.isArray(current) ? current.filter((conversation: { id: number }) => conversation.id !== id) : []);
      if (activeId === id) onSelect(null);
      return;
    }
    deleteConversation.mutate({ id }, {
      onSuccess: () => {
        if (activeId === id) onSelect(null);
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
        toast({ title: t.conversationDeleted });
      }
    });
  };

  const handleDeleteMemory = (id: number) => {
    deleteMemory.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMemoriesQueryKey() });
        toast({ title: t.memoryDeleted });
      }
    });
  };

  const startRename = (conv: { id: number; title?: string | null }, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRenamingId(conv.id);
    setRenameValue(conv.title || "");
    setTimeout(() => renameInputRef.current?.select(), 0);
  };

  const commitRename = async (id: number) => {
    const trimmed = renameValue.trim();
    if (!trimmed) { setRenamingId(null); return; }
    if (id < 0) {
      const stored = JSON.parse(localStorage.getItem("zei_demo_conversations") || "[]") as Array<{ id: number; title?: string | null }>;
      const updated = stored.map(conversation => conversation.id === id ? { ...conversation, title: trimmed } : conversation);
      localStorage.setItem("zei_demo_conversations", JSON.stringify(updated));
      queryClient.setQueryData(getListOpenaiConversationsQueryKey(), (current: any) => Array.isArray(current) ? current.map((conversation: { id: number; title?: string | null }) => conversation.id === id ? { ...conversation, title: trimmed } : conversation) : current);
      setRenamingId(null);
      return;
    }
    try {
      await fetch(`/api/openai/conversations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(user?.id ? { "x-user-id": user.id } : {}),
        },
        body: JSON.stringify({ title: trimmed }),
      });
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    } catch {
      toast({ title: t.renameFailed, variant: "destructive" });
    }
    setRenamingId(null);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    queryClient.clear();
    onSelect(null);
    logout();
  };

  const handleConvContextMenu = (e: React.MouseEvent, conv: { id: number; title?: string | null }) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, convId: conv.id, convTitle: conv.title ?? null });
  };

  const convMenuItems: ContextMenuItem[] = ctxMenu
    ? [
        {
          label: t.renameChat,
          icon: Pencil,
          onClick: () => {
            startRename({ id: ctxMenu.convId, title: ctxMenu.convTitle });
          },
        },
        { separator: true, label: "", onClick: () => {} },
        {
          label: t.deleteChat,
          icon: Trash2,
          variant: "danger",
          onClick: () => handleDeleteChat(ctxMenu.convId),
        },
      ]
    : [];

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const avatarUrl = (user as any)?.avatarUrl as string | null | undefined;

  return (
    <>
      <div className="w-full bg-sidebar border-r flex flex-col h-full shadow-sm z-10 relative">
        {/* Brand Header */}
        <div className="px-4 pt-safe pt-4 pb-3 border-b border-sidebar-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <img src={brandAsset("zei-mark.png")} alt="Zaheen Student.AI" className="w-8 h-8 object-contain" />
              <div className="leading-tight">
                <p className="text-sm font-bold tracking-widest text-foreground">Zaheen Student.AI</p>
                <p className="text-[9px] text-muted-foreground tracking-wider">{t.dailyGuide}</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Button
            onClick={handleCreateChat}
            className="w-full justify-start gap-2 h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm"
            disabled={createConversation.isPending}
          >
            {createConversation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Plus className="w-4 h-4" />}
            {t.newChat}
          </Button>
          <button
            onClick={() => { setLocation("/questions"); onClose?.(); }}
            className="w-full mt-2 h-8 rounded-xl border border-border/40 bg-transparent hover:bg-sidebar-accent/40 transition-all text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5"
          >
            <img src={brandAsset("zei-mark.png")} alt="" className="w-3.5 h-3.5 object-contain opacity-60" />
            {t.checkCommunity}
          </button>
          <CareerMatchButton onClick={() => { onCareerMatch?.(); onClose?.(); }} />
        </div>

        <ScrollArea className="flex-1">
          <div className="px-2.5 py-4">
            {/* Conversations */}
            <div className="space-y-0.5 mb-6">
              <h3 className="px-2 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-2">
                {t.chats}
              </h3>
              {loadingConversations ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : visibleConversations.length === 0 ? (
                <p className="px-2 text-xs text-muted-foreground italic py-2">{t.noConversations}</p>
              ) : (
                visibleConversations.map((conv: { id: number; title?: string | null }) => (
                  <ConvItem
                    key={conv.id}
                    conv={conv}
                    activeId={activeId}
                    renamingId={renamingId}
                    renameValue={renameValue}
                    renameInputRef={renameInputRef}
                    onSelect={onSelect}
                    onRenameChange={setRenameValue}
                    onRenameKeyDown={(e, id) => {
                      if (e.key === "Enter") { e.preventDefault(); commitRename(id); }
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    onRenameBlur={commitRename}
                    onRenameClick={e => e.stopPropagation()}
                    onCommitRename={commitRename}
                    onDelete={handleDeleteChat}
                    onContextMenu={handleConvContextMenu}
                    onTouchOpen={(c: { id: number; title?: string | null }, x, y) => setCtxMenu({ x, y, convId: c.id, convTitle: c.title ?? null })}
                    untitledLabel={t.untitledChat}
                  />
                ))
              )}
            </div>

            {/* Memories */}
            <Collapsible open={isMemoriesOpen} onOpenChange={setIsMemoriesOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest hover:bg-sidebar-accent/30 rounded-xl transition-colors mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span>{t.memories}</span>
                  {visibleMemories.length > 0 && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-[9px] font-mono bg-sidebar-accent text-sidebar-foreground h-4">
                      {visibleMemories.length}
                    </Badge>
                  )}
                </div>
                <ChevronDown className={cn("w-3 h-3 transition-transform", isMemoriesOpen && "rotate-180")} />
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-1.5 pt-0.5">
                {loadingMemories ? (
                  <div className="flex justify-center p-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : visibleMemories.length === 0 ? (
                  <div className="px-3 py-5 mx-1 text-center bg-sidebar-accent/30 rounded-xl border border-sidebar-border/40 border-dashed">
                    <Brain className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground/40" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {t.noMemories}
                    </p>
                  </div>
                ) : (
                  visibleMemories.map((mem: { id: number; content: string }) => (
                    <div key={mem.id} className="px-3 py-2 bg-background border border-border/50 rounded-xl group relative overflow-hidden transition-all hover:border-border">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/30 rounded-l-xl" />
                      <p className="text-[11px] text-foreground/80 pr-5 leading-relaxed ml-1">{mem.content}</p>
                      <button
                        className="w-5 h-5 absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded hover:bg-destructive/10 transition-all"
                        onClick={() => handleDeleteMemory(mem.id)}
                      >
                        <Trash2 className="w-2.5 h-2.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>

        {/* User Footer */}
        {user && (
          <div className="border-t border-sidebar-border/50 p-2.5">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-sidebar-accent/40 transition-colors group">
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-primary/10 border border-border/60 flex items-center justify-center shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-semibold text-foreground/70">{initials}</span>
                )}
              </div>

              {/* Name + email */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate leading-tight">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>

              {/* Action buttons — visible on hover */}
              <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="p-1 rounded-lg hover:bg-sidebar-accent transition-colors"
                  title={t.settings}
                >
                  <Settings className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="p-1 rounded-lg hover:bg-destructive/10 transition-colors"
                  title={t.logout}
                >
                  <LogOut className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSelect={onSelect}
      />
      {showLogoutConfirm && (
        <LogoutConfirm
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={convMenuItems}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  );
}
