import { SESSION_COOKIE, redirectTo } from "@/lib/auth";

export async function POST() {
  const res = redirectTo("/admin/login");
  res.headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
  return res;
}
