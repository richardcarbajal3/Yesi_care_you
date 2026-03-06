import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Sparkles, Trophy, Heart } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Challenge, Patient } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();

  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: ["/api/patient/profile"],
  });

  const { data: dailyMessage, isLoading: messageLoading } = useQuery<{ message: string }>({
    queryKey: ["/api/patient/daily-message"],
  });

  const { data: todayChallenge, isLoading: challengeLoading } = useQuery<Challenge>({
    queryKey: ["/api/patient/today-challenge"],
  });

  const { data: completedToday } = useQuery<boolean>({
    queryKey: ["/api/patient/challenge-completed-today"],
  });

  const completeChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      return await apiRequest("POST", "/api/patient/complete-challenge", { challengeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patient/challenge-completed-today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patient/today-challenge"] });
      toast({
        title: "¡Reto completado!",
        description: `Has ganado ${todayChallenge?.points || 10} puntos. ¡Excelente trabajo!`,
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Cerraste sesión. Iniciando sesión de nuevo...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No se pudo completar el reto. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const skipChallengeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/patient/skip-challenge", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient/today-challenge"] });
      toast({
        title: "No pasa nada",
        description: "Mañana seguimos. Tu bienestar es lo más importante.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Cerraste sesión. Iniciando sesión de nuevo...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  if (patientLoading || messageLoading || challengeLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const progressPercentage = patient ? Math.min((patient.totalPoints / 1000) * 100, 100) : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Daily Message */}
      <Card className="bg-gradient-to-br from-primary/10 to-chart-3/10 border-primary/20">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {dailyMessage?.message || "Hoy seguimos avanzando, paso a paso"}
              </h2>
              <p className="text-sm text-muted-foreground" data-testid="text-daily-message">
                Tu acompañante digital está contigo en cada momento
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display flex items-center gap-2">
              <Trophy className="w-5 h-5 text-chart-1" />
              Tu Progreso
            </CardTitle>
            <span className="text-2xl font-bold text-primary" data-testid="text-total-points">
              {patient?.totalPoints || 0} pts
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Avance del plan de cuidado</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" data-testid="progress-care-plan" />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center p-3 rounded-lg bg-chart-1/10">
              <div className="text-2xl font-bold text-chart-1" data-testid="text-current-streak">
                {patient?.currentStreak || 0}
              </div>
              <div className="text-xs text-muted-foreground">Días seguidos</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <div className="text-2xl font-bold text-primary">
                {patient?.totalPoints || 0}
              </div>
              <div className="text-xs text-muted-foreground">Puntos totales</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Challenge */}
      {todayChallenge && !completedToday ? (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <Heart className="w-5 h-5 text-chart-3" />
              Reto de hoy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg" data-testid="text-challenge-title">
                {todayChallenge.title}
              </h3>
              {todayChallenge.description && (
                <p className="text-muted-foreground" data-testid="text-challenge-description">
                  {todayChallenge.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm text-primary">
                <Trophy className="w-4 h-4" />
                <span data-testid="text-challenge-points">{todayChallenge.points} puntos</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1"
                size="lg"
                onClick={() => completeChallengeMutation.mutate(todayChallenge.id)}
                disabled={completeChallengeMutation.isPending}
                data-testid="button-complete-challenge"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Marcar como completado
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => skipChallengeMutation.mutate()}
                disabled={skipChallengeMutation.isPending}
                data-testid="button-skip-challenge"
              >
                Omitir por hoy
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : completedToday ? (
        <Card className="bg-gradient-to-br from-chart-1/10 to-chart-1/5 border-chart-1/30">
          <CardContent className="p-6 md:p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-chart-1/20 mb-4">
              <CheckCircle className="w-8 h-8 text-chart-1" />
            </div>
            <h3 className="font-display text-2xl font-bold mb-2">¡Reto completado!</h3>
            <p className="text-muted-foreground">
              Excelente trabajo hoy. Tu compromiso es tu mejor medicina.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-muted/30">
          <CardContent className="p-6 md:p-8 text-center">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">No hay reto para hoy</h3>
            <p className="text-muted-foreground">
              Consulta con tu enfermero/a para nuevos retos personalizados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
