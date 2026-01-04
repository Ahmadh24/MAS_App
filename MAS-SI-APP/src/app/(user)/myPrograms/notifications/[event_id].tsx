import { View, Text, Dimensions, ScrollView, StatusBar, useWindowDimensions, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import { EventsType } from '@/src/types'
import { useAuth } from '@/src/providers/AuthProvider'
import { supabase } from '@/src/lib/supabase'
import { Stack, useLocalSearchParams } from 'expo-router'
import Animated, { interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset } from 'react-native-reanimated'
import NotificationCard from './NotificationCard'
import { Icon } from 'react-native-paper'
import NotificationEventCard from './NotificationEventCard'
import { LinearGradient } from 'expo-linear-gradient'
const NotificationEventSettings = () => {
  const { event_id } = useLocalSearchParams()
  const { session } = useAuth()
  const [event, setEvent] = useState<EventsType>()
  const [speaker, setSpeakers] = useState<string[]>([])
  const layout = useWindowDimensions().width
  const layoutHeight = useWindowDimensions().height
  const [scrollY, setScrollY] = useState(0)
  const [active, setActive] = useState(0)
  const [selectedNotification, setSelectedNotification] = useState<number[]>([])
  const NOTICARDHEIGHT = layoutHeight / 12
  const NOTICARDWIDTH = layout * 0.95

  const getEvent = async () => {
    const { data, error } = await supabase.from('events').select("*").eq("event_id", event_id).single()
    if (data) {
      setEvent(data)
      const Speakers: string[] = []
      await Promise.all(
        data.event_speaker.map(async (speaker: string) => {
          const { data: speaker_name } = await supabase.from('speaker_data').select('speaker_name').eq('speaker_id', speaker).single()
          const name = speaker_name?.speaker_name
          Speakers.push(name)
        })
      )
      setSpeakers(Speakers)
    }
  }
  const { width } = Dimensions.get("window")
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollOffset = useScrollViewOffset(scrollRef)
  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-250, 0, 250],
            [-250 / 2, 0, 250 * 0.75]
          )
        },
        {
          scale: interpolate(scrollOffset.value, [-250, 0, 250], [2, 1, 1])
        }
      ]
    }
  })

  const handleScroll = (event: any) => {
    const scrollPositon = event.nativeEvent.contentOffset.y
    const index = scrollPositon / NOTICARDHEIGHT
    setActive(index)
  }
  useEffect(() => {
    getEvent()
  }, [])

  const array = [1, 2, 3]
  return (
    <LinearGradient
      colors={['#1d4681', '#3183bf']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar barStyle={"light-content"} />
      <Stack.Screen options={{ 
        title: '', 
        headerStyle: { backgroundColor: "transparent" },
        headerTransparent: true,
        headerTintColor: 'white',
      }} />
      <Animated.ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        contentContainerStyle={{ justifyContent: "center", alignItems: "center", marginTop: "15%", paddingBottom: 40 }}
      >

        <Animated.Image
          source={event?.event_img ? { uri: event.event_img } : require("@/assets/images/MASHomeLogo.png")}
          style={[{ width: width / 1.2, height: 300, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }, imageAnimatedStyle]}
          resizeMode='stretch'
        />
        <View style={{ width: '100%', paddingVertical: 20 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 24, textAlign: 'center', color: 'white' }}>{event?.event_name}</Text>
          <Text style={{ fontWeight: '600', textAlign: 'center', color: '#6EE7B7' }}>{speaker ? speaker.join(' & ') : ''}</Text>
        </View>

        <View style={{ marginLeft: 8, marginTop: 16, width: '100%', paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: 'white' }}>Notification Options</Text>
        </View>
        <View style={{ width: '100%', alignItems: 'center', paddingTop: 12 }}>
          {
            array.map((item, index) => {
              return (
                <View className='flex-col' key={index}>
                  <View className='flex-row items-center justify-center'>
                    <NotificationEventCard height={NOTICARDHEIGHT} width={NOTICARDWIDTH} index={index} scrollY={scrollY} setSelectedNotification={setSelectedNotification} selectedNotification={selectedNotification} event_id={event_id} eventInfo={event!} />
                  </View>
                  <View style={{ height: 10 }} />
                </View>
              )
            })
          }
        </View>
      </Animated.ScrollView>
    </LinearGradient>
  )
}

export default NotificationEventSettings