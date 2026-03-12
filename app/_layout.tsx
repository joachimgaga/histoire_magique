import { useEffect, useRef, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Session } from "@supabase/supabase-js";
import {
  useFonts,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";
import { C, GRAD, F } from "@/lib/theme";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { setProfile } = useStore();
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  // Splash animation
  const moonScale  = useRef(new Animated.Value(0)).current;
  const moonOpacity= useRef(new Animated.Value(0)).current;
  const titleOpacity=useRef(new Animated.Value(0)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (!fontsLoaded) return;
    Animated.sequence([
      // Moon appears with spring
      Animated.parallel([
        Animated.spring(moonScale,   { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(moonOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // Title fades in
      Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      // Subtitle fades in
      Animated.timing(subOpacity,   { toValue: 1, duration: 400, useNativeDriver: true }),
      // Hold 0.8s then done
      Animated.delay(800),
    ]).start(() => setSplashDone(true));
  }, [fontsLoaded]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          if (data) setProfile(data);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);


  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "(auth)";
    if (!session && !inAuth) {
      router.replace("/(auth)/login");
    } else if (session && inAuth) {
      router.replace("/(tabs)");
    }
  }, [session, loading, segments]);

  if (!fontsLoaded || loading || !splashDone) {
    return (
      <LinearGradient colors={GRAD.bg} style={sl.container}>
        <Animated.View style={{ opacity: moonOpacity, transform: [{ scale: moonScale }] }}>
          <Text style={sl.moon}>🌙</Text>
        </Animated.View>
        <Animated.Text style={[sl.title, { opacity: titleOpacity }]}>
          Histoires Magiques
        </Animated.Text>
        <Animated.Text style={[sl.sub, { opacity: subOpacity }]}>
          L'histoire parfaite, créée pour votre enfant ✨
        </Animated.Text>
      </LinearGradient>
    );
  }

  return <Slot />;
}

const sl = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  moon:  { fontSize: 80, textAlign: "center", marginBottom: 4 },
  title: { color: C.gold, fontFamily: F.title, fontSize: 28, marginTop: 20, textAlign: "center" },
  sub:   { color: C.lavender, fontFamily: F.semi, fontSize: 14, marginTop: 10, textAlign: "center", paddingHorizontal: 40 },
});
