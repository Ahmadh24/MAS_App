import { View, Text, ScrollView, useWindowDimensions, Button, FlatList, Pressable, ImageBackground, StyleSheet } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Redirect, Stack, useNavigation } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import{ useAuth } from "@/src/providers/AuthProvider"
import { EventsType, Program } from '@/src/types'
import RenderAddedEvents from "@/src/components/UserProgramComponets/RenderAddedEvents" 
import ProgramsListProgram from '@/src/components/ProgramsListProgram'
import RenderAddedPrograms from '@/src/components/UserProgramComponets/RenderAddedPrograms'
import { TabView, SceneMap, TabBar, TabBarProps } from 'react-native-tab-view';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { Dialog, Icon, IconButton } from 'react-native-paper'
import { usePrayer } from '@/src/providers/prayerTimesProvider'
import NotificationPrayerTable from '@/src/components/notificationPrayerTimeTable'
import { useRouter, Link } from 'expo-router'
import JummahMarquee from '@/src/components/JummahMarquee'
import { add } from 'date-fns'
import { LinearGradient } from 'expo-linear-gradient'
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass'
import HeroTransitionModal, { LayoutInfo } from '@/src/components/HeroTransitionModal'
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
          <View>
            <Text className='font-bold text-xl text-center'>Add programs and events by tapping the <Icon source={"bell"} color="#007AFF" size={20}/> or sliding right on the flyer name</Text>
          </View>
        </View>
      </ScrollView>
    )
  }

  */}
type NotificationEventsScreenProp = {
  addedEvents : EventsType[] | null
  layout: number
}
const NotificationEventsScreen = ( { addedEvents, layout } : NotificationEventsScreenProp) => {
  const tabBarHeight = useBottomTabBarHeight() + 30
  return(
    <ScrollView className='w-[100%]' contentContainerStyle={{ flexDirection : "row", flexWrap : "wrap", paddingBottom : tabBarHeight }}>
        {
          addedEvents && addedEvents.length > 0? addedEvents.map((item, index) => {
            return (
            <View key={index} style={{ width : layout / 2, justifyContent : "center", alignItems : "center", paddingTop : 10}}>
              <RenderAddedEvents eventsInfo={item}/>
            </View>
          )
          }) :  
          ( 
            <View className='px-7'>
            <View className='items-center'>
              <Text className='font-bold text-2xl text-center'>Start adding flyers to make your notifications list</Text>
              <Icon source={"bell"} color="#007AFF" size={40}/>
            </View>
            <View className='pb-[50%]'/>
            <View>
              <Text className='font-bold text-xl text-center'>Add programs and events by tapping the <Icon source={"bell"} color="#007AFF" size={20}/> or sliding right on the flyer name</Text>
            </View>
          </View>
          )
        }
    </ScrollView>
  )
}
type ClassesScreenProp = {
  addedPrograms : Program[]
  layout: number
}

const ClassesScreen = ( { addedPrograms, layout } : ClassesScreenProp) => {
  const tabBarHeight = useBottomTabBarHeight() + 30

  return(
    <ScrollView className='w-[100%]' contentContainerStyle={{ flexDirection : "row", flexWrap : "wrap", paddingBottom : tabBarHeight }}>
        {
          addedPrograms && addedPrograms.length > 0 ? addedPrograms.map(( item ) => {
            return(
              <View style={{ width : layout / 2, justifyContent : "center", alignItems : "center", paddingTop : 10 }}>
                <RenderAddedPrograms programInfo={item}/>
              </View>
            )
          }) : 
          ( 
          <View className='px-7'>
            <View className='items-center'>
              <Text className='font-bold text-2xl text-center'>Start adding flyers to make your notifications list</Text>
              <Icon source={"bell"} color="#007AFF" size={40}/>
            </View>
            <View className='pb-[50%]'/>
            <View>
              <Text className='font-bold text-xl text-center'>Add programs and events by tapping the <Icon source={"bell"} color="#007AFF" size={20}/> or sliding right on the flyer name</Text>
            </View>
          </View>
          )
        }
    </ScrollView>
  )
}

