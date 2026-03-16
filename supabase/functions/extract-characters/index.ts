import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractedCharacter {
  name: string;
  emoji: string;
  physical_description: string | null;
  personality_trait: string | null;
  poetic_detail: string | null;
  origin_family: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  try {
    const { story_content, story_title, origin_family } = await req.json();

    if (!story_content || typeof story_content !== "string") {
      return new Response(JSON.stringify({ error: "story_content is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const systemPrompt = `Tu es un assistant spécialisé dans l'analyse de personnages dans les histoires pour enfants.
Ta tâche est d'extraire les personnages principaux d'une histoire et de les décrire de manière synthétique.

RÈGLES :
- Extrait entre 1 et 4 personnages principaux (pas les personnages secondaires ou mentionnés en passant)
- Pour chaque personnage, propose un emoji approprié (1 seul emoji, pas de texte)
- Les descriptions doivent être courtes et bienveillantes, adaptées aux enfants
- La description physique : 1 trait visuel mémorable (max 15 mots)
- Le trait de caractère : 1 qualité ou habitude distinctive (max 12 mots)
- Le détail poétique : ce qui rend le personnage magique ou unique (max 15 mots)
- Si un champ n'est pas mentionné dans l'histoire, retourne null

RÉPONSE : Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans explication.
Format exact :
{
  "characters": [
    {
      "name": "Nom du personnage",
      "emoji": "🧚",
      "physical_description": "Description physique courte ou null",
      "personality_trait": "Trait de caractère ou null",
      "poetic_detail": "Détail poétique ou null"
    }
  ]
}`;

    const userPrompt = `Histoire : "${story_title}"
Famille de récit : ${origin_family || "non précisée"}

Contenu :
${story_content}

Extrais les personnages principaux de cette histoire.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errText}`);
    }

    const json = await response.json();
    const rawText: string = json.content?.[0]?.text || "{}";

    let parsed: { characters?: ExtractedCharacter[] };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Attempt to extract JSON block if the model wrapped it in something
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Could not parse character extraction response");
      }
    }

    const characters: ExtractedCharacter[] = (parsed.characters ?? []).map((c) => ({
      name: c.name ?? "Personnage",
      emoji: c.emoji ?? "✨",
      physical_description: c.physical_description ?? null,
      personality_trait: c.personality_trait ?? null,
      poetic_detail: c.poetic_detail ?? null,
      origin_family: origin_family ?? null,
    }));

    return new Response(JSON.stringify({ characters }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});
