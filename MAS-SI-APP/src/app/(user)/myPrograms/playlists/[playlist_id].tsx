import { View, Text, Dimensions, StatusBar, Image, Pressable, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { UserPlaylistLectureType, UserPlaylistType } from '@/src/types'
import { Stack } from "expo-router"
import { useAuth } from '@/src/providers/AuthProvider'
import * as Haptics from "expo-haptics"
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import { Divider, Icon } from 'react-native-paper'
import RenderAddedProgramLectures from '@/src/components/UserProgramComponets/RenderAddedLecturesToPlaylist'
import { RenderAddedEventLectures, RenderAddedQuranLectures } from '@/src/components/UserProgramComponets/RenderAddedLecturesToPlaylist'
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Pressable 
          onPress={() => router.push('/myPrograms/PlaylistIndex')}
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Icon source="plus" color="black" size={28} />
        </Pressable>
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
      </View>
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

      <ScrollView contentContainerStyle={{justifyContent: "center", alignItems: "center", marginTop: "2%" }} >
          
          {
            userPlayListInfo?.playlist_img ? 
            <Image 
            source={ userPlayListInfo?.playlist_img ? { uri : userPlayListInfo?.playlist_img } : require("@/assets/images/MASHomeLogo.png") }
            style={{width: width / 1.2, height: 300, borderRadius: 8 }}
            resizeMode='stretch'
          />
          :
          <View style={{width: width / 1.2, height: 300, borderRadius: 8, backgroundColor : userPlayListInfo?.def_background, alignItems : 'center', justifyContent : 'center' }}>
            <Image source={require('@/assets/images/MasPlaylistDef.png')} 
            resizeMode='stretch'
            style={{ width : '90%', height : '90%'}}
            />
          </View>
          }
          <View className='bg-white w-[100%]' style={{paddingBottom : 0}}>
            <Text className='text-center mt-2 text-xl text-black font-bold'>{userPlayListInfo?.playlist_name}</Text>
            <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
              {userPlaylistLectures?.length || 0} lecture{userPlaylistLectures?.length !== 1 ? 's' : ''}
            </Text>

              <View className=''>
                {
                  userPlaylistLectures && userPlaylistLectures.length > 0 ? userPlaylistLectures.map((lecture, index) => {
                    if(lecture.program_lecture_id){
                      return (
                      <View key={lecture.id || index}>
                        <RenderAddedProgramLectures program_lecture_id={lecture.program_lecture_id} playlist={playlist_id as string} id={lecture.id}/>
                        <Divider />
                      </View>
                    )
                    }else if(lecture.event_lecture_id){
                      return(
                      <View key={lecture.id || index}>                      
                      <RenderAddedEventLectures event_lecture_id={lecture.event_lecture_id} playlist={playlist_id as string} id={lecture.id}/>
                      <Divider />
                      </View>
                    )
                    }else if(lecture.quran_lecture_id){
                      return(
                      <View key={lecture.id || index}>                      
                      <RenderAddedQuranLectures quran_lecture_id={lecture.quran_lecture_id} playlist={playlist_id as string} id={lecture.id}/>
                      <Divider />
                      </View>
                    )
                    }
                  }) :
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <View style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: '#f3f4f6',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}>
                      <Icon source="plus" color="#9ca3af" size={32} />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#6b7280', marginBottom: 4 }}>
                      No Lectures Yet
                    </Text>
                    <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', paddingHorizontal: 40 }}>
                      Browse programs or events above to add lectures to your playlist
                    </Text>
                  </View>
                }
              </View>
          </View>
        </ScrollView>
  </View>
  )
}

export default UserPlayListLectures