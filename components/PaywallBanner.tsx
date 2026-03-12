import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useIAP, SKU_MONTHLY, SKU_YEARLY } from "@/lib/iap";

interface Props { onClose: () => void; }

export default function PaywallBanner({ onClose }: Props) {
  const { profile } = useStore();
  const t = useT(profile?.language);
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const { connected, monthlyPrice, yearlyPrice, loading, error, purchase, restore } = useIAP();

  const FEATURES_PREMIUM = [
    "✨ Histoires illimitées",
    "🎭 4 familles de récit",
    "🎂 Tous les âges (3-10 ans)",
    "⏳ Durée au choix (3/5/10 min)",
    "🌟 Prénom de l'enfant",
    "📚 Bibliothèque personnelle",
    "👨‍👩‍👧‍👦 Profils enfants avec préférences",
  ];

  const handlePurchase = async () => {
    if (!connected) {
      Alert.alert(t.comingSoon, t.iapComingSoon);
      return;
    }
    const sku = plan === "monthly" ? SKU_MONTHLY : SKU_YEARLY;
    await purchase(sku);
    if (!error) onClose();
  };

  const handleRestore = async () => {
    await restore();
    if (!error) onClose();
  };

  // Displayed prices: use real store price if available, fallback to hardcoded
  const displayMonthly = monthlyPrice ?? "2,99 €";
  const displayYearly  = yearlyPrice  ?? "29,99 €";

  return (
    <LinearGradient colors={["#0f0c29", "#1a1a4e", "#0d1b3e"]} style={s.flex}>
      <SafeAreaView style={s.container}>
        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
          <Text style={s.closeTxt}>✕</Text>
        </TouchableOpacity>

        <Text style={s.emoji}>✨</Text>
        <Text style={s.title}>{t.goPremiun}</Text>
        <Text style={s.sub}>{t.unlockAll}</Text>

        {/* Plan selector */}
        <View style={s.planRow}>
          <TouchableOpacity onPress={() => setPlan("monthly")} style={[s.planCard, plan === "monthly" && s.planCardOn]}>
            <Text style={[s.planName, plan === "monthly" && s.planNameOn]}>{t.planMonthly}</Text>
            <Text style={[s.planPrice, plan === "monthly" && s.planPriceOn]}>{displayMonthly}</Text>
            <Text style={[s.planPer, plan === "monthly" && s.planPerOn]}>{t.perMonth}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setPlan("yearly")} style={[s.planCard, plan === "yearly" && s.planCardOn]}>
            <View style={s.saveBadge}>
              <Text style={s.saveTxt}>{t.saveLabel}</Text>
            </View>
            <Text style={[s.planName, plan === "yearly" && s.planNameOn]}>{t.planYearly}</Text>
            <Text style={[s.planPrice, plan === "yearly" && s.planPriceOn]}>{displayYearly}</Text>
            <Text style={[s.planPer, plan === "yearly" && s.planPerOn]}>{t.perYear}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.premiumBox}>
          {FEATURES_PREMIUM.map((f) => <Text key={f} style={s.featurePremium}>{f}</Text>)}
        </View>

        {error && <Text style={s.errorTxt}>{error}</Text>}

        <TouchableOpacity onPress={handlePurchase} disabled={loading} style={{ marginBottom: 10 }}>
          <LinearGradient colors={["#7c3aed", "#2563eb"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={s.btnTxt}>
                  {plan === "monthly"
                    ? `${t.startPremium} — ${displayMonthly}/${t.perMonthShort}`
                    : `${t.startPremium} — ${displayYearly}/${t.perYearShort}`}
                </Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRestore} disabled={loading} style={s.restoreBtn}>
          <Text style={s.restoreTxt}>{t.restorePurchases}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} style={s.skipBtn}>
          <Text style={s.skipTxt}>{t.continueFree}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, justifyContent: "center" },
  closeBtn: { position: "absolute", top: 50, right: 16, padding: 8 },
  closeTxt: { color: "rgba(255,255,255,0.4)", fontSize: 18 },
  emoji: { fontSize: 44, textAlign: "center", marginBottom: 6 },
  title: { fontSize: 26, fontWeight: "800", color: "#fde68a", textAlign: "center" },
  sub: { color: "#c4b5fd", textAlign: "center", marginTop: 4, marginBottom: 16 },
  planRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  planCard: { flex: 1, alignItems: "center", borderRadius: 16, padding: 14, borderWidth: 2, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)" },
  planCardOn: { borderColor: "#a78bfa", backgroundColor: "rgba(124,58,237,0.2)" },
  saveBadge: { backgroundColor: "#7c3aed", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6 },
  saveTxt: { color: "white", fontSize: 10, fontWeight: "700" },
  planName: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "700", marginBottom: 4 },
  planNameOn: { color: "#c4b5fd" },
  planPrice: { color: "rgba(255,255,255,0.7)", fontSize: 24, fontWeight: "800" },
  planPriceOn: { color: "#fde68a" },
  planPer: { color: "rgba(255,255,255,0.3)", fontSize: 11 },
  planPerOn: { color: "rgba(255,255,255,0.6)" },
  premiumBox: { backgroundColor: "rgba(124,58,237,0.1)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(167,139,250,0.3)", marginBottom: 14 },
  featurePremium: { color: "white", fontSize: 13, marginBottom: 3 },
  errorTxt: { color: "#f87171", fontSize: 13, textAlign: "center", marginBottom: 10 },
  btn: { borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  btnTxt: { color: "white", fontWeight: "700", fontSize: 14 },
  restoreBtn: { paddingVertical: 10, alignItems: "center" },
  restoreTxt: { color: "rgba(255,255,255,0.4)", fontSize: 13 },
  skipBtn: { paddingVertical: 10, alignItems: "center" },
  skipTxt: { color: "rgba(255,255,255,0.25)", fontSize: 12 },
});
