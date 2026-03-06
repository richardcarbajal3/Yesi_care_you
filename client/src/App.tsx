import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/landing";
import MiCamino from "@/pages/patient/mi-camino";
import AdminDashboard from "@/pages/admin/dashboard";
import NuevaReceta from "@/pages/admin/nueva-receta";

import NurseDashboard from "@/pages/nurse/dashboard";
import NewPatient from "@/pages/nurse/new-patient";
import PatientDetail from "@/pages/nurse/patient-detail";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={MiCamino} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/nueva-receta" component={NuevaReceta} />
        <Route path="/mi-camino" component={MiCamino} />
        <Route component={MiCamino} />
      </Switch>
    );
  }

  const isNurse = user?.role === "nurse";

  if (isNurse) {
    return (
      <Switch>
        <Route path="/" component={NurseDashboard} />
        <Route path="/enfermero" component={NurseDashboard} />
        <Route path="/enfermero/nuevo-paciente" component={NewPatient} />
        <Route path="/enfermero/paciente/:id" component={PatientDetail} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/nueva-receta" component={NuevaReceta} />
        <Route path="/mi-camino" component={MiCamino} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/nueva-receta" component={NuevaReceta} />
      <Route path="/mi-camino" component={MiCamino} />
      <Route component={MiCamino} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
