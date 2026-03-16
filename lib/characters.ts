import { supabase } from "./supabase";

export interface Character {
  id: string;
  user_id: string;
  origin_story_id: string | null;
  name: string;
  emoji: string;
  physical_description: string | null;
  personality_trait: string | null;
  poetic_detail: string | null;
  origin_family: string | null;
  appearances: number;
  created_at: string;
}

export async function fetchCharacters(userId: string): Promise<Character[]> {
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Character[];
}

export async function saveCharacters(
  characters: Omit<Character, "id" | "created_at">[]
): Promise<Character[]> {
  if (characters.length === 0) return [];

  const { data, error } = await supabase
    .from("characters")
    .insert(characters)
    .select();

  if (error) throw new Error(error.message);
  return (data ?? []) as Character[];
}

export async function deleteCharacter(id: string): Promise<void> {
  const { error } = await supabase.from("characters").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function incrementAppearances(id: string): Promise<void> {
  const { error } = await supabase.rpc("increment_character_appearances", {
    character_id: id,
  });

  if (error) {
    // Fallback: manual fetch + update if rpc not available
    const { data: current } = await supabase
      .from("characters")
      .select("appearances")
      .eq("id", id)
      .single();

    if (current) {
      await supabase
        .from("characters")
        .update({ appearances: (current.appearances ?? 1) + 1 })
        .eq("id", id);
    }
  }
}
