/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

type BriefingArticleInput = {
  region: "us" | "world";
  headline: string;
  summary: string;
  source_name: string;
  source_url: string;
  source_type: "email" | "web";
  published_at?: string;
};

const briefingTool = {
  name: "update_daily_briefing",
  description: "Replace one day of The AI Proof Sheet with sourced U.S. and World AI news.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["issue_date", "articles"],
    properties: {
      issue_date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "Edition date in YYYY-MM-DD format." },
      articles: {
        type: "array",
        minItems: 2,
        maxItems: 12,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["region", "headline", "summary", "source_name", "source_url", "source_type"],
          properties: {
            region: { type: "string", enum: ["us", "world"] },
            headline: { type: "string", minLength: 8, maxLength: 140 },
            summary: { type: "string", minLength: 30, maxLength: 600 },
            source_name: { type: "string", minLength: 2, maxLength: 100 },
            source_url: { type: "string", format: "uri" },
            source_type: { type: "string", enum: ["email", "web"] },
            published_at: { type: "string", maxLength: 40 },
          },
        },
      },
    },
  },
};

const readTool = {
  name: "get_daily_briefing",
  description: "Read the latest saved AI Proof Sheet briefing and its sources.",
  inputSchema: { type: "object", additionalProperties: false, properties: {} },
};

function jsonRpc(id: unknown, result: unknown, status = 200) {
  return Response.json(
    { jsonrpc: "2.0", id: id ?? null, result },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

function toolError(message: string) {
  return { content: [{ type: "text", text: message }], isError: true };
}

function validateBriefing(input: unknown): { issueDate: string; articles: BriefingArticleInput[] } | { error: string } {
  if (!input || typeof input !== "object") return { error: "Arguments are required." };
  const { issue_date: issueDate, articles } = input as { issue_date?: unknown; articles?: unknown };
  if (typeof issueDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) return { error: "issue_date must use YYYY-MM-DD." };
  if (!Array.isArray(articles) || articles.length < 2 || articles.length > 12) return { error: "Provide 2 to 12 articles." };

  const clean: BriefingArticleInput[] = [];
  for (const value of articles) {
    if (!value || typeof value !== "object") return { error: "Every article must be an object." };
    const article = value as Record<string, unknown>;
    if (article.region !== "us" && article.region !== "world") return { error: "Every article needs a us or world region." };
    if (article.source_type !== "email" && article.source_type !== "web") return { error: "Every article needs an email or web source_type." };
    for (const field of ["headline", "summary", "source_name", "source_url"] as const) {
      if (typeof article[field] !== "string" || !article[field].trim()) return { error: `Every article needs ${field}.` };
    }
    try {
      const url = new URL(article.source_url as string);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch {
      return { error: "Every source_url must be an http(s) URL." };
    }
    clean.push({
      region: article.region,
      headline: (article.headline as string).trim().slice(0, 140),
      summary: (article.summary as string).trim().slice(0, 600),
      source_name: (article.source_name as string).trim().slice(0, 100),
      source_url: (article.source_url as string).trim(),
      source_type: article.source_type,
      published_at: typeof article.published_at === "string" ? article.published_at.trim().slice(0, 40) : undefined,
    });
  }
  if (!clean.some((article) => article.region === "us") || !clean.some((article) => article.region === "world")) {
    return { error: "The briefing must include at least one U.S. and one World article." };
  }
  return { issueDate, articles: clean };
}

async function handleMcp(request: Request, env: Env) {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
  let body: { jsonrpc?: string; id?: unknown; method?: string; params?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return jsonRpc(null, { content: [{ type: "text", text: "Invalid JSON." }], isError: true }, 400);
  }

  if (body.method === "server/discover") {
    return jsonRpc(body.id, { supportedVersions: ["2026-07-28"], capabilities: { tools: {} } });
  }
  if (body.method === "tools/list") return jsonRpc(body.id, { tools: [readTool, briefingTool] });
  if (body.method !== "tools/call") return jsonRpc(body.id, toolError("Unknown MCP method."), 400);

  const name = body.params?.name;
  if (name === "get_daily_briefing") {
    const latest = await env.DB.prepare("SELECT issue_date FROM briefing_articles ORDER BY issue_date DESC, id DESC LIMIT 1").first<{ issue_date: string }>();
    const articles = latest
      ? (await env.DB.prepare("SELECT id, issue_date, region, headline, summary, source_name, source_url, source_type, published_at FROM briefing_articles WHERE issue_date = ? ORDER BY id").bind(latest.issue_date).all()).results
      : [];
    return jsonRpc(body.id, { content: [{ type: "text", text: JSON.stringify({ issue_date: latest?.issue_date ?? null, articles }) }] });
  }

  if (name === "update_daily_briefing") {
    const validated = validateBriefing(body.params?.arguments);
    if ("error" in validated) return jsonRpc(body.id, toolError(validated.error));
    const statements = [
      env.DB.prepare("DELETE FROM briefing_articles WHERE issue_date = ?").bind(validated.issueDate),
      ...validated.articles.map((article) => env.DB.prepare(
        "INSERT INTO briefing_articles (issue_date, region, headline, summary, source_name, source_url, source_type, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      ).bind(validated.issueDate, article.region, article.headline, article.summary, article.source_name, article.source_url, article.source_type, article.published_at ?? null)),
    ];
    await env.DB.batch(statements);
    const us = validated.articles.filter((article) => article.region === "us").length;
    const world = validated.articles.length - us;
    return jsonRpc(body.id, {
      content: [{ type: "text", text: `Saved ${validated.issueDate}: ${us} U.S. stories and ${world} World stories.` }],
    });
  }

  return jsonRpc(body.id, toolError("Unknown tool."));
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/mcp") return handleMcp(request, env);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
