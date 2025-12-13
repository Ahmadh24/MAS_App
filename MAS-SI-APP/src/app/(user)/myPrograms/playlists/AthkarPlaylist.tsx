import { View, Text, StatusBar, Dimensions, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Link, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { UserPlaylistLectureType, UserPlaylistType } from '@/src/types'
import { Stack } from "expo-router"
import Animated,{ interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset, useSharedValue, withSpring, withTiming, withRepeat, runOnJS } from 'react-native-reanimated';
import { useAuth } from '@/src/providers/AuthProvider'
import * as Haptics from "expo-haptics"
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import { Divider, Icon } from 'react-native-paper'
const AthkarPlaylist = () => {
    const [ videos, setVideos ] = useState<{youtube_id : string, reciter : string , surah : string, id : string }[]>([])
    const [ reciters, setReciters ] = useState<{ speaker_id : string, speaker_name : string, speaker_creds : string[], speaker_img : string }[]>([])
    const getVideos = async () => {
      const { data , error } = await supabase.from('quran_playlist').select('*').eq('video_type', 'Athkar')
      const { data : Reciters , error : RecitersError } = await supabase.from('speaker_data').select('*')
       if( data  && Reciters ){
          setVideos(data)
          setReciters(Reciters)
      }
    } 
    const windowHeight = Dimensions.get("window").height 
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
  
    useEffect(() => {
      getVideos()
    }, [])
  return (
    <View className='flex-1 bg-white' style={{flexGrow: 1}}>
      <Stack.Screen options={{ title : "", headerBackTitleVisible: false, headerStyle : {backgroundColor : "white"}}} />
      <StatusBar barStyle={"dark-content"}/>

      <Animated.ScrollView ref={scrollRef}  scrollEventThrottle={16} contentContainerStyle={{justifyContent: "center", alignItems: "center", marginTop: "2%" }} >
          
          <Animated.Image 
            source={require('@/assets/images/MASHomeLogo.png')}
            style={ [{width: width / 1.2, height: 300, borderRadius: 8 }, imageAnimatedStyle] }
            resizeMode='stretch'
          />

          <View className='bg-white w-[100%]' style={{paddingBottom : 0}}>

            <Text className='text-center mt-2 text-xl text-black font-bold mb-4'>Athkar</Text>
              <View className=' px-2 w-[100%]'>
                  {
                    videos.map(( vid, index ) =>{
                        const speaker = reciters.filter(id => id.speaker_id == vid.reciter )
                        return  (
                        <Pressable className='bg-white mt-2'>
                        <View className='flex-row items-center' >
                          <Link href={{ 
                            pathname : '/myPrograms/quran/QuranVideo',
                            params : { 
                              youtube_id : vid.youtube_id, 
                              quran_id : vid.id, 
                              surah : vid.surah, 
                              speaker_name : speaker[0]?.speaker_name, 
                              speaker_img : speaker[0]?.speaker_img, 
                              speaker_id : speaker[0]?.speaker_id 
                            }
                          }} className='items-center justify-center'>
                          
                            <View className='w-[35] h-[25] items-center justify-center mb-2'>
                              <Text className='text-xl font-bold text-gray-400' >{index + 1}</Text>
                            </View>

                            <View className='flex-col justify-center' style={{width: width / 1.5}}>
                              <Text className='text-md font-bold ml-2 text-black' style={{flexShrink: 1, }} numberOfLines={1}>{vid.surah}</Text>
                              <View className='flex-row' style={{flexShrink: 1, width: width / 1.5}}>    
                                <Text className='ml-2 text-gray-500' style={{flexShrink:1}} numberOfLines={1}>{speaker[0]?.speaker_name} </Text>
                              </View>
                            </View>
                            
                          </Link>

                        </View>
                          </Pressable>
                    )}
                    )
                  }
              </View>
          </View>
        </Animated.ScrollView>
  </View>
  )
}

export default AthkarPlaylist