const LecturesScreen = ({ addedPrograms, layout } : ClassesScreenProp) => {
  const tabBarHeight = useBottomTabBarHeight() + 30

  return(
    <ScrollView className='w-[100%]' contentContainerStyle={{ flexDirection : "row", flexWrap : "wrap", paddingBottom : tabBarHeight }}>
        {
           addedPrograms.length > 0 ? addedPrograms.map(( item ) => {
            return(
              <View style={{ width : layout / 2, justifyContent : "center", alignItems : "center", paddingTop : 10 }}>
                <RenderAddedPrograms programInfo={item}/>
              </View>
            )
          }) : 
          ( 
          <View className='px-7'>
            <View className='items-center'>
              <Text className='font-bold text-2xl text-center'>Start adding flyers to make your notifications list</Text>
              <Icon source={"bell"} color="#007AFF" size={40}/>
            </View>
            <View className='pb-[50%]'/>
            <View>
              <Text className='font-bold text-xl text-center'>Add programs and events by tapping the <Icon source={"bell"} color="#007AFF" size={20}/> or sliding right on the flyer name</Text>
            </View>
          </View>
          )
        }
    </ScrollView>
  )
}

type ProgramsScreenProp = {
  addedPrograms: Program[]
  addedLecturePrograms: Program[]
  addedEvents: EventsType[]
  layout: number
  onProgramHeroPress?: (program: Program, layout: LayoutInfo) => void
  onEventHeroPress?: (event: EventsType, layout: LayoutInfo) => void
}

const ProgramsScreen = ({ addedPrograms, addedLecturePrograms, addedEvents, layout, onProgramHeroPress, onEventHeroPress }: ProgramsScreenProp) => {
  const tabBarHeight = useBottomTabBarHeight() + 30
  
  const hasClasses = addedPrograms && addedPrograms.length > 0
  const hasLectures = addedLecturePrograms && addedLecturePrograms.length > 0
  const hasEvents = addedEvents && addedEvents.length > 0
  const hasAnyContent = hasClasses || hasLectures || hasEvents

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={{ fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 12, marginTop: 20, paddingHorizontal: 20 }}>
      {title}
    </Text>
  )

  const EmptyState = () => (
    <View style={{ paddingHorizontal: 28, paddingTop: 40 }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 24, textAlign: 'center', marginBottom: 16 }}>
          Start adding programs to your notifications
        </Text>
        <Icon source={"bell"} color="#007AFF" size={40}/>
      </View>
      <View style={{ height: 40 }}/>
      <View>
        <Text style={{ fontWeight: 'bold', fontSize: 18, textAlign: 'center', color: '#666' }}>
          Add programs and events by tapping the bell icon or sliding right on the flyer name
        </Text>
      </View>
    </View>
  )

  if (!hasAnyContent) {
    return <EmptyState />
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentContainerStyle={{ paddingBottom: tabBarHeight }}
      showsVerticalScrollIndicator={false}
    >
      {/* Classes Section */}
      {hasClasses && (
        <>
          <SectionTitle title="Classes" />
          <FlatList
            horizontal
            data={addedPrograms}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 20 }}
            renderItem={({ item }) => (
              <View style={{ width: 160 }}>
                <RenderAddedPrograms programInfo={item} onHeroPress={onProgramHeroPress}/>
              </View>
            )}
            keyExtractor={(item, index) => `class-${index}`}
          />
        </>
      )}

      {/* Lectures Section */}
      {hasLectures && (
        <>
          <SectionTitle title="Lectures" />
          <FlatList
            horizontal
            data={addedLecturePrograms}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 20 }}
            renderItem={({ item }) => (
              <View style={{ width: 160 }}>
                <RenderAddedPrograms programInfo={item} onHeroPress={onProgramHeroPress}/>
              </View>
            )}
            keyExtractor={(item, index) => `lecture-${index}`}
          />
        </>
      )}

      {/* Events Section */}
      {hasEvents && (
        <>
          <SectionTitle title="Events" />
          <FlatList
            horizontal
            data={addedEvents}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 20 }}
            renderItem={({ item }) => (
              <View style={{ width: 160 }}>
                <RenderAddedEvents eventsInfo={item} onHeroPress={onEventHeroPress}/>
              </View>
            )}
            keyExtractor={(item, index) => `event-${index}`}
          />
        </>
      )}
    </ScrollView>
  )
}
const SalahTimesScreen = () => {
  const { prayerTimesWeek } = usePrayer();
  if( prayerTimesWeek.length == 0 ){
    return <View style={{ flex: 1, backgroundColor: 'transparent' }} />
  }
  const [ tableIndex, setTableIndex ] = useState(0)

  // Use the first day's prayer times for now (today)
  const todayPrayerData = prayerTimesWeek[0] || prayerTimesWeek[tableIndex];

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      {todayPrayerData && (
        <NotificationPrayerTable 
          prayerData={todayPrayerData} 
          setTableIndex={setTableIndex} 
          tableIndex={tableIndex} 
          index={0}
        />
      )}
    </View>
  )
}


