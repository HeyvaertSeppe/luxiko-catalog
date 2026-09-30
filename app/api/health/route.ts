export const dynamic = "force-dynamic";

/** Used by the Docker HEALTHCHECK. */
export function GET() {
  return Response.json({ ok: true });
}
