import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as net from 'net';
import bcrypt from 'bcryptjs';

const execAsync = promisify(exec);

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function testTcpConnection(host: string, port: number, timeoutMs: number): Promise<string> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const start = Date.now();
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => {
      const elapsed = Date.now() - start;
      let banner = '';
      socket.once('data', (data) => {
        banner = data.toString('utf8', 0, Math.min(data.length, 200));
        socket.destroy();
        resolve(`TCP connected in ${elapsed}ms, banner: ${banner}`);
      });
      setTimeout(() => { socket.destroy(); resolve(`TCP connected in ${elapsed}ms, no banner received`); }, 2000);
    });
    socket.on('error', (err) => { socket.destroy(); resolve(`TCP error: ${err.message}`); });
    socket.on('timeout', () => { socket.destroy(); resolve('TCP timeout'); });
    socket.connect(port, host);
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const key = searchParams.get('key');

  // Simple auth key to prevent unauthorized access
  if (key !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? '***set***' : '***missing***',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      AZURE_AD_CLIENT_ID: process.env.AZURE_AD_CLIENT_ID ? '***set***' : '***missing***',
      AZURE_AD_CLIENT_SECRET: process.env.AZURE_AD_CLIENT_SECRET ? '***set***' : '***missing***',
    },
  };

  // Raw TCP test to DB (always runs, independent of Prisma)
  try {
    const tcpResult = await testTcpConnection('10.153.27.200', 5432, 5000);
    results.tcp = tcpResult;
  } catch (e: unknown) {
    results.tcp = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Test DB connectivity with a 10-second timeout
  try {
    const dbResult = await withTimeout(
      prisma.$queryRawUnsafe('SELECT current_user, current_database(), version()'),
      10000,
      'Prisma query'
    );
    results.db = { status: 'connected', result: dbResult };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    results.db = { status: 'error', message: msg };
  }

  // List DB roles if requested
  if (action === 'roles') {
    try {
      const roles = await withTimeout(
        prisma.$queryRawUnsafe(`SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin FROM pg_roles WHERE rolname NOT LIKE 'pg_%' ORDER BY rolname`),
        10000,
        'Roles query'
      );
      results.roles = roles;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.roles = { error: msg };
    }
  }

  // List databases if requested
  if (action === 'databases') {
    try {
      const dbs = await withTimeout(
        prisma.$queryRawUnsafe(`SELECT datname, pg_catalog.pg_get_userbyid(datdba) as owner FROM pg_database ORDER BY datname`),
        10000,
        'Databases query'
      );
      results.databases = dbs;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.databases = { error: msg };
    }
  }

  // Run migration if requested (tries CLI first)
  if (action === 'migrate') {
    try {
      const { stdout, stderr } = await execAsync(
        'node node_modules/prisma/build/index.js migrate deploy',
        { cwd: '/home/site/wwwroot', timeout: 30000 }
      );
      results.migrate = { status: 'success', stdout, stderr };
    } catch (e: unknown) {
      const msg = e instanceof Error ? (e as Error & { stdout?: string; stderr?: string }).stderr || e.message : String(e);
      results.migrate = { status: 'error', message: msg };
    }
  }

  // Run migrations as raw SQL (bypasses Prisma CLI)
  if (action === 'rawmigrate') {
    const migrationLog: string[] = [];
    try {
      // Create _prisma_migrations tracking table if it doesn't exist
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
          "id" VARCHAR(36) NOT NULL PRIMARY KEY,
          "checksum" VARCHAR(64) NOT NULL,
          "finished_at" TIMESTAMPTZ,
          "migration_name" VARCHAR(255) NOT NULL,
          "logs" TEXT,
          "rolled_back_at" TIMESTAMPTZ,
          "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "applied_steps_count" INTEGER NOT NULL DEFAULT 0
        )
      `);
      migrationLog.push('_prisma_migrations table ready');

      // Migration 1: 20260322212057_init
      const m1Name = '20260322212057_init';
      const m1Exists: Array<Record<string, unknown>> = await prisma.$queryRawUnsafe(
        `SELECT id FROM "_prisma_migrations" WHERE "migration_name" = $1`, m1Name
      );
      if (m1Exists.length === 0) {
        await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "User" ("userId" TEXT NOT NULL, "email" TEXT NOT NULL, "password" TEXT NOT NULL, "displayName" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'taker', "externalId" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "lastLoginAt" TIMESTAMP(3), CONSTRAINT "User_pkey" PRIMARY KEY ("userId"))`);
        await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Feedback" ("feedbackId" TEXT NOT NULL, "userId" TEXT, "name" TEXT, "email" TEXT, "rating" INTEGER, "content" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Feedback_pkey" PRIMARY KEY ("feedbackId"))`);
        await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "BankVersion" ("versionId" SERIAL NOT NULL, "status" TEXT NOT NULL, "description" TEXT, "publishedBy" TEXT NOT NULL, "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "questionCount" INTEGER NOT NULL, "dimensionConfig" JSONB NOT NULL, "competencyConfig" JSONB NOT NULL, "questions" JSONB NOT NULL, CONSTRAINT "BankVersion_pkey" PRIMARY KEY ("versionId"))`);
        await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "AssessmentAttempt" ("attemptId" TEXT NOT NULL, "userId" TEXT NOT NULL, "bankVersionId" INTEGER NOT NULL, "status" TEXT NOT NULL, "toolsDaily" JSONB NOT NULL DEFAULT '[]', "toolsWeekly" JSONB NOT NULL DEFAULT '[]', "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "endTime" TIMESTAMP(3), "answers" JSONB NOT NULL DEFAULT '{}', "dimScores" JSONB, "overallScore" DOUBLE PRECISION, "badge" TEXT, "badgeExpiresAt" TIMESTAMP(3), CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("attemptId"))`);
        await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "QuestionReaction" ("reactionId" TEXT NOT NULL, "attemptId" TEXT NOT NULL, "questionId" TEXT NOT NULL, "vote" TEXT, "comment" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "QuestionReaction_pkey" PRIMARY KEY ("reactionId"))`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "Feedback" DROP CONSTRAINT IF EXISTS "Feedback_userId_fkey"`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "AssessmentAttempt" DROP CONSTRAINT IF EXISTS "AssessmentAttempt_userId_fkey"`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "AssessmentAttempt" DROP CONSTRAINT IF EXISTS "AssessmentAttempt_bankVersionId_fkey"`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_bankVersionId_fkey" FOREIGN KEY ("bankVersionId") REFERENCES "BankVersion"("versionId") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "QuestionReaction" DROP CONSTRAINT IF EXISTS "QuestionReaction_attemptId_fkey"`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "QuestionReaction" ADD CONSTRAINT "QuestionReaction_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("attemptId") ON DELETE RESTRICT ON UPDATE CASCADE`);
        // Record migration
        await prisma.$executeRawUnsafe(
          `INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count") VALUES (gen_random_uuid()::text, 'raw_init', $1, now(), 1)`, m1Name
        );
        migrationLog.push(`${m1Name}: applied`);
      } else {
        migrationLog.push(`${m1Name}: already applied`);
      }

      // Migration 2: 20260326115324_add_selected_question_ids
      const m2Name = '20260326115324_add_selected_question_ids';
      const m2Exists: Array<Record<string, unknown>> = await prisma.$queryRawUnsafe(
        `SELECT id FROM "_prisma_migrations" WHERE "migration_name" = $1`, m2Name
      );
      if (m2Exists.length === 0) {
        await prisma.$executeRawUnsafe(`ALTER TABLE "AssessmentAttempt" ADD COLUMN IF NOT EXISTS "selectedQuestionIds" JSONB NOT NULL DEFAULT '[]'`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'contentAdmin'`);
        await prisma.$executeRawUnsafe(
          `INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count") VALUES (gen_random_uuid()::text, 'raw_add_selected_question_ids', $1, now(), 1)`, m2Name
        );
        migrationLog.push(`${m2Name}: applied`);
      } else {
        migrationLog.push(`${m2Name}: already applied`);
      }

      // Migration 3: schema drift fixes (authProvider, password default, role default)
      const m3Name = 'schema_drift_fix_authprovider';
      const m3Exists: Array<Record<string, unknown>> = await prisma.$queryRawUnsafe(
        `SELECT id FROM "_prisma_migrations" WHERE "migration_name" = $1`, m3Name
      );
      if (m3Exists.length === 0) {
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "authProvider" TEXT NOT NULL DEFAULT 'credentials'`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ALTER COLUMN "password" SET DEFAULT ''`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'user'`);
        await prisma.$executeRawUnsafe(
          `INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count") VALUES (gen_random_uuid()::text, 'raw_schema_drift_fix', $1, now(), 1)`, m3Name
        );
        migrationLog.push(`${m3Name}: applied`);
      } else {
        migrationLog.push(`${m3Name}: already applied`);
      }

      // Migration 4: timer fields on AssessmentAttempt (timeUsedSeconds, isPaused, lastResumedAt)
      const m4Name = 'add_timer_fields';
      const m4Exists: Array<Record<string, unknown>> = await prisma.$queryRawUnsafe(
        `SELECT id FROM "_prisma_migrations" WHERE "migration_name" = $1`, m4Name
      );
      if (m4Exists.length === 0) {
        await prisma.$executeRawUnsafe(`ALTER TABLE "AssessmentAttempt" ADD COLUMN IF NOT EXISTS "timeUsedSeconds" INTEGER NOT NULL DEFAULT 0`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "AssessmentAttempt" ADD COLUMN IF NOT EXISTS "isPaused" BOOLEAN NOT NULL DEFAULT false`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "AssessmentAttempt" ADD COLUMN IF NOT EXISTS "lastResumedAt" TIMESTAMP(3)`);
        await prisma.$executeRawUnsafe(
          `INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count") VALUES (gen_random_uuid()::text, 'raw_add_timer_fields', $1, now(), 1)`, m4Name
        );
        migrationLog.push(`${m4Name}: applied`);
      } else {
        migrationLog.push(`${m4Name}: already applied`);
      }

      results.rawmigrate = { status: 'success', log: migrationLog };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.rawmigrate = { status: 'error', log: migrationLog, message: msg };
    }
  }

  // Seed admin if requested (via external script)
  if (action === 'seed') {
    try {
      const { stdout, stderr } = await execAsync(
        'node seed_admin.js',
        { cwd: '/home/site/wwwroot', timeout: 15000 }
      );
      results.seed = { status: 'success', stdout, stderr };
    } catch (e: unknown) {
      const msg = e instanceof Error ? (e as Error & { stdout?: string; stderr?: string }).stderr || e.message : String(e);
      results.seed = { status: 'error', message: msg };
    }
  }

  // Seed admin inline (uses app's bcryptjs)
  if (action === 'seedadmin') {
    try {
      const email = 'admin@admin.com';
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        results.seedadmin = { status: 'exists', message: `Admin user already exists: ${email}` };
      } else {
        const hashedPassword = await bcrypt.hash('password', 10);
        await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            displayName: 'Admin',
            role: 'admin',
          },
        });
        results.seedadmin = { status: 'created', message: `Admin user created: ${email}` };
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.seedadmin = { status: 'error', message: msg };
    }
  }

  // Count users if DB is connected
  if (results.db && (results.db as Record<string, unknown>).status === 'connected') {
    try {
      const userCount = await prisma.user.count();
      results.users = { count: userCount };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.users = { error: msg };
    }
  }

  return NextResponse.json(results, { status: 200 });
}
