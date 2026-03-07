import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { UserPlus, ArrowLeft } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function NewPatient() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [userId, setUserId] = useState("");

  const createPatientMutation = useMutation({
    mutationFn: async (data: { userId: string; fullName: string }) => {
      return await apiRequest("POST", "/api/nurse/patients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nurse/patients"] });
      toast({
        title: "Paciente creado",
        description: "El paciente ha sido agregado exitosamente",
      });
      navigate("/enfermero");
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
        description: "No se pudo crear el paciente. Verifica los datos.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !userId.trim()) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }
    createPatientMutation.mutate({ userId, fullName });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/enfermero")}
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" />
            Agregar Nuevo Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="userId">ID de Usuario del Paciente</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Ej: 927070657"
                data-testid="input-user-id"
                required
              />
              <p className="text-xs text-muted-foreground">
                El ID único del usuario que se registró en la plataforma
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Yessica Yupanqui Alvites"
                data-testid="input-full-name"
                required
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={createPatientMutation.isPending}
                data-testid="button-create-patient"
              >
                {createPatientMutation.isPending ? "Creando..." : "Crear Paciente"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/enfermero")}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
