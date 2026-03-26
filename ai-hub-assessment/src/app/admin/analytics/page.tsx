import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AnalyticsClient from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'contentAdmin')) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <h1 className="text-3xl font-medium text-foreground mb-8">
        Analytics & Exports
      </h1>
      
      <AnalyticsClient />
    </div>
  );
}
