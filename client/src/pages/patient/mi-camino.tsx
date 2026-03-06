import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  CheckCircle,
  Circle,
  Heart,
  MessageCircle,
  Sparkles,
  ChevronRight,
  User,
  Clock,
  Settings,
  ArrowLeft,
  Plus,
  Users,
  FileText,
  Phone,
  Send
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import type { CareProgram, ProgramStep, SupportMessage, Patient } from "@shared/schema";

interface ProgramWithSteps extends CareProgram {
  steps: ProgramStep[];
}

interface SimulatedData {
  patient: Patient;
  program: ProgramWithSteps | null;
  messages: SupportMessage[];
}

export default function MiCamino() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [simulatedPatientId, setSimulatedPatientId] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("simulatedPatientId");
    if (stored) {
      setSimulatedPatientId(stored);
    }
  }, []);

  const { data: simulatedData, isLoading: simulatedLoading } = useQuery<SimulatedData>({
    queryKey: ["/api/admin/simulate", simulatedPatientId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/simulate/${simulatedPatientId}`);
      if (!response.ok) throw new Error("Failed to fetch simulated data");
      return response.json();
    },
    enabled: !!simulatedPatientId,
  });

  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: ["/api/patient/profile"],
    enabled: !simulatedPatientId,
  });

  const { data: program, isLoading: programLoading } = useQuery<ProgramWithSteps>({
    queryKey: ["/api/patient/care-program"],
    enabled: !simulatedPatientId,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<SupportMessage[]>({
    queryKey: ["/api/patient/support-messages"],
    enabled: !simulatedPatientId,
  });

  const { data: dailyMessage } = useQuery<{ message: string }>({
    queryKey: ["/api/patient/daily-message"],
    enabled: !simulatedPatientId,
  });

  const completeStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      return await apiRequest("POST", "/api/patient/complete-step", { stepId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient/care-program"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patient/profile"] });
      toast({
        title: "¡Paso completado!",
        description: "Sigue avanzando en tu camino de cuidado.",
      });
    },
  });

  const markMessageReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return await apiRequest("POST", "/api/patient/mark-message-read", { messageId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient/support-messages"] });
    },
  });

  const isLoading = simulatedPatientId 
    ? simulatedLoading 
    : (patientLoading || programLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const activePatient = simulatedPatientId ? simulatedData?.patient : patient;
  const activeProgram = simulatedPatientId ? simulatedData?.program : program;
  const activeMessages = simulatedPatientId ? simulatedData?.messages : messages;

  const steps = activeProgram?.steps || [];
  const completedSteps = steps.filter(s => s.isCompleted).length;
  const totalSteps = steps.length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const currentStepIndex = steps.findIndex(s => !s.isCompleted);
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  const unreadMessages = activeMessages?.filter(m => !m.isRead) || [];
  const allMessages = activeMessages || [];

  const getMessageForStep = (stepId: string) => {
    return allMessages.filter(m => m.stepId === stepId);
  };

  const goToAdmin = () => {
    setLocation("/admin");
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackMessage.trim()) {
      toast({ title: "Error", description: "Por favor escribe tu comentario.", variant: "destructive" });
      return;
    }
    setFeedbackSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: feedbackName, email: feedbackEmail, message: feedbackMessage }),
      });
      if (!res.ok) throw new Error("Error al enviar");
      toast({ title: "Gracias", description: "Tu comentario ha sido enviado." });
      setFeedbackName("");
      setFeedbackEmail("");
      setFeedbackMessage("");
      setFeedbackOpen(false);
    } catch {
      toast({ title: "Error", description: "No se pudo enviar el comentario. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setFeedbackSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-6xl mx-auto p-4 pb-24 space-y-6">
        
        {simulatedPatientId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Settings className="w-4 h-4 text-amber-500" />
                    <span>Modo simulación: <strong>{activePatient?.fullName || 'Cargando...'}</strong></span>
                  </div>
                  <Button variant="outline" size="sm" onClick={goToAdmin}>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Cambiar usuario
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2"
        >
          <Card className="bg-gradient-to-br from-primary/10 via-chart-3/10 to-primary/5 border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-chart-3 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-lg">Yesi</span>
                    <Badge variant="secondary" className="text-xs">Tu enfermera</Badge>
                  </div>
                  <p className="text-foreground/80 leading-relaxed">
                    {dailyMessage?.message || `Hola ${activePatient?.fullName || ''}, hoy seguimos avanzando juntos. Tu bienestar es lo más importante.`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-none shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-semibold">Tu Progreso - {activeProgram?.title}</h2>
                <span className="text-sm text-muted-foreground">
                  {completedSteps} de {totalSteps} pasos
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Tu esfuerzo
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-chart-3" />
                  + Apoyo de Yesi
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-none shadow-md bg-gradient-to-r from-primary/5 to-chart-3/5">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 justify-center">
                <Button 
                  onClick={() => setLocation("/admin/nueva-receta")}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Receta o Deseo
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/admin")}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Gestionar Pacientes
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {activeProgram ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display font-semibold text-lg">Tu Camino</h2>
                    <p className="text-sm text-muted-foreground">Pasos de tu tratamiento</p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-primary/20" />

                  <div className="space-y-3">
                    {steps.map((step, index) => {
                      const isCompleted = step.isCompleted;
                      const isCurrent = currentStep?.id === step.id;
                      const isExpanded = expandedStep === step.id;
                      const stepMessages = getMessageForStep(step.id);

                      return (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card 
                            className={`
                              relative border-none shadow-sm transition-all cursor-pointer
                              ${isCurrent ? 'ring-2 ring-primary shadow-lg' : ''}
                              ${isCompleted ? 'bg-chart-1/10 border-l-4 border-l-chart-1' : 'bg-white'}
                              ${!isCompleted && !isCurrent ? 'opacity-60' : ''}
                            `}
                            onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`
                                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10
                                  ${isCompleted ? 'bg-chart-1 text-white' : isCurrent ? 'bg-primary text-white' : 'bg-muted'}
                                `}>
                                  {isCompleted ? (
                                    <CheckCircle className="w-5 h-5" />
                                  ) : (
                                    <span className="text-sm font-semibold">{index + 1}</span>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h3 className={`font-semibold text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                      {step.title}
                                    </h3>
                                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                  </div>
                                  
                                  {step.duration && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                      <Clock className="w-3 h-3" />
                                      {step.duration}
                                    </div>
                                  )}

                                  {stepMessages.length > 0 && (
                                    <Badge variant="outline" className="mt-2 text-xs">
                                      <MessageCircle className="w-3 h-3 mr-1" />
                                      {stepMessages.length} mensaje{stepMessages.length > 1 ? 's' : ''}
                                    </Badge>
                                  )}

                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                                          {step.description || "Sigue las indicaciones de tu guía de cuidado."}
                                        </p>
                                        
                                        {isCurrent && !isCompleted && !simulatedPatientId && (
                                          <Button
                                            className="mt-4 w-full"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              completeStepMutation.mutate(step.id);
                                            }}
                                            disabled={completeStepMutation.isPending}
                                          >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Marcar como completado
                                          </Button>
                                        )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-10 h-10 rounded-full bg-chart-3/20 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-chart-3" />
                  </div>
                  <div>
                    <h2 className="font-display font-semibold text-lg">Apoyo de Yesi</h2>
                    <p className="text-sm text-muted-foreground">Mensajes de tu enfermera</p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-chart-3/20" />

                  <div className="space-y-3">
                    {allMessages.length > 0 ? (
                      allMessages.map((msg, index) => {
                        const relatedStep = steps.find(s => s.id === msg.stepId);
                        
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card 
                              className={`
                                relative border-none shadow-sm
                                ${msg.isRead ? 'bg-white' : 'bg-chart-3/5 border-l-4 border-l-chart-3'}
                              `}
                              onClick={() => !msg.isRead && !simulatedPatientId && markMessageReadMutation.mutate(msg.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-chart-3/20 flex items-center justify-center flex-shrink-0 z-10">
                                    <MessageCircle className="w-4 h-4 text-chart-3" />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-sm">Yesi</span>
                                      {!msg.isRead && (
                                        <Badge className="bg-chart-3 text-white text-xs">Nuevo</Badge>
                                      )}
                                    </div>
                                    
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {msg.message}
                                    </p>

                                    {relatedStep && (
                                      <Badge variant="outline" className="mt-2 text-xs">
                                        Sobre: {relatedStep.title}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center">
                          <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">
                            Yesi te enviará mensajes de apoyo a medida que avances en tu camino.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-dashed border-2 bg-muted/20">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">
                  Tu camino está por comenzar
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Yesi está preparando tu programa de cuidado personalizado. 
                  Pronto recibirás tu guía con los pasos a seguir.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {completedSteps > 0 && completedSteps < totalSteps && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-r from-primary/5 to-chart-3/5 border-none">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">¡Vas muy bien!</span> Cada paso cuenta. 
                  Tu esfuerzo personal más el apoyo de Yesi te llevarán lejos.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {completedSteps === totalSteps && totalSteps > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-gradient-to-br from-chart-1/20 to-chart-1/5 border-chart-1/30">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-chart-1/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-chart-1" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-2">
                  ¡Programa completado!
                </h3>
                <p className="text-muted-foreground">
                  Has completado todos los pasos de tu programa de cuidado. 
                  Tu dedicación es admirable.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Floating action buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {/* Feedback button */}
        <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
          <DialogTrigger asChild>
            <button
              className="w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-110"
              title="Déjanos tus comentarios"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Déjanos tus comentarios</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="Tu nombre (opcional)"
                value={feedbackName}
                onChange={(e) => setFeedbackName(e.target.value)}
              />
              <Input
                placeholder="Tu email (opcional)"
                type="email"
                value={feedbackEmail}
                onChange={(e) => setFeedbackEmail(e.target.value)}
              />
              <Textarea
                placeholder="Escribe tu comentario, sugerencia o experiencia..."
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                rows={4}
              />
              <Button
                className="w-full"
                onClick={handleFeedbackSubmit}
                disabled={feedbackSending}
              >
                <Send className="w-4 h-4 mr-2" />
                {feedbackSending ? "Enviando..." : "Enviar comentario"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* WhatsApp button */}
        <a
          href="https://wa.me/51963231357"
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg flex items-center justify-center hover:bg-[#20bd5a] transition-all hover:scale-110"
          title="Soporte por WhatsApp"
        >
          <Phone className="w-6 h-6" />
        </a>
      </div>
    </div>
  );
}
