
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import SettingsPanel from "@/components/SettingsPanel";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ResetPassword";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public auth entry point. The page stays outside the dashboard shell so users
                can sign in without loading the full application chrome first. */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected application shell. The entire dashboard layout now reads from
                AuthContext through a single ProtectedRoute wrapper instead of repeating
                the guard around every child page. */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            >
              <Route index element={<BusinessDashboard />} />
              <Route path="dashboard" element={<BusinessDashboard />} />
              <Route path="trading" element={<TradingBot />} />
              <Route path="leadbot" element={<LeadBot />} />
              <Route path="portal" element={<CustomerPortal />} />
              <Route path="rhnis" element={<RHNISIdentity />} />
              <Route path="businesses" element={<BusinessCards />} />
              <Route path="leads" element={<LeadManagement />} />
              <Route path="workers" element={<WorkerControl />} />
              <Route path="chat" element={<ChatPanel />} />
              <Route path="settings" element={<SettingsPanel />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
