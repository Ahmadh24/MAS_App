import { Stack } from "expo-router";

export default function MyProgramsStack(){
    return(
        <Stack
        >
            <Stack.Screen name="index" options={{headerShown: false}}/>
            <Stack.Screen name="notifications" options={{ headerShown : false}}/>
            <Stack.Screen name="recordedLectures" options={{ headerShown: true }}/>
       </Stack>
    )
}