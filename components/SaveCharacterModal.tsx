import { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { saveCharacters, Character } from "@/lib/characters";
import { C, GRAD, F } from "@/lib/theme";

export interface ExtractedCharacter {
  name: string;
  emoji: string;
  physical_description: string | null;
  personality_trait: string | null;
  poetic_detail: string | null;
  origin_family: string | null;
}

interface Props {
  visible: boolean;
  characters: ExtractedCharacter[];
  storyId: string;
  userId: string;
  onClose: () => void;
  onSaved: (saved: Character[]) => void;
}

export default function SaveCharacterModal({
  visible,
  characters,
  storyId,
  userId,
  onClose,
  onSaved,
}: Props) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(characters.map((_, i) => i))
  );
  const [loading, setLoading] = useState(false);

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSave = async () => {
    const toSave = characters
      .filter((_, i) => selected.has(i))
      .map((c) => ({
        user_id: userId,
        origin_story_id: storyId !== "temp" ? storyId : null,
        name: c.name,
        emoji: c.emoji,
        physical_description: c.physical_description,
        personality_trait: c.personality_trait,
        poetic_detail: c.poetic_detail,
        origin_family: c.origin_family,
        appearances: 1,
      }));

    if (toSave.length === 0) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      const saved = await saveCharacters(toSave);
      onSaved(saved);
      onClose();
    } catch (e) {
      // Silently dismiss on error — non-critical feature
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (characters.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Title */}
          <Text style={s.title}>Personnages découverts ✨</Text>
          <Text style={s.subtitle}>
            Sélectionne les personnages à sauvegarder dans ta collection.
          </Text>

          {/* Character list */}
          <ScrollView
            style={s.list}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            {characters.map((char, index) => {
              const isSelected = selected.has(index);
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => toggleSelect(index)}
                  style={[s.charRow, isSelected && s.charRowOn]}
                  activeOpacity={0.7}
                >
                  <Text style={s.charEmoji}>{char.emoji}</Text>
                  <View style={s.charInfo}>
                    <Text style={s.charName}>{char.name}</Text>
                    {char.personality_trait && (
                      <Text style={s.charTrait} numberOfLines={1}>
                        {char.personality_trait}
                      </Text>
                    )}
                  </View>
                  <View style={[s.checkbox, isSelected && s.checkboxOn]}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Save button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={s.saveBtn}
          >
            <LinearGradient
              colors={GRAD.btn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.saveBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={s.saveBtnTxt}>
                  Sauvegarder la sélection ({selected.size})
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Ignore button */}
          <TouchableOpacity
            onPress={onClose}
            disabled={loading}
            style={s.ignoreBtn}
          >
            <Text style={s.ignoreTxt}>Ignorer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1a1a4e",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    maxHeight: "80%",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: C.white30,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    color: C.gold,
    fontFamily: F.title,
    fontSize: 20,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    color: C.white50,
    fontFamily: F.semi,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },
  list: {
    maxHeight: 280,
    marginBottom: 16,
  },
  charRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    gap: 12,
  },
  charRowOn: {
    backgroundColor: C.violet,
    borderColor: C.violetBorder,
  },
  charEmoji: {
    fontSize: 32,
    width: 40,
    textAlign: "center",
  },
  charInfo: {
    flex: 1,
  },
  charName: {
    color: C.white92,
    fontFamily: F.bold,
    fontSize: 15,
    marginBottom: 2,
  },
  charTrait: {
    color: C.white50,
    fontFamily: F.semi,
    fontSize: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.white30,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: {
    backgroundColor: C.purple,
    borderColor: C.purple,
  },
  saveBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 10,
  },
  saveBtnGradient: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnTxt: {
    color: "white",
    fontFamily: F.bold,
    fontSize: 15,
  },
  ignoreBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  ignoreTxt: {
    color: C.white30,
    fontFamily: F.semi,
    fontSize: 14,
  },
});
