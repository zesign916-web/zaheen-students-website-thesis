import { useCallback, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WebsitePreloader } from "@/components/website-preloader";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AppearanceProvider } from "@/hooks/use-appearance";
import { LanguageProvider } from "@/hooks/use-language";
import NotFound from "@/pages/not-found";
import ChatPage from "@/pages/chat";
import LoginPage from "@/pages/login";
import QuestionsHubPage from "@/pages/questions-hub";
import SectionPage from "@/pages/section-page";
import HomePage from "@/pages/home";
import AboutPage from "@/pages/about";
import { OnboardingOverlay } from "@/components/onboarding-overlay";
import { Preloader } from "@/components/preloader";

const queryClient = new QueryClient();

function AppRoutes() {
  const [location] = useLocation();
  return (
    <div key={location} className="zt-fade" style={{ minHeight: "100vh" }}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/about" component={AboutPage} />
        <Route path={/^\/ai$/i} component={ChatPage} />
        <Route path="/questions" component={QuestionsHubPage} />
        <Route path="/questions/:section" component={SectionPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const [onboardingDone, setOnboardingDone] = useState(() => {
    try { return localStorage.getItem("zei_onboarding_complete") === "true"; }
    catch { return false; }
  });

  if (location === "/" || location === "/about") {
    return <AppRoutes />;
  }

  if (isLoading) {
    return <Preloader />;
  }

  // Determine which top-level "page" is active so we can key the transition
  const pageKey = !user
    ? "login"
    : !user.birthday && !onboardingDone
      ? "onboarding"
      : "app";

  return (
    <div key={pageKey} className="zt-page" style={{ minHeight: "100vh" }}>
      {pageKey === "login" && <LoginPage />}
      {pageKey === "onboarding" && (
        <OnboardingOverlay onDone={() => setOnboardingDone(true)} />
      )}
      {pageKey === "app" && <AppRoutes />}
    </div>
  );
}

function App() {
  const [showPreloader, setShowPreloader] = useState(true);
  const finishPreloader = useCallback(() => setShowPreloader(false), []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <AppearanceProvider>
            <AuthProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
              {showPreloader && <WebsitePreloader onComplete={finishPreloader} />}
            </AuthProvider>
          </AppearanceProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
