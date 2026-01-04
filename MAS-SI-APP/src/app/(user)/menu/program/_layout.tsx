import { Stack } from "expo-router";
import ProgramProvider from "@/src/providers/programProvider";
import ProgramsAndEventsScreen from './programsAndEventsScreen'
import UpcomingEvents from "./upcomingEvents";
import ProgramLectures from "./[programId]";
export default function programStack() {
    return (
       <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="programsAndEventsScreen" options={{ headerShown: false }}/>
        <Stack.Screen name="[programId]" options={{ headerShown: true }}/>
        <Stack.Screen name="upcomingEvents" options={{ headerShown: false }}/>
        <Stack.Screen name="events/[event_id]" options={{ headerShown: false }}/>
       </Stack>
    )
  };
  
  {
    /*
        <Stack.Screen name="allPrograms" options={ { title: "All Programs", headerShown: false } } />
        <Stack.Screen name="kids/Kids" />
        <Stack.Screen name="[programId]" />
        <Stack.Screen name="events/Event" options={ {headerShown : false} } />
        <Stack.Screen name="lectures"  options={{ headerTitle : ""}}/>
      */
  }