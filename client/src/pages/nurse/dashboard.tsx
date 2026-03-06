import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, TrendingUp, Trophy, Activity } from "lucide-react";
import { useLocation } from "wouter";
import type { Patient } from "@shared/schema";

interface PatientWithStats extends Patient {
  completionRate?: number;
  lastActivity?: string;
}

export default function NurseDashboard() {
  const [, navigate] = useLocation();

  const { data: patients, isLoading } = useQuery<PatientWithStats[]>({
    queryKey: ["/api/nurse/patients"],
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const totalPatients = patients?.length || 0;
  const avgPoints = patients?.length 
    ? Math.round(patients.reduce((acc, p) => acc + p.totalPoints, 0) / patients.length)
    : 0;
  const activePatients = patients?.filter(p => (p.currentStreak || 0) > 0).length || 0;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary/10 to-chart-3/10 border-primary/20">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">Panel de Enfermero</h1>
                <p className="text-muted-foreground">Gestiona a tus pacientes</p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => navigate("/enfermero/nuevo-paciente")}
              data-testid="button-new-patient"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Paciente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pacientes</p>
                <p className="text-3xl font-bold text-primary" data-testid="text-total-patients">
                  {totalPatients}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-chart-1/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pacientes Activos</p>
                <p className="text-3xl font-bold text-chart-1" data-testid="text-active-patients">
                  {activePatients}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-chart-3/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Puntos Promedio</p>
                <p className="text-3xl font-bold text-chart-3" data-testid="text-avg-points">
                  {avgPoints}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patients List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Mis Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          {patients && patients.length > 0 ? (
            <div className="space-y-3">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border border-border hover-elevate active-elevate-2 cursor-pointer"
                  onClick={() => navigate(`/enfermero/paciente/${patient.id}`)}
                  data-testid={`patient-card-${patient.id}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={undefined} alt={patient.fullName} />
                      <AvatarFallback>{getInitials(patient.fullName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{patient.fullName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {patient.lastActivity 
                          ? `Última actividad: ${new Date(patient.lastActivity).toLocaleDateString('es-ES')}`
                          : 'Sin actividad reciente'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Trophy className="w-3 h-3 mr-1" />
                      {patient.totalPoints} pts
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {patient.currentStreak} días
                    </Badge>
                    {patient.completionRate !== undefined && (
                      <Badge 
                        variant={patient.completionRate > 70 ? "default" : "outline"}
                        className="text-xs"
                      >
                        {patient.completionRate}% completado
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">
                Aún no tienes pacientes
              </h3>
              <p className="text-muted-foreground mb-6">
                Comienza agregando tu primer paciente
              </p>
              <Button onClick={() => navigate("/enfermero/nuevo-paciente")} data-testid="button-add-first-patient">
                <Plus className="w-5 h-5 mr-2" />
                Agregar Paciente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
