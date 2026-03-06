import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { User, Heart, Activity, Calendar, CheckCircle } from "lucide-react";
import type { ChallengeCompletion, SupportActivity } from "@shared/schema";

interface TimelineEvent {
  date: Date;
  type: 'personal' | 'support';
  title: string;
  description?: string;
  icon: any;
  points?: number;
  activityType?: string;
}

export default function DualPath() {
  const { data: completions, isLoading: completionsLoading } = useQuery<ChallengeCompletion[]>({
    queryKey: ["/api/patient/completions-history"],
  });

  const { data: supportActivities, isLoading: activitiesLoading } = useQuery<SupportActivity[]>({
    queryKey: ["/api/patient/support-activities"],
  });

  if (completionsLoading || activitiesLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Combine and sort timeline events
  const personalEvents: TimelineEvent[] = (completions || []).map(c => ({
    date: new Date(c.completedAt),
    type: 'personal' as const,
    title: 'Reto completado',
    description: 'Has cumplido con tu compromiso diario',
    icon: CheckCircle,
    points: c.pointsEarned,
  }));

  const supportEvents: TimelineEvent[] = (supportActivities || []).map(a => ({
    date: new Date(a.activityDate),
    type: 'support' as const,
    title: a.title,
    description: a.description || undefined,
    icon: Activity,
    activityType: a.type,
  }));

  const allEvents = [...personalEvents, ...supportEvents].sort((a, b) => 
    b.date.getTime() - a.date.getTime()
  );

  const personalCount = personalEvents.length;
  const supportCount = supportEvents.length;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary/10 via-chart-3/10 to-chart-1/10 border-primary/20">
        <CardContent className="p-6 md:p-8">
          <div className="text-center space-y-3">
            <h1 className="font-display text-3xl md:text-4xl font-bold">Mi Camino de Cuidado Dual</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Tu progreso es el resultado de tu esfuerzo personal y el apoyo que recibes. 
              Aquí puedes ver cómo ambos caminos se complementan en tu proceso de cuidado.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-primary/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">Esfuerzo Personal</h3>
                <p className="text-2xl font-bold text-primary" data-testid="text-personal-count">
                  {personalCount} actividades
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-chart-3/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-chart-3/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-chart-3" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">Apoyo Externo</h3>
                <p className="text-2xl font-bold text-chart-3" data-testid="text-support-count">
                  {supportCount} actividades
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dual Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Trayectoria Completa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allEvents.length > 0 ? (
            <div className="relative">
              {/* Center line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border transform -translate-x-1/2 hidden lg:block" />

              <div className="space-y-8">
                {allEvents.map((event, idx) => {
                  const isPersonal = event.type === 'personal';
                  const EventIcon = event.icon;

                  return (
                    <div
                      key={idx}
                      className={`
                        flex flex-col lg:flex-row items-start gap-4
                        ${isPersonal ? 'lg:flex-row' : 'lg:flex-row-reverse'}
                      `}
                      data-testid={`timeline-event-${idx}`}
                    >
                      {/* Event card */}
                      <div className={`
                        flex-1 w-full lg:w-auto
                        ${isPersonal ? 'lg:text-right lg:pr-8' : 'lg:text-left lg:pl-8'}
                      `}>
                        <Card className={`
                          hover-elevate
                          ${isPersonal 
                            ? 'border-primary/30 bg-primary/5' 
                            : 'border-chart-3/30 bg-chart-3/5'
                          }
                        `}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                                ${isPersonal ? 'bg-primary/20' : 'bg-chart-3/20'}
                              `}>
                                <EventIcon className={`
                                  w-5 h-5
                                  ${isPersonal ? 'text-primary' : 'text-chart-3'}
                                `} />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">{event.title}</h4>
                                {event.description && (
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {event.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {event.date.toLocaleDateString('es-ES', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </Badge>
                                  {event.points && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{event.points} pts
                                    </Badge>
                                  )}
                                  {event.activityType && (
                                    <Badge variant="secondary" className="text-xs">
                                      {event.activityType}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Center indicator (desktop only) */}
                      <div className="hidden lg:flex items-center justify-center flex-shrink-0">
                        <div className={`
                          w-6 h-6 rounded-full border-4 border-background z-10
                          ${isPersonal ? 'bg-primary' : 'bg-chart-3'}
                        `} />
                      </div>

                      {/* Empty space for alignment */}
                      <div className="hidden lg:block flex-1" />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">
                Tu camino está comenzando
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                A medida que completes retos y recibas apoyo, aquí verás la historia 
                completa de tu proceso de cuidado
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Encouragement Message */}
      <Card className="bg-gradient-to-br from-primary/5 to-chart-3/5 border-primary/20">
        <CardContent className="p-6 md:p-8 text-center">
          <h3 className="font-display text-2xl font-bold mb-3">
            Avanzamos juntos
          </h3>
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Tu esfuerzo personal y el apoyo que recibes se complementan para crear 
            un camino sólido hacia tu bienestar. Cada paso cuenta, cada acción suma. 
            Estás construyendo algo importante: tu salud y tu futuro.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
