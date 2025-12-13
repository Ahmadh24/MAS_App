import { View, Text, Dimensions, StatusBar,Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { UserPlaylistLectureType, UserPlaylistType } from '@/src/types'
import { Stack } from "expo-router"
import Animated,{ interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset, useSharedValue, withSpring, withTiming, withRepeat, runOnJS } from 'react-native-reanimated';
import { useAuth } from '@/src/providers/AuthProvider'
import * as Haptics from "expo-haptics"
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import { Divider, Icon } from 'react-native-paper'
import RenderAddedProgramLectures from '@/src/components/UserProgramComponets/RenderAddedLecturesToPlaylist'
import { RenderAddedEventLectures } from '@/src/components/UserProgramComponets/RenderAddedLecturesToPlaylist'
const UserPlayListLectures = () => {
  const { session } = useAuth()
  const { playlist_id } = useLocalSearchParams()
  const [ userPlayListInfo, setUserPlaylistInfo ] = useState<UserPlaylistType>()
  const [ userPlaylistLectures, setPlaylistLectures ] = useState<UserPlaylistLectureType[]>()
  const getUserPlaylistInfo = async () => {
    const { data, error } = await supabase.from("user_playlist").select("*").eq("playlist_id", playlist_id).single()
    if( error ){
      console.log( error )
    }
    if( data ){
      setUserPlaylistInfo(data)
    }
  }
  const getUserPlaylistLectures = async () => {
    setPlaylistLectures([])
    const { data, error } = await supabase.from("user_playlist_lectures").select("*").eq("playlist_id", playlist_id)
    if( error ) {
        console.log( error )
    }
    if ( data ){
        setPlaylistLectures(data)
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

  const HeaderRight = () => {
    const removeFromLibrary = async () => {
      const { error } = await supabase.from("user_playlist").delete().eq("playlist_id", playlist_id)
      if( error ){
        alert(error)
      }else{
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        )
        router.back()
      }
    }
    return(
      <Menu>
      <MenuTrigger>
        <Icon source={"dots-horizontal"} color='black' size={25}/>
      </MenuTrigger>
      <MenuOptions customStyles={{optionsContainer: {width: 200, borderRadius: 8, marginTop: 20, padding: 8}}}>
        <MenuOption onSelect={removeFromLibrary}>
          <View className='flex-row justify-between items-center'>
           <Text className='text-red-600 '>Delete From Library</Text> 
           <Icon source="delete" color='red' size={15}/>
          </View>
        </MenuOption>
      </MenuOptions>
    </Menu>          
    )
  }

  useEffect(() => {
    getUserPlaylistInfo()
    getUserPlaylistLectures()
    const listenForPlaylistChanges = supabase.channel("Listen for user playlist lecture changes")
    .on(
        "postgres_changes",
        {
            event: "*",
            schema : 'public',
            table: "user_playlist_lectures",
            filter: `playlist_id=eq.${playlist_id}`
        },
        (payload) => getUserPlaylistLectures()
    )
    .subscribe()

    return () => { supabase.removeChannel(listenForPlaylistChanges) }
  }, [])

  return (
<View className='flex-1 bg-white' style={{flexGrow: 1}}>
      <Stack.Screen options={{ title : "", headerBackTitleVisible: false, headerRight :() => <HeaderRight />, headerStyle : {backgroundColor : "white"}}} />
      <StatusBar barStyle={"dark-content"}/>

      <Animated.ScrollView ref={scrollRef}  scrollEventThrottle={16} contentContainerStyle={{justifyContent: "center", alignItems: "center", marginTop: "2%" }} >
          
          {
            userPlayListInfo?.playlist_img ? 
            <Animated.Image 
            source={ userPlayListInfo?.playlist_img ? { uri : userPlayListInfo?.playlist_img } : require("@/assets/images/MASHomeLogo.png") }
            style={ [{width: width / 1.2, height: 300, borderRadius: 8 }, imageAnimatedStyle] }
            resizeMode='stretch'
          />
          :
          <Animated.View  style={[{width: width / 1.2, height: 300, borderRadius: 8, backgroundColor : userPlayListInfo?.def_background, alignItems : 'center', justifyContent : 'center' }, imageAnimatedStyle]}>
            <Image source={require('@/assets/images/MasPlaylistDef.png')} 
            resizeMode='stretch'
            style={{ width : '90%', height : '90%'}}
            />
          </Animated.View>
          }
          <View className='bg-white w-[100%]' style={{paddingBottom : 0}}>
            <Text className='text-center mt-2 text-xl text-black font-bold'>{userPlayListInfo?.playlist_name}</Text>
              <View className=''>
                {
                  userPlaylistLectures && userPlaylistLectures.length > 0 ? userPlaylistLectures.map((lecture, index) => {
                    if(lecture.program_lecture_id){
                      return (
                      <>
                        <RenderAddedProgramLectures program_lecture_id={lecture.program_lecture_id} playlist={playlist_id as string} id={lecture.id}/>
                        <Divider />
                      </>
                    )
                    }else if(lecture.event_lecture_id){
                      return(
                      <>                      
                      <RenderAddedEventLectures event_lecture_id={lecture.event_lecture_id} playlist={playlist_id as string} id={lecture.id}/>
                      <Divider />
                      </>
                    )
                    }
                  }) :
                  <View className='my-[15%] self-center'>
                    <Text className='font-bold text-xl text-gray-400 mr-3'>No Lectures Added Yet</Text>  
                   </View>
                }
              </View>
          </View>
        </Animated.ScrollView>
  </View>
  )
}

export default UserPlayListLectures