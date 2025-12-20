# 🚀 MemberBase - Sistema Base de Autenticación y Administración

Sistema completo de autenticación de usuarios con panel de administración, perfil de usuario y configuración del sistema. Listo para usar como base en múltiples proyectos.

---

## ✨ Características

### 🔐 Autenticación Completa
- ✅ Login/Registro con email y contraseña
- ✅ OAuth con Google, GitHub y Microsoft
- ✅ Verificación de email con Resend
- ✅ Sistema de roles (USER/ADMIN)
- ✅ Recuperación de contraseña
- ✅ Protección de rutas con middleware

### 👤 Sistema de Perfil
- ✅ Upload de avatar (Azure Blob Storage)
- ✅ Edición de nombre
- ✅ Cambio de contraseña
- ✅ Cambio de email con re-verificación
- ✅ Información de cuenta y estadísticas

### 🛡️ Panel de Administración
- ✅ Dashboard con estadísticas
- ✅ Gestión de usuarios (cambiar roles, eliminar)
- ✅ Búsqueda y filtros avanzados
- ✅ Paginación de resultados
- ✅ Configuración del sistema

### ⚙️ Configuración del Sistema
- ✅ Personalizar nombre de la aplicación
- ✅ Mensajes de bienvenida multiidioma
- ✅ Upload de logo y favicon
- ✅ Idioma predeterminado

### 🌐 Internacionalización
- ✅ Soporte completo para Español e Inglés
- ✅ Traducciones en todas las páginas
- ✅ Selector de idioma en interfaz

### 🎨 Interfaz de Usuario
- ✅ Dark mode completo
- ✅ Diseño responsive (mobile-first)
- ✅ Componentes modernos y accesibles
- ✅ Tailwind CSS

---

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 15 (App Router)
- **Autenticación:** NextAuth v5
- **Base de Datos:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Almacenamiento:** Azure Blob Storage
- **Email:** Resend
- **Internacionalización:** next-intl
- **Styling:** Tailwind CSS
- **Iconos:** Lucide React
- **TypeScript:** Full type-safety

