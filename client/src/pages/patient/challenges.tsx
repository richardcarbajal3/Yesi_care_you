import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, CheckCircle, Clock, Award } from "lucide-react";
import type { Challenge, ChallengeCompletion, Patient, PatientBadge, Badge as BadgeType } from "@shared/schema";

interface ChallengeWithCompletion extends Challenge {
  completion?: ChallengeCompletion;
}

interface PatientBadgeWithBadge extends PatientBadge {
  badge: BadgeType;
}

export default function Challenges() {
  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: ["/api/patient/profile"],
  });

  const { data: challenges, isLoading: challengesLoading } = useQuery<ChallengeWithCompletion[]>({
    queryKey: ["/api/patient/challenges"],
  });

  const { data: badges, isLoading: badgesLoading } = useQuery<PatientBadgeWithBadge[]>({
    queryKey: ["/api/patient/badges"],
  });

  if (patientLoading || challengesLoading || badgesLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const completedChallenges = challenges?.filter(c => c.completion) || [];
  const pendingChallenges = challenges?.filter(c => !c.completion) || [];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header with Points */}
      <Card className="bg-gradient-to-br from-primary/10 to-chart-1/10 border-primary/20">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">Retos Lúdicos</h1>
                <p className="text-muted-foreground">Sigue acumulando puntos y logros</p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary" data-testid="text-total-points">
                {patient?.totalPoints || 0}
              </div>
              <div className="text-sm text-muted-foreground">Puntos acumulados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges Section */}
      {badges && badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Award className="w-5 h-5 text-chart-3" />
              Insignias Desbloqueadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map((pb) => (
                <div
                  key={pb.id}
                  className="flex flex-col items-center p-4 rounded-lg bg-gradient-to-br from-chart-3/10 to-chart-1/10 hover-elevate"
                  data-testid={`badge-${pb.badge.id}`}
                >
                  <div className="w-16 h-16 rounded-full bg-chart-3/20 flex items-center justify-center mb-3">
                    <Award className="w-8 h-8 text-chart-3" />
                  </div>
                  <h4 className="font-semibold text-sm text-center">{pb.badge.name}</h4>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    {pb.badge.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Challenges */}
      {pendingChallenges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-chart-4" />
              Retos Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="p-4 rounded-lg border border-border hover-elevate"
                  data-testid={`challenge-pending-${challenge.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{challenge.title}</h4>
                      {challenge.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {challenge.description}
                        </p>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        <Trophy className="w-3 h-3 mr-1" />
                        {challenge.points} puntos
                      </Badge>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-chart-1" />
              Retos Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="p-4 rounded-lg bg-chart-1/5 border border-chart-1/20"
                  data-testid={`challenge-completed-${challenge.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 text-chart-1">{challenge.title}</h4>
                      {challenge.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {challenge.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs border-chart-1/30 text-chart-1">
                          <Trophy className="w-3 h-3 mr-1" />
                          +{challenge.completion?.pointsEarned || challenge.points} puntos
                        </Badge>
                        {challenge.completion?.completedAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(challenge.completion.completedAt).toLocaleDateString('es-ES')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-chart-1/20 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-chart-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {challenges?.length === 0 && (
        <Card className="bg-muted/30">
          <CardContent className="p-12 text-center">
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">No hay retos aún</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Tu enfermero/a creará retos personalizados para tu plan de cuidado
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
