import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, TrendingUp, Trophy, Calendar } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-chart-3/10">
      {/* Hero Section */}
      <div className="relative min-h-[80vh] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        
        <div className="relative max-w-4xl mx-auto text-center space-y-8 py-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Tu acompañante digital en salud</span>
          </div>
          
          <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground leading-tight">
            Compañera Digital de Cuidado
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground font-display font-light max-w-2xl mx-auto">
            Cuidar es acompañar
          </p>
          
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Tu proceso de cuidado diario con motivación empática, seguimiento personalizado 
            y apoyo constante. Avanza paso a paso hacia tu bienestar.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="text-lg px-8 py-6 h-auto"
              onClick={handleLogin}
              data-testid="button-login"
            >
              Comenzar mi camino
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 hover-elevate">
            <div className="w-12 h-12 rounded-lg bg-chart-1/10 flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-chart-1" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">Retos Personalizados</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Desafíos diarios adaptados a tu plan de cuidado y progreso
            </p>
          </Card>

          <Card className="p-6 hover-elevate">
            <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-chart-3" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">Apoyo Empático</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mensajes motivacionales generados con IA para acompañarte cada día
            </p>
          </Card>

          <Card className="p-6 hover-elevate">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">Seguimiento Visual</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Visualiza tu progreso con gráficos claros e insignias de logros
            </p>
          </Card>

          <Card className="p-6 hover-elevate">
            <div className="w-12 h-12 rounded-lg bg-chart-4/10 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-chart-4" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">Camino Dual</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Visualiza tu esfuerzo personal junto al apoyo médico que recibes
            </p>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-chart-3/5 border-primary/20">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Comienza tu viaje de cuidado hoy
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Únete a una comunidad que te acompaña en cada paso de tu proceso de recuperación
          </p>
          <Button
            size="lg"
            className="text-lg px-8 py-6 h-auto"
            onClick={handleLogin}
            data-testid="button-login-cta"
          >
            Iniciar sesión
          </Button>
        </Card>
      </div>
    </div>
  );
}
