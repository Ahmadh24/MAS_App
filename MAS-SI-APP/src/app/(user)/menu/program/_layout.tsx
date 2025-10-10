import { Stack } from "expo-router";
import ProgramProvider from "@/src/providers/programProvider";
import ProgramsAndEventsScreen from './programsAndEventsScreen'
import UpcomingEvents from "./upcomingEvents/UpcomingEvents";
import ProgramLectures from "./[programId]";
export default function programStack() {
    return (
       <Stack>
        <Stack.Screen name="programsAndEventsScreen" options={{ headerShown : false }}/>
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