import { supabase } from "./supabase";

export interface GenerateParams {
  age_target: string;
  theme: string;
  family: string;
  family_description: string;
  duration_minutes: number;
  child_name?: string;
  lieu?: string;
  language?: string;
}

export interface GeneratedStory {
  title: string;
  content: string;
  family: string;
}

export async function generateStory(params: GenerateParams): Promise<GeneratedStory> {
  const { data, error } = await supabase.functions.invoke("generate-story", {
    body: params,
  });

  if (error) throw new Error(error.message);
  if (!data?.title || !data?.content) throw new Error("Réponse invalide");

  return data as GeneratedStory;
}
