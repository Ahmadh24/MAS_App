import { View, Text, Dimensions, ScrollView, StatusBar, useWindowDimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Program } from '@/src/types'
import { useAuth } from '@/src/providers/AuthProvider'
import { supabase } from '@/src/lib/supabase'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import Animated, { interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset } from 'react-native-reanimated'
import { Icon } from 'react-native-paper'
import NotificationCard from "@/src/app/(user)/myPrograms/notifications/NotificationCard"
import * as Haptics from 'expo-haptics'
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu'

const ClassesAndLecturesSettings = () => {
  const { program_id } = useLocalSearchParams()
  const { session } = useAuth()
  const [program, setProgram] = useState<Program>()
  const [speakers, setSpeakers] = useState<string[]>()
  const [scrollY, setScrollY] = useState(0)
  const layout = useWindowDimensions().width
  const layoutHeight = useWindowDimensions().height
  const [selectedNotification, setSelectedNotification] = useState<number[]>([])
  const NOTICARDHEIGHT = layoutHeight / 12
  const NOTICARDWIDTH = layout * 0.95
  const getProgram = async () => {
    const { data, error } = await supabase.from('programs').select("*").eq("program_id", program_id).single()
    if (data) {
      setProgram(data)
      const Speakers: string[] = []
      await Promise.all(
        data.program_speaker.map(async (speaker: string) => {
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

  const HeaderRight = () => {
    const router = useRouter()
    const removeFromLibrary = async () => {
      const { error } = await supabase.from('added_notifications_programs').delete().eq("user_id", session?.user.id).eq("program_id", program_id)
      const { error: errorSettings } = await supabase.from("program_notifications_settings").delete().eq("user_id", session?.user.id).eq("program_id", program_id)
      if (error) {
        alert(error)
      } else {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        )
      }
      router.back()
    }
    return (
      <Menu>
        <MenuTrigger>
          <Icon source={"dots-horizontal"} color='black' size={25} />
        </MenuTrigger>
        <MenuOptions customStyles={{ optionsContainer: { width: 200, borderRadius: 8, marginTop: 20, padding: 8 } }}>
          <MenuOption onSelect={removeFromLibrary}>
            <View className='flex-row justify-between items-center'>
              <Text className='text-red-600 '>Delete From Notifications</Text>
              <Icon source="delete" color='red' size={15} />
            </View>
          </MenuOption>
        </MenuOptions>
      </Menu>
    )
  }

  useEffect(() => {
    getProgram()
  }, [])
  const array = [1, 2, 3]
  return (
    <View className='flex-1 bg-white' style={{ flexGrow: 1 }}>
      <StatusBar barStyle={"dark-content"} />
      <Stack.Screen options={{ title: '', headerBackTitleVisible: false, headerStyle: { backgroundColor: "white" }, headerRight: () => <HeaderRight />, }} />
      <Animated.ScrollView ref={scrollRef} scrollEventThrottle={16} contentContainerStyle={{ justifyContent: "center", alignItems: "center", marginTop: "2%", paddingBottom: 20 }}  >
        <Animated.Image
          source={program?.program_img ? { uri: program.program_img } : require("@/assets/images/MASHomeLogo.png")}
          style={[{ width: width / 1.2, height: 300, borderRadius: 8 }, imageAnimatedStyle]}
          resizeMode='stretch'
          sharedTransitionTag={`program-image-${program_id}`}
        />
        <View className='flex-col bg-white w-[100%]'>
          <Text className='font-bold text-2xl text-center'>{program?.program_name}</Text>
          <Text className='font-bold text-gray-400 text-center'>{speakers ? speakers.join('&') : ''}</Text>

          <View className='ml-2'>
            <Text>Notification Options</Text>
          </View>
        </View>
        <View className='bg-white w-[100%] items-center '>
          {
            array.map((item, index) => {
              return (
                <View className='flex-col w-[100%]' key={index}>
                  <View className='flex-row items-center justify-center'>
                    <NotificationCard height={NOTICARDHEIGHT} width={NOTICARDWIDTH} index={index} scrollY={scrollY} setSelectedNotification={setSelectedNotification} selectedNotification={selectedNotification} program_id={program_id} programInfo={program} />
                  </View>
                  <View style={{ height: 10 }} />
                </View>
              )
            })
          }
        </View>

      </Animated.ScrollView>
    </View>
  )
}

export default ClassesAndLecturesSettings