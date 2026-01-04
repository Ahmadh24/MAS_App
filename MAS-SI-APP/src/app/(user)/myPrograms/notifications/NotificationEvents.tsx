import { View, Text, ScrollView, useWindowDimensions, Button, FlatList, Pressable, ImageBackground, StyleSheet, Modal, Animated, Image } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Redirect, Stack } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { useAuth } from "@/src/providers/AuthProvider"
import { EventsType, Program } from '@/src/types'
import RenderAddedEvents from "@/src/components/UserProgramComponets/RenderAddedEvents" 
import ProgramsListProgram from '@/src/components/ProgramsListProgram'
import RenderAddedPrograms from '@/src/components/UserProgramComponets/RenderAddedPrograms'
import { TabView, TabBarProps } from 'react-native-tab-view';
import { Dialog, Icon, IconButton, Switch } from 'react-native-paper'
import { BlurView } from 'expo-blur'
import { X, Check } from 'lucide-react-native'
import { usePrayerTimes } from '@/src/hooks/usePrayerTimes'
import NotificationPrayerTable from '@/src/components/notificationPrayerTimeTable'
import { useRouter, Link } from 'expo-router'
import JummahMarquee from '@/src/components/JummahMarquee'
import { add } from 'date-fns'
import { LinearGradient } from 'expo-linear-gradient'
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass'
import HeroTransitionModal, { LayoutInfo } from '@/src/components/HeroTransitionModal'

// Commented out - NotificationPaidScreen component (unused)
/*
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
*/

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

type ProgramsScreenProp = {
  addedPrograms: Program[]
  addedLecturePrograms: Program[]
  addedEvents: EventsType[]
  layout: number
  onProgramHeroPress?: (program: Program, layout: LayoutInfo) => void
  onEventHeroPress?: (event: EventsType, layout: LayoutInfo) => void
}

