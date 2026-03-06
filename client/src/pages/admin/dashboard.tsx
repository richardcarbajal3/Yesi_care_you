import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Heart,
  Scale,
  Sparkles,
  UserCheck,
  Eye,
  ArrowRight,
  Plus,
  FileText,
  MessageSquare,
  Mail,
  CheckCheck
} from "lucide-react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

interface FeedbackItem {
  id: string;
  name: string | null;
  email: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface SimulatedPatient {
  id: string;
  userId: string;
  fullName: string;
  programTitle: string;
  programType: "recovery" | "weight" | "antiage";
  icon: any;
  description: string;
  color: string;
}

const SIMULATED_PATIENTS: SimulatedPatient[] = [
  {
    id: "patient-richard-001",
    userId: "46342018",
    fullName: "Richard",
    programTitle: "Recuperación Post-Operatoria",
    programType: "recovery",
    icon: Heart,
    description: "Recuperándose de una operación. Seguimiento de cuidados post-quirúrgicos.",
    color: "from-red-500 to-pink-500"
  },
  {
    id: "patient-sofia-001",
    userId: "user-sofia-001",
    fullName: "Sofía",
    programTitle: "Rutina de Cuidado Facial",
    programType: "weight",
    icon: Scale,
    description: "Programa de belleza y cuidado de piel. Rutinas de skincare diarias.",
    color: "from-amber-500 to-orange-500"
  },
  {
    id: "patient-carmen-001",
    userId: "user-carmen-001",
    fullName: "Carmen",
    programTitle: "Programa Anti-Edad Integral",
    programType: "antiage",
    icon: Sparkles,
    description: "Tratamiento anti-age completo. Colágeno, ejercicio facial y nutrición.",
    color: "from-purple-500 to-indigo-500"
  }
];

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const { data: feedbackList = [] } = useQuery<FeedbackItem[]>({
    queryKey: ["/api/admin/feedback"],
    queryFn: async () => {
      const res = await fetch("/api/admin/feedback");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/feedback/${id}/read`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback"] });
    },
  });

  const unreadCount = feedbackList.filter(f => !f.isRead).length;

  useEffect(() => {
    const stored = localStorage.getItem("simulatedPatientId");
    if (stored) {
      setSelectedUser(stored);
    }
  }, []);

  const handleSelectPatient = (patient: SimulatedPatient) => {
    localStorage.setItem("simulatedPatientId", patient.id);
    setSelectedUser(patient.id);
  };

  const handleViewAsPatient = () => {
    if (selectedUser) {
      setLocation("/mi-camino");
    }
  };

  const handleClearSimulation = () => {
    localStorage.removeItem("simulatedPatientId");
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Simula la experiencia de diferentes pacientes para probar la aplicación. 
            Selecciona un perfil y explora su camino de cuidado.
          </p>
        </div>

        <Card className="border-2 border-dashed border-primary/40 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 hover:border-primary transition-colors cursor-pointer"
          onClick={() => setLocation("/admin/nueva-receta")}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <Plus className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Nueva Receta o Deseo
                </h3>
                <p className="text-muted-foreground">
                  Sube una foto de receta o describe tu deseo de cuidado para generar un plan con IA
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        {selectedUser && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-primary" />
                  <span className="font-semibold">
                    Usuario activo: {SIMULATED_PATIENTS.find(p => p.id === selectedUser)?.fullName}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleClearSimulation}
                  >
                    Limpiar
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleViewAsPatient}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver como paciente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {SIMULATED_PATIENTS.map((patient) => {
            const Icon = patient.icon;
            const isSelected = selectedUser === patient.id;
            
            return (
              <Card 
                key={patient.id}
                className={`
                  cursor-pointer transition-all hover:shadow-lg
                  ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:border-primary/30'}
                `}
                onClick={() => handleSelectPatient(patient)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div className={`
                      w-16 h-16 rounded-2xl bg-gradient-to-br ${patient.color}
                      flex items-center justify-center flex-shrink-0 shadow-lg
                    `}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-xl font-semibold">{patient.fullName}</h3>
                        {isSelected && (
                          <Badge className="bg-primary">Seleccionado</Badge>
                        )}
                      </div>
                      <Badge variant="outline">{patient.programTitle}</Badge>
                      <p className="text-muted-foreground">{patient.description}</p>
                    </div>

                    <ArrowRight className={`
                      w-6 h-6 flex-shrink-0 transition-colors
                      ${isSelected ? 'text-primary' : 'text-muted-foreground'}
                    `} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feedback Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Comentarios de usuarios
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white ml-2">{unreadCount} nuevos</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feedbackList.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                No hay comentarios aún.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {feedbackList.map((fb) => (
                  <Card
                    key={fb.id}
                    className={`border ${!fb.isRead ? 'border-primary/40 bg-primary/5' : 'border-muted'}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">
                              {fb.name || "Anónimo"}
                            </span>
                            {fb.email && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {fb.email}
                              </span>
                            )}
                            {!fb.isRead && (
                              <Badge variant="secondary" className="text-xs">Nuevo</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {fb.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(fb.createdAt).toLocaleString("es-PE")}
                          </p>
                        </div>
                        {!fb.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markReadMutation.mutate(fb.id)}
                            title="Marcar como leído"
                          >
                            <CheckCheck className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            <p>
              <strong>Nota:</strong> Esta es una herramienta de demostración.
              Al seleccionar un paciente, la aplicación simulará su sesión
              para que puedas explorar su experiencia personalizada.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
