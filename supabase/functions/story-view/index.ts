import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response("Histoire introuvable.", { status: 404 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: story } = await supabase
    .from("stories")
    .select("title, content")
    .eq("share_token", token)
    .single();

  if (!story) {
    return new Response("Histoire introuvable.", { status: 404 });
  }

  const paragraphs = story.content
    .split("\n\n")
    .filter((p: string) => p.trim())
    .map((p: string) => `<p>${p.trim().replace(/\n/g, "<br>")}</p>`)
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta property="og:title" content="${story.title} — Histoires Magiques">
  <meta property="og:description" content="Une histoire magique créée avec Histoires Magiques ✨">
  <title>${story.title} — Histoires Magiques</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: linear-gradient(160deg, #0f0c29 0%, #1a1a4e 50%, #0d1b3e 100%);
      color: #e2e8f0;
      font-family: Georgia, 'Times New Roman', serif;
      min-height: 100vh;
      padding: 24px 16px 60px;
    }
    .container { max-width: 680px; margin: 0 auto; }
    .moon { font-size: 40px; text-align: center; display: block; margin-bottom: 8px; }
    h1 {
      color: #fde68a;
      font-size: clamp(22px, 5vw, 32px);
      text-align: center;
      line-height: 1.3;
      margin-bottom: 32px;
    }
    p {
      font-size: clamp(16px, 2.5vw, 18px);
      line-height: 1.9;
      margin-bottom: 20px;
      color: rgba(255,255,255,0.88);
    }
    .end {
      text-align: center;
      color: #fde68a;
      font-size: 22px;
      margin-top: 16px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .footer p { color: #a78bfa; font-size: 14px; font-family: sans-serif; }
    .badge {
      display: inline-block;
      background: rgba(124,58,237,0.3);
      border: 1px solid rgba(167,139,250,0.4);
      border-radius: 20px;
      padding: 6px 16px;
      color: #c4b5fd;
      font-size: 13px;
      font-family: sans-serif;
      margin-top: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <span class="moon">🌙</span>
    <h1>${story.title}</h1>
    ${paragraphs}
    <div class="end">✨ Fin ✨</div>
    <div class="footer">
      <p>Créé avec</p>
      <span class="badge">✨ Histoires Magiques</span>
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});
