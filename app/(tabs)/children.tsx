import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, FlatList,
  TextInput, Alert, StyleSheet, Modal, ActivityIndicator, ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { useStore, ChildProfile } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useTablet } from "@/lib/tablet";
import { C, GRAD, F } from "@/lib/theme";
import PaywallBanner from "@/components/PaywallBanner";

const AGES = ["3-4", "5-6", "7-8", "9-10"];

const HEROS = [
  { id: "princesse", emoji: "👸" }, { id: "dragon", emoji: "🐉" },
  { id: "lapin", emoji: "🐰" }, { id: "chevalier", emoji: "⚔️" },
  { id: "fee", emoji: "🧚" }, { id: "pirate", emoji: "🏴‍☠️" },
  { id: "camion", emoji: "🚛" }, { id: "robot", emoji: "🤖" },
  { id: "sorcier", emoji: "🧙" },
  { id: "sirene", emoji: "🧜" }, { id: "licorne", emoji: "🦄" },
  { id: "dinosaure", emoji: "🦕" }, { id: "superhero", emoji: "🦸" },
];

const LIEUX = [
  { id: "foret", emoji: "🌳" }, { id: "chateau", emoji: "🏰" },
  { id: "ocean", emoji: "🌊" }, { id: "espace", emoji: "🚀" },
  { id: "montagne", emoji: "🏔️" }, { id: "village", emoji: "🏡" },
  { id: "desert", emoji: "🏜️" }, { id: "ile", emoji: "🏝️" },
  { id: "volcan", emoji: "🌋" }, { id: "foret_hivernale", emoji: "❄️" },
  { id: "cirque", emoji: "🎪" }, { id: "cite_marine", emoji: "🐠" },
];

