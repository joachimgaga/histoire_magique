import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HEROS = [
  { id: "princesse", label: "Princesse", emoji: "👸" },
  { id: "dragon", label: "Dragon", emoji: "🐉" },
  { id: "lapin", label: "Lapin", emoji: "🐰" },
  { id: "chevalier", label: "Chevalier", emoji: "⚔️" },
  { id: "fee", label: "Fée", emoji: "🧚" },
  { id: "pirate", label: "Pirate", emoji: "🏴‍☠️" },
];

const LIEUX = [
  { id: "foret", label: "Forêt Enchantée", emoji: "🌳" },
  { id: "chateau", label: "Château Magique", emoji: "🏰" },
  { id: "ocean", label: "Fond de l'Océan", emoji: "🌊" },
  { id: "espace", label: "Galaxie Lointaine", emoji: "🚀" },
  { id: "montagne", label: "Montagnes de Glace", emoji: "🏔️" },
  { id: "village", label: "Village Féerique", emoji: "🏡" },
];

const DUREES = [
  { id: "court", label: "Courte", sublabel: "~2 min", mots: 150 },
  { id: "moyen", label: "Moyenne", sublabel: "~5 min", mots: 400 },
  { id: "long", label: "Longue", sublabel: "~10 min", mots: 800 },
];

const AMBIANCES = [
  { id: "aventure", label: "Aventure", emoji: "⚡" },
  { id: "calme", label: "Douce & Calme", emoji: "🌙" },
  { id: "drole", label: "Rigolote", emoji: "😄" },
  { id: "mystere", label: "Mystère", emoji: "🔮" },
];

