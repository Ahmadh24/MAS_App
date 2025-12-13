import { View, Text, ScrollView, useWindowDimensions, Button, FlatList, Pressable } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Redirect, Stack, useNavigation } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { useAuth } from "@/src/providers/AuthProvider"
import { EventsType, Program } from '@/src/types'
import RenderAddedEvents from "@/src/components/UserProgramComponets/RenderAddedEvents"
import ProgramsListProgram from '@/src/components/ProgramsListProgram'
import RenderAddedPrograms from '@/src/components/UserProgramComponets/RenderAddedPrograms'
// import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Dialog, Icon, IconButton } from 'react-native-paper'
import { usePrayer } from '@/src/providers/prayerTimesProvider'
import NotificationPrayerTable from '@/src/components/notificationPrayerTimeTable'
import { useRouter } from 'expo-router'
import JummahMarquee from '@/src/components/JummahMarquee'
import { add } from 'date-fns'
{/*
  const NotificationPaidScreen = () => {
    return(
      <ScrollView>
        <View className='px-7'>
          <View className='items-center'>
            <Text className='font-bold text-2xl text-center'>Start adding flyers to make your notifications list</Text>
            <Icon source={"bell"} color="#007AFF" size={40}/>
          </View>
          <View className='pb-[50%]'/>
          <View className='items-center px-4'>
            <View className='flex-row items-center justify-center flex-wrap'>
              <Text className='font-bold text-xl text-center'>Add programs and events by tapping the </Text>
              <Icon source={"bell"} color="#007AFF" size={20}/>
              <Text className='font-bold text-xl text-center'> or sliding right on the flyer name</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    )
  }

  */}
type NotificationEventsScreenProp = {
  addedEvents: EventsType[] | null
  layout: number
}
const NotificationEventsScreen = ({ addedEvents, layout }: NotificationEventsScreenProp) => {
  return (
    <ScrollView className='w-[100%]' contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", paddingBottom: 0 }}>
      {
        addedEvents && addedEvents.length > 0 ? addedEvents.map((item, index) => {
          return (
            <View key={index} style={{ width: layout / 2, justifyContent: "center", alignItems: "center", paddingTop: 10 }}>
              <RenderAddedEvents eventsInfo={item} />
            </View>
          )
        }) :
          (
            <View className='px-7'>
              <View className='items-center'>
                <Text className='font-bold text-2xl text-center'>Start adding flyers to make your notifications list</Text>
                <Icon source={"bell"} color="#007AFF" size={40} />
              </View>
              <View className='pb-[50%]' />
              <View>
                <Text className='font-bold text-xl text-center'>Add programs and events by tapping the <Icon source={"bell"} color="#007AFF" size={20} /> or sliding right on the flyer name</Text>
              </View>
            </View>
          )
      }
    </ScrollView>
  )
}
type ClassesScreenProp = {
  addedPrograms: Program[]
  layout: number
}

const ClassesScreen = ({ addedPrograms, layout }: ClassesScreenProp) => {
  return (
    <ScrollView className='w-[100%]' contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", paddingBottom: 0 }}>
      {
        addedPrograms && addedPrograms.length > 0 ? addedPrograms.map((item) => {
          return (
            <View style={{ width: layout / 2, justifyContent: "center", alignItems: "center", paddingTop: 10 }}>
              <RenderAddedPrograms programInfo={item} />
            </View>
          )
        }) :
          (
            <View className='px-7'>
              <View className='items-center'>
                <Text className='font-bold text-2xl text-center'>Start adding flyers to make your notifications list</Text>
                <Icon source={"bell"} color="#007AFF" size={40} />
              </View>
              <View className='pb-[50%]' />
              <View>
                <Text className='font-bold text-xl text-center'>Add programs and events by tapping the <Icon source={"bell"} color="#007AFF" size={20} /> or sliding right on the flyer name</Text>
              </View>
            </View>
          )
      }
    </ScrollView>
  )
}

