-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authProvider" TEXT NOT NULL DEFAULT 'credentials',
ALTER COLUMN "password" SET DEFAULT '';
