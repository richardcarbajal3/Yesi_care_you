import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function Welcome() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-chart-3/5">
      <Card className="max-w-2xl w-full p-8 md:p-12 text-center space-y-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-chart-3 mx-auto">
          <Heart className="w-10 h-10 text-white" fill="currentColor" />
        </div>
        
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Bienvenido/a</span>
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Compañera Digital de Cuidado
          </h1>
          
          <p className="text-xl md:text-2xl text-primary font-display font-medium">
            Cuidar es acompañar
          </p>
          
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Estamos aquí para acompañarte en cada paso de tu proceso de cuidado. 
            Juntos avanzaremos hacia tu bienestar, día a día.
          </p>
        </div>
        
        <Button
          size="lg"
          className="w-full sm:w-auto text-lg px-8 py-6 h-auto"
          onClick={() => navigate("/cuidado-hoy")}
          data-testid="button-continue"
        >
          Continuar
        </Button>
      </Card>
    </div>
  );
}
