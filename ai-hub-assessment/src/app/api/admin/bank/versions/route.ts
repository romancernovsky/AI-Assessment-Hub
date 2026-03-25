import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'contentAdmin')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const versions = await prisma.bankVersion.findMany({
      orderBy: { publishedAt: 'desc' },
      select: {
        versionId: true,
        status: true,
        publishedBy: true,
        publishedAt: true,
        description: true,
        questionCount: true,
      }
    });

    return NextResponse.json(versions, { status: 200 });

  } catch (error) {
    console.error('Error fetching bank versions:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
