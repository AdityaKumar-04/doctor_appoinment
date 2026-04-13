"use client";

import { useEffect, useState, Suspense } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

function VerifyLogic() {
  const router = useRouter();
  const [status, setStatus] = useState("Verifying your account...");
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        // Retrieve session. createBrowserClient handles the URL hash locally.
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        // If session exists, verification via magic link was successful!
        if (session) {
          if (isMounted) setStatus("Success! Redirecting to dashboard...");
          setTimeout(() => {
            if (isMounted) router.replace("/dashboard");
          }, 1500);
        }
      } catch (err: unknown) {
        console.error("Verification error:", err);
        if (isMounted) setError(err instanceof Error ? err.message : "An error occurred during verification.");
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        checkSession();
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <div className="max-w-md w-full relative z-10 bg-surface-container-lowest p-10 rounded-2xl shadow-xl border border-surface-container-highest text-center">
      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${error ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
        <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          {error ? 'error' : 'verified_user'}
        </span>
      </div>

      <h2 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight mb-3">
        {error ? 'Verification Failed' : 'Account Verification'}
      </h2>
      
      {!error ? (
         <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-on-surface-variant text-sm leading-relaxed">
              {status}
            </p>
            {status !== "Success! Redirecting to dashboard..." && (
              <span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mt-2" />
            )}
         </div>
      ) : (
        <>
            <p className="text-error text-sm leading-relaxed mb-6">
                {error}
            </p>
            <button
                onClick={() => router.push("/login")}
                className="w-full bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high py-3 rounded-xl font-bold transition-colors"
            >
                Back to Login
            </button>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="flex-grow flex items-center justify-center relative overflow-hidden px-4 py-12 min-h-screen bg-surface font-body">
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[60%] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[50%] bg-tertiary/5 rounded-full blur-3xl pointer-events-none" />
      <Suspense fallback={<div className="text-on-surface-variant animate-pulse">Loading...</div>}>
        <VerifyLogic />
      </Suspense>
    </main>
  );
}
