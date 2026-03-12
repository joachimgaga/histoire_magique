import { create } from "zustand";

export interface Profile {
  id: string;
  email: string;
  is_premium: boolean;
  stories_generated_this_month: number;
  language: string;
  display_name: string | null;
  avatar: string | null;
}

export interface Story {
  id: string;
  user_id: string;
  title: string;
  content: string;
  family: string;
  subtype: string;
  age_target: string;
  theme: string;
  duration_minutes: number;
  child_name: string | null;
  share_token: string | null;
  created_at: string;
}

export interface ChildProfile {
  id: string;
  user_id: string;
  name: string;
  age: string;
  favorite_heroes: string[] | null;
  favorite_places: string[] | null;
  created_at: string;
}

interface AppState {
  profile: Profile | null;
  stories: Story[];
  childProfiles: ChildProfile[];
  setProfile: (profile: Profile | null) => void;
  setStories: (stories: Story[]) => void;
  addStory: (story: Story) => void;
  removeStory: (id: string) => void;
  setChildProfiles: (profiles: ChildProfile[]) => void;
  addChildProfile: (profile: ChildProfile) => void;
  updateChildProfile: (profile: ChildProfile) => void;
  removeChildProfile: (id: string) => void;
  incrementStoryCount: () => void;
}

export const useStore = create<AppState>((set) => ({
  profile: null,
  stories: [],
  childProfiles: [],
  setProfile: (profile) => set({ profile }),
  setStories: (stories) => set({ stories }),
  addStory: (story) => set((state) => ({ stories: [story, ...state.stories] })),
  removeStory: (id) => set((state) => ({ stories: state.stories.filter((s) => s.id !== id) })),
  setChildProfiles: (childProfiles) => set({ childProfiles }),
  addChildProfile: (profile) => set((state) => ({ childProfiles: [...state.childProfiles, profile] })),
  updateChildProfile: (profile) => set((state) => ({ childProfiles: state.childProfiles.map((p) => p.id === profile.id ? profile : p) })),
  removeChildProfile: (id) => set((state) => ({ childProfiles: state.childProfiles.filter((p) => p.id !== id) })),
  incrementStoryCount: () =>
    set((state) => ({
      profile: state.profile
        ? { ...state.profile, stories_generated_this_month: state.profile.stories_generated_this_month + 1 }
        : null,
    })),
}));