---

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Cuenta en [Neon](https://neon.tech) (PostgreSQL)
- Cuenta en [Azure](https://azure.microsoft.com) (Blob Storage)
- Cuenta en [Resend](https://resend.com) (Email)
- Cuentas OAuth (opcional):
  - [Google Cloud Console](https://console.cloud.google.com)
  - [GitHub OAuth Apps](https://github.com/settings/developers)
  - [Microsoft Azure](https://portal.azure.com)

---

## 🚀 Instalación y Configuración

### 1️⃣ Clonar o Usar como Template

**Opción A: Clonar repositorio**
```bash
git clone https://github.com/tu-usuario/memberbase-template.git mi-nueva-app
cd mi-nueva-app
rm -rf .git
git init
```

**Opción B: Usar como template en GitHub**
1. Ve al repositorio en GitHub
2. Click en **"Use this template"**
3. Crea un nuevo repositorio
4. Clona tu nuevo repositorio

---

### 2️⃣ Instalar Dependencias
```bash
npm install
```

---

### 3️⃣ Configurar Base de Datos (Neon)

1. Ve a [Neon Console](https://console.neon.tech)
2. Crea un nuevo proyecto
3. Copia la **Connection String**
4. Guárdala para el siguiente paso

---

### 4️⃣ Configurar Azure Blob Storage

1. Ve a [Azure Portal](https://portal.azure.com)
2. Crea o selecciona un **Storage Account**
3. En el Storage Account, ve a **Containers**
4. **Crea un nuevo container:**
   - Name: `memberbase` (o el nombre que prefieras)
   - Public access level: **Blob (anonymous read access for blobs only)**
5. Ve a **Access keys** y copia:
   - Storage account name
   - Key (key1 o key2)

⚠️ **IMPORTANTE:** Si no creas el container, el upload de avatares y logos fallará con un error.

---

### 5️⃣ Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:
```env
# Database (Neon)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="genera-un-secret-aleatorio-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Azure Blob Storage
AZURE_STORAGE_ACCOUNT_NAME="tu-storage-account-name"
AZURE_STORAGE_ACCOUNT_KEY="tu-storage-account-key"
AZURE_STORAGE_CONTAINER_NAME="memberbase"

# Resend (Email)
RESEND_API_KEY="re_tu_api_key_aqui"
EMAIL_FROM="noreply@tudominio.com"

# OAuth - Google (Opcional)
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"

# OAuth - GitHub (Opcional)
GITHUB_CLIENT_ID="tu-github-client-id"
GITHUB_CLIENT_SECRET="tu-github-client-secret"

# OAuth - Microsoft (Opcional)
MICROSOFT_CLIENT_ID="tu-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="tu-microsoft-client-secret"
```

#### 🔑 Generar NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

O visita: https://generate-secret.vercel.app/32

---

### 6️⃣ Inicializar Base de Datos
```bash
# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones
npx prisma migrate deploy

# (Opcional) Ver base de datos
npx prisma studio
```

---

### 7️⃣ Iniciar Servidor de Desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

### 8️⃣ Crear Primer Administrador

1. Ve a [http://localhost:3000/setup](http://localhost:3000/setup)
2. Completa el formulario para crear el primer admin
3. La página `/setup` se desactivará automáticamente

✅ **¡Listo! Tu aplicación está funcionando.**

---

## 📦 Deploy en Vercel

### 1️⃣ Preparar para Deploy

Asegúrate de que `package.json` tenga estos scripts:
```json
{
  "scripts": {
    "dev": "prisma generate && next dev",
    "build": "prisma generate && prisma migrate deploy && next build",
    "postinstall": "prisma generate",
    "start": "next start"
  }
}
```

### 2️⃣ Deploy en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com)
2. Click en **"Add New Project"**
3. Importa tu repositorio de GitHub
4. Configura las **Environment Variables** (todas las de `.env.local`)
5. Click en **"Deploy"**

⚠️ **IMPORTANTE:** 
- Cambia `NEXTAUTH_URL` a tu dominio de producción
- Asegúrate de que el container de Azure esté creado antes del primer deploy

### 3️⃣ Configurar OAuth (Producción)

Actualiza las **Redirect URLs** en cada proveedor OAuth:

**Google:**
```
https://tu-app.vercel.app/api/auth/callback/google
```

**GitHub:**
```
https://tu-app.vercel.app/api/auth/callback/github
```

**Microsoft:**
```
https://tu-app.vercel.app/api/auth/callback/microsoft
```

### 4️⃣ Inicializar en Producción

1. Ve a `https://tu-app.vercel.app/setup`
2. Crea el primer administrador
3. ¡Aplicación lista en producción! 🎉

---

## 🏗️ Estructura del Proyecto
```
├── src/
│   ├── core/                      # 🔒 Sistema base (no modificar)
│   │   ├── auth/                  # Autenticación
│   │   ├── admin/                 # Panel de administración
│   │   ├── profile/               # Sistema de perfil
│   │   └── shared/                # Utilidades compartidas
│   │
│   ├── features/                  # ✨ Agrega tus funcionalidades aquí
│   │   └── README.md
│   │
│   ├── app/                       # Next.js App Router
│   │   ├── [locale]/              # Rutas multiidioma
│   │   │   ├── page.tsx           # Página principal
│   │   │   ├── (auth)/            # Rutas de autenticación
│   │   │   ├── (dashboard)/       # Rutas protegidas
│   │   │   └── setup/             # Configuración inicial
│   │   └── api/                   # API Routes
│   │
│   ├── components/                # Componentes compartidos
│   ├── lib/                       # Utilidades
│   └── middleware.ts              # Protección de rutas
│
├── prisma/
│   ├── schema.prisma              # Modelos de base de datos
│   └── migrations/                # Migraciones
│
├── messages/                      # Traducciones
│   ├── en.json
│   └── es.json
│
└── public/                        # Archivos estáticos
```

---

## 🎯 Agregar Nuevas Funcionalidades

### 1. Crear Feature
```bash
mkdir -p src/features/mi-feature/{components,actions,types}
```

### 2. Agregar Modelos a Prisma
```prisma
// prisma/schema.prisma

model User {
  // ... campos existentes ...
  miFeature  MiFeature[]  // ← Agregar relación
}

model MiFeature {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  
  // Campos específicos de tu feature
  title     String
  content   String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 3. Aplicar Migración
```bash
npx prisma migrate dev --name add_mi_feature
```

### 4. Crear Componentes y Rutas

Sigue los patrones establecidos en `src/core/` para mantener consistencia.

### 5. ACTUALIZACIÓN DEL CORE
Cuando mejores el sistema de autenticación en el template:

En el template base
```bash
git add core/
git commit -m "feat: mejorar sistema de verificación email"
git push origin main
git tag v1.1.0
git push --tags
```
En cada aplicación existente (opcional)
Agregar el template como remote
```bash
git remote add template https://github.com/tu-usuario/memberbase-template.git
```

Fetch cambios
```bash
git fetch template
```

Merge solo la carpeta core (cherry-pick)
```bash
git checkout template/main -- src/core/
git commit -m "chore: actualizar core desde template v1.1.0"
```

Resolver conflictos si los hay
Probar que todo funcione
```bash
npm run dev
```

---

## 🔐 Usuarios de Prueba

Después de ejecutar `/setup`, puedes crear usuarios de prueba:

### Admin:
- Creado en `/setup`
- Acceso completo al panel de administración

### Usuario Regular:
- Regístrate en `/register`
- Acceso solo a perfil y features públicas

---

## 📝 Scripts Disponibles
```bash
# Desarrollo
npm run dev                    # Servidor de desarrollo
npm run build                  # Build de producción
npm run start                  # Servidor de producción
npm run lint                   # Linter

# Base de datos
npx prisma generate            # Generar cliente Prisma
npx prisma migrate dev         # Crear migración (desarrollo)
npx prisma migrate deploy      # Aplicar migraciones (producción)
npx prisma studio              # Visualizar base de datos
npx prisma db push             # Sincronizar schema (desarrollo)

# Testing
npm run test:db-full           # Test de conexión a DB
npm run test:db-diagnostics    # Diagnóstico de DB
```

---

## 🌍 Internacionalización

### Agregar Nuevas Traducciones

1. Edita `messages/en.json` y `messages/es.json`
2. Usa las traducciones en componentes:
```typescript
import { useTranslations } from 'next-intl'

export function MiComponente() {
  const t = useTranslations('MiNamespace')
  
  return <h1>{t('miClave')}</h1>
}
```

### Agregar Nuevo Idioma

1. Crea `messages/fr.json` (por ejemplo)
2. Actualiza `src/i18n/routing.ts`:
```typescript
export const routing = defineRouting({
  locales: ['en', 'es', 'fr'],
  defaultLocale: 'en'
})
```

---

## 🐛 Solución de Problemas

### Error: "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### Error: "AZURE_STORAGE_ACCOUNT_NAME is not defined"

Verifica que todas las variables de entorno estén en `.env.local`

### Error: "Container not found" al subir avatar

Crea el container en Azure Storage Account (ver paso 4 de configuración)

### Error: Database connection failed

- Verifica que `DATABASE_URL` sea correcta
- Asegúrate de que la base de datos en Neon esté activa
- Revisa que incluya `?sslmode=require` al final

### Error: Migraciones no se aplican en Vercel

Asegúrate de que `package.json` tenga:
```json
"build": "prisma generate && prisma migrate deploy && next build"
```

---

## 🔄 Actualizar Template

Si mejoras el sistema base y quieres actualizar proyectos existentes:
```bash
# En tu proyecto existente
git remote add template https://github.com/tu-usuario/memberbase-template.git
git fetch template
git checkout template/main -- src/core/
git commit -m "chore: actualizar core desde template"
```

---

## 📚 Documentación Adicional

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js](https://next-auth.js.org/)
- [Prisma](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [next-intl](https://next-intl-docs.vercel.app/)

---

## 🤝 Contribuir

Si encuentras bugs o tienes sugerencias:

1. Abre un Issue
2. Crea un Pull Request
3. Describe los cambios claramente

---

## 📄 Licencia

MIT License - Usa este template libremente en tus proyectos.

---

## ✅ Checklist de Configuración

- [ ] Clonar/usar como template
- [ ] Instalar dependencias (`npm install`)
- [ ] Crear base de datos en Neon
- [ ] Crear Storage Account y Container en Azure
- [ ] Configurar `.env.local` con todas las variables
- [ ] Ejecutar `npx prisma migrate deploy`
- [ ] Iniciar servidor (`npm run dev`)
- [ ] Visitar `/setup` y crear admin
- [ ] (Opcional) Configurar OAuth providers
- [ ] (Opcional) Deploy en Vercel
- [ ] ¡Comenzar a desarrollar! 🚀

---

## 💡 Tips

- Usa `/setup` solo la primera vez
- El panel admin está en `/admin`
- El perfil de usuario está en `/profile`
- La configuración del sistema está en `/admin/settings`
- Cambia el idioma desde el menú de usuario

---

**¿Preguntas?** Abre un issue en GitHub o consulta la documentación.

**¡Feliz desarrollo!** 🎉

