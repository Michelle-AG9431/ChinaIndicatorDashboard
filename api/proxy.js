// Vercel Serverless Function: server-side proxy to bypass browser CORS.
// Usage from the frontend:  fetch(`/api/proxy?url=${encodeURIComponent(target)}`)
//
// Only a whitelist of official Chinese statistics domains is allowed, so the
// endpoint cannot be abused as an open proxy.

const ALLOWED_HOSTS = [
  "data.stats.gov.cn",
  "www.stats.gov.cn",
  "stats.gov.cn",
  "www.gov.cn",
  "www.pbc.gov.cn",
  "www.nfra.gov.cn",
  "www.mof.gov.cn",
  "www.npc.gov.cn",
  "www.celma.org.cn",
];

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    res.status(400).json({ error: "Missing ?url= parameter" });
    return;
  }

  let target;
  try {
    target = new URL(url);
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  if (!ALLOWED_HOSTS.includes(target.hostname)) {
    res
      .status(403)
      .json({ error: `Host not allowed: ${target.hostname}`, allowed: ALLOWED_HOSTS });
    return;
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ChinaMonitoringDashboard/1.0; +https://vercel.com)",
        Accept: "application/json, text/html, */*",
      },
      // 12s soft timeout via AbortController
      signal: AbortSignal.timeout(12000),
    });

    const contentType = upstream.headers.get("content-type") || "text/plain";
    const body = await upstream.text();

    // Cache at the edge for 1h; serve stale for a day while revalidating.
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Cache-Control",
      "s-maxage=3600, stale-while-revalidate=86400"
    );
    res.setHeader("Content-Type", contentType);
    res.status(upstream.status).send(body);
  } catch (err) {
    res.status(502).json({
      error: "Upstream fetch failed",
      detail: String(err),
      hint: "The official site may block automated access or be temporarily down.",
    });
  }
}
