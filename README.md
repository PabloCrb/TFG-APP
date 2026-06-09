# Prisma – Aplicación de Gestión de Finanzas Personales

Este proyecto ha sido desarrollado por Pablo Carballo Ramos como Trabajo de Fin de Grado

**Prisma** es una aplicación web y móvil orientada a la gestión de finanzas personales, diseñada para permitir a los usuarios registrar ingresos y gastos, analizar su comportamiento financiero y mejorar la toma de decisiones económicas.

---

## 🚀 Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone <(https://github.com/PabloCrb/Prisma_TFG)>
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env` con los parámetros necesarios en la carpeta /AI:

```env
PORT
LLAMA_PORT
DB_PORT
API_URL
INTERNAL_API_KEY
```

Crear un archivo `.env` con los parámetros necesarios en la carpeta /Backend/config:

```env
TOKEN_PASS
PORT
AI_PORT
DBhost
DBuser
DBpassword
DBdatabase
INTERNAL_API_KEY (Debe coincidir con la definida en el otro archivo .env)
API_URL
```

### 4. Ejecutar el frontend (carpeta /Frontend/TFG-App)

```bash
ng serve
```

### 5. Ejecutar el backend (carpeta /Backend)

```bash
npm --prefix ./config run dev
```

### 5. Ejecutar el microservicio de IA (carpeta /AI)

Requiere la instalación del modelo "llama3" de Ollama.

```bash
node .\server-AI.js
```

---