const NotificationEvents = () => {
  const { session } = useAuth()
  const [ addedEvents, setAddedEvents ] = useState<EventsType[]>([])
  const [ addedPrograms, setAddedPrograms ] = useState<Program[]>([])
  const [ addedLecturePrograms, setAddedProgramLectures ] = useState<Program[]>([])
  const [ index, setIndex ] = useState(0)
  const layout = useWindowDimensions().width
  const tabBarHeight = useBottomTabBarHeight()
  
  // Hero transition modal state
  const [heroModalVisible, setHeroModalVisible] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventsType | null>(null)
  const [heroLayoutInfo, setHeroLayoutInfo] = useState<LayoutInfo | null>(null)
  const router = useRouter()

  // Hero transition handlers
  const handleProgramHeroPress = (program: Program, layoutInfo: LayoutInfo) => {
    setSelectedProgram(program)
    setSelectedEvent(null)
    setHeroLayoutInfo(layoutInfo)
    setHeroModalVisible(true)
  }

  const handleEventHeroPress = (event: EventsType, layoutInfo: LayoutInfo) => {
    setSelectedEvent(event)
    setSelectedProgram(null)
    setHeroLayoutInfo(layoutInfo)
    setHeroModalVisible(true)
  }

  const handleHeroModalClose = () => {
    setHeroModalVisible(false)
    // Small delay to let animation complete before clearing data
    setTimeout(() => {
      setSelectedProgram(null)
      setSelectedEvent(null)
      setHeroLayoutInfo(null)
    }, 300)
  }

  const handleHeroNavigate = () => {
    setHeroModalVisible(false)
    setTimeout(() => {
      if (selectedProgram) {
        router.push(`/myPrograms/notifications/ClassesAndLectures/${selectedProgram.program_id}`)
      } else if (selectedEvent) {
        router.push(`/myPrograms/notifications/${selectedEvent.event_id}`)
      }
      setSelectedProgram(null)
      setSelectedEvent(null)
      setHeroLayoutInfo(null)
    }, 100)
  }
  const getAddedEvents = async () => {
    const { data : AddedEvents ,error } = await supabase.from("added_notifications_events").select("*").eq("user_id", session?.user.id).order("created_at", { ascending : false })
    if( error ){
        console.log( error)
    }
    if( AddedEvents ){
      const EventInfo = await Promise.all(
        AddedEvents.map( async ( event ) => {
          const { data : eventInfo , error } = await supabase.from('events').select('*').eq('event_id', event.event_id).single()
          return eventInfo
        })
      )
      setAddedEvents(EventInfo)
    }
  }

  const getAddedProgram = async () => {
    const currDate = new Date().toISOString()
    const { data : AddedProgram, error } = await supabase.from("added_notifications_programs").select("*").eq("user_id", session?.user.id).eq('has_lectures', false).order("created_at", { ascending : false })
    if( error ){
      console.log( error )
    }
    if( AddedProgram ){
      if( AddedProgram ){
        const ProgramInfo =  await Promise.all(
          AddedProgram.map( async (Program) => {
            const { data : ProgramInfo, error } = await supabase.from("programs").select("*").eq("program_id", Program.program_id).single()
            return ProgramInfo
          })
        )
  
        setAddedPrograms(ProgramInfo)
      }
    }
  }
  const getAddedLecturePrograms = async () => {
    const currDate = new Date().toISOString()
    const { data: AddedProgram , error } = await supabase.from("added_notifications_programs").select("*").eq("user_id", session?.user.id).eq('has_lectures', true).order("created_at", { ascending : false })
    if( error ){
      console.log( error )
    }
    if( AddedProgram ){
      const ProgramInfo =  await Promise.all(
        AddedProgram.map( async (Program) => {
          const { data : ProgramInfo, error } = await supabase.from("programs").select("*").eq("program_id", Program.program_id).single()
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
          schema : "public",
          table: "added_notifications_events",
          filter:`user_id=eq.${session?.user.id}`

        },
        async (payload) => await getAddedEvents()
      )
      .subscribe()

      const listenForAddedPrograms = supabase.channel("added notifications programs").on(
        "postgres_changes",
        {
          event: '*',
          schema : "public",
          table: "added_notifications_programs",
          filter:`user_id=eq.${session?.user.id}`
        },
        async (payload) => {await getAddedProgram(); await getAddedLecturePrograms()}
      )
      .subscribe()
      return () => { supabase.removeChannel( listenForAddedEvents ) ; supabase.removeChannel( listenForAddedPrograms )}
  },[])

const JummahScreen = () => {
  const tabBarHeight = useBottomTabBarHeight() + 30
  const jummahTimes = ['12:15 PM', '1:00 PM', '1:45 PM', '3:45 PM']
  
  const JummahCard = ({ time, index }: { time: string, index: number }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: isLiquidGlassSupported ? 'transparent' : 'white',
      }}
    >
      <LinearGradient
        colors={['#007AFF', '#0EA5E9', '#38BDF8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 50,
          height: 50,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        }}
      >
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
          {index + 1}
        </Text>
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 }}>
          Jummah Prayer {index + 1}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#666666' }}>
          {time}
        </Text>
      </View>
      {isLiquidGlassSupported ? (
        <LiquidGlassView
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
          effect="regular"
        >
          <Text style={{ color: '#1a1a1a', fontSize: 14, fontWeight: '600' }}>›</Text>
        </LiquidGlassView>
      ) : (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: '#E5E7EB',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#666666', fontSize: 12 }}>›</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: tabBarHeight }}
    >
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 20 }}>Jummah Notifications</Text>
      <View style={{ gap: 12 }}>
        {
          jummahTimes.map((time, idx) => (
            <Link 
              href={{
                pathname: `/(user)/myPrograms/notifications/Prayer/Jummah/[jummahDetails]`,
                params: { jummahName: time, index: idx + 1 }
              }}
              key={idx}
              asChild
            >
              <Pressable>
                {isLiquidGlassSupported ? (
                  <LiquidGlassView
                    style={{
                      borderRadius: 16,
                      overflow: 'hidden',
                    }}
                    interactive
                    effect="clear"
                  >
                    <JummahCard time={time} index={idx} />
                  </LiquidGlassView>
                ) : (
                  <View
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 12,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 3,
                    }}
                  >
                    <JummahCard time={time} index={idx} />
                  </View>
                )}
              </Pressable>
            </Link>
          ))
        }
      </View>
    </ScrollView>
  )
}

