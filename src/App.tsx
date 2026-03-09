import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import NilaChatbot from "./components/NilaChatbot";
import Dashboard from "./pages/Dashboard";
import StudentModule from "./pages/StudentModule";
import WorkplaceModule from "./pages/WorkplaceModule";
import HealthcareModule from "./pages/HealthcareModule";
import InvestigationModule from "./pages/InvestigationModule";
import EmotionModule from "./pages/EmotionModule";
import HistoryPage from "./pages/HistoryPage";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/student" element={<StudentModule />} />
                    <Route path="/workplace" element={<WorkplaceModule />} />
                    <Route path="/healthcare" element={<HealthcareModule />} />
                    <Route path="/investigation" element={<InvestigationModule />} />
                    <Route path="/emotion" element={<EmotionModule />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
                <NilaChatbot />
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
