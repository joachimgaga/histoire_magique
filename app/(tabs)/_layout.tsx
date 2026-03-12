import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { F } from "@/lib/theme";

export default function TabsLayout() {
  const { profile } = useStore();
  const t = useT(profile?.language);

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: "#0a0818",
        borderTopColor: "rgba(255,255,255,0.06)",
        borderTopWidth: 1,
        height: 60,
        paddingBottom: 8,
        paddingTop: 6,
      },
      tabBarActiveTintColor: "#a78bfa",
      tabBarInactiveTintColor: "#3d3a5c",
      tabBarLabelStyle: { fontSize: 11, fontFamily: F.bold },
    }}>
      <Tabs.Screen name="index" options={{
        title: t.tabCreate,
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? "sparkles" : "sparkles-outline"} size={24} color={color} />
        ),
      }} />
      <Tabs.Screen name="library" options={{
        title: t.tabLibrary,
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? "book" : "book-outline"} size={24} color={color} />
        ),
      }} />
      <Tabs.Screen name="children" options={{
        title: t.tabChildren,
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} />
        ),
      }} />
      <Tabs.Screen name="profile" options={{
        title: t.tabProfile,
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? "person-circle" : "person-circle-outline"} size={26} color={color} />
        ),
      }} />
    </Tabs>
  );
}
