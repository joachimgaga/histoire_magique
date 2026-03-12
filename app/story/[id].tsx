import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useTablet } from "@/lib/tablet";
import { C, GRAD, F } from "@/lib/theme";
import { useRef, useState } from "react";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

export default function StoryScreen() {
  const { title, content, id, share_token } = useLocalSearchParams<{
    id: string; title: string; content: string; share_token?: string;
  }>();
  const { profile } = useStore();
  const t = useT(profile?.language);
  const router = useRouter();
  const { isTablet, contentWidth } = useTablet();
  const paragraphs = (content ?? "").split("\n\n").filter((p) => p.trim());

  const [showFooter, setShowFooter] = useState(false);
  const footerAnim = useRef(new Animated.Value(0)).current;

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isAtEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - 80;
    if (isAtEnd && !showFooter) {
      setShowFooter(true);
      Animated.spring(footerAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start();
    }
  };

  const handleShare = async () => {
    const hasLink = share_token && id !== "temp";
    const link = hasLink ? `${SUPABASE_URL}/functions/v1/story-view?token=${share_token}` : null;
    await Share.share({
      title: title ?? "",
      message: link
        ? `${title}\n\n${link}\n\n— Créé avec Histoires Magiques ✨`
        : `${title}\n\n${content}\n\n— Créé avec Histoires Magiques ✨`,
    });
  };

  return (
    <LinearGradient colors={["#0f0c29", "#1a1a4e", "#0d1b3e"]} style={s.flex}>
      <SafeAreaView style={s.flex}>

        {/* Top bar — back + share, sans titre */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.replace(id === "temp" ? "/(tabs)" : "/(tabs)/library")} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#a78bfa" />
          </TouchableOpacity>
          <Text style={s.topTitle} numberOfLines={1}>{title}</Text>
          <TouchableOpacity onPress={handleShare} style={s.shareBtn}>
            <Ionicons name="share-outline" size={22} color="#a78bfa" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={s.flex}
          contentContainerStyle={[s.body, isTablet && s.bodyTablet]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={isTablet ? { maxWidth: contentWidth, alignSelf: "center", width: "100%" } : undefined}>
            {/* Titre une seule fois, en grand */}
            <Text style={[s.storyTitle, isTablet && s.storyTitleTablet]}>{title}</Text>

            {/* Séparateur décoratif */}
            <View style={s.titleDivider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerMoon}>🌙</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Paragraphes */}
            {paragraphs.map((p, i) => (
              <Text key={i} style={[s.para, isTablet && s.paraTablet]}>{p.trim()}</Text>
            ))}

            {/* Fin */}
            <Text style={s.fin}>{t.theEnd}</Text>
          </View>
        </ScrollView>

        {/* Footer — apparaît uniquement en fin de lecture */}
        {showFooter && (
          <Animated.View style={[s.footer, {
            opacity: footerAnim,
            transform: [{ translateY: footerAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
          }]}>
            <TouchableOpacity onPress={handleShare} style={{ marginBottom: 10 }}>
              <LinearGradient colors={["#374151", "#1f2937"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                <Ionicons name="share-outline" size={18} color="white" style={{ marginRight: 8 }} />
                <Text style={s.btnTxt}>Partager cette histoire</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
              <LinearGradient colors={["#7c3aed", "#2563eb"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                <Text style={s.btnTxt}>{t.newStory}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.separator },
  backBtn: { padding: 6, marginRight: 8 },
  topTitle: { color: C.white50, fontFamily: F.semi, fontSize: 14, flex: 1 },
  shareBtn: { padding: 6, marginLeft: 8 },
  body: { paddingHorizontal: 22, paddingTop: 32, paddingBottom: 60 },
  bodyTablet: { paddingHorizontal: 40 },
  storyTitle: { color: C.gold, fontFamily: F.title, fontSize: 28, textAlign: "center", lineHeight: 38, marginBottom: 20 },
  storyTitleTablet: { fontSize: 36, lineHeight: 48 },
  titleDivider: { flexDirection: "row", alignItems: "center", marginBottom: 28, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  dividerMoon: { fontSize: 16 },
  para: { color: C.ivory, fontSize: 19, lineHeight: 34, marginBottom: 22 },
  paraTablet: { fontSize: 22, lineHeight: 40 },
  fin: { color: C.gold, fontFamily: F.title, fontSize: 24, textAlign: "center", marginTop: 24, marginBottom: 8 },
  footer: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.separator },
  btn: { borderRadius: 16, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  btnTxt: { color: "white", fontFamily: F.bold, fontSize: 15 },
});
