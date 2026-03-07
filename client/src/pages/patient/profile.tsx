import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Trophy, Calendar, Award, Activity } from "lucide-react";
import type { Patient, ChallengeCompletion, PatientBadge, Badge as BadgeType, SupportActivity } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface PatientBadgeWithBadge extends PatientBadge {
  badge: BadgeType;
}

export default function Profile() {
  const { user } = useAuth();

  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: ["/api/patient/profile"],
  });

  const { data: completions, isLoading: completionsLoading } = useQuery<ChallengeCompletion[]>({
    queryKey: ["/api/patient/completions-history"],
  });

  const { data: badges, isLoading: badgesLoading } = useQuery<PatientBadgeWithBadge[]>({
    queryKey: ["/api/patient/badges"],
  });

  const { data: supportActivities, isLoading: activitiesLoading } = useQuery<SupportActivity[]>({
    queryKey: ["/api/patient/support-activities"],
  });

  if (patientLoading || completionsLoading || badgesLoading || activitiesLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user?.profileImageUrl || undefined} alt={patient?.fullName} />
              <AvatarFallback className="text-2xl">
                {getInitials(patient?.fullName || 'Usuario')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-display text-3xl font-bold mb-2" data-testid="text-patient-name">
                {patient?.fullName}
              </h1>
              <p className="text-muted-foreground mb-4">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                <Badge variant="secondary" className="text-sm">
                  <Trophy className="w-4 h-4 mr-1" />
                  {patient?.totalPoints || 0} puntos
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  <Activity className="w-4 h-4 mr-1" />
                  Racha de {patient?.currentStreak || 0} días
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  <Award className="w-4 h-4 mr-1" />
                  {badges?.length || 0} insignias
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Badges Section */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Award className="w-5 h-5 text-chart-3" />
              Insignias Conseguidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {badges && badges.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {badges.map((pb) => (
                  <div
                    key={pb.id}
                    className="flex flex-col items-center p-3 rounded-lg bg-gradient-to-br from-chart-3/10 to-chart-1/10 hover-elevate"
                    data-testid={`profile-badge-${pb.badge.id}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-chart-3/20 flex items-center justify-center mb-2">
                      <Award className="w-6 h-6 text-chart-3" />
                    </div>
                    <h4 className="font-semibold text-xs text-center">{pb.badge.name}</h4>
                    <p className="text-xs text-muted-foreground text-center mt-1 line-clamp-2">
                      {pb.badge.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aún no has desbloqueado insignias</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Estadísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                <span className="text-sm text-muted-foreground">Retos completados</span>
                <span className="text-xl font-bold text-primary" data-testid="text-completions-count">
                  {completions?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-chart-1/5">
                <span className="text-sm text-muted-foreground">Puntos totales</span>
                <span className="text-xl font-bold text-chart-1" data-testid="text-total-points">
                  {patient?.totalPoints || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-chart-3/5">
                <span className="text-sm text-muted-foreground">Racha actual</span>
                <span className="text-xl font-bold text-chart-3" data-testid="text-current-streak">
                  {patient?.currentStreak || 0} días
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-chart-4/5">
                <span className="text-sm text-muted-foreground">Insignias</span>
                <span className="text-xl font-bold text-chart-4">
                  {badges?.length || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Completions History */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Historial Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completions && completions.length > 0 ? (
            <div className="space-y-2">
              {completions.slice(0, 10).map((completion) => (
                <div
                  key={completion.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover-elevate"
                  data-testid={`completion-${completion.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-chart-1/20 flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-chart-1" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Reto completado</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(completion.completedAt).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    +{completion.pointsEarned} pts
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Aún no has completado retos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Support Activities */}
      {supportActivities && supportActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Activity className="w-5 h-5 text-chart-3" />
              Apoyo Recibido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {supportActivities.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover-elevate"
                  data-testid={`support-activity-${activity.id}`}
                >
                  <div className="w-8 h-8 rounded-full bg-chart-3/20 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-chart-3" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.activityDate).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
