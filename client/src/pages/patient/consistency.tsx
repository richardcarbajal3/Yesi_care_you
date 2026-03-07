import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, TrendingUp, Award } from "lucide-react";
import type { Patient, ChallengeCompletion } from "@shared/schema";

interface ConsistencyData {
  date: string;
  completed: boolean;
}

export default function Consistency() {
  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: ["/api/patient/profile"],
  });

  const { data: consistency, isLoading: consistencyLoading } = useQuery<ConsistencyData[]>({
    queryKey: ["/api/patient/consistency"],
  });

  const { data: milestones, isLoading: milestonesLoading } = useQuery<string[]>({
    queryKey: ["/api/patient/milestones"],
  });

  if (patientLoading || consistencyLoading || milestonesLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Generate last 42 days (6 weeks) for calendar view
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 41; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const completionData = consistency?.find(c => c.date === dateStr);
      days.push({
        date: date,
        dateStr: dateStr,
        completed: completionData?.completed || false,
        isToday: i === 0,
      });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const completedDays = consistency?.filter(c => c.completed).length || 0;
  const totalDays = consistency?.length || 0;
  const consistencyRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-chart-1/10 to-primary/10 border-chart-1/20">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-chart-1/20 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-chart-1" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">Cuidado Óptimo</h1>
                <p className="text-muted-foreground">Tu consistencia es clave</p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-chart-1" data-testid="text-consistency-rate">
                {consistencyRate}%
              </div>
              <div className="text-sm text-muted-foreground">Tasa de consistencia</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2" data-testid="text-total-days">
              {totalDays}
            </div>
            <div className="text-sm text-muted-foreground">Días en el programa</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-chart-1 mb-2" data-testid="text-completed-days">
              {completedDays}
            </div>
            <div className="text-sm text-muted-foreground">Días completados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-chart-3 mb-2" data-testid="text-current-streak">
              {patient?.currentStreak || 0}
            </div>
            <div className="text-sm text-muted-foreground">Racha actual</div>
          </CardContent>
        </Card>
      </div>

      {/* Consistency Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Calendario de Consistencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day) => (
                <div
                  key={day.dateStr}
                  className={`
                    aspect-square rounded-md flex items-center justify-center text-xs font-medium
                    transition-colors
                    ${day.completed 
                      ? 'bg-chart-1 text-white' 
                      : 'bg-muted/30 text-muted-foreground'
                    }
                    ${day.isToday ? 'ring-2 ring-primary ring-offset-2' : ''}
                  `}
                  data-testid={`calendar-day-${day.dateStr}`}
                  title={day.date.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                >
                  {day.date.getDate()}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-6 pt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-chart-1" />
                <span>Completado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted/30" />
                <span>Pendiente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted/30 ring-2 ring-primary" />
                <span>Hoy</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones / Recognition Messages */}
      {milestones && milestones.length > 0 && (
        <Card className="bg-gradient-to-br from-chart-3/10 to-chart-1/10 border-chart-3/20">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Award className="w-5 h-5 text-chart-3" />
              Mensajes de Reconocimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {milestones.map((message, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-background/50 border border-chart-3/20"
                  data-testid={`milestone-${idx}`}
                >
                  <p className="text-foreground font-medium">{message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Encouragement Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 md:p-8 text-center">
          <h3 className="font-display text-2xl font-bold mb-2">Tu compromiso es tu mejor medicina</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Cada día que cumples con tus retos, estás construyendo hábitos saludables 
            que transforman tu bienestar. Sigue adelante, ¡vas por muy buen camino!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
