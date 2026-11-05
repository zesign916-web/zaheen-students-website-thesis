import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type AuthUser } from "@/hooks/use-auth";
import { useAppearance, type FontSize } from "@/hooks/use-appearance";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, Trash2, Sun, Moon, AlertTriangle, Star, Send, ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/hooks/use-language";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (id: number | null) => void;
}

interface StoredReview {
  id: number;
  messageContent: string;
  selectedLine: string | null;
  rating: number;
  note: string | null;
  createdAt: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "w-3.5 h-3.5",
            s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20",
          )}
        />
      ))}
    </div>
  );
}

export function SettingsDialog({ open, onOpenChange, onSelect }: SettingsDialogProps) {
  const { user, login, logout } = useAuth();
  const { theme, setTheme, fontSize, setFontSize } = useAppearance();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(() => localStorage.getItem("zei_username") || user?.username || user?.email.split("@")[0] || "");
  const [phone, setPhone] = useState((user as any)?.phone ?? "");
  const [province, setProvince] = useState((user as any)?.province ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>((user as any)?.avatarUrl ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [problemNote, setProblemNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [selectedReviewId, setSelectedReviewId] = useState<number | "">("");
  const [reportNote, setReportNote] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoadingReviews(true);
    fetch("/api/reviews", { headers: { "x-user-id": user.id } })
      .then((r) => r.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [open, user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      let avatarUrl: string | undefined = (user as any).avatarUrl ?? undefined;
      if (avatarFile) avatarUrl = avatarPreview ?? undefined;
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ name: name.trim() || user.name, phone: phone.trim() ? `+92${phone.trim().replace(/^0/, "")}` : null, province: province || null, avatarUrl: avatarUrl ?? null }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? t.somethingWrong); }
      const updated: AuthUser = await res.json();
      localStorage.setItem("zei_username", username.trim());
      login({ ...updated, username: username.trim() });
      toast({ title: t.profileSaved });
    } catch {
      localStorage.setItem("zei_username", username.trim());
      login({ ...user, name: name.trim() || user.name, phone, province, username: username.trim(), avatarUrl: avatarPreview });
      toast({ title: "Saved in this browser", description: "Profile changes are stored locally for this preview." });
    } finally { setIsSaving(false); }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/auth/account", { method: "DELETE", headers: { "x-user-id": user.id } });
      if (!res.ok && res.status !== 204) throw new Error(t.somethingWrong);
      queryClient.clear();
      onSelect?.(null);
      logout();
      onOpenChange(false);
      toast({ title: t.accountDeleted });
    } catch (err: any) {
      toast({ title: t.error, description: err.message, variant: "destructive" });
    } finally { setIsDeleting(false); setShowDeleteConfirm(false); }
  };

  const handleDeleteReview = async (id: number) => {
    if (!user) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": user.id },
      });
      if (!res.ok && res.status !== 204) throw new Error(t.somethingWrong);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      if (selectedReviewId === id) setSelectedReviewId("");
      toast({ title: t.reviewDeleted });
    } catch {
      toast({ title: t.errorDeletingReview, variant: "destructive" });
    } finally { setDeletingId(null); }
  };

  const handleSubmitReport = async () => {
    if (!user || !selectedReviewId) return;
    const review = reviews.find((r) => r.id === selectedReviewId);
    if (!review) return;
    setIsSubmittingReport(true);
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({
          reviewId: review.id,
          messageContent: review.selectedLine || review.messageContent,
          additionalNote: reportNote.trim() || undefined,
        }),
      });
      setReportSubmitted(true);
      setReportNote("");
      setSelectedReviewId("");
    } catch {
      toast({ title: t.errorSubmittingReport, variant: "destructive" });
    } finally { setIsSubmittingReport(false); }
  };

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const fontSizes: { value: FontSize; label: string }[] = [
    { value: "small", label: t.small },
    { value: "medium", label: t.medium },
    { value: "large", label: t.large },
  ];

  const THEMES = [
    { value: "light" as const, label: t.light, preview: <Sun className="w-5 h-5" /> },
    { value: "dark" as const, label: t.dark, preview: <Moon className="w-5 h-5" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0 gap-0 overflow-hidden rounded-2xl border border-border/60 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <DialogTitle className="text-base font-semibold tracking-tight">{t.settingsTitle}</DialogTitle>
          <DialogDescription className="sr-only">{t.settingsDesc}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-4 flex flex-col flex-1 min-h-0">
          <TabsList className="mx-6 mb-0 h-9 bg-muted/50 rounded-xl grid grid-cols-4 shrink-0">
            <TabsTrigger value="profile" className="rounded-lg text-xs">{t.profile}</TabsTrigger>
            <TabsTrigger value="account" className="rounded-lg text-xs">Account</TabsTrigger>
            <TabsTrigger value="appearance" className="rounded-lg text-xs">{t.appearance}</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg text-xs">{t.myReviews}</TabsTrigger>
          </TabsList>

          {/* ─── PROFILE TAB ─── */}
          <TabsContent value="profile" className="mt-0 overflow-y-auto max-h-[calc(90vh-9rem)] px-6 pb-6 pt-4 space-y-5">
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <div
                  className="w-20 h-20 rounded-full bg-primary/10 border-2 border-border/60 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-semibold text-foreground/60">{initials}</span>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
              <button onClick={() => fileInputRef.current?.click()} className="text-xs text-primary hover:underline">
                {avatarPreview ? t.changePhoto : t.addPhoto}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_.-]/g, ""))} placeholder="Choose a username" className="rounded-xl h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">User ID</Label>
              <Input value={user?.id ?? ""} readOnly disabled className="rounded-xl h-10 font-mono text-xs opacity-60" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.nameLabel}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePlaceholder} className="rounded-xl h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.phoneLabel}</Label>
              <div className="flex items-center rounded-xl border border-input h-10 overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                <div className="flex items-center gap-1.5 px-3 bg-muted/40 border-r border-input h-full shrink-0 select-none">
                  <span className="text-base leading-none">🇵🇰</span>
                  <span className="text-xs font-medium text-foreground/70">+92</span>
                </div>
                <input
                  value={phone.replace(/^\+92/, "")}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="300 0000000"
                  type="tel"
                  inputMode="numeric"
                  maxLength={12}
                  className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 h-full"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.provinceLabel}</Label>
              <div className="relative">
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-input bg-background h-10 px-3 pr-8 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
                >
                  <option value="">{t.selectProvince}</option>
                  <option value="Punjab">{t.punjab}</option>
                  <option value="Sindh">{t.sindh}</option>
                  <option value="Balochistan">{t.balochistan}</option>
                  <option value="Khyber Pakhtunkhwa">{t.kpk}</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.emailLabel}</Label>
              <Input value={user?.email ?? ""} readOnly disabled className="rounded-xl h-10 opacity-60 cursor-not-allowed" />
            </div>

            <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full h-10 rounded-xl">
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t.saving}</> : t.saveChanges}
            </Button>

            <div className="pt-2 border-t border-border/40">
              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 text-xs text-destructive hover:underline">
                  <Trash2 className="w-3.5 h-3.5" />{t.deleteAccount}
                </button>
              ) : (
                <div className="space-y-3 bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground leading-relaxed">{t.deleteWarning}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={() => setShowDeleteConfirm(false)}>{t.cancel}</Button>
                    <Button variant="destructive" size="sm" className="flex-1 rounded-lg" onClick={handleDeleteAccount} disabled={isDeleting}>
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.delete}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="account" className="mt-0 overflow-y-auto max-h-[calc(90vh-9rem)] px-6 pb-6 pt-4 space-y-5">
            <div>
              <h3 className="text-sm font-semibold">Change password</h3>
              <p className="mt-1 text-xs text-muted-foreground">Password updates will be connected to secure account services; values here are never stored.</p>
              <div className="mt-3 grid gap-3">
                <Input type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" className="h-10 rounded-xl" />
                <Input type="password" autoComplete="new-password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} placeholder="Confirm new password" className="h-10 rounded-xl" />
                <Button variant="outline" className="rounded-xl" onClick={() => toast({ title: newPassword.length >= 8 && newPassword === confirmNewPassword ? "Password API not connected" : "Check your password fields", description: "No password has been saved." })}>Update password</Button>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold">Report a problem</h3>
              <textarea value={problemNote} onChange={e => setProblemNote(e.target.value)} rows={3} placeholder="Describe the issue you encountered" className="mt-3 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring" />
              <Button variant="outline" className="mt-2 w-full rounded-xl" disabled={!problemNote.trim()} onClick={() => { localStorage.setItem("zei_problem_report", JSON.stringify({ message: problemNote.trim(), createdAt: new Date().toISOString() })); setProblemNote(""); toast({ title: "Report saved in this browser", description: "A report API is not connected in this frontend preview." }); }}>Save report locally</Button>
            </div>
            <div className="border-t border-border pt-4">
              <p className="mb-3 text-xs text-muted-foreground">Signed in as {user?.email}</p>
              <Button variant="outline" className="w-full rounded-xl" onClick={() => { queryClient.clear(); onSelect?.(null); logout(); onOpenChange(false); }}><LogOut className="mr-2 h-4 w-4" />Log out</Button>
            </div>
          </TabsContent>

          {/* ─── APPEARANCE TAB ─── */}
          <TabsContent value="appearance" className="mt-0 overflow-y-auto max-h-[calc(90vh-9rem)] px-6 pb-6 pt-4 space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.themeLabel}</Label>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map((th) => (
                  <button
                    key={th.value}
                    onClick={() => setTheme(th.value)}
                    className={cn(
                      "flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all",
                      theme === th.value
                        ? "border-primary bg-primary/5"
                        : "border-border/50 hover:border-border"
                    )}
                  >
                    <span className={theme === th.value ? "text-primary" : "text-muted-foreground"}>
                      {th.preview}
                    </span>
                    <span className={cn("text-xs font-medium", theme === th.value ? "text-primary" : "text-muted-foreground")}>
                      {th.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.fontSizeLabel}</Label>
              <div className="grid grid-cols-3 gap-2">
                {fontSizes.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFontSize(value)}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border-2 text-center transition-all",
                      fontSize === value ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"
                    )}
                  >
                    <span className={cn("font-medium block", value === "small" ? "text-xs" : value === "medium" ? "text-sm" : "text-base", fontSize === value ? "text-primary" : "text-muted-foreground")}>
                      Aa
                    </span>
                    <span className={cn("text-[10px] mt-0.5 block", fontSize === value ? "text-primary" : "text-muted-foreground/60")}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Preview: <span className="text-foreground">{t.previewText}</span>
              </p>
            </div>
          </TabsContent>

          {/* ─── MY REVIEWS TAB ─── */}
          <TabsContent value="reviews" className="mt-0">
            <ScrollArea className="max-h-[calc(90vh-9rem)]">
              <div className="px-6 pt-4 pb-2">
                <p className="text-xs text-muted-foreground">
                  {reviews.length === 0 && !loadingReviews
                    ? t.noReviews
                    : t.reviewsCount(reviews.length)}
                </p>
              </div>

              {loadingReviews ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 px-6 text-center">
                  <Star className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">{t.noReviews}</p>
                  <p className="text-xs text-muted-foreground/60">{t.noReviewsHint}</p>
                </div>
              ) : (
                <div className="space-y-3 px-6 pb-4">
                  {reviews.map((rv) => (
                    <div key={rv.id} className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <StarDisplay rating={rv.rating} />
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground/60">
                            {new Date(rv.createdAt).toLocaleString("en-PK", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                          <button
                            onClick={() => handleDeleteReview(rv.id)}
                            disabled={deletingId === rv.id}
                            title={t.delete}
                            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive transition-colors disabled:opacity-40"
                          >
                            {deletingId === rv.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Trash2 className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {rv.selectedLine && (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                          <p className="text-[10px] text-primary/60 font-medium uppercase tracking-wide mb-1">{t.reviewedExcerpt}</p>
                          <p className="text-xs text-foreground/80 leading-relaxed italic">"{rv.selectedLine}"</p>
                        </div>
                      )}

                      <div className="rounded-lg bg-background/60 border border-border/30 px-3 py-2 max-h-32 overflow-y-auto">
                        <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wide mb-1">
                          {rv.selectedLine ? t.fullResponse : t.response}
                        </p>
                        <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                          {rv.messageContent}
                        </p>
                      </div>

                      {rv.note && (
                        <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                          "{rv.note}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ─── SUBMIT REPORT SECTION ─── */}
              {reviews.length > 0 && (
                <div className="mx-6 mb-6 rounded-xl border border-border/60 bg-card/60 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-0.5">{t.submitReport}</p>
                    <p className="text-xs text-muted-foreground">{t.submitReportDesc}</p>
                  </div>

                  {reportSubmitted ? (
                    <div className="flex flex-col items-center gap-2 py-4 text-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Send className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-foreground">{t.reportSubmitted}</p>
                      <p className="text-xs text-muted-foreground">{t.reportSubmittedDesc}</p>
                      <button
                        onClick={() => setReportSubmitted(false)}
                        className="text-xs text-primary hover:underline mt-1"
                      >
                        {t.submitAnother}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {t.selectReview}
                        </label>
                        <div className="relative">
                          <select
                            value={selectedReviewId}
                            onChange={(e) => setSelectedReviewId(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full appearance-none rounded-xl border border-border/50 bg-background px-3 py-2 pr-8 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
                          >
                            <option value="">{t.chooseReview}</option>
                            {reviews.map((rv) => (
                              <option key={rv.id} value={rv.id}>
                                {"★".repeat(rv.rating)}{"☆".repeat(5 - rv.rating)} ·{" "}
                                {(rv.selectedLine || rv.messageContent).slice(0, 50)}
                                {(rv.selectedLine || rv.messageContent).length > 50 ? "…" : ""}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {t.additionalContext}
                        </label>
                        <textarea
                          value={reportNote}
                          onChange={(e) => setReportNote(e.target.value)}
                          placeholder={t.additionalPlaceholder}
                          rows={3}
                          className="w-full resize-none rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/40 transition-colors"
                        />
                      </div>

                      <button
                        onClick={handleSubmitReport}
                        disabled={!selectedReviewId || isSubmittingReport}
                        className="w-full py-2.5 text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                      >
                        {isSubmittingReport ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" />{t.submitting}</>
                        ) : (
                          <><Send className="w-3.5 h-3.5" />{t.submitReportBtn}</>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
