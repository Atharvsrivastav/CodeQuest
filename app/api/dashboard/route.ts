import { buildDashboardSummary, sanitizeDashboardProgress } from "@/lib/dashboard";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as unknown;
    const progress = sanitizeDashboardProgress(input);
    const summary = buildDashboardSummary(progress);

    return Response.json(summary);
  } catch {
    return Response.json({ error: "Unable to build dashboard summary." }, { status: 400 });
  }
}
