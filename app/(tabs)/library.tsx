import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useTablet } from "@/lib/tablet";
import { C, GRAD, F } from "@/lib/theme";
import PaywallBanner from "@/components/PaywallBanner";

export default function LibraryScreen() {
  const { profile, stories, setStories, removeStory } = useStore();
  const t = useT(profile?.language);
  const router = useRouter();
  const { isTablet } = useTablet();
  const [showPaywall, setShowPaywall] = useState(false);
  const isPremium = profile?.is_premium ?? false;

  useEffect(() => {
    if (!isPremium || !profile) return;
    supabase.from("stories").select("*").eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setStories(data); });
  }, [isPremium, profile]);

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      "Supprimer l'histoire",
      `Supprimer "${title}" définitivement ?`,
      [
        { text: t.cancel, style: "cancel" },
        {
          text: "Supprimer", style: "destructive", onPress: async () => {
            await supabase.from("stories").delete().eq("id", id);
            removeStory(id);
          },
        },
      ]
    );
  };

  if (showPaywall) return <PaywallBanner onClose={() => setShowPaywall(false)} />;

  if (!isPremium) {
    return (
      <LinearGradient colors={GRAD.bg} style={s.flex}>
        <SafeAreaView style={[s.flex, s.center]} edges={['top']}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>📚</Text>
          <Text style={s.title}>{t.premiumLibTitle}</Text>
          <Text style={s.sub}>{t.premiumLibSub}</Text>
          <TouchableOpacity onPress={() => setShowPaywall(true)} style={{ marginTop: 20 }}>
            <LinearGradient colors={GRAD.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
              <Text style={s.btnTxt}>{t.goPremium}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRAD.bg} style={s.flex}>
      <SafeAreaView style={s.flex} edges={['top']}>
        <View style={s.header}>
          <Text style={s.title}>{t.myStories}</Text>
          <Text style={s.headerSub}>{t.storiesSaved(stories.length)}</Text>
        </View>
        <FlatList data={stories} keyExtractor={(item) => item.id}
          numColumns={isTablet ? 2 : 1}
          key={isTablet ? "tablet" : "phone"}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          columnWrapperStyle={isTablet ? { gap: 12 } : undefined}
          ListEmptyComponent={
            <View style={[s.center, { marginTop: 80 }]}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>📖</Text>
              <Text style={{ color: C.white30, textAlign: "center" }}>{t.noStories}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[s.storyCard, isTablet && s.storyCardTablet]}>
              <TouchableOpacity
                style={s.cardMain}
                onPress={() => router.push({ pathname: "/story/[id]", params: { id: item.id, title: item.title, content: item.content, share_token: item.share_token ?? "" } })}
              >
                <Text style={{ fontSize: 28 }}>📖</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.storyTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={s.storySub}>{item.age_target} {t.ageUnit} • {item.family} • {item.duration_minutes} min</Text>
                  <Text style={s.storyDate}>{new Date(item.created_at).toLocaleDateString("fr-FR")}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.title)} style={s.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color="#f87171" />
              </TouchableOpacity>
            </View>
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontFamily: F.title, color: C.gold },
  headerSub: { color: C.lavender, fontSize: 13, marginTop: 2, fontFamily: F.semi },
  sub: { color: C.lavender, fontSize: 14, textAlign: "center", marginTop: 8 },
  btn: { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24, alignItems: "center" },
  btnTxt: { color: "white", fontFamily: F.bold, fontSize: 15 },
  storyCard: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 18, paddingLeft: 16, paddingRight: 8, paddingVertical: 14, borderWidth: 1, borderColor: C.cardBorder },
  storyCardTablet: { flex: 1 },
  cardMain: { flex: 1, flexDirection: "row", alignItems: "center" },
  storyTitle: { color: C.gold, fontFamily: F.bold, fontSize: 15 },
  storySub: { color: C.white50, fontSize: 12, marginTop: 3 },
  storyDate: { color: C.white30, fontSize: 11, marginTop: 3 },
  deleteBtn: { padding: 10, marginLeft: 4 },
});