const LecturesScreen = ({ addedPrograms, layout }: ClassesScreenProp) => {
  return (
    <ScrollView className='w-[100%]' contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", paddingBottom: 0 }}>
      {
        addedPrograms.length > 0 ? addedPrograms.map((item) => {
          return (
            <View style={{ width: layout / 2, justifyContent: "center", alignItems: "center", paddingTop: 10 }}>
              <RenderAddedPrograms programInfo={item} />
            </View>
          )
        }) :
          (
            <View className='px-7'>
              <View className='items-center'>
                <Text className='font-bold text-2xl text-center'>Start adding flyers to make your notifications list</Text>
                <Icon source={"bell"} color="#007AFF" size={40} />
              </View>
              <View className='pb-[50%]' />
              <View>
                <Text className='font-bold text-xl text-center'>Add programs and events by tapping the <Icon source={"bell"} color="#007AFF" size={20} /> or sliding right on the flyer name</Text>
              </View>
            </View>
          )
      }
    </ScrollView>
  )
}
const SalahTimesScreen = () => {
  const { prayerTimesWeek } = usePrayer();
  if (prayerTimesWeek.length == 0) {
    return
  }
  const [tableIndex, setTableIndex] = useState(0)
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  const flatlistRef = useRef<FlatList>(null)
  useEffect(() => {
    flatlistRef.current?.scrollToIndex({
      index: tableIndex,
      animated: true
    })
  }, [tableIndex])

  return (
    <View className='items-center justify-center bg-white'>
      <FlatList
        data={prayerTimesWeek}
        renderItem={({ item, index }) => <NotificationPrayerTable prayerData={item} setTableIndex={setTableIndex} tableIndex={tableIndex} index={index} />}
        horizontal
        bounces={false}
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        scrollEventThrottle={32}
        viewabilityConfig={viewConfig}
        contentContainerStyle={{ flex: 1 }}
        ref={flatlistRef}
        nestedScrollEnabled
      />
    </View>
  )
}


