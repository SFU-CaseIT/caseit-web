import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// MIDDLEWARE FOR HANDLING AUTH

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
