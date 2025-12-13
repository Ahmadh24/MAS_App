import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Link, router, Stack } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { differenceInDays, format, toDate } from 'date-fns'
import Svg, { Path } from 'react-native-svg'

const NotiEvents = () => {
  const [events, setevents] = useState<any[]>([])
  const [speakers, setSpeakers] = useState<any[] | null>([])
  const TodaysDate = new Date()

  const getevents = async () => {
    const { data: Userevents, error } = await supabase.from('events').select('*')
    const { data: speakers, error: speakerError } = await supabase.from('speaker_data').select('*')
    if (Userevents) {
      setevents(Userevents)
      setSpeakers(speakers)
    }

  }
  useEffect(() => {
    getevents()
  }, [])

  return (
    <View className='flex-1 bg-gray-50' style={{ paddingBottom: 30 }}>
      <Stack.Screen
        options={{
          title: "Create Event Notification",
          headerStyle: { backgroundColor: "#F9FAFB" },
          headerTitleStyle: {
            fontSize: 22,
            fontWeight: '600',
            color: '#1F2937'
          },
          headerTintColor: '#4A5568',
          headerShadowVisible: false,
        }}
      />
      <View className='flex-1 grow' >
        <Text className='my-5 ml-3 text-black font-bold text-xl'>Select A Event  </Text>
        <FlatList
          style={{ flex: 1 }}
          data={events}
          renderItem={({ item }) => {
            const EventLeaders = item.event_speaker.map((id) => {
              const person = speakers?.filter(person => person.speaker_id == id)[0]
              return person?.speaker_name
            })
            return (
              <View style={{ marginHorizontal: 2, marginVertical: 6 }}>
                <Link href={{ pathname: '/(user)/more/Admin/EventsNotificationScreen', params: { event_id: item.event_id, has_lecture: item.has_lecture, event_name: item.event_name, event_img: item.event_img } }} asChild >
                  <TouchableOpacity>
                    <View className='mt-1 self-center justify-center bg-[#F6F6F6] flex-row ' style={{ borderRadius: 20, width: '95%' }}>

                      <View className='justify-center w-[30%]'>
                        <Image source={{ uri: item.event_img }} style={{ borderRadius: 8, width: '100%', height: 100 }} />
                      </View>

                      <View className='w-[70%] pl-2 bg-[#F6F6F6] rounded-r-[15px] h-[100px] py-1'>
                        <Text className='text-[14px] font-[400] text-black' numberOfLines={1}>{item.event_name}</Text>
                        <Text className='text-sm text-[#A2A2A2] font-[400]' numberOfLines={1}>By: {EventLeaders.join(',')}</Text>
                        <Text className='mt-[18px]  text-sm text-black' numberOfLines={1}>Start Date: {format(item.event_start_date, 'P')}</Text>
                        {differenceInDays(item.event_end_date, TodaysDate) > 0 ? <Text className='text-gray-700'><Text className='text-green-500'>{differenceInDays(item.event_end_date, TodaysDate)} Days</Text> until Event ends</Text> : <Text className='text-red-600'>Event Has Ended</Text>}
                      </View>
                    </View>
                  </TouchableOpacity>
                </Link>
              </View>
            )
          }}
        />
      </View>

    </View>
  )
}

export default NotiEvents