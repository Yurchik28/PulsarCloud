import { QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient, queryClient } from "./lib/trpc";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CloudServers from "./pages/CloudServers";
import CloudServerDetail from "./pages/CloudServerDetail";
import GPUs from "./pages/GPUs";
import GPUDetail from "./pages/GPUDetail";
import Pricing from "./pages/Pricing";
import Calculator from "./pages/Calculator";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Admin from "./pages/Admin";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/cloud-servers"} component={CloudServers} />
      <Route path={"/cloud-servers/:slug"} component={CloudServerDetail} />
      <Route path={"/gpus"} component={GPUs} />
      <Route path={"/gpus/:slug"} component={GPUDetail} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/calculator"} component={Calculator} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/register"} component={Register} />
      <Route path={"/login"} component={Login} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/billing"} component={Billing} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <ThemeProvider defaultTheme="dark">
            <TooltipProvider>
              <Toaster />
              <div className="flex flex-col min-h-screen bg-background text-foreground">
                <Navigation />
                <main className="flex-1">
                  <Router />
                </main>
                <Footer />
              </div>
            </TooltipProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
