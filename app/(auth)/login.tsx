import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useT } from "@/lib/i18n";
import { useTablet } from "@/lib/tablet";
import { C, GRAD, F } from "@/lib/theme";

export default function LoginScreen() {
  const t = useT();
  const { isTablet, contentWidth } = useTablet();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert("Erreur", t.fillFields); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert("Erreur", error.message);
  };

  return (
    <LinearGradient colors={["#0f0c29", "#1a1a4e", "#0d1b3e"]} style={s.flex}>
      <SafeAreaView style={s.flex}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.center}>
          <View style={isTablet ? { width: contentWidth, alignSelf: "center" } : undefined}>
          <Text style={s.emoji}>🌙</Text>
          <Text style={s.title}>{t.appName}</Text>
          <Text style={s.sub}>{t.welcomeBack}</Text>

          <View style={s.card}>
            <Text style={s.label}>{t.email}</Text>
            <TextInput style={s.input} placeholder="ton@email.com" placeholderTextColor="#64748b"
              value={email} onChangeText={setEmail} keyboardType="email-address"
              autoCapitalize="none" autoCorrect={false} />
            <Text style={s.label}>{t.password}</Text>
            <TextInput style={[s.input, { marginBottom: 20 }]} placeholder="••••••••"
              placeholderTextColor="#64748b" value={password} onChangeText={setPassword} secureTextEntry />
            <TouchableOpacity onPress={handleLogin} disabled={loading} style={s.btn}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={s.btnTxt}>{t.signIn}</Text>}
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", marginTop: 24 }}>
            <Text style={{ color: "rgba(255,255,255,0.5)" }}>{t.noAccount} </Text>
            <Link href="/(auth)/register"><Text style={{ color: "#a78bfa", fontWeight: "700" }}>{t.signUp}</Text></Link>
          </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  emoji: { fontSize: 60, textAlign: "center", marginBottom: 8 },
  title: { fontSize: 30, fontFamily: F.title, color: C.gold, textAlign: "center" },
  sub: { color: C.lavender, fontFamily: F.semi, textAlign: "center", marginTop: 4, marginBottom: 32 },
  card: { backgroundColor: C.card, borderRadius: 22, padding: 22, borderWidth: 1, borderColor: C.cardBorder },
  label: { color: C.white70, fontFamily: F.semi, fontSize: 13, marginBottom: 6 },
  input: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, color: "white", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.15)", marginBottom: 14 },
  btn: { backgroundColor: C.purple, borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  btnTxt: { color: "white", fontFamily: F.bold, fontSize: 15 },
});