const renderScene = ({ route } : any) => {
  switch( route.key ){
    case "prayer" :
         return <SalahTimesScreen />
    case "programs" :
       return <ProgramsScreen 
         addedPrograms={addedPrograms} 
         addedLecturePrograms={addedLecturePrograms} 
         addedEvents={addedEvents} 
         layout={layout}
         onProgramHeroPress={handleProgramHeroPress}
         onEventHeroPress={handleEventHeroPress}
       /> 
    case "jummah" :
      return <JummahScreen />
  }
}
  const routes = [
    { key : 'prayer', title: 'Prayer'},
    { key: 'programs', title: 'Programs' },
    { key : 'jummah', title: 'Jummah'},
    ]

  const renderTabBar = (props : TabBarProps<any>) => (
    <View style={{ backgroundColor: 'transparent', paddingTop: 16, paddingBottom: 12 }}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        style={{ flexGrow: 0 }}
      >
        {props.navigationState.routes.map((route, i) => {
          const isActive = props.navigationState.index === i;
          
          if (isActive) {
            // Active tab with liquid glass
            return isLiquidGlassSupported ? (
              <LiquidGlassView
                key={route.key}
                style={tabStyles.activeTabGlass}
                interactive
                effect="regular"
              >
                <Pressable
                  onPress={() => props.jumpTo(route.key)}
                  style={tabStyles.activeTabPressable}
                >
                  <Text style={tabStyles.activeTabTextGlass}>
                    {route.title}
                  </Text>
                </Pressable>
              </LiquidGlassView>
            ) : (
              <Pressable
                key={route.key}
                onPress={() => props.jumpTo(route.key)}
                style={{
                  borderRadius: 999,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  backgroundColor: '#0EA5E9',
                }}
              >
                <Text style={{
                  color: 'white',
                  fontWeight: '600',
                  fontSize: 15,
                }}>
                  {route.title}
                </Text>
              </Pressable>
            );
          }
          
          // Inactive tab with liquid glass
          return isLiquidGlassSupported ? (
            <LiquidGlassView
              key={route.key}
              style={tabStyles.inactiveTabGlass}
              interactive
              effect="clear"
            >
              <Pressable
                onPress={() => props.jumpTo(route.key)}
                style={tabStyles.tabPressable}
              >
                <Text style={tabStyles.inactiveTabTextGlass}>
                  {route.title}
                </Text>
              </Pressable>
            </LiquidGlassView>
          ) : (
            <Pressable
              key={route.key}
              onPress={() => props.jumpTo(route.key)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 999,
                backgroundColor: '#E5E7EB',
              }}
            >
              <Text style={{
                color: '#6B7280',
                fontWeight: '600',
                fontSize: 15,
              }}>
                {route.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
 //#0D509D
  const navigation = useNavigation()
  return (
    <>
    <Stack.Screen options={{ 
      title : "Notification Center", 
      headerBackTitle: '',
      headerTintColor : '#007AFF', 
      headerTitleStyle: { color : 'black', fontWeight: '600' },
      headerShadowVisible: false,
      headerLeft: () => (
        <Pressable 
          onPress={() => router.back()}
          style={{ 
            marginLeft: 0, 
            width: 40, 
            height: 40, 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <Icon source="chevron-left" color="#007AFF" size={28} />
        </Pressable>
      ),
    }}/>
    <LinearGradient
      colors={['#FFFFFF', '#6BA8D1']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout }}
        renderTabBar={renderTabBar}
        style={{ backgroundColor: 'transparent' }}
      />
    </LinearGradient>

    {/* Hero Transition Modal */}
    <HeroTransitionModal
      visible={heroModalVisible}
      onClose={handleHeroModalClose}
      imageUri={selectedProgram?.program_img || selectedEvent?.event_img || null}
      title={selectedProgram?.program_name || selectedEvent?.event_name || ''}
      subtitle={selectedProgram ? 'Program' : selectedEvent ? 'Event' : ''}
      layoutInfo={heroLayoutInfo}
      onNavigate={handleHeroNavigate}
    />
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

const tabStyles = StyleSheet.create({
  activeTabGlass: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  inactiveTabGlass: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  tabPressable: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  activeTabPressable: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#38A3D1',
  },
  activeTabTextGlass: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  inactiveTabTextGlass: {
    color: '#4a4a4a',
    fontWeight: '600',
    fontSize: 15,
  },
})
