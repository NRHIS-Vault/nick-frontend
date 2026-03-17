
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/routes/ProtectedRoute";
import BusinessDashboard from "@/components/BusinessDashboard";
import TradingBot from "@/components/TradingBot";
import LeadBot from "@/components/LeadBot";
import CustomerPortal from "@/components/CustomerPortal";
import RHNISIdentity from "@/components/RHNISIdentity";
import BusinessCards from "@/components/BusinessCards";
import LeadManagement from "@/components/LeadManagement";
import WorkerControl from "@/components/WorkerControl";
import ChatInterface from "@/components/ChatInterface";
import NickAvatar from "@/components/NickAvatar";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ChatPanel = () => (
  <div className="space-y-6">
    <div className="text-center">
      <NickAvatar />
      <h2 className="text-2xl font-bold mt-4">Nick AI Assistant</h2>
      <p className="text-muted-foreground mt-2">Your Right Hand Nick Identity System</p>
    </div>
    <ChatInterface />
  </div>
);

const SettingsPanel = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold">Settings</h2>
    <p className="text-muted-foreground">
      Account, workspace, and notification controls will live here. This route stays public-ready
      while authentication is still being wired up.
    </p>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          {/* Public auth entry point. The page stays outside the dashboard shell so users
              can sign in without loading the full application chrome first. */}
          <Route path="/login" element={<Login />} />

          {/* Protected application shell. Each child route inherits the shared layout and
              now passes through the session-aware ProtectedRoute wrapper. */}
          <Route path="/" element={<Index />}>
            <Route
              index
              element={
                <ProtectedRoute>
                  <BusinessDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <BusinessDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="trading"
              element={
                <ProtectedRoute>
                  <TradingBot />
                </ProtectedRoute>
              }
            />
            <Route
              path="leadbot"
              element={
                <ProtectedRoute>
                  <LeadBot />
                </ProtectedRoute>
              }
            />
            <Route
              path="portal"
              element={
                <ProtectedRoute>
                  <CustomerPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="rhnis"
              element={
                <ProtectedRoute>
                  <RHNISIdentity />
                </ProtectedRoute>
              }
            />
            <Route
              path="businesses"
              element={
                <ProtectedRoute>
                  <BusinessCards />
                </ProtectedRoute>
              }
            />
            <Route
              path="leads"
              element={
                <ProtectedRoute>
                  <LeadManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="workers"
              element={
                <ProtectedRoute>
                  <WorkerControl />
                </ProtectedRoute>
              }
            />
            <Route
              path="chat"
              element={
                <ProtectedRoute>
                  <ChatPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute>
                  <SettingsPanel />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
