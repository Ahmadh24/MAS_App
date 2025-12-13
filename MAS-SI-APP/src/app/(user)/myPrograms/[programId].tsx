import { View, Text, Pressable, FlatList, Image, TouchableOpacity, Dimensions, ScrollView, Alert } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useLocalSearchParams, Stack, router, useRouter, useNavigation } from 'expo-router';
import { Divider, Portal, Modal, IconButton, Icon, Button } from 'react-native-paper';
import { Lectures, SheikDataType, Program, UserPlaylistType } from '@/src/types';
import Animated, { interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset, useSharedValue, withSpring, withTiming, withRepeat, runOnJS } from 'react-native-reanimated';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import RenderMyLibraryProgramLectures from '@/src/components/UserProgramComponets/RenderMyLibraryProgramLectures';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import * as Haptics from "expo-haptics"
import { Link } from 'expo-router';
import RenderAddToUserPlaylistsListProgram from '@/src/components/RenderAddToUserPlaylistsList';
import CreatePlaylistBottomSheet from '@/src/components/UserProgramComponets/CreatePlaylistBottomSheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
const programLectures = () => {
  const { session } = useAuth()
  const { programId } = useLocalSearchParams();
  const [lectures, setLectures] = useState<Lectures[] | null>(null)
  const [program, setProgram] = useState<Program>()
  const [visible, setVisible] = useState(false);
  const [addToPlaylistVisible, setAddToPlaylistVisible] = useState(false)
  const [lectureToBeAddedToPlaylist, setLectureToBeAddedToPlaylist] = useState<string>("")
  const [playlistAddingTo, setPlaylistAddingTo] = useState<string[]>([])
  const [speakerString, setSpeakerString] = useState('')
  const [speakerData, setSpeakerData] = useState<any[]>([])
  const [playAnimation, setPlayAnimation] = useState(false)
  const [lectureInfoAnimation, setLectureInfoAnimation] = useState<Lectures>()
  const [usersPlaylists, setUsersPlaylists] = useState<UserPlaylistType[]>()
  const navigation = useNavigation()
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const handlePresentModalPress = () => bottomSheetRef.current?.present();
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const hideAddToPlaylist = () => setAddToPlaylistVisible(false)

  const windowHeight = Dimensions.get("window").height
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
  async function getProgram() {
    const { data, error } = await supabase.from("programs").select("*").eq("program_id", programId).single()
    if (error) {
      alert(error)
    }
    if (data) {
      setProgram(data)
      const speakers: any[] = []
      let speaker_string: string[] = data.program_speaker.map(() => { return '' })
      await Promise.all(
        data.program_speaker.map(async (speaker_id: string, index: number) => {
          const { data: speakerInfo, error: speakerInfoError } = await supabase.from('speaker_data').select('*').eq('speaker_id', speaker_id).single()
          if (speakerInfo) {
            if (index == data.program_speaker.length - 1) {
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
  }
  async function getProgramLectures() {
    const { data, error } = await supabase.from("program_lectures").select("*").eq("lecture_program", programId).order('lecture_date', { ascending: false })
    if (error) {
      alert(error)
    }
    if (data) {
      setLectures(data)
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
  useEffect(() => {
    getProgram()
    getProgramLectures()
    getUserPlaylists()
  }, [])
  useEffect(() => {
    setPlaylistAddingTo([])
  }, [!addToPlaylistVisible])
  const HeaderRight = () => {
    const router = useRouter()
    const removeFromLibrary = async () => {
      const { error } = await supabase.from("added_programs").delete().eq("user_id", session?.user.id).eq("program_id", programId)
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
              <Text className='text-red-600 '>Delete From Library</Text>
              <Icon source="delete" color='red' size={15} />
            </View>
          </MenuOption>
        </MenuOptions>
      </Menu>
    )
  }

  const GetSheikData = () => {
    return (
      <View className='flex-1'>

        {
          speakerData?.map((speakerData) => (
            <View className='border-2 border-gray-400 border-solid rounded-[15px] p-2 my-1'>
              <Animated.View className=' flex-row'>
                <Image source={speakerData?.speaker_img ? { uri: speakerData.speaker_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 110, height: 110, borderRadius: 50 }} resizeMode='cover' />
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
  const onDonePress = async () => {
    if (playlistAddingTo && playlistAddingTo.length > 0) {
      playlistAddingTo.map(async (item) => {
        const { data: checkDupe, error: checkDupeError } = await supabase.from("user_playlist_lectures").select("*").eq("user_id ", session?.user.id).eq("playlist_id", item).eq("program_lecture_id", lectureToBeAddedToPlaylist).single()
        if (checkDupe) {
          const { data: dupePlaylistName, error } = await supabase.from("user_playlist").select("playlist_name").eq("playlist_id", checkDupe.playlist_id).single()
          Alert.alert(`Lecture already found in ${dupePlaylistName?.playlist_name}`, "", [
            {
              text: "Cancel",
              onPress: () => setAddToPlaylistVisible(false)
            },
            {
              text: "Continue",
              onPress: async () => await supabase.from("user_playlist_lectures").insert({ user_id: session?.user.id, playlist_id: item, program_lecture_id: lectureToBeAddedToPlaylist })
            }
          ]
          )
        }
        else {
          const { error } = await supabase.from("user_playlist_lectures").insert({ user_id: session?.user.id, playlist_id: item, program_lecture_id: lectureToBeAddedToPlaylist })
          const getPlaylistAddedTo = usersPlaylists?.filter(playlist => playlist.playlist_id == playlistAddingTo[0])
          const goToPlaylist = () => { navigation.navigate('myPrograms', { screen: 'playlists/[playlist_id]', params: { playlist_id: playlistAddingTo } }) }
          if (getPlaylistAddedTo && getPlaylistAddedTo[0]) {
            Toast.show({
              type: 'LectureAddedToPlaylist',
              props: { props: getPlaylistAddedTo[0], onPress: goToPlaylist },
              position: 'bottom',
              bottomOffset: 100 * 2
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
    onDonePress()
    setAddToPlaylistVisible(false)
  }, [playlistAddingTo.length > 0])
  return (
    <View className='flex-1 bg-white' style={{ flexGrow: 1 }}>
      <Stack.Screen options={{ title: "", headerBackTitleVisible: false, headerRight: () => <HeaderRight />, headerStyle: { backgroundColor: "white" } }} />
      <Animated.ScrollView ref={scrollRef} scrollEventThrottle={16} contentContainerStyle={{ justifyContent: "center", alignItems: "center", marginTop: "2%" }} >

        <Animated.Image
          source={program?.program_img ? { uri: program.program_img } : require("@/assets/images/MASHomeLogo.png")}
          style={[{ width: width / 1.2, height: 300, borderRadius: 8 }, imageAnimatedStyle]}
          resizeMode='stretch'
        />
        <View className='bg-white w-[100%]' style={{ paddingBottom: 100 * 3 }}>
          <Text className='text-center mt-2 text-xl text-black font-bold'>{program?.program_name}</Text>
          <Text className='text-center mt-2  w-[60%] text-[#0D509D] self-center' onPress={showModal} numberOfLines={1}>{speakerString}</Text>
          <View className='ml-3'>
            {
              lectures && lectures?.length > 0 ? lectures.map((item, index) => {
                return (
                  <View key={index}>
                    <RenderMyLibraryProgramLectures lecture={item} index={index} speaker={program?.program_speaker} setPlayAnimation={setPlayAnimation} setLectureInfoAnimation={setLectureInfoAnimation} setAddToPlaylistVisible={setAddToPlaylistVisible} setLectureToBeAddedToPlaylist={setLectureToBeAddedToPlaylist} length={lectures.length} />
                    <Divider style={{ width: "95%", marginLeft: 8 }} />
                  </View>
                )
              })

                : (
                  <View>
                    <View>
                      <Text className='text-left text-2xl font-bold text-black'>Description: </Text>
                    </View>
                  </View>
                )

            }
            {

            }
          </View>
        </View>
        <Portal>
          <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={{ backgroundColor: 'white', padding: 20, height: "70%", width: "95%", borderRadius: 35, alignSelf: "center" }} >
            <ScrollView className='flex-1'
              showsVerticalScrollIndicator={true}
            >
              <GetSheikData />
            </ScrollView>
          </Modal>
        </Portal>
        <Portal>
          <Modal visible={addToPlaylistVisible} onDismiss={hideAddToPlaylist} contentContainerStyle={{ backgroundColor: 'white', padding: 20, height: "50%", width: "90%", borderRadius: 35, alignSelf: "center" }} >
            <View className=' h-[100%]'>
              <View className='flex-row items-center justify-between'>
                <Text className='text-xl font-bold text-black'>Save To...</Text>
                <Button style={{ alignItems: "center", justifyContent: "center" }} textColor='#007AFF' onPress={() => { setAddToPlaylistVisible(false); handlePresentModalPress() }}><Text className='text-2xl'>+</Text><Text> New Playlist</Text></Button>
              </View>
              <Divider />
              {usersPlaylists ?
                <View className='flex-1'>
                  <ScrollView className='mt-2'>
                    {usersPlaylists.map((item, index) => {
                      return (<View className='mt-2'><RenderAddToUserPlaylistsListProgram playlist={item} lectureToBeAdded={lectureToBeAddedToPlaylist} setAddToPlaylistVisible={setAddToPlaylistVisible} setPlaylistAddingTo={setPlaylistAddingTo} playListAddingTo={playlistAddingTo} /></View>)
                    })
                    }
                  </ScrollView>
                  <Divider />
                </View>
                :
                (
                  <View className=' items-center justify-center '>
                    <Text> No User Playlists Yet </Text>
                  </View>
                )
              }
            </View>
          </Modal>
        </Portal>
      </Animated.ScrollView>
      <CreatePlaylistBottomSheet ref={bottomSheetRef} />

    </View>
  )
}


export default programLectures