import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { generateStory } from "@/lib/anthropic";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useTablet } from "@/lib/tablet";
import { C, GRAD, F } from "@/lib/theme";
import PaywallBanner from "@/components/PaywallBanner";
import GeneratingScreen from "@/components/GeneratingScreen";

const HEROS_FREE: { id: string; emoji: string }[] = [
  { id: "princesse", emoji: "👸" },
  { id: "dragon",    emoji: "🐉" },
  { id: "lapin",     emoji: "🐰" },
  { id: "chevalier", emoji: "⚔️" },
  { id: "fee",       emoji: "🧚" },
  { id: "pirate",    emoji: "🏴‍☠️" },
  { id: "camion",    emoji: "🚛" },
  { id: "robot",     emoji: "🤖" },
  { id: "dinosaure", emoji: "🦕" },
];
const HEROS_PREMIUM: { id: string; emoji: string }[] = [
  { id: "sorcier",   emoji: "🧙" },
  { id: "sirene",    emoji: "🧜" },
  { id: "licorne",   emoji: "🦄" },
  { id: "superhero", emoji: "🦸" },
];
const LIEUX_FREE: { id: string; emoji: string }[] = [
  { id: "foret",     emoji: "🌳" },
  { id: "chateau",   emoji: "🏰" },
  { id: "ocean",     emoji: "🌊" },
  { id: "espace",    emoji: "🚀" },
  { id: "montagne",  emoji: "🏔️" },
  { id: "village",   emoji: "🏡" },
];
const LIEUX_PREMIUM: { id: string; emoji: string }[] = [
  { id: "desert",          emoji: "🏜️" },
  { id: "ile",             emoji: "🏝️" },
  { id: "volcan",          emoji: "🌋" },
  { id: "foret_hivernale", emoji: "❄️" },
  { id: "cirque",          emoji: "🎪" },
  { id: "cite_marine",     emoji: "🐠" },
];
const AGES = [
  { id: "3-4",  emoji: "🍼" },
  { id: "5-6",  emoji: "🧸" },
  { id: "7-8",  emoji: "📚" },
  { id: "9-10", emoji: "🔭" },
];
const DUREES = [
  { id: "court", label: "Court",  sub: "3 min",  icon: "moon-outline"         as const, minutes: 3  },
  { id: "moyen", label: "Moyen",  sub: "5 min",  icon: "partly-sunny-outline" as const, minutes: 5  },
  { id: "long",  label: "Long",   sub: "10 min", icon: "sunny-outline"        as const, minutes: 10 },
];
const FAMILLES = [
  { id: "protection",   key: "familyProtection"  as const, emoji: "🛡️", famille: "PROTECTION",  description: "Un personnage défend, protège ou sauve quelqu'un.", premium: false },
  { id: "lecon",        key: "familyLecon"        as const, emoji: "🌟", famille: "LEÇON",        description: "Un personnage fait une erreur, puis comprend et change.", premium: false },
  { id: "emancipation", key: "familyEmancipation" as const, emoji: "🌱", famille: "ÉMANCIPATION", description: "Un personnage surmonte une blessure ou accomplit quelque chose.", premium: true },
  { id: "contestation", key: "familyContestation" as const, emoji: "⚡", famille: "CONTESTATION", description: "Un personnage refuse les règles ou veut changer le monde.", premium: true },
];

