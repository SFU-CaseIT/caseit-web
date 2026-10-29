import { createHmac, timingSafeEqual } from "node:crypto";

const GRANT_LIFETIME_MS = 2 * 60 * 60 * 1000;

function signature(userId: string, path: string, expiresAt: string): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Supabase service-role configuration is missing.");
  return createHmac("sha256", key)
    .update(JSON.stringify(["sheet-upload-v1", userId, path, expiresAt]))
    .digest("base64url");
}

export function createSheetUploadGrant(userId: string, path: string): string {
  const expiresAt = String(Date.now() + GRANT_LIFETIME_MS);
  return `${expiresAt}.${signature(userId, path, expiresAt)}`;
}

export function verifySheetUploadGrant(userId: string, path: string, grant: unknown): boolean {
  if (typeof grant !== "string" || grant.length > 100) return false;
  const parts = grant.split(".");
  if (parts.length !== 2 || !/^\d{13}$/.test(parts[0]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[1])) return false;
  const expiresAt = Number(parts[0]);
  if (expiresAt < Date.now() || expiresAt > Date.now() + GRANT_LIFETIME_MS) return false;
  const expected = Buffer.from(signature(userId, path, parts[0]));
  const received = Buffer.from(parts[1]);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