export default function ChildrenScreen() {
  const { profile, childProfiles, setChildProfiles, addChildProfile, updateChildProfile, removeChildProfile } = useStore();
  const t = useT(profile?.language);
  const { isTablet } = useTablet();
  const insets = useSafeAreaInsets();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("5-6");
  const [favoriteHeroes, setFavoriteHeroes] = useState<string[]>([]);
  const [favoritePlaces, setFavoritePlaces] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const isPremium = profile?.is_premium ?? false;

  useEffect(() => {
    if (!isPremium || !profile) return;
    supabase.from("child_profiles").select("*").eq("user_id", profile.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setChildProfiles(data); });
  }, [isPremium, profile]);

  const openAdd = () => {
    setEditingChild(null);
    setName(""); setAge("5-6"); setFavoriteHeroes([]); setFavoritePlaces([]);
    setShowModal(true);
  };

  const openEdit = (child: ChildProfile) => {
    setEditingChild(child);
    setName(child.name);
    setAge(child.age);
    setFavoriteHeroes(child.favorite_heroes ?? []);
    setFavoritePlaces(child.favorite_places ?? []);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Erreur", t.firstName); return; }
    setLoading(true);

    const payload = {
      name: name.trim(),
      age,
      favorite_heroes: favoriteHeroes.length > 0 ? favoriteHeroes : null,
      favorite_places: favoritePlaces.length > 0 ? favoritePlaces : null,
    };

    try {
      if (editingChild) {
        const { data, error } = await supabase.from("child_profiles")
          .update(payload).eq("id", editingChild.id).select().single();
        if (error) { Alert.alert("Erreur", error.message); return; }
        if (data) updateChildProfile(data);
      } else {
        const { data, error } = await supabase.from("child_profiles")
          .insert({ user_id: profile!.id, ...payload }).select().single();
        if (error) { Alert.alert("Erreur", error.message); return; }
        if (data) addChildProfile(data);
      }
      setShowModal(false);
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, childName: string) => {
    Alert.alert(t.deleteChild, t.deleteChildMsg(childName), [
      { text: t.cancel, style: "cancel" },
      {
        text: t.deleteChild, style: "destructive", onPress: async () => {
          await supabase.from("child_profiles").delete().eq("id", id);
          removeChildProfile(id);
        }
      },
    ]);
  };

  if (showPaywall) return <PaywallBanner onClose={() => setShowPaywall(false)} />;

  if (!isPremium) {
    return (
      <LinearGradient colors={["#0f0c29", "#1a1a4e", "#0d1b3e"]} style={s.flex}>
        <SafeAreaView style={[s.flex, s.center]} edges={['top']}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>👨‍👩‍👧‍👦</Text>
          <Text style={s.title}>{t.premiumChildTitle}</Text>
          <Text style={s.sub}>{t.premiumChildSub}</Text>
          <TouchableOpacity onPress={() => setShowPaywall(true)} style={{ marginTop: 20 }}>
            <LinearGradient colors={["#7c3aed", "#2563eb"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
              <Text style={s.btnTxt}>{t.goPremium}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0f0c29", "#1a1a4e", "#0d1b3e"]} style={s.flex}>
      <SafeAreaView style={s.flex} edges={['top']}>
        <View style={s.header}>
          <Text style={s.title}>{t.myChildren}</Text>
          <Text style={s.headerSub}>{childProfiles.length} profil{childProfiles.length > 1 ? "s" : ""}</Text>
        </View>

        <FlatList
          data={childProfiles}
          keyExtractor={(item) => item.id}
          numColumns={isTablet ? 2 : 1}
          key={isTablet ? "tablet" : "phone"}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          columnWrapperStyle={isTablet ? { gap: 12 } : undefined}
          ListHeaderComponent={
            <TouchableOpacity onPress={openAdd} style={s.addCard}>
              <Text style={s.addCardIcon}>＋</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.addCardTitle}>{t.addChild.replace("+ ", "")} un enfant</Text>
                <Text style={s.addCardSub}>Préférences de héros et de lieu</Text>
              </View>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={[s.center, { marginTop: 40 }]}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>🧒</Text>
              <Text style={{ color: "rgba(255,255,255,0.4)", textAlign: "center" }}>{t.noChildren}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[s.card, isTablet && s.cardTablet]}>
              <View style={s.cardLeft}>
                <Text style={s.childName}>{item.name}</Text>
                <Text style={s.childAge}>{item.age} {t.ageUnit}</Text>
                {((item.favorite_heroes?.length ?? 0) > 0 || (item.favorite_places?.length ?? 0) > 0) && (
                  <Text style={s.childPrefs}>
                    {(item.favorite_heroes ?? []).map(id => HEROS.find(h => h.id === id)?.emoji ?? "").join("")}
                    {(item.favorite_places ?? []).length > 0 ? " " : ""}
                    {(item.favorite_places ?? []).map(id => LIEUX.find(l => l.id === id)?.emoji ?? "").join("")}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => openEdit(item)} style={s.editBtn}>
                <Text style={s.editTxt}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={s.deleteBtn}>
                <Text style={s.deleteTxt}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        />

        <Modal visible={showModal} transparent animationType="slide">
          <View style={s.modalOverlay}>
            <View style={[s.modalCard, { paddingBottom: 24 + insets.bottom }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={s.modalTitle}>
                  {editingChild ? `Modifier ${editingChild.name}` : t.newChildProfile}
                </Text>

                <Text style={s.label}>{t.firstName}</Text>
                <TextInput
                  style={s.input}
                  placeholder={t.firstNamePlaceholder}
                  placeholderTextColor="#64748b"
                  value={name}
                  onChangeText={setName}
                  maxLength={20}
                />

                <Text style={s.label}>{t.age}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
                  {AGES.map((a) => (
                    <TouchableOpacity key={a} onPress={() => setAge(a)} style={[s.ageChip, age === a && s.ageChipOn]}>
                      <Text style={{ color: age === a ? "#a78bfa" : "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "700" }}>
                        {a} {t.ageUnit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={s.label}>👑 Héros favoris <Text style={s.optional}>(optionnel)</Text></Text>
                <View style={s.prefGrid}>
                  {HEROS.map((h) => (
                    <TouchableOpacity key={h.id} onPress={() => setFavoriteHeroes(prev => prev.includes(h.id) ? prev.filter(x => x !== h.id) : [...prev, h.id])}
                      style={[s.prefChip, favoriteHeroes.includes(h.id) && s.prefChipOn]}>
                      <Text style={s.prefEmoji}>{h.emoji}</Text>
                      <Text style={s.prefLabel}>{(t.heroLabels as Record<string, string>)[h.id]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={s.label}>🗺️ Lieux favoris <Text style={s.optional}>(optionnel)</Text></Text>
                <View style={s.prefGrid}>
                  {LIEUX.map((l) => (
                    <TouchableOpacity key={l.id} onPress={() => setFavoritePlaces(prev => prev.includes(l.id) ? prev.filter(x => x !== l.id) : [...prev, l.id])}
                      style={[s.prefChip, favoritePlaces.includes(l.id) && s.prefChipOn]}>
                      <Text style={s.prefEmoji}>{l.emoji}</Text>
                      <Text style={s.prefLabel}>{(t.placeLabels as Record<string, string>)[l.id]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity onPress={handleSave} disabled={loading} style={{ marginTop: 8 }}>
                  <LinearGradient colors={["#7c3aed", "#2563eb"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                    {loading ? <ActivityIndicator color="white" /> : (
                      <Text style={s.btnTxt}>{editingChild ? "Enregistrer les modifications" : t.createProfile}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {editingChild && (
                  <TouchableOpacity onPress={() => { setShowModal(false); handleDelete(editingChild.id, editingChild.name); }}
                    style={{ marginTop: 12, alignItems: "center" }}>
                    <Text style={{ color: "#f87171", fontSize: 13 }}>🗑️ {t.deleteChild}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => setShowModal(false)} style={{ marginTop: 12, alignItems: "center" }}>
                  <Text style={{ color: "rgba(255,255,255,0.4)" }}>{t.cancel}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 24, fontFamily: F.title, color: C.gold },
  headerSub: { color: C.white30, fontSize: 12, marginTop: 2 },
  sub: { color: C.lavender, fontSize: 14, textAlign: "center", marginTop: 8 },
  btn: { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24, alignItems: "center" },
  btnTxt: { color: "white", fontFamily: F.bold, fontSize: 15 },
  addCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.violet, borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: C.violetBorder, marginBottom: 4 },
  addCardIcon: { fontSize: 28, color: "#a78bfa" },
  addCardTitle: { color: "#a78bfa", fontFamily: F.bold, fontSize: 15 },
  addCardSub: { color: C.white30, fontSize: 12, marginTop: 2 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.cardBorder },
  cardTablet: { flex: 1 },
  cardLeft: { flex: 1 },
  childName: { color: C.gold, fontFamily: F.bold, fontSize: 16 },
  childAge: { color: C.white50, fontSize: 13, marginTop: 2 },
  childPrefs: { fontSize: 18, marginTop: 6 },
  editBtn: { padding: 8 },
  editTxt: { fontSize: 18 },
  deleteBtn: { padding: 8 },
  deleteTxt: { fontSize: 20 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#1a1a4e", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: C.cardBorder, maxHeight: "90%" },
  modalTitle: { color: C.gold, fontFamily: F.title, fontSize: 20, marginBottom: 20, textAlign: "center" },
  label: { color: C.white70, fontFamily: F.semi, fontSize: 13, marginBottom: 8, marginTop: 4 },
  optional: { color: C.white30, fontFamily: F.semi },
  input: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, color: "white", borderWidth: 1.5, borderColor: C.cardBorder, marginBottom: 16 },
  ageChip: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 12, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardBorder },
  ageChipOn: { backgroundColor: C.violet, borderColor: C.purple },
  prefGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  prefChip: { width: "22%", flexGrow: 1, alignItems: "center", paddingVertical: 9, borderRadius: 12, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardBorder },
  prefChipOn: { backgroundColor: C.violet, borderColor: C.purple },
  prefEmoji: { fontSize: 22 },
  prefLabel: { color: C.white50, fontSize: 9, marginTop: 3, textAlign: "center" },
});
