import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trophy, TrendingUp, Activity, Calendar, Heart } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Patient, Challenge, SupportActivity } from "@shared/schema";

export default function PatientDetail() {
  const [, params] = useRoute("/enfermero/paciente/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const patientId = params?.id;

  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengePoints, setChallengePoints] = useState("10");
  
  const [supportTitle, setSupportTitle] = useState("");
  const [supportDescription, setSupportDescription] = useState("");
  const [supportType, setSupportType] = useState("");
  const [supportDate, setSupportDate] = useState("");

  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: ["/api/nurse/patient", patientId],
    enabled: !!patientId,
  });

  const { data: challenges, isLoading: challengesLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/nurse/patient/challenges", patientId],
    enabled: !!patientId,
  });

  const { data: supportActivities, isLoading: supportLoading } = useQuery<SupportActivity[]>({
    queryKey: ["/api/nurse/patient/support", patientId],
    enabled: !!patientId,
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; points: number }) => {
      return await apiRequest("POST", `/api/nurse/patient/${patientId}/challenge`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nurse/patient/challenges", patientId] });
      toast({ title: "Reto creado", description: "El reto ha sido agregado exitosamente" });
      setChallengeDialogOpen(false);
      setChallengeTitle("");
      setChallengeDescription("");
      setChallengePoints("10");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Cerraste sesión. Iniciando sesión de nuevo...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "No se pudo crear el reto", variant: "destructive" });
    },
  });

  const createSupportMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; type: string; activityDate: string }) => {
      return await apiRequest("POST", `/api/nurse/patient/${patientId}/support`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nurse/patient/support", patientId] });
      toast({ title: "Actividad agregada", description: "El apoyo ha sido registrado exitosamente" });
      setSupportDialogOpen(false);
      setSupportTitle("");
      setSupportDescription("");
      setSupportType("");
      setSupportDate("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Cerraste sesión. Iniciando sesión de nuevo...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "No se pudo agregar el apoyo", variant: "destructive" });
    },
  });

  const handleCreateChallenge = () => {
    if (!challengeTitle.trim()) {
      toast({ title: "Error", description: "El título es requerido", variant: "destructive" });
      return;
    }
    createChallengeMutation.mutate({
      title: challengeTitle,
      description: challengeDescription,
      points: parseInt(challengePoints) || 10,
    });
  };

  const handleCreateSupport = () => {
    if (!supportTitle.trim() || !supportType.trim() || !supportDate) {
      toast({ title: "Error", description: "Completa todos los campos requeridos", variant: "destructive" });
      return;
    }
    createSupportMutation.mutate({
      title: supportTitle,
      description: supportDescription,
      type: supportType,
      activityDate: supportDate,
    });
  };

  if (patientLoading || challengesLoading || supportLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6 text-center">
        <Card>
          <CardContent className="p-12">
            <h2 className="text-2xl font-bold mb-4">Paciente no encontrado</h2>
            <Button onClick={() => navigate("/enfermero")}>Volver al panel</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/enfermero")} data-testid="button-back">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
      </Button>

      {/* Patient Header */}
      <Card>
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-2xl">{getInitials(patient.fullName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-display text-3xl font-bold mb-2" data-testid="text-patient-name">
                {patient.fullName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                <Badge variant="secondary">
                  <Trophy className="w-4 h-4 mr-1" />
                  {patient.totalPoints} puntos
                </Badge>
                <Badge variant="secondary">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Racha de {patient.currentStreak} días
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Challenges Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display flex items-center gap-2">
              <Heart className="w-5 h-5 text-chart-3" />
              Retos Personalizados
            </CardTitle>
            <Dialog open={challengeDialogOpen} onOpenChange={setChallengeDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-challenge">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Reto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Reto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="challenge-title">Título del Reto</Label>
                    <Input
                      id="challenge-title"
                      value={challengeTitle}
                      onChange={(e) => setChallengeTitle(e.target.value)}
                      placeholder="Ej: Mantén tu brazo relajado 10 min después de la aplicación"
                      data-testid="input-challenge-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="challenge-description">Descripción (opcional)</Label>
                    <Textarea
                      id="challenge-description"
                      value={challengeDescription}
                      onChange={(e) => setChallengeDescription(e.target.value)}
                      placeholder="Detalles adicionales del reto..."
                      data-testid="textarea-challenge-description"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="challenge-points">Puntos</Label>
                    <Input
                      id="challenge-points"
                      type="number"
                      value={challengePoints}
                      onChange={(e) => setChallengePoints(e.target.value)}
                      min="1"
                      data-testid="input-challenge-points"
                    />
                  </div>
                  <Button
                    onClick={handleCreateChallenge}
                    className="w-full"
                    disabled={createChallengeMutation.isPending}
                    data-testid="button-submit-challenge"
                  >
                    {createChallengeMutation.isPending ? "Creando..." : "Crear Reto"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {challenges && challenges.length > 0 ? (
            <div className="space-y-3">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="p-4 rounded-lg border border-border hover-elevate" data-testid={`challenge-${challenge.id}`}>
                  <h4 className="font-semibold mb-1">{challenge.title}</h4>
                  {challenge.description && (
                    <p className="text-sm text-muted-foreground mb-2">{challenge.description}</p>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    <Trophy className="w-3 h-3 mr-1" />
                    {challenge.points} puntos
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No hay retos creados aún</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Support Activities Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Apoyo Externo
            </CardTitle>
            <Dialog open={supportDialogOpen} onOpenChange={setSupportDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-support">
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Apoyo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Actividad de Apoyo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="support-title">Título</Label>
                    <Input
                      id="support-title"
                      value={supportTitle}
                      onChange={(e) => setSupportTitle(e.target.value)}
                      placeholder="Ej: Aplicación de tratamiento"
                      data-testid="input-support-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-description">Descripción (opcional)</Label>
                    <Textarea
                      id="support-description"
                      value={supportDescription}
                      onChange={(e) => setSupportDescription(e.target.value)}
                      placeholder="Detalles de la actividad..."
                      data-testid="textarea-support-description"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-type">Tipo</Label>
                    <Input
                      id="support-type"
                      value={supportType}
                      onChange={(e) => setSupportType(e.target.value)}
                      placeholder="Ej: tratamiento, medicación, cita"
                      data-testid="input-support-type"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-date">Fecha</Label>
                    <Input
                      id="support-date"
                      type="date"
                      value={supportDate}
                      onChange={(e) => setSupportDate(e.target.value)}
                      data-testid="input-support-date"
                    />
                  </div>
                  <Button
                    onClick={handleCreateSupport}
                    className="w-full"
                    disabled={createSupportMutation.isPending}
                    data-testid="button-submit-support"
                  >
                    {createSupportMutation.isPending ? "Registrando..." : "Registrar Apoyo"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {supportActivities && supportActivities.length > 0 ? (
            <div className="space-y-3">
              {supportActivities.map((activity) => (
                <div key={activity.id} className="p-4 rounded-lg border border-border hover-elevate" data-testid={`support-${activity.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{activity.title}</h4>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{activity.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(activity.activityDate).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No hay actividades de apoyo registradas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