const FREE_LIMIT = 3;

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export default function GenerateScreen() {
  const { profile, childProfiles, addStory, incrementStoryCount } = useStore();
  const t = useT(profile?.language);
  const router = useRouter();
  const { isTablet, contentWidth } = useTablet();

  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [hero,    setHero]    = useState<string | null>(null);
  const [lieu,    setLieu]    = useState<string | null>(null);
  const [age,     setAge]     = useState<string | null>(null);
  const [duree,   setDuree]   = useState("moyen");
  const [famille, setFamille] = useState("protection");
  const [prenom,  setPrenom]  = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [showPaywall,  setShowPaywall]  = useState(false);

  const isPremium   = profile?.is_premium ?? false;
  const storiesLeft = Math.max(0, FREE_LIMIT - (profile?.stories_generated_this_month ?? 0));
  const HEROS = isPremium ? [...HEROS_FREE, ...HEROS_PREMIUM] : HEROS_FREE;
  const LIEUX = isPremium ? [...LIEUX_FREE, ...LIEUX_PREMIUM] : LIEUX_FREE;

  // What's missing for the generate button hint
  const hint = !age ? "Choisis un âge pour continuer"
    : !hero ? "Choisis un héros pour continuer"
    : !lieu ? "Choisis un lieu pour continuer"
    : null;
  const canGenerate = !hint;

  const handleSelectChild = (childId: string) => {
    if (selectedChild === childId) { setSelectedChild(null); setPrenom(""); setAge(null); return; }
    const child = childProfiles.find((c) => c.id === childId);
    if (child) {
      setSelectedChild(childId);
      setPrenom(child.name);
      setAge(child.age);
      if (child.favorite_heroes?.length) setHero(pick(child.favorite_heroes));
      if (child.favorite_places?.length) setLieu(pick(child.favorite_places));
    }
  };

  const handleSurprise = () => {
    setAge(pick(AGES).id);
    setHero(pick(HEROS).id);
    setLieu(pick(LIEUX).id);
    setFamille(pick(isPremium ? FAMILLES : FAMILLES.filter(f => !f.premium)).id);
    setDuree(isPremium ? pick(DUREES).id : "moyen");
  };

  const handleGenerate = async () => {
    if (!hero || !lieu || !age) { Alert.alert(t.incomplete, t.incompleteMsg); return; }
    if (!isPremium && (profile?.stories_generated_this_month ?? 0) >= FREE_LIMIT) { setShowPaywall(true); return; }
    const familleObj = FAMILLES.find((f) => f.id === famille)!;
    if (!isPremium && familleObj.premium) { setShowPaywall(true); return; }
    if (!isPremium && age !== "5-6") { setShowPaywall(true); return; }

    setLoading(true);
    try {
      const heroObj  = HEROS.find((h) => h.id === hero)!;
      const lieuObj  = LIEUX.find((l) => l.id === lieu)!;
      const dureeObj = DUREES.find((d) => d.id === duree)!;
      const heroLabel = (t.heroLabels as Record<string, string>)[heroObj.id];
      const lieuLabel = (t.placeLabels as Record<string, string>)[lieuObj.id];

      const result = await generateStory({
        age_target: age, theme: `${heroLabel} dans ${lieuLabel}`,
        family: familleObj.famille, family_description: familleObj.description,
        duration_minutes: dureeObj.minutes, child_name: prenom.trim() || undefined,
        lieu: lieuLabel, language: profile?.language || "fr",
      });
      incrementStoryCount();

      let saved: any = null;
      if (isPremium && profile) {
        const { data } = await supabase.from("stories").insert({
          user_id: profile.id, title: result.title, content: result.content,
          family: familleObj.famille, subtype: "", age_target: age,
          theme: `${heroLabel} - ${lieuLabel}`, duration_minutes: dureeObj.minutes,
          child_name: prenom.trim() || null,
        }).select().single();
        if (data) { saved = data; addStory(data); }
        await supabase.from("profiles").update({ stories_generated_this_month: (profile.stories_generated_this_month ?? 0) + 1 }).eq("id", profile.id);
      }
      router.push({ pathname: "/story/[id]", params: { id: saved?.id ?? "temp", title: result.title, content: result.content, share_token: saved?.share_token ?? "" } });
    } catch (e: any) {
      Alert.alert("Erreur", e.message || t.errorGenerate);
    } finally {
      setLoading(false);
    }
  };

  if (showPaywall) return <PaywallBanner onClose={() => setShowPaywall(false)} />;
  if (loading)     return <GeneratingScreen language={profile?.language} />;

  return (
    <LinearGradient colors={GRAD.bg} style={s.flex}>
      <SafeAreaView style={s.flex} edges={['top']}>

        <ScrollView
          style={s.flex}
          contentContainerStyle={[s.scroll, isTablet && s.scrollTablet]}
          showsVerticalScrollIndicator={false}
        >
          <View style={isTablet ? { maxWidth: contentWidth, alignSelf: "center", width: "100%" } : undefined}>

            {/* ── Header ─────────────────────────────────── */}
            <View style={s.header}>
              <Text style={s.moon}>🌙</Text>
              <Text style={s.h1}>{t.appName}</Text>
              <Text style={s.sub}>{t.appSub}</Text>
              {!isPremium && (
                <View style={s.freeBadge}>
                  <Ionicons name="star-outline" size={12} color="#a78bfa" style={{ marginRight: 5 }} />
                  <Text style={s.freeTxt}>{t.freeLimit(storiesLeft)}</Text>
                </View>
              )}
            </View>

            {/* ── Enfants ────────────────────────────────── */}
            {isPremium && childProfiles.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionLabel}>🧒 {t.forChild}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 8, paddingBottom: 4 }}>
                    {childProfiles.map((child) => (
                      <TouchableOpacity key={child.id} onPress={() => handleSelectChild(child.id)}
                        style={[s.childChip, selectedChild === child.id && s.childChipOn]}>
                        <Text style={s.childChipEmoji}>🧒</Text>
                        <Text style={[s.childChipTxt, selectedChild === child.id && { color: "#a78bfa", fontFamily: F.bold }]}>
                          {child.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* ── Âge ────────────────────────────────────── */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>🎂 {t.childAge}</Text>
              <View style={s.row4}>
                {AGES.map((a) => {
                  const locked  = !isPremium && a.id !== "5-6";
                  const active  = age === a.id;
                  return (
                    <TouchableOpacity key={a.id}
                      style={[s.ageChip, active && s.ageChipOn, locked && s.locked]}
                      onPress={() => locked ? setShowPaywall(true) : setAge(a.id)}>
                      <Text style={s.ageEmoji}>{a.emoji}</Text>
                      <Text style={[s.ageNum, active && { color: C.lavender }]}>{a.id}</Text>
                      <Text style={[s.ageAns, active && { color: "rgba(196,181,253,0.6)" }]}>{t.ageUnit}</Text>
                      {locked && <View style={s.lockBadge}><Text style={{ fontSize: 9 }}>🔒</Text></View>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── Héros ──────────────────────────────────── */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>
                👑 {t.chooseHero}
                {isPremium && <Text style={s.premiumTag}> {t.premiumMore(4)}</Text>}
              </Text>
              <View style={s.grid3}>
                {HEROS.map((h) => {
                  const active = hero === h.id;
                  return (
                    <TouchableOpacity key={h.id} style={[s.heroChip, active && s.heroChipOn]} onPress={() => setHero(h.id)}>
                      <Text style={[s.chipEmoji, active && s.chipEmojiOn]}>{h.emoji}</Text>
                      <Text style={[s.chipLbl, active && { color: C.lavender, fontFamily: F.bold }]}>
                        {(t.heroLabels as Record<string, string>)[h.id]}
                      </Text>
                      {active && <View style={s.glowBar} />}
                    </TouchableOpacity>
                  );
                })}
                {!isPremium && (
                  <TouchableOpacity style={[s.heroChip, s.locked]} onPress={() => setShowPaywall(true)}>
                    <Text style={s.chipEmoji}>🔒</Text>
                    <Text style={s.chipLbl}>{t.premiumMore(4)}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* ── Lieu ───────────────────────────────────── */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>
                🗺️ {t.choosePlace}
                {isPremium && <Text style={s.premiumTag}> {t.premiumMore(6)}</Text>}
              </Text>
              <View style={s.grid3}>
                {LIEUX.map((l) => {
                  const active = lieu === l.id;
                  return (
                    <TouchableOpacity key={l.id} style={[s.lieuChip, active && s.lieuChipOn]} onPress={() => setLieu(l.id)}>
                      <Text style={[s.chipEmoji, active && s.chipEmojiOn]}>{l.emoji}</Text>
                      <Text style={[s.chipLbl, active && { color: "#93c5fd", fontFamily: F.bold }]}>
                        {(t.placeLabels as Record<string, string>)[l.id]}
                      </Text>
                      {active && <View style={s.glowBarBlue} />}
                    </TouchableOpacity>
                  );
                })}
                {!isPremium && (
                  <TouchableOpacity style={[s.lieuChip, s.locked]} onPress={() => setShowPaywall(true)}>
                    <Text style={s.chipEmoji}>🔒</Text>
                    <Text style={s.chipLbl}>{t.premiumMore(6)}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* ── Options avancées ───────────────────────── */}
            <TouchableOpacity onPress={() => setShowAdvanced(v => !v)} style={s.advancedToggle}>
              <Ionicons name={showAdvanced ? "chevron-up" : "chevron-down"} size={14} color={C.white30} />
              <Text style={s.advancedToggleTxt}>Options avancées</Text>
            </TouchableOpacity>

            {showAdvanced && (
              <View style={s.advancedBlock}>
                {/* Prénom */}
                <Text style={s.sectionLabel}>🌟 {t.heroName}</Text>
                <View style={s.inputWrap}>
                  <Ionicons name="person-outline" size={15} color={C.white50} style={{ marginRight: 8 }} />
                  <TextInput style={s.input} placeholder={t.heroNamePlaceholder} placeholderTextColor="#64748b"
                    value={prenom} onChangeText={setPrenom} maxLength={20} />
                </View>

                {/* Famille */}
                <Text style={[s.sectionLabel, { marginTop: 18 }]}>🎭 {t.chooseFamily}</Text>
                <View style={{ gap: 8 }}>
                  {FAMILLES.map((f) => {
                    const locked = !isPremium && f.premium;
                    const active = famille === f.id;
                    return (
                      <TouchableOpacity key={f.id}
                        style={[s.familleCard, active && s.familleCardOn, locked && s.locked]}
                        onPress={() => locked ? setShowPaywall(true) : setFamille(f.id)}>
                        <Text style={s.familleEmoji}>{f.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.familleTitle, active && { color: C.gold, fontFamily: F.bold }]}>{t[f.key]}</Text>
                          <Text style={s.familleDesc} numberOfLines={2}>{f.description}</Text>
                        </View>
                        {locked
                          ? <Text style={{ fontSize: 12 }}>🔒</Text>
                          : active && <Ionicons name="checkmark-circle" size={18} color={C.gold} />
                        }
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Durée */}
                <Text style={[s.sectionLabel, { marginTop: 18 }]}>⏳ {t.chooseDuration}</Text>
                <View style={s.rowDur}>
                  {DUREES.map((d) => {
                    const locked = !isPremium && d.id !== "moyen";
                    const active = duree === d.id;
                    return (
                      <TouchableOpacity key={d.id}
                        style={[s.durCard, active && s.durCardOn, locked && s.locked]}
                        onPress={() => locked ? setShowPaywall(true) : setDuree(d.id)}>
                        <Ionicons name={d.icon} size={20} color={active ? "#93c5fd" : C.white50} />
                        <Text style={[s.durLabel, active && { color: "#93c5fd", fontFamily: F.bold }]}>{d.label}</Text>
                        <Text style={[s.durSub, active && { color: "rgba(147,197,253,0.7)" }]}>{d.sub}</Text>
                        {locked && <Text style={{ fontSize: 9, color: C.white30, marginTop: 2 }}>🔒</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Espace pour le bouton flottant */}
            <View style={{ height: 20 }} />
          </View>
        </ScrollView>

        {/* ── Barre flottante ────────────────────────── */}
        <View style={s.floatingBar}>
          {hint && <Text style={s.hint}>{hint}</Text>}
          <View style={s.floatingRow}>
            <TouchableOpacity onPress={handleSurprise} style={s.surpriseBtn}>
              <Text style={s.surpriseTxt}>✨ Surprise !</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleGenerate}
              disabled={!canGenerate}
              style={[s.generateBtn, !canGenerate && s.generateBtnDisabled]}
            >
              <LinearGradient
                colors={canGenerate ? GRAD.btn : ["#2d2d4e", "#2d2d4e"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.generateGradient}
              >
                <Text style={[s.generateTxt, !canGenerate && { color: C.white30 }]}>
                  {t.generateBtn}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  scrollTablet: { paddingHorizontal: 24 },

  // Header
  header: { alignItems: "center", marginBottom: 24, marginTop: 8 },
  moon: { fontSize: 48, marginBottom: 4 },
  h1: { fontSize: 30, fontFamily: F.title, color: C.gold },
  sub: { color: C.lavender, fontSize: 14, marginTop: 4, fontFamily: F.semi },
  freeBadge: { marginTop: 10, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(124,58,237,0.2)", borderWidth: 1, borderColor: C.violetBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6 },
  freeTxt: { color: C.lavender, fontSize: 12 },

  // Sections
  section: { marginBottom: 22 },
  sectionLabel: { color: C.white70, fontFamily: F.bold, fontSize: 13, marginBottom: 10 },
  premiumTag: { color: "#a78bfa", fontSize: 11, fontFamily: F.semi },

  // Âge
  row4: { flexDirection: "row", gap: 6 },
  ageChip: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.12)", position: "relative" },
  ageChipOn: { backgroundColor: "rgba(139,92,246,0.2)", borderColor: C.purple },
  ageEmoji: { fontSize: 22, marginBottom: 4 },
  ageNum: { color: C.white70, fontFamily: F.bold, fontSize: 13 },
  ageAns: { color: C.white30, fontSize: 10, marginTop: 1 },
  lockBadge: { position: "absolute", top: 4, right: 4 },

  // Grilles héros / lieux
  grid3: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  heroChip: { width: "30%", flexGrow: 1, alignItems: "center", paddingVertical: 12, borderRadius: 14, backgroundColor: "rgba(139,92,246,0.07)", borderWidth: 1.5, borderColor: "rgba(139,92,246,0.2)", position: "relative", overflow: "hidden" },
  heroChipOn: { backgroundColor: "rgba(139,92,246,0.22)", borderColor: C.purple },
  lieuChip: { width: "30%", flexGrow: 1, alignItems: "center", paddingVertical: 12, borderRadius: 14, backgroundColor: "rgba(99,102,241,0.07)", borderWidth: 1.5, borderColor: "rgba(99,102,241,0.2)", position: "relative", overflow: "hidden" },
  lieuChipOn: { backgroundColor: "rgba(99,102,241,0.22)", borderColor: "#6366f1" },
  chipEmoji: { fontSize: 30, marginBottom: 5 },
  chipEmojiOn: { fontSize: 34 },
  chipLbl: { color: C.white70, fontSize: 11, fontFamily: F.semi, textAlign: "center" },
  locked: { opacity: 0.35 },
  glowBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: C.purple, borderRadius: 2 },
  glowBarBlue: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: "#6366f1", borderRadius: 2 },

  // Options avancées
  advancedToggle: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, marginBottom: 4 },
  advancedToggleTxt: { color: C.white30, fontSize: 12, fontFamily: F.semi },
  advancedBlock: { marginBottom: 8 },

  // Input prénom
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.15)", paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 13, color: "white", fontSize: 15 },

  // Famille
  familleCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)" },
  familleCardOn: { backgroundColor: "rgba(139,92,246,0.15)", borderColor: C.purple },
  familleEmoji: { fontSize: 28, width: 36, textAlign: "center" },
  familleTitle: { color: C.white92, fontFamily: F.semi, fontSize: 14, marginBottom: 2 },
  familleDesc: { color: C.white30, fontSize: 11, lineHeight: 16 },

  // Durée
  rowDur: { flexDirection: "row", gap: 8 },
  durCard: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 14, backgroundColor: "rgba(99,102,241,0.07)", borderWidth: 1.5, borderColor: "rgba(99,102,241,0.18)", gap: 3 },
  durCardOn: { backgroundColor: "rgba(99,102,241,0.2)", borderColor: "#6366f1" },
  durLabel: { color: C.white70, fontFamily: F.semi, fontSize: 12 },
  durSub: { color: C.white30, fontSize: 10 },

  // Barre flottante
  floatingBar: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: C.separator, backgroundColor: "rgba(15,12,41,0.95)" },
  hint: { color: C.white30, fontFamily: F.semi, fontSize: 12, textAlign: "center", marginBottom: 8 },
  floatingRow: { flexDirection: "row", gap: 10 },
  surpriseBtn: { paddingHorizontal: 16, paddingVertical: 15, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  surpriseTxt: { color: C.white70, fontFamily: F.bold, fontSize: 14 },
  generateBtn: { flex: 1, borderRadius: 14, overflow: "hidden" },
  generateBtnDisabled: { opacity: 0.5 },
  generateGradient: { paddingVertical: 15, alignItems: "center", justifyContent: "center" },
  generateTxt: { color: "white", fontFamily: F.title, fontSize: 15 },

  // Enfants
  childChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.12)" },
  childChipOn: { backgroundColor: C.violet, borderColor: C.purple },
  childChipEmoji: { fontSize: 16 },
  childChipTxt: { color: C.white70, fontFamily: F.semi, fontSize: 13 },
});