const ProgramsScreen = ({ addedPrograms, addedLecturePrograms, addedEvents, layout, onProgramHeroPress, onEventHeroPress }: ProgramsScreenProp) => {
  const tabBarHeight = 120

  const hasClasses = addedPrograms && addedPrograms.length > 0
  const hasLectures = addedLecturePrograms && addedLecturePrograms.length > 0
  const hasEvents = addedEvents && addedEvents.length > 0
  const hasAnyContent = hasClasses || hasLectures || hasEvents

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={{ fontSize: 18, fontWeight: '700', color: 'white', marginBottom: 12, marginTop: 20, paddingHorizontal: 20 }}>
      {title}
    </Text>
  )

  const EmptyState = () => (
    <View style={{ paddingHorizontal: 28, paddingTop: 40 }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 24, textAlign: 'center', marginBottom: 16, color: 'white' }}>
          Start adding programs to your notifications
        </Text>
        <Icon source={"bell"} color="#6EE7B7" size={40} />
      </View>
      <View style={{ height: 40 }} />
      <View>
        <Text style={{ fontWeight: 'bold', fontSize: 18, textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
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
                <RenderAddedPrograms programInfo={item} onHeroPress={onProgramHeroPress} />
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
                <RenderAddedPrograms programInfo={item} onHeroPress={onProgramHeroPress} />
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
                <RenderAddedEvents eventsInfo={item} onHeroPress={onEventHeroPress} />
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
  const { data: prayerTimesWeek } = usePrayerTimes();
  if (!prayerTimesWeek || prayerTimesWeek.length == 0) {
    return <View style={{ flex: 1, backgroundColor: 'transparent' }} />
  }
  const [tableIndex, setTableIndex] = useState(0)

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
  const [addedEvents, setAddedEvents] = useState<EventsType[]>([])
  const [addedPrograms, setAddedPrograms] = useState<Program[]>([])
  const [addedLecturePrograms, setAddedProgramLectures] = useState<Program[]>([])
  const [index, setIndex] = useState(0)
  const layout = useWindowDimensions().width

  // Hero transition modal state
  const [heroModalVisible, setHeroModalVisible] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventsType | null>(null)
  const [heroLayoutInfo, setHeroLayoutInfo] = useState<LayoutInfo | null>(null)

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

  const JummahScreen = () => {
    const tabBarHeight = 120
    const jummahTimes = ['12:15 PM', '1:00 PM', '1:45 PM', '3:45 PM']
    
    // Modal state
    const [jummahModalVisible, setJummahModalVisible] = useState(false)
    const [selectedJummah, setSelectedJummah] = useState<number | null>(null)
    const blurOpacity = useRef(new Animated.Value(0)).current
    
    // Jummah notification settings
    const [jummahSettings, setJummahSettings] = useState<{[key: number]: { enabled: boolean; option: string }}>({
      1: { enabled: false, option: 'jummah_time' },
      2: { enabled: false, option: 'jummah_time' },
      3: { enabled: false, option: 'jummah_time' },
      4: { enabled: false, option: 'jummah_time' },
    })
    
    // Animate blur when modal opens
    useEffect(() => {
      if (jummahModalVisible) {
        const timeout = setTimeout(() => {
          Animated.timing(blurOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start()
        }, 300)
        return () => clearTimeout(timeout)
      } else {
        blurOpacity.setValue(0)
      }
    }, [jummahModalVisible])
    
    const handleToggle = (jummahIndex: number) => {
      const currentEnabled = jummahSettings[jummahIndex]?.enabled
      
      if (!currentEnabled) {
        setSelectedJummah(jummahIndex)
        setJummahModalVisible(true)
      }
      
      setJummahSettings(prev => ({
        ...prev,
        [jummahIndex]: {
          ...prev[jummahIndex],
          enabled: !currentEnabled,
        }
      }))
    }
    
    const handleOptionSelect = (option: string) => {
      if (selectedJummah) {
        setJummahSettings(prev => ({
          ...prev,
          [selectedJummah]: {
            ...prev[selectedJummah],
            option: option,
          }
        }))
      }
    }
    
    const handleCloseModal = () => {
      setJummahModalVisible(false)
      setSelectedJummah(null)
    }
    
    const handleSave = () => {
      console.log('Saving Jummah settings for:', selectedJummah, jummahSettings[selectedJummah!])
      handleCloseModal()
    }
    
    const notificationOptions = [
      { key: 'jummah_time', title: 'Notify at Jummah Time:', description: 'Get notified exactly when Jummah starts' },
      { key: '30_min_before', title: 'Notify 30 minutes before:', description: 'Get reminded 30 minutes before Jummah' },
      { key: '1_hour_before', title: 'Notify 1 hour before:', description: 'Get reminded 1 hour before Jummah' },
      { key: 'mute', title: 'Mute', description: '' },
    ]

    const JummahCard = ({ time, index }: { time: string, index: number }) => {
      const isEnabled = jummahSettings[index + 1]?.enabled || false
      
      return (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 20,
            paddingHorizontal: 18,
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderRadius: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 18,
              overflow: 'hidden',
            }}
          >
            <Image
              source={require('@/assets/images/JummahIcon.png')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: 'white', marginBottom: 6 }}>
              Jummah Prayer {index + 1}
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '500', color: '#6EE7B7' }}>
              {time}
            </Text>
          </View>
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Switch
              value={isEnabled}
              onValueChange={() => handleToggle(index + 1)}
              color="#6EE7B7"
            />
          </View>
        </View>
      )
    }

    return (
      <>
        <ScrollView
          style={{ flex: 1, backgroundColor: 'transparent' }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: tabBarHeight }}
        >
          {jummahTimes.map((time, idx) => (
            <JummahCard key={idx} time={time} index={idx} />
          ))}
        </ScrollView>
        
        {/* Modal for Notification Settings */}
        <Modal
          visible={jummahModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseModal}
        >
          <View style={jummahStyles.modalOverlay}>
            {/* Animated blur background */}
            <Animated.View style={[jummahStyles.blurContainer, { opacity: blurOpacity }]}>
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            </Animated.View>
            
            <View style={jummahStyles.modalContent}>
              {/* Handle Indicator */}
              <View style={jummahStyles.modalIndicator} />
              
              {/* Header */}
              <View style={jummahStyles.sheetHeader}>
                <Text style={jummahStyles.sheetTitle}>
                  Jummah {selectedJummah} notification settings
                </Text>
                <Pressable onPress={handleCloseModal} style={jummahStyles.closeButton}>
                  <X color="rgba(255, 255, 255, 0.7)" size={24} />
                </Pressable>
              </View>

              {/* Options */}
              <View style={jummahStyles.optionsContainer}>
                {notificationOptions.map((option) => (
                  <Pressable 
                    key={option.key}
                    style={jummahStyles.optionRow}
                    onPress={() => handleOptionSelect(option.key)}
                  >
                    <View style={[
                      jummahStyles.radioOuter,
                      jummahSettings[selectedJummah || 1]?.option === option.key && jummahStyles.radioOuterSelected
                    ]}>
                      {jummahSettings[selectedJummah || 1]?.option === option.key && (
                        <View style={jummahStyles.radioInner} />
                      )}
                    </View>
                    <View style={jummahStyles.optionTextContainer}>
                      <Text style={jummahStyles.optionTitle}>{option.title}</Text>
                      {option.description ? (
                        <Text style={jummahStyles.optionDescription}>{option.description}</Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </View>

              {/* Save Button */}
              <Pressable style={jummahStyles.saveButton} onPress={handleSave}>
                <Check color="#6EE7B7" size={20} strokeWidth={2.5} style={{ marginRight: 8 }} />
                <Text style={jummahStyles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </>
    )
  }

  const routes = [
    { key: 'prayer', title: 'Prayer' },
    { key: 'programs', title: 'Programs' },
    { key: 'jummah', title: 'Jummah' },
  ]

  const renderScene = ({ route }: any) => {
    switch (route.key) {
      case "prayer":
        return <SalahTimesScreen />
      case "programs":
        return <ProgramsScreen
          addedPrograms={addedPrograms}
          addedLecturePrograms={addedLecturePrograms}
          addedEvents={addedEvents}
          layout={layout}
          onProgramHeroPress={handleProgramHeroPress}
          onEventHeroPress={handleEventHeroPress}
        />
      case "jummah":
        return <JummahScreen />
    }
  }

  const renderTabBar = (props: TabBarProps<any>) => (
    <View style={{ 
      paddingTop: 70, 
      paddingBottom: 16,
      paddingHorizontal: 20,
    }}>
      <View
        style={{ 
          flexDirection: 'row', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: 12,
        }}
      >
        {props.navigationState.routes.map((route, i) => {
          const isActive = props.navigationState.index === i;

          return (
            <Pressable
              key={route.key}
              onPress={() => props.jumpTo(route.key)}
              style={{
                borderRadius: 999,
                paddingVertical: 12,
                paddingHorizontal: 24,
                backgroundColor: isActive 
                  ? 'rgba(110, 231, 183, 0.25)' 
                  : 'rgba(255, 255, 255, 0.15)',
                borderWidth: 1.5,
                borderColor: isActive 
                  ? 'rgba(110, 231, 183, 0.5)' 
                  : 'rgba(255, 255, 255, 0.25)',
              }}
            >
              <Text style={{
                color: isActive ? '#6EE7B7' : 'white',
                fontWeight: '600',
                fontSize: 15,
              }}>
                {route.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
  const router = useRouter()
  return (
    <>
    <Stack.Screen options={{ 
        headerShown: false,
      }} />
      <LinearGradient
        colors={['#1d4681', '#3183bf']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Custom Header */}
          <View style={{ paddingTop: 10, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon source="chevron-left" color="white" size={28} />
            </Pressable>
            <Text style={{ 
              color: 'white', 
              fontSize: 20, 
              fontWeight: '600', 
              flex: 1, 
              textAlign: 'center',
              marginRight: 40,
            }}>
              Notification Center
            </Text>
          </View>

          {/* Manual Tab Bar */}
          <View style={{ paddingTop: 20, paddingBottom: 16, paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
              {routes.map((route, i) => {
                const isActive = index === i;
                return (
                  <Pressable
                    key={route.key}
                    onPress={() => setIndex(i)}
                    style={{
                      borderRadius: 999,
                      paddingVertical: 12,
                      paddingHorizontal: 24,
                      backgroundColor: isActive 
                        ? 'rgba(110, 231, 183, 0.25)' 
                        : 'rgba(255, 255, 255, 0.15)',
                      borderWidth: 1.5,
                      borderColor: isActive 
                        ? 'rgba(110, 231, 183, 0.5)' 
                        : 'rgba(255, 255, 255, 0.25)',
                    }}
                  >
                    <Text style={{
                      color: isActive ? '#6EE7B7' : 'white',
                      fontWeight: '600',
                      fontSize: 15,
                    }}>
                      {route.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Content based on selected tab */}
          <View style={{ flex: 1, minHeight: 500 }}>
            {index === 0 && <SalahTimesScreen />}
            {index === 1 && (
              <ProgramsScreen
                addedPrograms={addedPrograms}
                addedLecturePrograms={addedLecturePrograms}
                addedEvents={addedEvents}
                layout={layout}
                onProgramHeroPress={handleProgramHeroPress}
                onEventHeroPress={handleEventHeroPress}
              />
            )}
            {index === 2 && <JummahScreen />}
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Hero Transition Modal */}
      <HeroTransitionModal
        visible={heroModalVisible}
        onClose={handleHeroModalClose}
        imageUri={selectedProgram?.program_img || selectedEvent?.event_img || null}
        title={selectedProgram?.program_name || selectedEvent?.event_name || ''}
        subtitle={selectedProgram ? 'Program' : selectedEvent ? 'Event' : ''}
        layoutInfo={heroLayoutInfo}
        program={selectedProgram}
        event={selectedEvent}
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabPressable: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  activeTabPressable: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(110, 231, 183, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.5)',
    borderRadius: 999,
  },
  activeTabTextGlass: {
    color: '#6EE7B7',
    fontWeight: '600',
    fontSize: 15,
  },
  inactiveTabTextGlass: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    fontSize: 15,
  },
})

const jummahStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#1a3a5c',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    gap: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6EE7B7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioOuterSelected: {
    backgroundColor: '#6EE7B7',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1a3a5c',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: 'rgba(110, 231, 183, 0.25)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(110, 231, 183, 0.5)',
  },
  saveButtonText: {
    color: '#6EE7B7',
    fontSize: 16,
    fontWeight: '600',
  },
})
