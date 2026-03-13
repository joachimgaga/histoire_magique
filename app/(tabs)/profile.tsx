import {
  View, Text, TouchableOpacity, Alert, StyleSheet,
  ScrollView, Linking, Modal, TextInput, ActivityIndicator, Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { useTablet } from "@/lib/tablet";
import { C, GRAD, F } from "@/lib/theme";
import PaywallBanner from "@/components/PaywallBanner";
import { useIAP } from "@/lib/iap";

const LANGUAGES = [
  { id: "fr", label: "Français",  flag: "🇫🇷" },
  { id: "en", label: "English",   flag: "🇬🇧" },
  { id: "es", label: "Español",   flag: "🇪🇸" },
  { id: "zh", label: "中文",      flag: "🇨🇳" },
  { id: "hi", label: "हिन्दी",   flag: "🇮🇳" },
  { id: "ar", label: "العربية",  flag: "🇸🇦" },
  { id: "bn", label: "বাংলা",    flag: "🇧🇩" },
  { id: "pt", label: "Português", flag: "🇧🇷" },
  { id: "ru", label: "Русский",   flag: "🇷🇺" },
  { id: "ja", label: "日本語",    flag: "🇯🇵" },
];

const AVATARS = ["👤","🧑","👦","👧","🧒","🧔","👩","🧑‍🦱","🧑‍🦰","🧑‍🦳","🧑‍🦲","🧙","🧚","🧜","🦸","🧝","🤖","👻","🐉","🦄"];

export default function ProfileScreen() {
  const { profile, setProfile } = useStore();
  const t = useT(profile?.language);
  const { isTablet, contentWidth } = useTablet();
  const router = useRouter();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const isPremium = profile?.is_premium ?? false;
  const { restore } = useIAP();
  const currentLang = LANGUAGES.find((l) => l.id === (profile?.language || "fr")) ?? LANGUAGES[0];

  const [editName, setEditName]       = useState(profile?.display_name ?? "");
  const [editAvatar, setEditAvatar]   = useState(profile?.avatar ?? "👤");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving]           = useState(false);

  const openEdit = () => {
    setEditName(profile?.display_name ?? "");
    setEditAvatar(profile?.avatar ?? "👤");
    setNewPassword("");
    setShowEditModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from("profiles").update({
        display_name: editName.trim() || null,
        avatar: editAvatar,
      }).eq("id", profile!.id);
      setProfile({ ...profile!, display_name: editName.trim() || null, avatar: editAvatar });
      if (newPassword.length > 0) {
        if (newPassword.length < 6) { Alert.alert("Erreur", t.passwordShort); setSaving(false); return; }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) { Alert.alert("Erreur", error.message); setSaving(false); return; }
      }
      setShowEditModal(false);
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLanguage = async (langId: string) => {
    await supabase.from("profiles").update({ language: langId }).eq("id", profile!.id);
    setProfile({ ...profile!, language: langId });
    setShowLangModal(false);
  };

  const handleLogout = () => {
    Alert.alert(t.logoutConfirm, t.logoutMsg, [
      { text: t.cancel, style: "cancel" },
      { text: t.logout, style: "destructive", onPress: () => supabase.auth.signOut() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer mon compte",
      "Cette action est irréversible. Toutes tes histoires et données seront définitivement supprimées.",
      [
        { text: t.cancel, style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirmation",
              "Es-tu sûr(e) ? Toutes tes données seront perdues définitivement.",
              [
                { text: t.cancel, style: "cancel" },
                {
                  text: "Oui, supprimer",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      const uid = profile!.id;
                      await supabase.from("stories").delete().eq("user_id", uid);
                      await supabase.from("child_profiles").delete().eq("user_id", uid);
                      await supabase.from("profiles").delete().eq("id", uid);
                      await supabase.rpc("delete_user");
                      await supabase.auth.signOut();
                    } catch (e: any) {
                      Alert.alert("Erreur", "Impossible de supprimer le compte. Contacte le support.");
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleShareApp = () => {
    Share.share({
      title: "Histoires Magiques",
      message: "Découvre Histoires Magiques ✨ — Des histoires personnalisées pour endormir tes enfants en douceur.\n\niOS : https://apps.apple.com/app/histoires-magiques/id123456789\nAndroid : https://play.google.com/store/apps/details?id=com.gasnier.histoiresmagiques",
    });
  };

  const handleFeedback = () => {
    Linking.openURL("mailto:contact@histoiresmagiques.fr?subject=Feedback%20-%20Histoires%20Magiques");
  };

  const handlePrivacy = () => Linking.openURL("https://joachimgaga.github.io/histoires-magiques-privacy/");
  const handleCGU     = () => Linking.openURL("https://joachimgaga.github.io/histoires-magiques-privacy/cgu");

  if (showPaywall) return <PaywallBanner onClose={() => setShowPaywall(false)} />;

  const displayAvatar = profile?.avatar ?? "👤";
  const displayName   = profile?.display_name || profile?.email;

  return (
    <LinearGradient colors={GRAD.bg} style={s.flex}>
      <SafeAreaView style={s.flex} edges={['top']}>
        <ScrollView contentContainerStyle={[s.container, isTablet && s.containerTablet]} showsVerticalScrollIndicator={false}>
          <View style={isTablet ? { maxWidth: contentWidth, alignSelf: "center", width: "100%" } : undefined}>

            {/* Header */}
            <View style={s.header}>
              <TouchableOpacity onPress={openEdit} style={s.avatarWrap}>
                <View style={s.avatarCircle}>
                  <Text style={s.avatarEmoji}>{displayAvatar}</Text>
                </View>
                <View style={s.editBadge}>
                  <Ionicons name="pencil" size={10} color="white" />
                </View>
              </TouchableOpacity>
              <Text style={s.displayName}>{displayName}</Text>
              {profile?.display_name && <Text style={s.emailSub}>{profile.email}</Text>}
              <View style={[s.badge, isPremium && s.badgePremium]}>
                <Text style={[s.badgeTxt, isPremium && s.badgeTxtPremium]}>
                  {isPremium ? "✨ Premium" : t.free}
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View style={s.statsRow}>
              <View style={s.statCard}>
                <Text style={s.statNum}>
                  {profile?.stories_generated_this_month ?? 0}
                  {!isPremium && <Text style={s.statMax}>/3</Text>}
                </Text>
                <Text style={s.statLabel}>{t.storiesThisMonth}</Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statNum}>{isPremium ? "∞" : "3"}</Text>
                <Text style={s.statLabel}>{isPremium ? "Illimité" : "Par mois"}</Text>
              </View>
            </View>

            {/* Subscribe CTA — free users only */}
            {!isPremium && (
              <TouchableOpacity onPress={() => setShowPaywall(true)} style={{ marginBottom: 24 }}>
                <LinearGradient colors={GRAD.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.subscribeBanner}>
                  <View style={s.subscribeLeft}>
                    <Text style={s.subscribeTitle}>✨ Passer à Premium</Text>
                    <Text style={s.subscribeSub}>Histoires illimitées · Tous les âges · Bibliothèque</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Mon compte */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Mon compte</Text>
              <View style={s.actionBlock}>
                <ActionRow icon="person" label="Modifier mon profil" onPress={openEdit} />
                <Sep />
                <ActionRow
                  icon="language"
                  label={t.storyLanguage}
                  value={`${currentLang.flag} ${currentLang.label}`}
                  onPress={() => setShowLangModal(true)}
                />
                {!isPremium && <><Sep /><ActionRow icon="star" label="S'abonner à Premium" onPress={() => setShowPaywall(true)} accent /></>}
                <Sep />
                <ActionRow icon="refresh" label={t.restorePurchases} onPress={restore} />
              </View>
            </View>

            {/* Contenu */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Contenu</Text>
              <View style={s.actionBlock}>
                <ActionRow icon="book" label={t.myStories} onPress={() => router.replace("/(tabs)/library")} />
              </View>
            </View>

            {/* À propos */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>À propos</Text>
              <View style={s.actionBlock}>
                <ActionRow icon="share-social" label="Partager l'application" onPress={handleShareApp} />
                <Sep />
                <ActionRow icon="mail" label="Envoyer un feedback" onPress={handleFeedback} />
                <Sep />
                <ActionRow icon="document-text" label="Conditions générales" onPress={handleCGU} />
                <Sep />
                <ActionRow icon="lock-closed" label="Politique de confidentialité" onPress={handlePrivacy} />
              </View>
            </View>

            {/* Logout */}
            <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
              <Ionicons name="log-out-outline" size={18} color="#f87171" />
              <Text style={s.logoutTxt}>{t.logout}</Text>
            </TouchableOpacity>

            {/* Delete account */}
            <TouchableOpacity onPress={handleDeleteAccount} style={s.deleteBtn}>
              <Text style={s.deleteTxt}>Supprimer mon compte</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Language picker modal */}
      <Modal visible={showLangModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{t.storyLanguage}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {LANGUAGES.map((lang, i) => {
                const active = lang.id === currentLang.id;
                return (
                  <View key={lang.id}>
                    {i > 0 && <View style={s.langSep} />}
                    <TouchableOpacity onPress={() => handleLanguage(lang.id)} style={s.langRow}>
                      <Text style={s.langRowFlag}>{lang.flag}</Text>
                      <Text style={[s.langRowLabel, active && s.langRowLabelOn]}>{lang.label}</Text>
                      {active && <Ionicons name="checkmark" size={18} color={C.purple} />}
                    </TouchableOpacity>
                  </View>
                );
              })}
              <TouchableOpacity onPress={() => setShowLangModal(false)} style={{ marginTop: 16, alignItems: "center" }}>
                <Text style={{ color: C.white30, fontSize: 13, fontFamily: F.semi }}>{t.cancel}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit profile modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.modalTitle}>Modifier mon profil</Text>
              <Text style={s.modalLabel}>Avatar</Text>
              <View style={s.avatarGrid}>
                {AVATARS.map((a) => (
                  <TouchableOpacity key={a} onPress={() => setEditAvatar(a)}
                    style={[s.avatarOption, editAvatar === a && s.avatarOptionOn]}>
                    <Text style={{ fontSize: 24 }}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.modalLabel}>Prénom</Text>
              <TextInput style={s.input} placeholder="Ton prénom (optionnel)" placeholderTextColor="#475569"
                value={editName} onChangeText={setEditName} maxLength={30} />
              <Text style={s.modalLabel}>Nouveau mot de passe</Text>
              <TextInput style={s.input} placeholder="Laisser vide pour ne pas changer" placeholderTextColor="#475569"
                value={newPassword} onChangeText={setNewPassword} secureTextEntry maxLength={50} />
              <TouchableOpacity onPress={handleSave} disabled={saving} style={{ marginTop: 8 }}>
                <LinearGradient colors={GRAD.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtn}>
                  {saving ? <ActivityIndicator color="white" /> : <Text style={s.saveBtnTxt}>Enregistrer</Text>}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={{ marginTop: 14, alignItems: "center" }}>
                <Text style={{ color: C.white30, fontSize: 13 }}>{t.cancel}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionRow({ icon, label, value, onPress, accent }: {
  icon: any; label: string; value?: string; onPress: () => void; accent?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={s.actionRow}>
      <View style={[s.actionIcon, accent && s.actionIconAccent]}>
        <Ionicons name={icon} size={16} color={accent ? C.gold : "#a78bfa"} />
      </View>
      <Text style={[s.actionLabel, accent && s.actionLabelAccent]}>{label}</Text>
      {value
        ? <Text style={s.actionValue}>{value}</Text>
        : <Ionicons name="chevron-forward" size={16} color={C.white30} />
      }
    </TouchableOpacity>
  );
}

function Sep() {
  return <View style={s.separator} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  containerTablet: { paddingHorizontal: 32 },

  header: { alignItems: "center", marginBottom: 24, paddingTop: 16 },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatarCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.violet, borderWidth: 2, borderColor: C.violetBorder, alignItems: "center", justifyContent: "center" },
  avatarEmoji: { fontSize: 42 },
  editBadge: { position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: C.purple, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.bg0 },
  displayName: { color: C.gold, fontFamily: F.bold, fontSize: 18, marginBottom: 2 },
  emailSub: { color: C.white30, fontSize: 12, marginBottom: 8 },
  badge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: C.cardBorder, marginTop: 6 },
  badgePremium: { backgroundColor: C.violet, borderColor: "#a78bfa" },
  badgeTxt: { color: C.white50, fontFamily: F.bold, fontSize: 12 },
  badgeTxtPremium: { color: "#a78bfa" },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: C.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.cardBorder, alignItems: "center" },
  statNum: { color: "white", fontFamily: F.title, fontSize: 32 },
  statMax: { color: C.lavender, fontSize: 20, fontFamily: F.bold },
  statLabel: { color: C.white50, fontSize: 12, marginTop: 4, textAlign: "center" },

  subscribeBanner: { borderRadius: 18, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  subscribeLeft: { flex: 1 },
  subscribeTitle: { color: "white", fontFamily: F.title, fontSize: 16, marginBottom: 3 },
  subscribeSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: F.semi },

  section: { marginBottom: 20 },
  sectionTitle: { color: C.white30, fontSize: 11, fontFamily: F.bold, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 },

  actionBlock: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.cardBorder, overflow: "hidden" },
  actionRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  actionIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.violet, alignItems: "center", justifyContent: "center" },
  actionIconAccent: { backgroundColor: "rgba(253,230,138,0.15)" },
  actionLabel: { flex: 1, color: C.white70, fontFamily: F.semi, fontSize: 14 },
  actionLabelAccent: { color: C.gold },
  actionValue: { color: C.white50, fontFamily: F.semi, fontSize: 13 },
  separator: { height: 1, backgroundColor: C.separator, marginHorizontal: 16 },

  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16, backgroundColor: "rgba(239,68,68,0.08)", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" },
  logoutTxt: { color: "#f87171", fontFamily: F.bold, fontSize: 14 },
  deleteBtn: { alignItems: "center", paddingVertical: 14, marginTop: 8 },
  deleteTxt: { color: C.white30, fontSize: 12, fontFamily: F.semi, textDecorationLine: "underline" },

  // Language modal
  langRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 4, gap: 14 },
  langRowFlag: { fontSize: 22 },
  langRowLabel: { flex: 1, color: C.white70, fontFamily: F.semi, fontSize: 16 },
  langRowLabelOn: { color: C.purple, fontFamily: F.bold },
  langSep: { height: 1, backgroundColor: C.separator },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#1a1a4e", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: "85%", borderWidth: 1, borderColor: C.cardBorder },
  modalTitle: { color: C.gold, fontFamily: F.title, fontSize: 20, textAlign: "center", marginBottom: 20 },
  modalLabel: { color: C.white70, fontSize: 13, fontFamily: F.bold, marginBottom: 10, marginTop: 8 },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  avatarOption: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardBorder },
  avatarOptionOn: { backgroundColor: C.violet, borderColor: C.purple },
  input: { backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, color: "white", borderWidth: 1.5, borderColor: C.cardBorder, marginBottom: 16, fontSize: 15 },
  saveBtn: { borderRadius: 16, paddingVertical: 15, alignItems: "center" },
  saveBtnTxt: { color: "white", fontFamily: F.bold, fontSize: 15 },
});
