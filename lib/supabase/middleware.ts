import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// REFRESH SESSION (COOKIE) MIDDLEWARE

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const startedAt = performance.now();
  await supabase.auth.getClaims();
  if (request.nextUrl.pathname === "/admin" && request.method === "GET") {
    console.info("[admin-auth] middleware claims", {
      durationMs: Math.round(performance.now() - startedAt),
    });
  }
  return response;
}
