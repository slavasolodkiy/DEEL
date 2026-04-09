import "@/lib/i18n";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Workers from "@/pages/workers";
import WorkerDetail from "@/pages/worker-detail";
import WorkerNew from "@/pages/worker-new";
import Contracts from "@/pages/contracts";
import ContractNew from "@/pages/contract-new";
import Payments from "@/pages/payments";
import Compliance from "@/pages/compliance";
import Onboarding from "@/pages/onboarding";
import Notifications from "@/pages/notifications";
import Login from "@/pages/login";
import Register from "@/pages/register";
import OnboardFlow from "@/pages/onboard/index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

function AppRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/onboard" component={OnboardFlow} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/">
              <Redirect to="/dashboard" />
            </Route>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/workers/new" component={WorkerNew} />
            <Route path="/workers/:id" component={WorkerDetail} />
            <Route path="/workers" component={Workers} />
            <Route path="/contracts/new" component={ContractNew} />
            <Route path="/contracts" component={Contracts} />
            <Route path="/payments" component={Payments} />
            <Route path="/compliance" component={Compliance} />
            <Route path="/onboarding" component={Onboarding} />
            <Route path="/notifications" component={Notifications} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="globalhr-theme">
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppRouter />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
