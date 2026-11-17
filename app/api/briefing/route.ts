import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { briefingArticles } from "../../../db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const [latest] = await db
      .select({ issueDate: briefingArticles.issueDate })
      .from(briefingArticles)
      .orderBy(desc(briefingArticles.issueDate), desc(briefingArticles.id))
      .limit(1);

    if (!latest) {
      return Response.json({ issueDate: null, articles: [] }, { headers: { "Cache-Control": "private, no-store" } });
    }

    const articles = await db
      .select()
      .from(briefingArticles)
      .where(eq(briefingArticles.issueDate, latest.issueDate))
      .orderBy(briefingArticles.id);

    return Response.json(
      { issueDate: latest.issueDate, articles },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      { issueDate: null, articles: [], error: "The daily briefing is not available yet." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
