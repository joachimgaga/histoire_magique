import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStore } from "@/lib/store";
import { incrementAppearances, Character } from "@/lib/characters";
import { supabase } from "@/lib/supabase";
import { C, GRAD, F } from "@/lib/theme";

const DUREES = [
  { id: "court", label: "Court", sub: "3 min", minutes: 3 },
  { id: "moyen", label: "Moyen", sub: "5 min", minutes: 5 },
  { id: "long", label: "Long", sub: "10 min", minutes: 10 },
];

type AdventureType = "suite" | "nouvelle";

export default function CharacterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, characters } = useStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const character = characters.find((c) => c.id === id);

  const [showAdventureModal, setShowAdventureModal] = useState(false);
  const [adventureType, setAdventureType] = useState<AdventureType>("nouvelle");
  const [duree, setDuree] = useState("moyen");
  const [generating, setGenerating] = useState(false);

  if (!character) {
    return (
      <LinearGradient colors={GRAD.bg} style={s.flex}>
        <SafeAreaView style={[s.flex, s.center]} edges={["top"]}>
          <Text style={s.notFoundEmoji}>😶</Text>
          <Text style={s.notFoundTxt}>Personnage introuvable</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
            <Text style={s.backLink}>← Retour</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const handleNewAdventure = async () => {
    if (!profile) return;

    const dureeObj = DUREES.find((d) => d.id === duree)!;
    const mots =
      dureeObj.minutes === 3
        ? "250 à 300"
        : dureeObj.minutes === 5
        ? "500 à 550"
        : "950 à 1000";

    const characterContext = [
      character.physical_description,
      character.personality_trait,
      character.poetic_detail,
    ]
      .filter(Boolean)
      .join(". ");

    const themePrompt =
      adventureType === "suite"
        ? `Suite d'aventure avec le personnage ${character.name} (${character.emoji}). ${characterContext}`
        : `Nouvelle aventure avec le personnage ${character.name} (${character.emoji}). ${characterContext}`;

    const params = {
      age_target: "5-6",
      theme: themePrompt,
      family: character.origin_family ?? "PROTECTION",
      family_description:
        adventureType === "suite"
          ? "Le héros continue son aventure précédente dans un nouveau chapitre."
          : "Un personnage défend, protège ou sauve quelqu'un.",
      duration_minutes: dureeObj.minutes,
      child_name: character.name,
      language: profile.language ?? "fr",
    };

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-story", {
        body: params,
      });

      if (error) throw new Error(error.message);
      if (!data?.title || !data?.content) throw new Error("Réponse invalide");

      // Increment appearances count
      await incrementAppearances(character.id).catch(() => {});

      let saved: any = null;
      if (profile) {
        const { data: storyData } = await supabase
          .from("stories")
          .insert({
            user_id: profile.id,
            title: data.title,
            content: data.content,
            family: character.origin_family ?? "PROTECTION",
            subtype: "",
            age_target: "5-6",
            theme: `${character.name} - Nouvelle aventure`,
            duration_minutes: dureeObj.minutes,
            child_name: character.name,
          })
          .select()
          .single();
        if (storyData) saved = storyData;
      }

      setShowAdventureModal(false);
      router.push({
        pathname: "/story/[id]",
        params: {
          id: saved?.id ?? "temp",
          title: data.title,
          content: data.content,
          share_token: saved?.share_token ?? "",
        },
      });
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Impossible de générer l'histoire.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <LinearGradient colors={GRAD.bg} style={s.flex}>
      <SafeAreaView style={s.flex} edges={["top"]}>
        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={C.purple} />
          </TouchableOpacity>
          <Text style={s.topTitle} numberOfLines={1}>
            {character.name}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={s.flex}
          contentContainerStyle={s.body}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero emoji */}
          <View style={s.emojiCircle}>
            <Text style={s.emojiLarge}>{character.emoji}</Text>
          </View>

          {/* Name */}
          <Text style={s.name}>{character.name}</Text>

          {/* Appearances */}
          <View style={s.appearancesBadge}>
            <Ionicons name="book-outline" size={13} color={C.lavender} />
            <Text style={s.appearancesTxt}>
              {character.appearances} aventure{character.appearances > 1 ? "s" : ""}
            </Text>
          </View>

          {/* Details sections */}
          {character.physical_description && (
            <DetailSection
              icon="body-outline"
              label="Description physique"
              text={character.physical_description}
            />
          )}
          {character.personality_trait && (
            <DetailSection
              icon="heart-outline"
              label="Trait de caractère"
              text={character.personality_trait}
            />
          )}
          {character.poetic_detail && (
            <DetailSection
              icon="sparkles"
              label="Détail poétique"
              text={character.poetic_detail}
            />
          )}
          {character.origin_family && (
            <DetailSection
              icon="shield-outline"
              label="Famille d'origine"
              text={character.origin_family}
            />
          )}

          {/* Bottom spacer for button */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* New adventure button */}
        <View style={[s.fab, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            onPress={() => setShowAdventureModal(true)}
            style={s.fabBtn}
          >
            <LinearGradient
              colors={GRAD.btn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.fabGradient}
            >
              <Text style={s.fabTxt}>✨ Nouvelle aventure</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* New Adventure Modal */}
        <Modal
          visible={showAdventureModal}
          transparent
          animationType="slide"
          onRequestClose={() => {
            if (!generating) setShowAdventureModal(false);
          }}
        >
          <View style={s.modalOverlay}>
            <View
              style={[
                s.modalSheet,
                { paddingBottom: Math.max(insets.bottom, 20) },
              ]}
            >
              <View style={s.handle} />
              <Text style={s.modalTitle}>
                {character.emoji} Nouvelle aventure
              </Text>
              <Text style={s.modalSubtitle}>
                Que fait {character.name} dans cette nouvelle histoire ?
              </Text>

              {/* Type selector */}
              <Text style={s.modalLabel}>Type d'histoire</Text>
              <View style={s.typeRow}>
                <TouchableOpacity
                  style={[
                    s.typeCard,
                    adventureType === "suite" && s.typeCardOn,
                  ]}
                  onPress={() => setAdventureType("suite")}
                  disabled={generating}
                >
                  <Text style={s.typeEmoji}>📖</Text>
                  <Text
                    style={[
                      s.typeName,
                      adventureType === "suite" && s.typeNameOn,
                    ]}
                  >
                    Suite
                  </Text>
                  <Text style={s.typeSub}>Continuité de l'aventure</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    s.typeCard,
                    adventureType === "nouvelle" && s.typeCardOn,
                  ]}
                  onPress={() => setAdventureType("nouvelle")}
                  disabled={generating}
                >
                  <Text style={s.typeEmoji}>✨</Text>
                  <Text
                    style={[
                      s.typeName,
                      adventureType === "nouvelle" && s.typeNameOn,
                    ]}
                  >
                    Nouvelle histoire
                  </Text>
                  <Text style={s.typeSub}>Nouveau départ</Text>
                </TouchableOpacity>
              </View>

              {/* Duration selector */}
              <Text style={[s.modalLabel, { marginTop: 16 }]}>Durée</Text>
              <View style={s.durRow}>
                {DUREES.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[s.durCard, duree === d.id && s.durCardOn]}
                    onPress={() => setDuree(d.id)}
                    disabled={generating}
                  >
                    <Text
                      style={[
                        s.durLabel,
                        duree === d.id && { color: "#93c5fd", fontFamily: F.bold },
                      ]}
                    >
                      {d.label}
                    </Text>
                    <Text
                      style={[
                        s.durSub,
                        duree === d.id && { color: "rgba(147,197,253,0.7)" },
                      ]}
                    >
                      {d.sub}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Generate button */}
              <TouchableOpacity
                onPress={handleNewAdventure}
                disabled={generating}
                style={[s.generateBtn, { marginTop: 20 }]}
              >
                <LinearGradient
                  colors={GRAD.btn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.generateGradient}
                >
                  {generating ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={s.generateTxt}>
                      ✨ Créer l'histoire
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {!generating && (
                <TouchableOpacity
                  onPress={() => setShowAdventureModal(false)}
                  style={s.cancelBtn}
                >
                  <Text style={s.cancelTxt}>Annuler</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

function DetailSection({
  icon,
  label,
  text,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  text: string;
}) {
  return (
    <View style={ds.section}>
      <View style={ds.labelRow}>
        <Ionicons name={icon} size={14} color={C.lavender} />
        <Text style={ds.label}>{label}</Text>
      </View>
      <Text style={ds.text}>{text}</Text>
    </View>
  );
}

const ds = StyleSheet.create({
  section: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  label: {
    color: C.lavender,
    fontFamily: F.semi,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  text: {
    color: C.white92,
    fontFamily: F.body,
    fontSize: 15,
    lineHeight: 22,
  },
});

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
  },
  backBtn: { padding: 6, marginRight: 8 },
  topTitle: {
    flex: 1,
    color: C.white70,
    fontFamily: F.semi,
    fontSize: 15,
    textAlign: "center",
  },

  // Body
  body: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: "center",
  },

  // Emoji
  emojiCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: C.violet,
    borderWidth: 2,
    borderColor: C.violetBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emojiLarge: { fontSize: 60 },

  // Name
  name: {
    color: C.gold,
    fontFamily: F.title,
    fontSize: 30,
    textAlign: "center",
    marginBottom: 8,
  },

  // Appearances
  appearancesBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 24,
  },
  appearancesTxt: {
    color: C.lavender,
    fontFamily: F.semi,
    fontSize: 12,
  },

  // FAB
  fab: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.separator,
    backgroundColor: "rgba(15,12,41,0.95)",
  },
  fabBtn: { borderRadius: 16, overflow: "hidden" },
  fabGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  fabTxt: { color: "white", fontFamily: F.bold, fontSize: 16 },

  // Not found
  notFoundEmoji: { fontSize: 48, marginBottom: 12 },
  notFoundTxt: { color: C.white50, fontFamily: F.semi, fontSize: 16 },
  backLink: { color: C.purple, fontFamily: F.bold, fontSize: 14 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#1a1a4e",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: C.white30,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: C.gold,
    fontFamily: F.title,
    fontSize: 20,
    textAlign: "center",
    marginBottom: 4,
  },
  modalSubtitle: {
    color: C.white50,
    fontFamily: F.semi,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
  },
  modalLabel: {
    color: C.white70,
    fontFamily: F.bold,
    fontSize: 13,
    marginBottom: 10,
  },

  // Type selector
  typeRow: { flexDirection: "row", gap: 10 },
  typeCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    gap: 4,
  },
  typeCardOn: {
    backgroundColor: C.violet,
    borderColor: C.violetBorder,
  },
  typeEmoji: { fontSize: 26, marginBottom: 2 },
  typeName: {
    color: C.white70,
    fontFamily: F.bold,
    fontSize: 13,
  },
  typeNameOn: { color: C.lavender },
  typeSub: { color: C.white30, fontSize: 10, fontFamily: F.semi, textAlign: "center" },

  // Duration
  durRow: { flexDirection: "row", gap: 8 },
  durCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(99,102,241,0.07)",
    borderWidth: 1.5,
    borderColor: "rgba(99,102,241,0.18)",
    gap: 2,
  },
  durCardOn: {
    backgroundColor: "rgba(99,102,241,0.2)",
    borderColor: "#6366f1",
  },
  durLabel: { color: C.white70, fontFamily: F.semi, fontSize: 12 },
  durSub: { color: C.white30, fontSize: 10 },

  // Generate
  generateBtn: { borderRadius: 16, overflow: "hidden" },
  generateGradient: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  generateTxt: { color: "white", fontFamily: F.bold, fontSize: 15 },

  cancelBtn: { alignItems: "center", paddingVertical: 12 },
  cancelTxt: { color: C.white30, fontFamily: F.semi, fontSize: 14 },
});
