import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, Pressable, ScrollView, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Link, router, Stack, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { differenceInDays, format, toDate } from 'date-fns'
import Svg, { Circle, Path } from 'react-native-svg'
import { useNavigation } from 'expo-router'
const UpdateProgramHomeScreen = () => {
  const { program_id, program_img, has_lectures, program_name } = useLocalSearchParams()
  const [lectures, setLectures] = useState<any[]>()
  const navigation = useNavigation()
  const getLectures = async () => {
    setLectures([])
    if (has_lectures) {
      const { data, error } = await supabase.from('program_lectures').select('*').eq('lecture_program', program_id).order('lecture_date', { ascending: false })
      if (data) {
        setLectures(data)
      }
    }
  }

  useEffect(() => {
    getLectures()
    const listenforlectures = supabase
      .channel('listen for lecture change')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: "program_lectures",
          filter: `lecture_program=eq.${program_id}`
        },
        async (payload) => await getLectures()
      )
      .subscribe()

    return () => { supabase.removeChannel(listenforlectures) }
  }, [])
  return (
    <View className='flex-1 grow bg-gray-50 w-[100%]' style={{ paddingBottom: 30 }}>
      <Stack.Screen
        options={{
          title: "Edit Existing Programs",
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
      <ScrollView style={{}} showsVerticalScrollIndicator={false} className="px-4">
        <Image
          src={program_img}
          className='w-[200px] h-[200px] self-center rounded-[15px] my-4'
        />

        <Link href={{
          pathname: `/more/Admin/UpdateProgramScreen`,
          params: { program_id: program_id, program_name: program_name }
        }} asChild>
          <Pressable className='bg-[#6077F5] h-[50px] w-[70%] self-center items-center justify-center rounded-xl mb-6 shadow-sm'>
            <Text className='text-white font-semibold text-base'>Edit Program Info</Text>
          </Pressable>
        </Link>
        {
          has_lectures == 'true' ?
            (
              <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
                <Text className='text-base font-bold text-gray-800 mb-3'>Edit Lecture Content</Text>
                <View className='flex flex-row items-center justify-between mb-3'>
                  <Text className='text-gray-600 text-sm'>Select The Lecture To Edit</Text>
                  <Link href={{
                    pathname: '/more/Admin/UploadProgramLectures',
                    params: { program_id: program_id, program_name: program_name, program_img: program_img }
                  }} asChild>
                    <Pressable>
                      <Text className='underline text-[#6077F5] font-medium'>Add New Lecture</Text>
                    </Pressable>
                  </Link>
                </View>
                {
                  lectures?.map((item, index) => (
                    <View key={item.lecture_id} className='w-[100%] flex flex-row justify-between items-center py-3 border-t border-gray-200'>
                      <Link href={{
                        pathname: '/more/Admin/UpdateProgramLectures',
                        params: { lecture: item.lecture_id, program_name: program_name, program_img: program_img }
                      }}
                        className='flex-1' asChild>
                        <Pressable className='flex-row items-center'>
                          <View className='w-[30px] h-[30px] bg-gray-100 rounded-full items-center justify-center mr-3'>
                            <Text className='text-base font-bold text-gray-600'>{lectures.length - index}</Text>
                          </View>
                          <View className='flex-1'>
                            <Text className='text-sm font-semibold text-gray-800' numberOfLines={1}>{item.lecture_name}</Text>
                            <Text className='text-xs text-gray-500 mt-1'>{format(item.lecture_date, 'PP')}</Text>
                            <Text className='text-[#6077F5] text-xs mt-1 font-medium'>Edit...</Text>
                          </View>
                        </Pressable>
                      </Link>

                      <Pressable className='ml-3 flex flex-col items-center justify-center' onPress={() => {
                        Alert.alert('Are you sure you want to delete this lecture?', `Press Delete to remove ${item.lecture_name}`, [
                          {
                            text: 'Cancel',
                            onPress: () => { },
                          },
                          {
                            text: 'Delete',
                            onPress: async () => { await supabase.from('program_lectures').delete().eq('lecture_id', item.lecture_id); await getLectures() },
                            style: 'destructive',
                          },

                        ]
                        );
                      }}>
                        <View className='w-[32px] h-[32px] bg-red-50 rounded-full items-center justify-center'>
                          <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <Path d="M15 5L5 15M5 5L15 15" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                          </Svg>
                        </View>
                        <Text className='text-red-500 text-[10px] mt-1'>Delete</Text>
                      </Pressable>
                    </View>
                  ))
                }

              </View>
            ) :
            (
              <></>
            )
        }
      </ScrollView>
    </View>
  )
}

export default UpdateProgramHomeScreen