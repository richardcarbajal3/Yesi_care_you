# Compañera Digital de Cuidado

## Descripción General
Aplicación web de acompañamiento digital para pacientes en proceso de cuidado médico. Enfoque en **Camino Dual**: programa lineal de cuidado con apoyo puntual y espaciado de Yesi (enfermera) + IA.

## Propósito
El paciente recibe una receta/guía de cuidado y avanza **autónomamente** en un programa lineal. Yesi (la enfermera) + IA dan soporte puntual y espaciado para potenciar el progreso.

## Arquitectura - Single Page App

### Nuevo Enfoque (Camino Dual)
1. **Una sola página principal** para pacientes (`/mi-camino`)
2. **Programa lineal** de pasos basado en la receta de cuidado
3. **Autonomía del paciente** con soporte espaciado
4. **Mensajes puntuales de Yesi** cuando el paciente lo necesita

## Stack Tecnológico

### Frontend
- **Framework**: React + TypeScript con Vite
- **Routing**: Wouter (simplificado a single-page para pacientes)
- **UI Components**: Shadcn UI + Radix UI
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: TanStack Query v5

### Backend
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle
- **Authentication**: Replit Auth
- **AI**: OpenAI GPT-4o-mini vía Replit AI Integrations

## Estructura de Base de Datos

### Tablas Principales
- `users`: Usuarios con roles (nurse/patient)
- `patients`: Perfiles de pacientes
- `care_programs`: Programas/recetas de cuidado
- `program_steps`: Pasos lineales del programa
- `support_messages`: Mensajes puntuales de Yesi/IA
- `challenges`: Retos (legacy)
- `challenge_completions`: Completados (legacy)
- `badges`, `patient_badges`: Sistema de insignias
- `support_activities`: Actividades de apoyo externo
- `daily_messages`: Mensajes motivacionales diarios
- `sessions`: Sesiones de autenticación

## Navegación

### Pacientes (Single Page)
- `/` → Página principal "Mi Camino" con programa lineal

### Enfermeros
- `/enfermero`: Panel de control
- `/enfermero/nuevo-paciente`: Crear paciente
- `/enfermero/paciente/:id`: Gestión de paciente y programa

### Admin/Demo
- `/admin`: Panel de administración con pacientes simulados
- `/admin/nueva-receta`: Cargar receta/deseo y generar plan dual con IA

## API Endpoints

### Paciente
- `GET /api/patient/profile` - Perfil del paciente
- `GET /api/patient/care-program` - Programa activo con pasos
- `POST /api/patient/complete-step` - Completar paso
- `GET /api/patient/support-messages` - Mensajes de Yesi
- `POST /api/patient/mark-message-read` - Marcar mensaje leído
- `GET /api/patient/daily-message` - Mensaje motivacional diario

### Enfermero
- `GET /api/nurse/patients` - Lista de pacientes
- `POST /api/nurse/patients` - Crear paciente
- `POST /api/nurse/patient/:id/care-program` - Crear programa de cuidado
- `POST /api/nurse/patient/:id/message` - Enviar mensaje de soporte

### Admin/Demo (Público)
- `GET /api/admin/patients` - Lista todos los pacientes simulados
- `GET /api/admin/simulate/:patientId` - Obtiene datos de paciente para simulación
- `POST /api/admin/generate-care-plan` - Genera plan dual con IA desde receta/deseo
- `POST /api/admin/create-patient-with-plan` - Crea paciente con plan generado

## Desarrollo
- **Comando**: `npm run dev`
- **Database**: `npm run db:push`
- **Puerto**: 5000

## Idioma
Toda la aplicación en español.
