import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function UpcomingEventsLayout() {
  const router = useRouter();
  
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#214E91' },
        headerTintColor: 'white',
        headerTitleStyle: { color: 'white' },
        headerLeft: () => (
          <Pressable onPress={() => router.back()} hitSlop={10} style={{ marginLeft: 3 }}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </Pressable>
        ),
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Upcoming Events',
        }}
      />
    </Stack>
  );
}

