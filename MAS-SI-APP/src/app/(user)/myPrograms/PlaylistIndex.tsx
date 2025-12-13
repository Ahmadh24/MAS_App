import { View, Text, Pressable, ScrollView, useWindowDimensions, TouchableOpacity, Image } from 'react-native'
import { Link, Stack } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { Icon } from "react-native-paper"
import CreatePlaylistBottomSheet from '@/src/components/UserProgramComponets/CreatePlaylistBottomSheet'
import BottomSheet, { BottomSheetModal, BottomSheetBackdrop, BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { supabase } from '@/src/lib/supabase'
import { useAuth } from "@/src/providers/AuthProvider"
import { UserPlaylistType } from '@/src/types'
import RenderUserPlaylist from '@/src/components/UserProgramComponets/RenderUserPlaylist'
import Svg, { Path, Rect } from 'react-native-svg'
const PlaylistIndex = () => {
  const { session } = useAuth()
  const [userPlayLists, setUserPlaylists] = useState<UserPlaylistType[]>()
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const layout = useWindowDimensions().width
  const handlePresentModalPress = () => bottomSheetRef.current?.present();
  const getUserPlaylists = async () => {
    const { data: user_playlist, error } = await supabase.from("user_playlist").select("*").eq("user_id", session?.user.id)
    if (error) {
      console.log(error)
    }
    if (user_playlist) {
      setUserPlaylists(user_playlist)
    }
  }
  useEffect(() => {
    getUserPlaylists()

    const listenForUserPlaylistChanges = supabase
      .channel('listen for user playlist change')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: "user_playlist",
        },
        async (payload) => await getUserPlaylists()
      )
      .subscribe()

    return () => { supabase.removeChannel(listenForUserPlaylistChanges) }
  }, [])

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100, }} className="bg-white h-full flex-1">
      <Stack.Screen options={{ title: '', headerBackTitleVisible: false, headerTintColor: '#007AFF', headerTitleStyle: { color: 'black' }, headerStyle: { backgroundColor: 'white', } }} />
      <Pressable className='flex-row items-center ml-2 mt-8' onPress={handlePresentModalPress}>
        <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <Path d="M4.25 7.75C4.25 5.817 5.817 4.25 7.75 4.25H22.25C24.183 4.25 25.75 5.817 25.75 7.75V22.25C25.75 24.183 24.183 25.75 22.25 25.75H7.75C5.817 25.75 4.25 24.183 4.25 22.25V7.75Z" stroke="#1B85FF" />
          <Path d="M15 10L15 20" stroke="#1B85FF" stroke-linejoin="round" />
          <Path d="M20 15L10 15" stroke="#1B85FF" stroke-linejoin="round" />
        </Svg>
        <Text className='text-xl font-bold px-[13]'>Create New Playlist...</Text>
      </Pressable>
      <View className='flex-row items-center mt-[40]'>
        <Link href={"/myPrograms/likedLectures/AllLikedLectures"} asChild>
          <Pressable className='flex-row items-center ml-2.5'>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Rect x="0.5" y="0.5" width="23" height="23" stroke="#FF0000" stroke-linejoin="round" />
              <Path d="M4.45067 13.9082L11.4033 20.4395C11.6428 20.6644 11.7625 20.7769 11.9037 20.8046C11.9673 20.8171 12.0327 20.8171 12.0963 20.8046C12.2375 20.7769 12.3572 20.6644 12.5967 20.4395L19.5493 13.9082C21.5055 12.0706 21.743 9.0466 20.0978 6.92607L19.7885 6.52734C17.8203 3.99058 13.8696 4.41601 12.4867 7.31365C12.2913 7.72296 11.7087 7.72296 11.5133 7.31365C10.1304 4.41601 6.17972 3.99058 4.21154 6.52735L3.90219 6.92607C2.25695 9.0466 2.4945 12.0706 4.45067 13.9082Z" stroke="#FF0000" />
            </Svg>
            <View className='flex flex-row justify-between w-[93%]' >
              <View className='flex flex-col'>
                <Text className='text-xl font-bold px-[13]'>Favorite Lectures</Text>
                <Text className='text-black text-[300] text-sm ml-3'>On Lectures Tap The Heart </Text>
              </View>
              <View className='flex flex-row items-center'>
                <Text className='text-gray-400 text-sm font-[300]'>view all</Text>
                <Icon source={'chevron-right'} color='gray' size={15} />
              </View>
            </View>
          </Pressable>
        </Link>
      </View>
      <Text className='ml-3 my-8 font-bold text-[20px]'>Playlist</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>

        {
          userPlayLists?.length == 0 &&
          <View style={{ width: layout / 2, justifyContent: "center", alignItems: "center" }} className=''>
            <Pressable className='border border-dotted border-[#0073EE] h-[140] w-[160] rounded-xl items-center justify-center flex flex-col ' onPress={handlePresentModalPress} >
              <Icon source={'playlist-plus'} size={50} color='#0073EE' />
              <Text className='text-center text-black text-[10px] font-[300]'>Make Your First Playlist</Text>
            </Pressable>
            <View className='mb-10' />
          </View>
        }

        <View style={{ width: layout / 2, justifyContent: "center", alignItems: "center", paddingTop: 5 }} className=''>
          <Link href={`/myPrograms/playlists/QuranPlaylist`} asChild>
            <TouchableOpacity>
              <View className='flex-col items-center px-2'>
                <View style={{ justifyContent: "center", alignItems: "center", borderRadius: 15, width: "100%", }} className=''>
                  <View style={{ height: 140, width: 160, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}
                    className='border-2 border-gray-400 mb-1'
                  >
                    <Image source={require('@/assets/images/MasPlaylistDef.png')} style={{ height: '70%', width: '70%', objectFit: 'fill' }} />
                  </View>
                </View>
                <View className='items-center justify-center w-[70%]'>
                  <Text className='text-[20px] font-[300] text-black my-2' numberOfLines={1}>Quran</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={{ width: layout / 2, justifyContent: "center", alignItems: "center", paddingTop: 5 }} >
          <Link href={`/myPrograms/playlists/AthkarPlaylist`} asChild>
            <TouchableOpacity>
              <View className='flex-col items-center px-2 '>
                <View style={{ justifyContent: "center", alignItems: "center", borderRadius: 15, width: "100%", }}>
                  <View style={{ height: 140, width: 160, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}
                    className='border-2 border-gray-400 mb-1'
                  >
                    <Image source={require('@/assets/images/MasPlaylistDef.png')} style={{ height: '70%', width: '70%', objectFit: 'fill' }} />
                  </View>
                </View>
                <View className='items-center justify-center w-[70%]'>
                  <Text className='text-[20px] font-[300] text-black my-2' numberOfLines={1}>Athkar</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        </View>

        {
          (userPlayLists && userPlayLists.length > 0) && userPlayLists.map((item, index) => {
            return (
              <View key={index} style={{ width: layout / 2, justifyContent: "center", alignItems: "center", paddingTop: 5 }} >
                <RenderUserPlaylist playlist={item} />
              </View>
            )
          })
        }
      </View>
      <CreatePlaylistBottomSheet ref={bottomSheetRef} />
    </ScrollView>
  )
}

export default PlaylistIndex