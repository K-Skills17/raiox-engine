import { cookies } from "next/headers";

// Fixed user ID for Domingos (single-user v1)
export const OWNER_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("raiox-authenticated");
  return authCookie?.value === process.env.AUTH_PASSWORD;
}
