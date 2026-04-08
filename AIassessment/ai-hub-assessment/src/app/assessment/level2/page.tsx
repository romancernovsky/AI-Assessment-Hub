'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Level 2 is no longer separate — redirect to the unified assessment page
export default function Level2Redirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/assessment/level1');
  }, [router]);

  return (
    <div className="text-center py-20 animate-pulse text-muted-foreground">
      Redirecting to assessment...
    </div>
  );
}
