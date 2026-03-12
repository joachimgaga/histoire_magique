import { useEffect, useRef, useState } from "react";
import { View, Text, Animated, StyleSheet, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { C, GRAD, F } from "@/lib/theme";

const MESSAGES: Record<string, string[]> = {
  fr: [
    "Les personnages prennent vie…",
    "La magie est en marche…",
    "L'histoire se tisse fil par fil…",
    "Les étoiles s'alignent…",
    "Le conteur s'installe…",
    "Les mots magiques apparaissent…",
    "L'aventure commence bientôt…",
  ],
  en: [
    "Characters are coming to life…",
    "The magic is at work…",
    "The story is weaving itself…",
    "Stars are aligning…",
    "The storyteller is ready…",
    "Magical words are appearing…",
    "The adventure begins soon…",
  ],
  es: [
    "Los personajes cobran vida…",
    "La magia está en marcha…",
    "La historia se teje hilo a hilo…",
    "Las estrellas se alinean…",
  ],
  default: [
    "Creating your story…",
    "Magic is happening…",
    "Almost ready…",
  ],
};

function getMessages(lang?: string) {
  if (!lang) return MESSAGES.fr;
  return MESSAGES[lang] ?? MESSAGES.default;
}

export default function GeneratingScreen({ language }: { language?: string }) {
  const msgs = getMessages(language);
  const [msgIndex, setMsgIndex] = useState(0);

  // Moon float animation
  const floatAnim = useRef(new Animated.Value(0)).current;
  // Moon glow / scale pulse
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Sparkles rotation
  const rotateAnim = useRef(new Animated.Value(0)).current;
  // Message fade
  const msgFade = useRef(new Animated.Value(1)).current;
  // Dots
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Float up/down
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -14, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,   duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Scale pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.08, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1,    duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Slow rotation for sparkle ring
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // Bouncing dots
    const dotDelay = 300;
    const dotDuration = 500;
    const animDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: dotDuration, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: dotDuration, useNativeDriver: true }),
          Animated.delay(dotDelay * 2),
        ])
      ).start();
    animDot(dot1, 0);
    animDot(dot2, dotDelay);
    animDot(dot3, dotDelay * 2);

    // Cycle messages
    const interval = setInterval(() => {
      Animated.timing(msgFade, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setMsgIndex((i) => (i + 1) % msgs.length);
        Animated.timing(msgFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const SPARKLES = ["✨", "⭐", "🌟", "💫", "✨", "⭐", "🌟", "💫"];
  const radius = 90;

  return (
    <LinearGradient colors={GRAD.bg} style={s.container}>

      {/* Rotating sparkle ring */}
      <Animated.View style={[s.sparkleRing, { transform: [{ rotate }] }]}>
        {SPARKLES.map((sp, i) => {
          const angle = (i / SPARKLES.length) * 2 * Math.PI;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          return (
            <Text key={i} style={[s.sparkle, { transform: [{ translateX: x }, { translateY: y }] }]}>
              {sp}
            </Text>
          );
        })}
      </Animated.View>

      {/* Moon */}
      <Animated.View style={{ transform: [{ translateY: floatAnim }, { scale: scaleAnim }] }}>
        <Text style={s.moon}>🌙</Text>
      </Animated.View>

      {/* Title */}
      <Text style={s.title}>Histoires Magiques</Text>

      {/* Rotating message */}
      <Animated.Text style={[s.message, { opacity: msgFade }]}>
        {msgs[msgIndex]}
      </Animated.Text>

      {/* Loading dots */}
      <View style={s.dots}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[s.dot, { opacity: dot, transform: [{ scale: dot }] }]} />
        ))}
      </View>

    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  sparkleRing: { position: "absolute", width: 1, height: 1, alignItems: "center", justifyContent: "center" },
  sparkle: { position: "absolute", fontSize: 16 },
  moon: { fontSize: 80, textAlign: "center" },
  title: { color: C.gold, fontFamily: F.title, fontSize: 24, marginTop: 24, marginBottom: 16 },
  message: { color: C.lavender, fontFamily: F.semi, fontSize: 15, textAlign: "center", paddingHorizontal: 40 },
  dots: { flexDirection: "row", gap: 8, marginTop: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.purple },
});
