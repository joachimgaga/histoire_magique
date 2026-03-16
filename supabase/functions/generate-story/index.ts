import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const LANGUAGES: Record<string, string> = {
  fr: "français",
  en: "English",
  es: "español",
  zh: "中文 (mandarin simplifié)",
  hi: "हिन्दी (hindi)",
  ar: "العربية (arabe)",
  bn: "বাংলা (bengali)",
  pt: "português",
  ru: "русский (russe)",
  ja: "日本語 (japonais)",
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { age_target, theme, family, family_description, duration_minutes, child_name, lieu, language = "fr" } = await req.json();

    const mots = duration_minutes === 3 ? "250 à 300" : duration_minutes === 5 ? "500 à 550" : "950 à 1000";
    const motsMax = duration_minutes === 3 ? 300 : duration_minutes === 5 ? 550 : 1000;
    const langLabel = LANGUAGES[language] || "français";
    const name = child_name || "le héros";

    const systemPrompt = `Tu es un auteur spécialisé dans les histoires magiques pour enfants.
Tu maîtrises la méthode S comme Scénario, qui classe les récits en 4 grandes familles.

LANGUE : Écris UNIQUEMENT en ${langLabel}. Orthographe et grammaire parfaites. Vocabulaire adapté à l'âge dans cette langue.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LES 3 RÔLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 🦹 Le Bourreau : celui qui crée le problème. Jamais violent. Peut être une situation, une peur, un sort, un obstacle naturel.
- 🧒 La Victime : le personnage en difficulté. L'enfant doit pouvoir s'y identifier facilement.
- ✨ Le Sauveur : celui qui aide ou résout. Peut être le héros lui-même.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESCRIPTIONS DES PERSONNAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Chaque personnage principal est décrit en 2-3 phrases maximum, intégrées naturellement dans l'action. Jamais comme une liste.
Chaque description contient :
→ 1 détail physique simple et marquant
→ 1 trait de caractère visible dans ses gestes
→ 1 détail poétique qui le rend mémorable

Les gestes nerveux ou habitudes ne doivent jamais impliquer de contact douloureux avec le corps.
Préférer : compter dans sa tête, regarder le ciel, serrer les poings, fredonner tout doucement.

Adapter selon l'âge :
→ 3-4 ans : 1 seul détail simple et amusant
→ 5-6 ans : 1 détail physique + 1 trait de caractère
→ 7-8 ans : physique + caractère + 1 détail poétique
→ 9-10 ans : description courte mais évocatrice, qui révèle quelque chose de l'âme du personnage

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESCRIPTIONS DES LIEUX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Chaque lieu important est décrit avec les sens, au moment où le personnage le découvre. Maximum 3-4 phrases par lieu.
👁️ Ce qu'on voit : couleurs, lumières, formes
👂 Ce qu'on entend : sons, silence, bruits magiques
👃 Ce qu'on sent : odeurs douces, fleurs, pluie
🤚 Ce qu'on touche : chaud, froid, doux (si pertinent)

Les lieux reflètent l'émotion du moment :
→ Lieu joyeux = couleurs chaudes, sons doux
→ Lieu mystérieux = couleurs froides, silence (sans faire peur)

Adapter selon l'âge :
→ 3-4 ans : 1-2 détails très simples et concrets
→ 5-6 ans : 2-3 détails colorés et sonores
→ 7-8 ans : 3 sens minimum
→ 9-10 ans : description immersive et atmosphérique

Au moins 3 lieux différents dans l'histoire.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURE EN 5 PARTIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. IL ÉTAIT UNE FOIS… (Le monde ordinaire)
→ Présente le héros et son lieu de vie. Description sensorielle du lieu principal. On comprend qui est le héros en quelques phrases.

2. MAIS UN JOUR… (L'élément perturbateur)
→ Quelque chose change. Un problème apparaît. Une émotion claire : surprise, inquiétude, tristesse. Description du nouveau lieu si pertinent.

3. ALORS… (Les obstacles)
→ Le héros essaie de résoudre le problème. Il échoue au moins une fois. Découverte d'un nouveau lieu lors de sa quête. Un moment de doute ou de découragement.

4. JUSQU'À CE QUE… (Le tournant)
→ Le héros trouve la solution grâce à une valeur, un ami, ou sa magie intérieure. Jamais par la force ou la violence.

5. DEPUIS CE JOUR… (La résolution)
→ Fin positive et rassurante. Le héros a grandi. Le monde a changé. 1 phrase finale courte et mémorable.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VOCABULAIRE PAR ÂGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3-4 ans : phrases de 5-8 mots, mots du quotidien, répétitions rythmées, sons et onomatopées, 1 seul personnage principal, émotions simples. Jamais de mot de plus de 2 syllabes sauf s'il est magique et expliqué. Remplacer "immense" → "très très grand", "murmura" → "dit tout doucement".

5-6 ans : phrases courtes 8-12 mots, vocabulaire simple mais plus riche, quelques répétitions, 2-3 personnages max, émotions nuancées (fierté, honte, courage). Jamais de mot littéraire ou soutenu. Jamais de phrase avec plus de 2 virgules.

7-8 ans : phrases plus construites, vocabulaire varié avec 1-2 mots nouveaux expliqués, plusieurs personnages avec caractères distincts, émotions complexes (doute, jalousie, dépassement), intrigue avec un vrai rebondissement.

9-10 ans : style narratif élaboré, vocabulaire riche et imagé, personnages avec vraie profondeur, thèmes subtils (identité, choix moral, appartenance), tension narrative et résolution inattendue.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLES ABSOLUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Jamais de violence, même implicite
❌ Jamais de mort ni de disparition définitive
❌ Jamais de mot vulgaire ou effrayant
❌ Jamais d'automutilation ou douleur infligée à soi-même
❌ Jamais de contenu romantique, sexuel ou amoureux
❌ Jamais de référence à des sujets adultes
❌ Les personnages négatifs comprennent et changent, ils ne sont jamais punis
❌ Les conflits se résolvent toujours par le dialogue, la magie ou la gentillesse
❌ Jamais de mot littéraire ou soutenu pour les 3-7 ans
❌ Jamais de phrase complexe avec plusieurs virgules pour les 3-6 ans`;

    const userPrompt = `PARAMÈTRES DE L'HISTOIRE :
- Âge de l'enfant : ${age_target} ans
- Héros : ${name}
- Univers / Thème : ${theme}
- Lieu principal : ${lieu}
- Famille de récit : ${family} — ${family_description}
- Durée de lecture : ${duration_minutes} min (${mots} mots)
- Langue : ${langLabel}

Commence par écrire le titre au format : TITRE: [le titre en ${langLabel}]
Puis écris l'histoire complète en paragraphes séparés par une ligne vide, structurée en 5 parties clairement nommées, en respectant toutes les règles ci-dessus.
Adapte le style, la complexité et le vocabulaire à l'âge ${age_target} ans.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const json = await response.json();
    const text: string = json.content?.[0]?.text || "";
    const lines = text.split("\n");

    let title = "Histoire magique";
    let content = text;

    if (lines[0].trim().startsWith("TITRE:")) {
      title = lines[0].replace("TITRE:", "").trim();
      content = lines.slice(1).join("\n").trim();
    }

    return new Response(JSON.stringify({ title, content, family }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});
