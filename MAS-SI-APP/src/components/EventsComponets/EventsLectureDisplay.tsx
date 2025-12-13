import { View, Text, Dimensions, Image, ScrollView, Alert } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { Stack, router } from "expo-router"
import Animated, { FadeInLeft, interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset, useSharedValue, withTiming } from 'react-native-reanimated';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { Divider, Portal, Modal, IconButton, Icon, Button } from 'react-native-paper';
import { Lectures, SheikDataType, Program } from '@/src/types';
import { EventsType } from '@/src/types';
import { EventLectureType } from '@/src/types';
import RenderEventsLectures from './RenderEventLectures';
import RenderEventLectures from "./RenderEventLectures"
import Header from '../headerTest';
import { UserPlaylistType } from '@/src/types';
import { RenderAddToUserPlaylistsListEvent } from '../RenderAddToUserPlaylistsList';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import CreatePlaylistBottomSheet from '../UserProgramComponets/CreatePlaylistBottomSheet';
import Toast from 'react-native-toast-message';

type EventsLectureDisplayProp = {
  event_id: string
  event_name: string
  event_img: string
  event_speaker: string
}
const EventsLectureDisplay = ({ event_id, event_img, event_speaker, event_name }: EventsLectureDisplayProp) => {
  const { session } = useAuth()
  const [eventLectures, setEventLectures] = useState<EventLectureType[] | null>(null)
  const [visible, setVisible] = useState(false);
  const [speakerData, setSpeakerData] = useState<SheikDataType[]>()
  const [speakerString, setSpeakerString] = useState('')
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const [playlistAddingTo, setPlaylistAddingTo] = useState<string[]>([])
  const [addToPlaylistVisible, setAddToPlaylistVisible] = useState(false)
  const [lectureToBeAddedToPlaylist, setLectureToBeAddedToPlaylist] = useState<string>("")
  const [playAnimation, setPlayAnimation] = useState(false)
  const [lectureInfoAnimation, setLectureInfoAnimation] = useState<Lectures>()
  const [usersPlaylists, setUsersPlaylists] = useState<UserPlaylistType[]>()
  const hideAddToPlaylist = () => setAddToPlaylistVisible(false)
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const handlePresentModalPress = () => bottomSheetRef.current?.present();
  const notifade = useSharedValue(1)

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

  const getSpeakers = async () => {
    const speakers: any[] = []
    let speaker_string: string[] = event_speaker.map(() => { return '' })
    await Promise.all(
      event_speaker.map(async (speaker_id: string, index: number) => {
        const { data: speakerInfo, error: speakerInfoError } = await supabase.from('speaker_data').select('*').eq('speaker_id', speaker_id).single()
        if (speakerInfo) {
          if (index == event_speaker.length - 1) {
            speaker_string[index] = speakerInfo.speaker_name
          }
          else {
            speaker_string[index] = speakerInfo.speaker_name + ' & '
          }
          speakers.push(speakerInfo)
        }
      })
    )
    setSpeakerData(speakers)
    setSpeakerString(speaker_string.join(''))
  }
  const GetSheikData = () => {
    return (
      <View className='flex-1'>

        {
          speakerData?.map((speakerData) => (
            <View className='border-2 border-gray-400 border-solid rounded-[25px] p-2 my-1'>
              <Animated.View className=' flex-row'>
                <Image source={speakerData.speaker_img ? { uri: speakerData?.speaker_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 110, height: 110, borderRadius: 50 }} resizeMode='cover' />
                <View className='flex-col px-1'>
                  <Text className='text-xl font-bold'>Name: </Text>
                  <Text className='pt-2 font-semibold' numberOfLines={1}> {speakerData?.speaker_name} </Text>
                </View>
              </Animated.View>

              <View className='flex-col py-3'>
                {speakerData?.speaker_name == "MAS" ? <Text className='font-bold'>Impact </Text> : <Text className='font-bold'>Credentials: </Text>}
                {speakerData?.speaker_creds.map((cred, i) => {
                  return <Text key={i}> <Icon source="cards-diamond-outline" size={15} color='black' /> {cred} {'\n'}</Text>
                })}
              </View>
            </View>
          ))
        }
      </View>
    )
  }
  const fetchEventLectures = async () => {
    const { data, error } = await supabase.from("events_lectures").select("*").eq("event_id", event_id)
    if (error) {
      console.log(error)
    }
    if (data) {
      setEventLectures(data)
    }
  }
  async function getUserPlaylists() {
    const { data, error } = await supabase.from("user_playlist").select("*").eq("user_id", session?.user.id)
    if (error) {
      console.log(error)
    }
    if (data) {
      setUsersPlaylists(data)
    }
  }

  const onDonePress = async () => {
    if (playlistAddingTo && playlistAddingTo.length > 0) {
      playlistAddingTo.map(async (item) => {
        const { data: checkDupe, error: checkDupeError } = await supabase.from("user_playlist_lectures").select("*").eq("user_id ", session?.user.id).eq("playlist_id", item).eq("event_lecture_id", lectureToBeAddedToPlaylist).single()
        if (checkDupe) {
          const { data: dupePlaylistName, error } = await supabase.from("user_playlist").select("playlist_name").eq("playlist_id", checkDupe.playlist_id).single()
          Alert.alert(`Lecture already found in ${dupePlaylistName?.playlist_name}`, "", [
            {
              text: "Cancel",
              onPress: () => setAddToPlaylistVisible(false)
            },
            {
              text: "Continue",
              onPress: async () => await supabase.from("user_playlist_lectures").insert({ user_id: session?.user.id, playlist_id: item, event_lecture_id: lectureToBeAddedToPlaylist })
            }
          ]
          )
        }
        else {
          const { error } = await supabase.from("user_playlist_lectures").insert({ user_id: session?.user.id, playlist_id: item, event_lecture_id: lectureToBeAddedToPlaylist })
          const getPlaylistAddedTo = usersPlaylists?.filter(playlist => playlist.playlist_id == playlistAddingTo[0])
          if (getPlaylistAddedTo && getPlaylistAddedTo[0]) {
            Toast.show({
              type: 'LectureAddedToPlaylist',
              props: { props: getPlaylistAddedTo[0] },
              position: 'bottom',
              bottomOffset: 0
            })
          }
        }
      })
      setAddToPlaylistVisible(false)
    }
    else {
      setAddToPlaylistVisible(false)
    }
  }

  useEffect(() => {
    fetchEventLectures()
    getSpeakers()
    getUserPlaylists()

    const listenForUserPlaylistChanges = supabase
      .channel('listen for user playlist event adds')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: "user_playlist",
          filter: `user_id=eq.${session?.user.id}`
        },
        (payload) => getUserPlaylists()
      )
      .subscribe()

    return () => { supabase.removeChannel(listenForUserPlaylistChanges) }
  }, [])

  useEffect(() => {
    setPlaylistAddingTo([])
  }, [!addToPlaylistVisible])

  useEffect(() => {
    onDonePress()
    setAddToPlaylistVisible(false)
  }, [playlistAddingTo.length > 0])
  return (
    <View className='flex-1 bg-white' style={{ flexGrow: 1 }}>
      <Animated.ScrollView ref={scrollRef} scrollEventThrottle={16} contentContainerStyle={{ justifyContent: "center", alignItems: "center", marginTop: "2%" }} >

        <Animated.Image
          source={event_img ? { uri: event_img } : require("@/assets/images/MASHomeLogo.png")}
          style={[{ width: width / 1.2, height: 300, borderRadius: 8 }, imageAnimatedStyle]}
          resizeMode='stretch'
          className='mt-[110]'
        />

        <View className='bg-white w-[100%]' style={{ paddingBottom: 0 }}>
          <Text className='text-center mt-2 text-xl text-black font-bold w-[95%] self-center' numberOfLines={2}>{event_name}</Text>
          <Text className='text-center mt-2  text-[#0D509D]' onPress={showModal}>{speakerString}</Text>
          {
            eventLectures ? eventLectures.map((item, index) => {
              return (
                <Animated.View key={index} entering={FadeInLeft.duration(400).delay(100)}>
                  <RenderEventLectures lecture={item} index={index} speaker={item.event_lecture_speaker} setAddToPlaylistVisible={setAddToPlaylistVisible} setLectureToBeAddedToPlaylist={setLectureToBeAddedToPlaylist} length={eventLectures.length} />
                  <Divider style={{ width: "95%", marginLeft: 8 }} />
                </Animated.View>
              )
            }) : <></>
          }
        </View>

        <Portal>
          <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={{ backgroundColor: 'white', padding: 20, minHeight: 400, maxHeight: "70%", width: "95%", borderRadius: 35, alignSelf: "center" }} >
            <ScrollView className='flex-1'
              showsVerticalScrollIndicator={true}
            >
              <GetSheikData />
            </ScrollView>
          </Modal>
        </Portal>
        <Portal>
          <Modal visible={addToPlaylistVisible} onDismiss={hideAddToPlaylist} contentContainerStyle={{ backgroundColor: 'white', padding: 20, height: "50%", width: "90%", borderRadius: 35, alignSelf: "center" }} >
            <View className='h-[100%]'>
              <View className='flex-row items-center justify-between'>
                <Text className='text-xl font-bold text-black'>Save To...</Text>
                <Button style={{ alignItems: "center", justifyContent: "center" }} textColor='#007AFF' onPress={() => { setAddToPlaylistVisible(false); handlePresentModalPress() }}><Text className='text-2xl'>+</Text><Text> New Playlist</Text></Button>
              </View>
              <Divider />
              {usersPlaylists ?
                <View className='flex-1'>
                  <ScrollView className='mt-2'>
                    {usersPlaylists.map((item, index) => {
                      return (<View className='mt-1'><RenderAddToUserPlaylistsListEvent playlist={item} lectureToBeAdded={lectureToBeAddedToPlaylist} setAddToPlaylistVisible={setAddToPlaylistVisible} setPlaylistAddingTo={setPlaylistAddingTo} playListAddingTo={playlistAddingTo} /></View>)
                    })}
                  </ScrollView>

                  <Divider />
                </View>
                : (
                  <View className=' items-center justify-center '>
                    <Text> No User Playlists Yet </Text>
                  </View>
                )
              }
            </View>
          </Modal>
        </Portal>
        <CreatePlaylistBottomSheet ref={bottomSheetRef} />
      </Animated.ScrollView>
    </View>
  )
}

export default EventsLectureDisplay