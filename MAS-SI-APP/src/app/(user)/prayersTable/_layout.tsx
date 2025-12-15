import { Stack } from "expo-router";

export default function TestStack() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            {/* <Stack.Screen name="Quran/Quran" options={{ title : "Quran" }} /> */}
        </Stack>
    )
}