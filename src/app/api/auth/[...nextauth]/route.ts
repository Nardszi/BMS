import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const originalHandler = NextAuth(authOptions);

async function handler(req: Request, context: any) {
  if (req.method === "POST") {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rateCheck = checkRateLimit(`auth:${ip}`, RATE_LIMITS.auth);
    if (!rateCheck.allowed) {
      return new Response(JSON.stringify({ error: "Too many login attempts. Please try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  return originalHandler(req, context);
}

export { handler as GET, handler as POST };
