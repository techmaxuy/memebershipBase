-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "appName" TEXT NOT NULL DEFAULT 'MemberBase',
    "welcomeMessageEn" TEXT NOT NULL DEFAULT 'Welcome to the Member Base with Roles Application',
    "welcomeMessageEs" TEXT NOT NULL DEFAULT 'Bienvenido a la aplicación base de miembros con roles',
    "logo" TEXT,
    "favicon" TEXT,
    "defaultLocale" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
