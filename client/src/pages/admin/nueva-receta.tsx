import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  Upload, 
  FileText, 
  Camera,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Heart,
  User,
  MessageCircle
} from "lucide-react";

interface PlanStep {
  title: string;
  description: string;
  duration: string;
  supportMessage: string;
}

interface DualPathPlan {
  title: string;
  description: string;
  steps: PlanStep[];
}

interface GeneratePlanResponse {
  plan: DualPathPlan;
  analyzedText: string;
}

interface CreatePatientResponse {
  patient: any;
  program: any;
  messages: any[];
}

export default function NuevaReceta() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<'input' | 'preview' | 'created'>('input');
  const [patientName, setPatientName] = useState("");
  const [prescriptionText, setPrescriptionText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
  const [generatedPlan, setGeneratedPlan] = useState<DualPathPlan | null>(null);
  const [createdPatient, setCreatedPatient] = useState<any>(null);

  const generatePlanMutation = useMutation({
    mutationFn: async (): Promise<GeneratePlanResponse> => {
      const response = await fetch('/api/admin/generate-care-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescriptionText,
          patientName,
          imageBase64: selectedImage,
          imageMimeType,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al generar el plan');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedPlan(data.plan);
      setStep('preview');
      toast({
        title: "Plan generado",
        description: "Revisa el plan dual antes de crear al paciente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: async (): Promise<CreatePatientResponse> => {
      const response = await fetch('/api/admin/create-patient-with-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName,
          plan: generatedPlan,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear el paciente');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setCreatedPatient(data.patient);
      setStep('created');
      toast({
        title: "Paciente creado",
        description: "El paciente y su plan de cuidado han sido creados.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setSelectedImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleViewAsPatient = () => {
    if (createdPatient) {
      localStorage.setItem("simulatedPatientId", createdPatient.id);
      setLocation("/mi-camino");
    }
  };

  const canGeneratePlan = patientName.trim() && (prescriptionText.trim() || selectedImage);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/admin")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al panel
        </Button>

        {step === 'input' && (
          <>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mx-auto shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-display text-3xl font-bold">Nueva Receta o Deseo</h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Sube una foto de tu receta o describe tu deseo de cuidado. 
                La IA creará un plan de acompañamiento personalizado con el Camino Dual.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información del Paciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Nombre del paciente"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="text-lg"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Receta o Deseo de Cuidado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Describe tu tratamiento, medicación, rutina de belleza, o cualquier deseo de cuidado personal...&#10;&#10;Ejemplo: 'Quiero una rutina de skincare para piel sensible con limpieza, hidratación y protección solar'&#10;&#10;O: 'Tomar ibuprofeno 400mg cada 8 horas por 5 días, aplicar pomada en la zona afectada 2 veces al día'"
                  value={prescriptionText}
                  onChange={(e) => setPrescriptionText(e.target.value)}
                  className="min-h-[150px] text-base"
                />

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    O sube una foto de tu receta médica:
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Subir imagen
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.setAttribute('capture', 'environment');
                          fileInputRef.current.click();
                        }
                      }}
                      className="flex-1"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Tomar foto
                    </Button>
                  </div>
                  
                  {selectedImage && (
                    <div className="mt-4 p-3 bg-muted rounded-lg flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Imagen cargada correctamente</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedImage(null)}
                        className="ml-auto"
                      >
                        Quitar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
              disabled={!canGeneratePlan || generatePlanMutation.isPending}
              onClick={() => generatePlanMutation.mutate()}
            >
              {generatePlanMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generando plan con IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generar Plan de Acompañamiento
                </>
              )}
            </Button>
          </>
        )}

        {step === 'preview' && generatedPlan && (
          <>
            <div className="text-center space-y-3">
              <h1 className="font-display text-3xl font-bold">{generatedPlan.title}</h1>
              <p className="text-muted-foreground">{generatedPlan.description}</p>
              <Badge variant="outline" className="text-sm">
                Plan para: {patientName}
              </Badge>
            </div>

            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-center">Vista Previa del Camino Dual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" />
                      Tu Camino
                    </h3>
                    <div className="space-y-3">
                      {generatedPlan.steps.map((planStep, index) => (
                        <div key={index} className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                            <span className="font-medium">{planStep.title}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{planStep.description}</p>
                          <p className="text-xs text-primary mt-1">{planStep.duration}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-amber-500" />
                      Apoyo de Yesi
                    </h3>
                    <div className="space-y-3">
                      {generatedPlan.steps.map((planStep, index) => (
                        <div key={index} className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border-l-4 border-amber-500">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs bg-amber-100 dark:bg-amber-900/30">{index + 1}</Badge>
                            <span className="text-xs font-medium text-amber-600">Mensaje de Yesi</span>
                          </div>
                          <p className="text-sm italic">"{planStep.supportMessage}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('input')}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Modificar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500"
                disabled={createPatientMutation.isPending}
                onClick={() => createPatientMutation.mutate()}
              >
                {createPatientMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Crear Paciente con este Plan
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {step === 'created' && createdPatient && (
          <>
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto shadow-lg">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h1 className="font-display text-3xl font-bold">¡Paciente Creado!</h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                El plan de acompañamiento para <strong>{patientName}</strong> ha sido creado exitosamente. 
                Ahora puedes ver la experiencia del Camino Dual.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Button
                variant="outline"
                onClick={() => setLocation("/admin")}
                className="flex-1"
              >
                Volver al panel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500"
                onClick={handleViewAsPatient}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Ver Camino Dual
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
