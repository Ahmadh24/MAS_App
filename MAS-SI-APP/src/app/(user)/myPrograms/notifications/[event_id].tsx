import { View, Text, Dimensions, ScrollView, StatusBar, useWindowDimensions, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import { EventsType } from '@/src/types'
import { useAuth } from '@/src/providers/AuthProvider'
import { supabase } from '@/src/lib/supabase'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import Animated, { interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset } from 'react-native-reanimated'
import NotificationCard from './NotificationCard'
import { Icon } from 'react-native-paper'
import NotificationEventCard from './NotificationEventCard'
const NotificationEventSettings = () => {
  const { event_id } = useLocalSearchParams()
  const { session } = useAuth()
  const [ event, setEvent ] = useState<EventsType>() 
  const [ speaker, setSpeakers ] = useState<string[]>([])
  const layout = useWindowDimensions().width
  const layoutHeight = useWindowDimensions().height
  const [ scrollY, setScrollY ] = useState(0)
  const [ active, setActive ] = useState(0)
  const [ selectedNotification, setSelectedNotification ] = useState<number[]>([])
  const NOTICARDHEIGHT  = layoutHeight / 12
  const NOTICARDWIDTH  = layout * 0.95

  const getEvent = async( ) => {
    const { data, error } = await supabase.from('events').select("*").eq("event_id", event_id ).single()
    if( data ){
      setEvent(data)
      const Speakers : string[] = []
      await Promise.all(
        data.event_speaker.map( async ( speaker : string ) => {
          const { data : speaker_name } = await supabase.from('speaker_data').select('speaker_name').eq('speaker_id', speaker).single()
          const name = speaker_name?.speaker_name
          Speakers.push(name)
        })
      )
      setSpeakers(Speakers)
    }
  }
  const tabBarHeight = useBottomTabBarHeight() + 30
  const { width } = Dimensions.get("window")
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollOffset = useScrollViewOffset(scrollRef)
  const imageAnimatedStyle = useAnimatedStyle(() => {
    return{
      transform: [
        {
          translateY : interpolate(
          scrollOffset.value,
          [-250, 0, 250 ],
          [-250/2, 0, 250 * 0.75]
          )
        },
        {
          scale: interpolate(scrollOffset.value, [-250, 0, 250], [2, 1, 1])
        }
      ]
    }
  })

  const handleScroll = (event : any) =>{
      const scrollPositon = event.nativeEvent.contentOffset.y
      const index = scrollPositon / NOTICARDHEIGHT 
      setActive(index)
    }
  useEffect(() => {
    getEvent()
  },[])

  const array = [ 1, 2, 3]
  return (
    <View className='flex-1 bg-white' style={{flexGrow: 1}}>
     <StatusBar barStyle={"dark-content"}/>
     <Stack.Screen options={{ title : '',  headerStyle : {backgroundColor : "white"}}}/>
      <Animated.ScrollView 
      ref={scrollRef}  
      scrollEventThrottle={16} 
      contentContainerStyle={{justifyContent: "center", alignItems: "center", marginTop: "2%", backgroundColor : "white", paddingBottom : tabBarHeight}} 
      >
          
          <Animated.Image 
            source={ event?.event_img ? { uri: event.event_img  } : require("@/assets/images/MASHomeLogo.png")}
            style={ [{width: width / 1.2, height: 300, borderRadius: 8 }, imageAnimatedStyle] }
            resizeMode='stretch'
            sharedTransitionTag={`event-image-${event_id}`}
          />
          <View className='flex-col bg-white w-[100%] h-[80]'>
            <Text className='font-bold text-2xl text-center'>{event?.event_name}</Text>
            <Text className='font-bold text-gray-400 text-center'>{speaker ? speaker.join('&') : ''}</Text>

            <View className='ml-2'>
              <Text>Notification Options</Text>
            </View>
          </View>
          <View className='bg-white w-[100%] items-center'>
            {
              array.map((item , index) => {
                return(
                  <View className='flex-col'>
                    <View className='flex-row items-center justify-center'>
                      <NotificationEventCard height={NOTICARDHEIGHT} width={NOTICARDWIDTH} index={index} scrollY={scrollY} setSelectedNotification={setSelectedNotification} selectedNotification={selectedNotification} event_id={event_id} eventInfo={event!}/>
                    </View>
                    <View style={{height : 10}}/>
                  </View>
                )
              })
            }
          </View>
        </Animated.ScrollView>
    </View>
  )
}

export default NotificationEventSettings