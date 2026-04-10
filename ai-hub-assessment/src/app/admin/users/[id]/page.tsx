import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import UserDetailClient from "./UserDetailClient";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'contentAdmin')) {
    redirect('/dashboard');
  }

  const user = await prisma.user.findUnique({
    where: { userId: id },
    include: {
      attempts: {
        orderBy: { startTime: 'desc' },
      }
    }
  });

  if (!user) {
    redirect('/admin/users');
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-8">
        User Details: {user.displayName}
      </h1>
      
      <UserDetailClient user={user as any} attempts={user.attempts as any} />
    </div>
  );
}