const NotificationEvents = () => {
  const { session } = useAuth()
  const [addedEvents, setAddedEvents] = useState<EventsType[]>([])
  const [addedPrograms, setAddedPrograms] = useState<Program[]>([])
  const [addedLecturePrograms, setAddedProgramLectures] = useState<Program[]>([])
  const [index, setIndex] = useState(0)
  const layout = useWindowDimensions().width
  const getAddedEvents = async () => {
    const { data: AddedEvents, error } = await supabase.from("added_notifications_events").select("*").eq("user_id", session?.user.id).order("created_at", { ascending: false })
    if (error) {
      console.log(error)
    }
    if (AddedEvents) {
      const EventInfo = await Promise.all(
        AddedEvents.map(async (event) => {
          const { data: eventInfo, error } = await supabase.from('events').select('*').eq('event_id', event.event_id).single()
          return eventInfo
        })
      )
      setAddedEvents(EventInfo)
    }
  }

  const getAddedProgram = async () => {
    const currDate = new Date().toISOString()
    const { data: AddedProgram, error } = await supabase.from("added_notifications_programs").select("*").eq("user_id", session?.user.id).eq('has_lectures', false).order("created_at", { ascending: false })
    if (error) {
      console.log(error)
    }
    if (AddedProgram) {
      if (AddedProgram) {
        const ProgramInfo = await Promise.all(
          AddedProgram.map(async (Program) => {
            const { data: ProgramInfo, error } = await supabase.from("programs").select("*").eq("program_id", Program.program_id).single()
            return ProgramInfo
          })
        )

        setAddedPrograms(ProgramInfo)
      }
    }
  }
  const getAddedLecturePrograms = async () => {
    const currDate = new Date().toISOString()
    const { data: AddedProgram, error } = await supabase.from("added_notifications_programs").select("*").eq("user_id", session?.user.id).eq('has_lectures', true).order("created_at", { ascending: false })
    if (error) {
      console.log(error)
    }
    if (AddedProgram) {
      const ProgramInfo = await Promise.all(
        AddedProgram.map(async (Program) => {
          const { data: ProgramInfo, error } = await supabase.from("programs").select("*").eq("program_id", Program.program_id).single()
          return ProgramInfo
        })
      )

      setAddedProgramLectures(ProgramInfo)
    }
  }
  useEffect(() => {
    getAddedEvents()
    getAddedProgram()
    getAddedLecturePrograms()
    const listenForAddedEvents = supabase.channel("added notifications").on(
      "postgres_changes",
      {
        event: '*',
        schema: "public",
        table: "added_notifications_events",
        filter: `user_id=eq.${session?.user.id}`

      },
      async (payload) => await getAddedEvents()
    )
      .subscribe()

    const listenForAddedPrograms = supabase.channel("added notifications programs").on(
      "postgres_changes",
      {
        event: '*',
        schema: "public",
        table: "added_notifications_programs",
        filter: `user_id=eq.${session?.user.id}`
      },
      async (payload) => { await getAddedProgram(); await getAddedLecturePrograms() }
    )
      .subscribe()
    return () => { supabase.removeChannel(listenForAddedEvents); supabase.removeChannel(listenForAddedPrograms) }
  }, [])

  const renderScene = ({ route }: any) => {
    switch (route.key) {
      case "second":
        return <SalahTimesScreen />
      case "third":
        return <ClassesScreen addedPrograms={addedPrograms} layout={layout} />
      case "fourth":
        return <LecturesScreen addedPrograms={addedLecturePrograms} layout={layout} />
      case "fifth":
        return <NotificationEventsScreen addedEvents={addedEvents} layout={layout} />
    }
  }
  const routes = [
    //{ key: 'first', title: 'Paid' },
    { key: 'second', title: 'Prayer' },
    { key: 'third', title: 'Classes' },
    { key: 'fourth', title: 'Lectures' },
    { key: 'fifth', title: 'Events' },
  ]

  // const renderTabBar = (props : any) => (
  //   <TabBar
  //     {...props}
  //     indicatorStyle={{ backgroundColor : "#57BA47", position: "absolute", zIndex : -1, bottom : "8%", left : "1%", height: "85%", width : "23%", borderRadius : 20  }}
  //     style={{ backgroundColor: '#0D509D', alignSelf : "center",  height: '9%'}}
  //     labelStyle={{ color : "white", fontWeight : "bold" }}
  //     tabStyle={{ width : layout / 3.5 }}
  //     scrollEnabled={true}
  //   />
  // );
  //#0D509D
  const router = useRouter()
  const navigation = useNavigation()
  return (
    <>
      <Stack.Screen options={{
        title: "Notification Center",
        headerBackTitleVisible: false, headerTintColor: '#007AFF', headerTitleStyle: { color: 'black' }, headerStyle: { backgroundColor: 'white' },
        headerLeft: () => (
          <Pressable className='items-start mr-2' onPress={() => {
            navigation.getParent()?.getState().index == 0 ? router.replace('/myPrograms') : router.back()
          }}>
            <Icon source={'chevron-left'} color='black' size={30} />
          </Pressable>
        ),

      }} />
      <View className='bg-[#ededed]' />
      {/* Custom Tab Bar */}
      <View style={{ backgroundColor: '#0D509D', paddingVertical: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8 }}>
          {routes.map((route, routeIndex) => (
            <Pressable
              key={route.key}
              onPress={() => setIndex(routeIndex)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginHorizontal: 4,
                borderRadius: 8,
                backgroundColor: index === routeIndex ? '#57BA47' : 'transparent',
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
                {route.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {/* Tab Content */}
      <View style={{ flex: 1, backgroundColor: '#ededed' }}>
        {renderScene({ route: routes[index] })}
      </View>
    </>
  )
}


{
  /*
        <ScrollView className='bg-white flex-1'>
      <Stack.Screen options={{title : 'Notification Center', headerBackTitleVisible : false}}/>
      <View className='flex-col w-[100%] flex-wrap justify-center mt-5' >
        <View>
          <Text className='text-2xl font-bold'>Events :</Text>
        </View> 

        <View className='mt-2 flex-row w-[100%] flex-wrap justify-center' >
        {addedEvents ? addedEvents.map((event, index) => {
          return(
            <View className='pb-5 justify-between mx-2' key={index}>
              <RenderAddedEvents event_id={event.event_id} />
            </View>
          )
        }) : <></>}
        </View>


        <View>
          <Text className='text-2xl font-bold'>Programs :</Text>
        </View> 

        <View className='mt-2 flex-row w-[100%] flex-wrap justify-center' >
        {addedPrograms ? addedPrograms.map((program, index) => {
          return(
            <View className='pb-5 justify-between mx-2' key={index}>
              <RenderAddedPrograms program_id={program.program_id} />
            </View>
          )
        }) : <></>}
        </View>

      </View>
    </ScrollView>
  */
}

export default NotificationEvents
