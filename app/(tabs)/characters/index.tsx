import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@/lib/store";
import { deleteCharacter, Character } from "@/lib/characters";
import { C, GRAD, F } from "@/lib/theme";
import PaywallBanner from "@/components/PaywallBanner";

export default function CharactersScreen() {
  const { profile, characters, removeCharacter } = useStore();
  const router = useRouter();
  const [showPaywall, setShowPaywall] = useState(false);

  const isPremium = profile?.is_premium ?? false;

  if (showPaywall) {
    return <PaywallBanner onClose={() => setShowPaywall(false)} />;
  }

  if (!isPremium) {
    return (
      <LinearGradient colors={GRAD.bg} style={s.flex}>
        <SafeAreaView style={[s.flex, s.center]} edges={["top"]}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>🎭</Text>
          <Text style={s.paywallTitle}>Mes Personnages</Text>
          <Text style={s.paywallSub}>
            Sauvegarde tes personnages préférés et retrouve-les pour de nouvelles aventures avec la version premium.
          </Text>
          <TouchableOpacity
            onPress={() => setShowPaywall(true)}
            style={{ marginTop: 20 }}
          >
            <LinearGradient
              colors={["#7c3aed", "#2563eb"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.btn}
            >
              <Text style={s.btnTxt}>✨ Passer Premium</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const handleDelete = (character: Character) => {
    Alert.alert(
      "Supprimer le personnage",
      `Supprimer ${character.name} de ta collection ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCharacter(character.id);
              removeCharacter(character.id);
            } catch {
              Alert.alert("Erreur", "Impossible de supprimer ce personnage.");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Character }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => router.push({ pathname: "/(tabs)/characters/[id]", params: { id: item.id } })}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.75}
    >
      <View style={s.cardEmojiWrap}>
        <Text style={s.cardEmoji}>{item.emoji}</Text>
      </View>
      <View style={s.cardBody}>
        <Text style={s.cardName}>{item.name}</Text>
        {item.personality_trait && (
          <Text style={s.cardTrait} numberOfLines={1}>
            {item.personality_trait}
          </Text>
        )}
        <View style={s.cardFooter}>
          <Ionicons name="book-outline" size={11} color={C.white30} />
          <Text style={s.cardAppearances}>
            {item.appearances} aventure{item.appearances > 1 ? "s" : ""}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.white30} />
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={GRAD.bg} style={s.flex}>
      <SafeAreaView style={s.flex} edges={["top"]}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Mes Personnages</Text>
          <Text style={s.headerCount}>
            {characters.length} héros{characters.length > 1 ? "" : ""}
          </Text>
        </View>

        <FlatList
          data={characters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>✨</Text>
              <Text style={s.emptyTitle}>Aucun personnage sauvegardé</Text>
              <Text style={s.emptySub}>
                Lis une histoire jusqu'au bout pour découvrir et sauvegarder ses personnages.
              </Text>
            </View>
          }
          renderItem={renderItem}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerTitle: {
    color: C.gold,
    fontFamily: F.title,
    fontSize: 24,
  },
  headerCount: {
    color: C.white30,
    fontSize: 12,
    marginTop: 2,
    fontFamily: F.semi,
  },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 12,
  },
  cardEmojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.violet,
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: { fontSize: 28 },
  cardBody: { flex: 1 },
  cardName: {
    color: C.white92,
    fontFamily: F.bold,
    fontSize: 16,
    marginBottom: 3,
  },
  cardTrait: {
    color: C.lavender,
    fontFamily: F.semi,
    fontSize: 12,
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardAppearances: {
    color: C.white30,
    fontSize: 11,
    fontFamily: F.semi,
  },

  // Empty
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: {
    color: C.white70,
    fontFamily: F.bold,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySub: {
    color: C.white30,
    fontFamily: F.semi,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },

  // Paywall
  paywallTitle: {
    color: C.gold,
    fontFamily: F.title,
    fontSize: 24,
    textAlign: "center",
    marginBottom: 8,
  },
  paywallSub: {
    color: C.lavender,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  btn: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  btnTxt: { color: "white", fontFamily: F.bold, fontSize: 15 },
});
