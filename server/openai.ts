// Referenced from javascript_openai_ai_integrations blueprint
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

export async function generateMotivationalMessage(
  patientName: string,
  currentStreak: number,
  totalPoints: number,
  recentProgress?: string
): Promise<string> {
  try {
    const prompt = `Genera un mensaje de Yesi (enfermera) para un paciente en su programa de cuidado.

Información del paciente:
- Nombre: ${patientName}
- Días de racha: ${currentStreak}
- Puntos: ${totalPoints}
${recentProgress ? `- Progreso: ${recentProgress}` : ''}

El mensaje debe:
- Ser de Yesi como apoyo puntual y espaciado
- Máximo 2 frases, cálido y cercano
- Motivar a seguir avanzando en su camino
- En español, sin usar el nombre

Responde SOLO con el mensaje.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres Yesi, una enfermera empática que da apoyo puntual y espaciado a pacientes. Tus mensajes son breves, cálidos y motivadores."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 100,
    });

    return response.choices[0]?.message?.content?.trim() || "Hoy seguimos avanzando juntos. Tu esfuerzo vale la pena.";
  } catch (error) {
    console.error("Error generating message:", error);
    return "Tu dedicación es tu mejor medicina. Sigue adelante.";
  }
}

export async function generateSupportMessage(
  stepTitle: string,
  stepDescription?: string
): Promise<string> {
  try {
    const prompt = `Genera un mensaje de apoyo puntual de Yesi (enfermera) para un paciente que está en este paso de su programa:

Paso: ${stepTitle}
${stepDescription ? `Descripción: ${stepDescription}` : ''}

El mensaje debe:
- Ser breve (1-2 frases)
- Dar un consejo práctico o ánimo específico para este paso
- Sonar como apoyo puntual, no intrusivo
- En español

Responde SOLO con el mensaje.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres Yesi, una enfermera que da apoyo puntual y espaciado. Tus consejos son prácticos y breves."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 80,
    });

    return response.choices[0]?.message?.content?.trim() || "Vas por buen camino. Un paso a la vez.";
  } catch (error) {
    console.error("Error generating support message:", error);
    return "Recuerda: cada pequeño paso cuenta. Estoy aquí si me necesitas.";
  }
}

export interface DualPathPlan {
  title: string;
  description: string;
  steps: Array<{
    title: string;
    description: string;
    duration: string;
    supportMessage: string;
  }>;
}

export async function generateDualPathPlan(
  prescriptionOrWish: string,
  patientName: string = "Paciente"
): Promise<DualPathPlan> {
  try {
    const prompt = `Analiza esta receta médica, tratamiento o deseo de cuidado personal y genera un plan de acompañamiento DUAL con el formato "Camino Dual":

ENTRADA DEL PACIENTE:
${prescriptionOrWish}

Genera un JSON con el siguiente formato exacto:
{
  "title": "Título del programa de cuidado (máx 50 caracteres)",
  "description": "Descripción breve del objetivo (máx 100 caracteres)",
  "steps": [
    {
      "title": "Título del paso (máx 40 caracteres)",
      "description": "Descripción detallada del paso para el paciente",
      "duration": "Duración estimada (ej: '1 día', '3 días', '1 semana')",
      "supportMessage": "Mensaje de apoyo de Yesi para este paso (1-2 frases, cálido y motivador)"
    }
  ]
}

REGLAS:
- Genera entre 4 y 8 pasos dependiendo de la complejidad
- Los pasos deben ser lineales y progresivos
- Cada supportMessage debe ser único, empático y específico al paso
- Los mensajes de Yesi deben dar consejos prácticos o ánimo
- Todo en español
- Si es una receta médica, interpreta las indicaciones médicas
- Si es un deseo personal (belleza, bienestar), crea un plan realista

Responde SOLO con el JSON, sin explicaciones adicionales.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres un asistente de planificación de cuidados de salud. Generas planes de acompañamiento estructurados en formato JSON. Yesi es una enfermera empática que da apoyo puntual."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const plan = JSON.parse(content) as DualPathPlan;
    return plan;
  } catch (error) {
    console.error("Error generating dual path plan:", error);
    return {
      title: "Plan de Cuidado Personalizado",
      description: "Tu camino de bienestar diseñado para ti",
      steps: [
        {
          title: "Inicio del camino",
          description: "Prepárate para comenzar tu programa de cuidado personal.",
          duration: "1 día",
          supportMessage: "¡Bienvenido! Estoy aquí para acompañarte en cada paso."
        },
        {
          title: "Establecer rutina",
          description: "Incorpora las indicaciones principales a tu día a día.",
          duration: "1 semana",
          supportMessage: "La constancia es clave. Un día a la vez vas construyendo hábitos."
        },
        {
          title: "Evaluación de progreso",
          description: "Revisa cómo te sientes y ajusta según necesites.",
          duration: "3 días",
          supportMessage: "Cada pequeño avance cuenta. ¡Vas muy bien!"
        },
        {
          title: "Consolidación",
          description: "Mantén lo aprendido y celebra tu progreso.",
          duration: "1 semana",
          supportMessage: "Tu dedicación está dando frutos. Sigue así."
        }
      ]
    };
  }
}

export async function analyzeImageForPrescription(
  base64Image: string,
  mimeType: string = "image/jpeg"
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres un asistente que analiza imágenes de recetas médicas, tratamientos de belleza, o notas de cuidado personal. Extrae y describe el contenido de forma clara y estructurada en español."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analiza esta imagen y extrae toda la información relevante sobre el tratamiento, medicación, o cuidado que se indica. Describe los pasos, dosis, frecuencias y cualquier instrucción especial. Si no puedes leer algo claramente, indícalo."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_completion_tokens: 800,
    });

    return response.choices[0]?.message?.content?.trim() || "No se pudo analizar la imagen. Por favor, describe el tratamiento manualmente.";
  } catch (error) {
    console.error("Error analyzing image:", error);
    return "Error al analizar la imagen. Por favor, ingresa la información manualmente.";
  }
}
