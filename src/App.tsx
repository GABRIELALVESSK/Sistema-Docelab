import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Receitas from "./pages/Receitas";
import Estoque from "./pages/Estoque";
import Pedidos from "./pages/Pedidos";
import Clientes from "./pages/Clientes";
import Orcamentos from "./pages/Orcamentos";
import ListaCompras from "./pages/ListaCompras";
import Financas from "./pages/Financas";
import Caixa from "./pages/Caixa";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import NotFound from "./pages/NotFound";
import { SettingsProvider } from "./contexts/SettingsContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { GlobalStyles } from "./components/GlobalStyles";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F1EB]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#FF8A96] animate-spin" />
          <p className="text-gray-500 font-medium text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F1EB]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#FF8A96] animate-spin" />
          <p className="text-gray-500 font-medium text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes (no sidebar/layout) */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/cadastro"
        element={user ? <Navigate to="/" replace /> : <Cadastro />}
      />

      {/* Protected routes (with sidebar/layout) */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <SettingsProvider>
              <GlobalStyles />
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/receitas" element={<Receitas />} />
                  <Route path="/estoque" element={<Estoque />} />
                  <Route path="/pedidos" element={<Pedidos />} />
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/orcamentos" element={<Orcamentos />} />
                  <Route path="/lista-compras" element={<ListaCompras />} />
                  <Route path="/financas" element={<Financas />} />
                  <Route path="/caixa" element={<Caixa />} />
                  <Route path="/configuracoes" element={<Configuracoes />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MainLayout>
            </SettingsProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