const API_KEY_STORAGE = "@histoires_magiques_api_key";

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [hero, setHero] = useState(null);
  const [lieu, setLieu] = useState(null);
  const [duree, setDuree] = useState("moyen");
  const [ambiance, setAmbiance] = useState("aventure");
  const [prenom, setPrenom] = useState("");
  const [step, setStep] = useState("config");
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(API_KEY_STORAGE).then((stored) => {
      if (stored) {
        setApiKey(stored);
        setApiKeySaved(true);
      }
    });
  }, []);

  const saveKey = async () => {
    if (apiKey.trim().startsWith("sk-ant-")) {
      await AsyncStorage.setItem(API_KEY_STORAGE, apiKey.trim());
      setApiKeySaved(true);
      setError("");
    } else {
      setError("Clé invalide — elle doit commencer par sk-ant-");
    }
  };

  const editKey = async () => {
    await AsyncStorage.removeItem(API_KEY_STORAGE);
    setApiKeySaved(false);
  };

  const generate = async () => {
    if (!hero || !lieu || !apiKeySaved) return;
    setStep("loading");
    setError("");

    const h = HEROS.find((x) => x.id === hero);
    const l = LIEUX.find((x) => x.id === lieu);
    const d = DUREES.find((x) => x.id === duree);
    const a = AMBIANCES.find((x) => x.id === ambiance);
    const name = prenom.trim() ? `Le héros s'appelle ${prenom.trim()}.` : "";

    const userPrompt = `Tu es un conteur d'histoires pour enfants de 3 à 8 ans. Écris une histoire ${a.label.toLowerCase()} avec comme héros : ${h.label} ${h.emoji}. ${name} L'histoire se déroule dans : ${l.label} ${l.emoji}. L'histoire doit faire environ ${d.mots} mots. Commence par écrire le titre sur la première ligne au format : TITRE: [le titre]. Puis écris l'histoire en paragraphes séparés par une ligne vide. Utilise un langage simple et poétique adapté aux enfants. Termine par une belle morale ou fin apaisante.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system:
            "Tu es un conteur bienveillant pour enfants de 3 à 8 ans. Règles strictes à respecter : 1) Jamais de mort, violence, sang ou blessures graves. 2) Jamais de gros mots ou langage vulgaire. 3) Jamais de peur intense ou de cauchemars. 4) Jamais de contenu triste sans résolution positive. 5) Toujours une fin heureuse ou apaisante. 6) Personnages toujours bienveillants ou qui apprennent à l'être. 7) Langage simple, doux et poétique adapté aux jeunes enfants.",
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.error?.message || `Erreur ${res.status}`);

      const text = json.content?.[0]?.text || "";
      const lines = text.split("\n");
      if (lines[0].trim().startsWith("TITRE:")) {
        setTitle(lines[0].replace("TITRE:", "").trim());
        setStory(lines.slice(1).join("\n").trim());
      } else {
        setStory(text.trim());
      }
      setStep("story");
    } catch (e) {
      setError(e.message || "Erreur inconnue");
      setStep("config");
    }
  };

  const reset = () => {
    setStep("config");
    setStory("");
    setTitle("");
    setError("");
  };

  // ── Loading ──────────────────────────────────────────────
  if (step === "loading") {
    return (
      <LinearGradient colors={["#0f0c29", "#1a1a4e", "#0d1b3e"]} style={styles.flex}>
        <SafeAreaView style={styles.flex}>
          <StatusBar barStyle="light-content" />
          <View style={styles.center}>
            <Text style={styles.spinEmoji}>🌙</Text>
            <Text style={styles.loadTxt}>La magie s'opère…</Text>
            <ActivityIndicator color="#c4b5fd" size="large" style={{ marginTop: 16 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Story ────────────────────────────────────────────────
  if (step === "story") {
    const heroObj = HEROS.find((x) => x.id === hero);
    return (
      <LinearGradient colors={["#0f0c29", "#1a1a4e", "#0d1b3e"]} style={styles.flex}>
        <SafeAreaView style={styles.flex}>
          <StatusBar barStyle="light-content" />
          <View style={styles.storyCard}>
            <View style={styles.storyTop}>
              <Text style={{ fontSize: 36 }}>{heroObj?.emoji}</Text>
              {title ? <Text style={styles.storyTitle}>{title}</Text> : null}
            </View>
            <ScrollView style={styles.storyBody} contentContainerStyle={{ paddingBottom: 16 }}>
              {story
                .split("\n\n")
                .filter((p) => p.trim())
                .map((p, i) => (
                  <Text key={i} style={styles.para}>
                    {p.trim()}
                  </Text>
                ))}
            </ScrollView>
            <View style={styles.storyFooter}>
              <Text style={styles.fin}>✨ Fin ✨</Text>
              <TouchableOpacity style={styles.btn} onPress={reset}>
                <Text style={styles.btnTxt}>📖 Nouvelle histoire</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Config ───────────────────────────────────────────────
  const canGenerate = hero && lieu && apiKeySaved;

  return (
    <LinearGradient colors={["#0f0c29", "#1a1a4e", "#0d1b3e"]} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.moon}>🌙</Text>
              <Text style={styles.h1}>Histoires Magiques</Text>
              <Text style={styles.sub}>Une histoire rien que pour toi ✨</Text>
            </View>

            <View style={styles.card}>
              {/* Error */}
              {error ? <View style={styles.errorBox}><Text style={styles.errorTxt}>{error}</Text></View> : null}

              {/* API Key */}
              <View style={[styles.apiBox, apiKeySaved && styles.apiBoxSaved]}>
                <Text style={styles.label}>🔑 Clé API Anthropic</Text>
                {apiKeySaved ? (
                  <View style={styles.row}>
                    <Text style={styles.keyOk}>✓ Clé configurée</Text>
                    <TouchableOpacity style={styles.smallBtn} onPress={editKey}>
                      <Text style={styles.smallBtnTxt}>Modifier</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, styles.inputFlex]}
                      placeholder="sk-ant-api03-..."
                      placeholderTextColor="#64748b"
                      secureTextEntry
                      value={apiKey}
                      onChangeText={setApiKey}
                      onSubmitEditing={saveKey}
                      returnKeyType="done"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity style={styles.smallBtn} onPress={saveKey}>
                      <Text style={styles.smallBtnTxt}>OK</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <Text style={styles.apiHint}>
                  Obtiens ta clé sur{" "}
                  <Text
                    style={styles.link}
                    onPress={() => Linking.openURL("https://console.anthropic.com")}
                  >
                    console.anthropic.com
                  </Text>
                </Text>
              </View>

              {/* Prénom */}
              <Text style={styles.label}>🌟 Prénom du héros (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Emma, Lucas, Zoe…"
                placeholderTextColor="#64748b"
                value={prenom}
                onChangeText={setPrenom}
                maxLength={20}
              />

              {/* Héros */}
              <Text style={styles.label}>👑 Choisis ton héros</Text>
              <View style={styles.grid3}>
                {HEROS.map((h) => (
                  <TouchableOpacity
                    key={h.id}
                    style={[styles.chip, hero === h.id && styles.chipOn]}
                    onPress={() => setHero(h.id)}
                  >
                    <Text style={{ fontSize: 26 }}>{h.emoji}</Text>
                    <Text style={styles.chipLbl}>{h.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Lieu */}
              <Text style={styles.label}>🗺️ Choisis le lieu</Text>
              <View style={styles.grid3}>
                {LIEUX.map((l) => (
                  <TouchableOpacity
                    key={l.id}
                    style={[styles.chip, lieu === l.id && styles.chipOn]}
                    onPress={() => setLieu(l.id)}
                  >
                    <Text style={{ fontSize: 26 }}>{l.emoji}</Text>
                    <Text style={styles.chipLbl}>{l.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Ambiance */}
              <Text style={styles.label}>🎭 Ambiance</Text>
              <View style={styles.grid4}>
                {AMBIANCES.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.chip, ambiance === a.id && styles.chipOn]}
                    onPress={() => setAmbiance(a.id)}
                  >
                    <Text style={{ fontSize: 22 }}>{a.emoji}</Text>
                    <Text style={[styles.chipLbl, { fontSize: 10 }]}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Durée */}
              <Text style={styles.label}>⏳ Durée</Text>
              <View style={styles.row}>
                {DUREES.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.dBtn, duree === d.id && styles.dBtnOn]}
                    onPress={() => setDuree(d.id)}
                  >
                    <Text style={styles.dBtnTxt}>{d.label}</Text>
                    <Text style={styles.dBtnSub}>{d.sublabel}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Generate */}
              <TouchableOpacity
                disabled={!canGenerate}
                onPress={generate}
                style={{ opacity: canGenerate ? 1 : 0.4, marginTop: 22 }}
              >
                <LinearGradient
                  colors={["#7c3aed", "#2563eb"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.genBtn}
                >
                  <Text style={styles.genBtnTxt}>✨ Créer mon histoire magique</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  spinEmoji: { fontSize: 72 },
  loadTxt: { color: "#c4b5fd", fontSize: 18, fontWeight: "600", marginTop: 24 },

  // Header
  header: { alignItems: "center", marginBottom: 24, marginTop: 16 },
  moon: { fontSize: 48, marginBottom: 8 },
  h1: { fontSize: 32, color: "#fde68a", fontWeight: "800" },
  sub: { color: "#c4b5fd", fontSize: 15, fontWeight: "600", marginTop: 6 },

  // Card
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  errorBox: {
    backgroundColor: "rgba(239,68,68,0.2)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.4)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorTxt: { color: "#fca5a5", fontSize: 13 },

  // API box
  apiBox: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
  },
  apiBoxSaved: { borderColor: "#86efac" },
  apiHint: { color: "#64748b", fontSize: 11, marginTop: 8 },
  link: { color: "#a78bfa" },
  keyOk: { color: "#86efac", fontWeight: "700", flex: 1 },

  // Label
  label: {
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 10,
    marginTop: 18,
  },

  // Input
  input: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    color: "white",
    fontSize: 14,
  },
  inputFlex: { flex: 1 },

  // Buttons
  smallBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "rgba(167,139,250,0.3)",
    borderWidth: 1,
    borderColor: "#a78bfa",
    marginLeft: 8,
  },
  smallBtnTxt: { color: "white", fontSize: 13, fontWeight: "700" },

  // Row
  row: { flexDirection: "row", alignItems: "center", gap: 8 },

  // Grids
  grid3: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  grid4: { flexDirection: "row", gap: 8 },

  // Chips
  chip: {
    flexBasis: "30%",
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 5,
  },
  chipOn: {
    backgroundColor: "rgba(167,139,250,0.3)",
    borderColor: "#a78bfa",
  },
  chipLbl: { color: "#e2e8f0", fontSize: 11, fontWeight: "700", textAlign: "center" },

  // Duration buttons
  dBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 3,
  },
  dBtnOn: {
    backgroundColor: "rgba(99,179,237,0.25)",
    borderColor: "#63b3ed",
  },
  dBtnTxt: { color: "#e2e8f0", fontWeight: "700", fontSize: 13 },
  dBtnSub: { color: "#94a3b8", fontSize: 11 },

  // Generate button
  genBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  genBtnTxt: { color: "white", fontSize: 16, fontWeight: "700" },

  // Story
  storyCard: {
    flex: 1,
    margin: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  storyTop: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    gap: 12,
  },
  storyTitle: {
    color: "#fde68a",
    fontSize: 20,
    fontWeight: "800",
    flex: 1,
  },
  storyBody: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  para: { color: "#e2e8f0", fontSize: 16, lineHeight: 28, marginBottom: 14 },
  storyFooter: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  fin: { color: "#fde68a", fontSize: 20, fontWeight: "800", marginBottom: 14 },
  btn: {
    paddingVertical: 11,
    paddingHorizontal: 26,
    borderRadius: 12,
    backgroundColor: "#7c3aed",
  },
  btnTxt: { color: "white", fontSize: 15, fontWeight: "700" },
});
