import { View, Text, Pressable, FlatList, Dimensions, Image } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useLocalSearchParams, Stack } from 'expo-router';
import { EventLectureType, Lectures, Program } from '@/src/types';
import { Link } from "expo-router";
import { ActivityIndicator, Icon, IconButton } from 'react-native-paper';
import LectureDotsMenu from '../LectureComponets/LectureDotsMenu';
import { Menu, MenuOptions, MenuOption, MenuTrigger} from 'react-native-popup-menu';
import * as Haptics from "expo-haptics"
import Animated, { useSharedValue, withSpring, useAnimatedStyle, interpolate, Extrapolation, runOnJS } from 'react-native-reanimated';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
type RenderAddedProgramLecturesProp = {
    program_lecture_id : string
    playlist : string
    id : number
}
const RenderAddedProgramLectures = ( {program_lecture_id, playlist, id} : RenderAddedProgramLecturesProp) => {
  const { session } = useAuth()
  const [ lecture, setLecture ] = useState<Lectures>()
  const [ lectureSpeaker, setLectureSpeaker ] = useState<string[]>([])
  const liked = useSharedValue(0)

  const getLectureInfo = async () => {
    const { data , error } = await supabase.from("program_lectures").select("*").eq("lecture_id", program_lecture_id).single()
    if ( error ){
        console.log( error )
    }
    if( data ){
        setLecture(data)
        if( data.lecture_speaker ){
          const speakerNames = await Promise.all (
            data.lecture_speaker.map( async ( id ) => {
              const { data , error } = await supabase.from("speaker_data").select("speaker_name").eq("speaker_id", id).single()
              return data?.speaker_name
            })  
          )
          setLectureSpeaker(speakerNames)
        }

    }
  }
  const [ program_img , setProgram_img ] = useState<string>()
  async function checkIfLectureIsLiked(){
    const { data , error } = await supabase.from("liked_lectures").select("lecture_id").eq("user_id", session?.user.id).eq("lecture_id", program_lecture_id).single()

    if( data ){
      return 1
    }else{
      return 0
    }
  }

  async function setLiked() {
    try {
      const isLiked = await checkIfLectureIsLiked(); 
      liked.value = isLiked; 
    } catch (error) {
      console.error("Error setting liked value:", error);
    }
  }

  async function stateOfLikedLecture(){
    if( liked.value == 0 ){
    const { error } = await supabase.from("liked_lectures").insert({user_id : session?.user.id, lecture_id: program_lecture_id})
    if (error) {
      console.log(error)
    }
    }
    if ( liked.value == 1 ){
      const { error } = await supabase.from("liked_lectures").delete().eq("user_id", session?.user.id).eq("lecture_id", program_lecture_id)
      if (error) {
        console.log(error)
      }
    }
    liked.value = withSpring( liked.value ? 0: 1, {} )
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    )
  }
      
  const outlineStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(liked.value, [0, 1], [1, 0], Extrapolation.CLAMP),
        },
      ],
    };
  });
  
  async function getLecImage(){
    const { data, error } = await supabase.from("program_lectures").select("lecture_program").eq("lecture_id", program_lecture_id).single()
    if( error ){
      console.log( error)
    }
    if( data ){
      let img = data;
      if( img ){
        const { data , error }  = await supabase.from("programs").select("program_img").eq("program_id", img.lecture_program).single()
        if( error ){
          console.log(error)
        }
        if( data ){
          setProgram_img(data.program_img)
      }
      }
    }
  }
  const fillStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: liked.value,
        },
      ],
      opacity: liked.value
    };
  });
  
    const LikeButton = () => {
      return(
        <Pressable onPress={stateOfLikedLecture} className=' relative'>
          <Animated.View style={outlineStyle}>
            <Icon source="cards-heart-outline"  color='black'size={25}/>
          </Animated.View>
          <Animated.View style={[{position: "absolute"} ,fillStyle]}>
            <Icon source="cards-heart"  color='red'size={25}/>
          </Animated.View>
      </Pressable>
      )
    }
  
    const DotsButton = () => {
      return(
        <Menu>
          <MenuTrigger>
            <Icon source={"dots-horizontal"} color='black' size={25}/>
          </MenuTrigger>
          <MenuOptions customStyles={{optionsContainer: {width: 150, borderRadius: 8, marginTop: 20, padding: 8}}}>
            <MenuOption  onSelect={ async () => {const { error } = await supabase.from('user_playlist_lectures').delete().eq('playlist_id', playlist).eq('program_lecture_id', program_lecture_id).eq('id', id) }}>
              <View className='flex-row justify-between items-center' >
                <Text className='text-center'>Remove From Playlist</Text>
                <Icon source="trash-can-outline" color='red' size={15}/>
              </View>
            </MenuOption>
          </MenuOptions>
        </Menu>           
      )
    }
   
  const width = Dimensions.get("window").width
  useEffect(() => {
    getLectureInfo()
    setLiked()
    getLecImage()
  },[])
  return (
    <View className='bg-white mt-2  justify-center' style={{width: width}}>
    <Pressable>
    <View className='flex-row justify-between px-2'>
      <Link href={`/myPrograms/lectures/${lecture?.lecture_id}`}>
        <View className=''>
          <Image source={program_img ? { uri : program_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 50, height: 50, borderRadius: 8}}/>
        </View>
        <View className='flex-col justify-center' style={{width: width / 1.5, height: 50}}>
          <Text className='text-md font-bold ml-2 text-black' style={{flexShrink: 1 }} numberOfLines={1}>{lecture?.lecture_name}</Text>
          <View className='flex-row' style={{flexShrink: 1, width: width / 1.5}}>
             <Text className='ml-2 text-gray-500' style={{flexShrink:1}} numberOfLines={1}>{lectureSpeaker ? lectureSpeaker.join('&') : ''} </Text> 
          </View>
        </View>
        </Link>
        <View className='flex-row mt-3 justify-center px-2'>
          <LikeButton />
          <View className='w-2'></View>
          <DotsButton />
        </View>
      </View>
    </Pressable>
  </View>
  )
}


type RenderAddedEventLecturesProp = {
  event_lecture_id : string
  playlist : string
  id : number
}
export const RenderAddedEventLectures = ( {event_lecture_id, playlist , id} : RenderAddedEventLecturesProp) => {
  const { session } = useAuth()
  const [ lecture, setLecture ] = useState<EventLectureType>()
  const liked = useSharedValue(0)
  const [ lectureSpeaker, setLectureSpeaker ] = useState<string[]>([])

  const getLectureInfo = async () => {
    const { data , error } = await supabase.from("events_lectures").select("*").eq("event_lecture_id", event_lecture_id).single()
    if ( error ){
        console.log( error )
    }
    if( data ){
        setLecture(data)
        if( data.event_lecture_speaker ){
          const speakerNames = await Promise.all (
            data.event_lecture_speaker.map( async ( id ) => {
              const { data , error } = await supabase.from("speaker_data").select("speaker_name").eq("speaker_id", id).single()
              return data?.speaker_name
            })  
          )
          setLectureSpeaker(speakerNames)
        }
    }
  }
  const [ program_img , setProgram_img ] = useState<string>()
  async function checkIfLectureIsLiked(){
    const { data , error } = await supabase.from("liked_event_lectures").select("event_lecture_id").eq("user_id", session?.user.id).eq("event_lecture_id", event_lecture_id).single()

    if( data ){
      return 1
    }else{
      return 0
    }
  }

  async function setLiked() {
    try {
      const isLiked = await checkIfLectureIsLiked(); 
      liked.value = isLiked; 
    } catch (error) {
      console.error("Error setting liked value:", error);
    }
  }

  async function stateOfLikedLecture(){
    if( liked.value == 0 ){
    const { error } = await supabase.from("liked_event_lectures").insert({user_id : session?.user.id, event_lecture_id: event_lecture_id})
    if (error) {
      console.log(error)
    }
    }
    if ( liked.value == 1 ){
      const { error } = await supabase.from("liked_event_lectures").delete().eq("user_id", session?.user.id).eq("event_lecture_id", event_lecture_id)
      if (error) {
        console.log(error)
      }
    }
    liked.value = withSpring( liked.value ? 0: 1, {} )
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    )
  }
      
  const outlineStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(liked.value, [0, 1], [1, 0], Extrapolation.CLAMP),
        },
      ],
    };
  });
  
  async function getLecImage(){
    const { data, error } = await supabase.from("events_lectures").select("event_id").eq("event_lecture_id", event_lecture_id).single()
    if( error ){
      console.log( error)
    }
    if( data ){
      let img = data;
      if( img ){
        const { data , error }  = await supabase.from("events").select("event_img").eq("event_id", img.event_id).single()
        if( error ){
          console.log(error)
        }
        if( data ){
          setProgram_img(data.event_img)
      }
      }
    }
  }
  const fillStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: liked.value,
        },
      ],
      opacity: liked.value
    };
  });
  
    const LikeButton = () => {
      return(
        <Pressable onPress={stateOfLikedLecture} className=' relative'>
          <Animated.View style={outlineStyle}>
            <Icon source="cards-heart-outline"  color='black'size={25}/>
          </Animated.View>
          <Animated.View style={[{position: "absolute"} ,fillStyle]}>
            <Icon source="cards-heart"  color='red'size={25}/>
          </Animated.View>
      </Pressable>
      )
    }
  
    const DotsButton = () => {
      return(
        <Menu>
          <MenuTrigger>
            <Icon source={"dots-horizontal"} color='black' size={25}/>
          </MenuTrigger>
          <MenuOptions customStyles={{optionsContainer: {width: 150, borderRadius: 8, marginTop: 20, padding: 8}}}>
            <MenuOption onSelect={ async () => {
              const { error } = await supabase.from('user_playlist_lecture').delete().eq('playlist_id', playlist).eq('event_lecture_id', event_lecture_id).eq('id',id)
              if( error ){
                console.log(error)
              }
              } }>
            <Pressable className='flex-row justify-between items-center' >
                <Text>Remove From Playlist</Text>
                <Icon source="trash-can-outline" color='red' size={15}/>
              </Pressable>
            </MenuOption>
          </MenuOptions>
        </Menu>           
      )
    }
   
  const width = Dimensions.get("window").width
  useEffect(() => {
    getLectureInfo()
    setLiked()
    getLecImage()
  },[])
  return (
    <View className='bg-white mt-2  justify-center' style={{width: width}}>
    <Pressable>
    <View className='flex-row justify-between px-2'>
      <Link href={`/myPrograms/eventLectures/${lecture?.event_lecture_id}`}>
        <View className=''>
          <Image source={ program_img ? { uri : program_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 50, height: 50, borderRadius: 8}}/>
        </View>
        <View className='flex-col justify-center' style={{width: width / 1.5, height: 50}}>
          <Text className='text-md font-bold ml-2 text-black' style={{flexShrink: 1 }} numberOfLines={1}>{lecture?.event_lecture_name}</Text>
          <View className='flex-row' style={{flexShrink: 1, width: width / 1.5}}>
          <Text className='ml-2 text-gray-500' style={{flexShrink:1}} numberOfLines={1}>{lectureSpeaker ? lectureSpeaker.join('&') : ''} </Text> 
          </View>
        </View>
        </Link>
        <View className='flex-row mt-3 justify-center px-2'>
          <LikeButton />
          <View className='w-2'></View>
          <DotsButton />
        </View>
      </View>
    </Pressable>
  </View>
  )
}

type RenderAddedQuranLecturesProp = {
  quran_lecture_id: string
  playlist: string
  id: number
}

export const RenderAddedQuranLectures = ({ quran_lecture_id, playlist, id }: RenderAddedQuranLecturesProp) => {
  const [lecture, setLecture] = useState<{ youtube_id: string, reciter: string, surah: string, id: string } | null>(null)
  const [speakerInfo, setSpeakerInfo] = useState<{ speaker_name: string, speaker_img: string } | null>(null)

  const getLectureInfo = async () => {
    const { data, error } = await supabase.from("quran_playlist").select("*").eq("id", quran_lecture_id).single()
    if (error) {
      console.log(error)
      return
    }
    if (data) {
      setLecture(data)
      // Get speaker info
      if (data.reciter) {
        const { data: speaker, error: speakerError } = await supabase
          .from("speaker_data")
          .select("speaker_name, speaker_img")
          .eq("speaker_id", data.reciter)
          .single()
        if (speaker) {
          setSpeakerInfo(speaker)
        }
      }
    }
  }

  const DotsButton = () => {
    return (
      <Menu>
        <MenuTrigger>
          <Icon source={"dots-horizontal"} color='black' size={25} />
        </MenuTrigger>
        <MenuOptions customStyles={{ optionsContainer: { width: 150, borderRadius: 8, marginTop: 20, padding: 8 } }}>
          <MenuOption onSelect={async () => {
            const { error } = await supabase.from('user_playlist_lectures').delete().eq('playlist_id', playlist).eq('quran_lecture_id', quran_lecture_id).eq('id', id)
            if (error) {
              console.log(error)
            }
          }}>
            <View className='flex-row justify-between items-center'>
              <Text>Remove From Playlist</Text>
              <Icon source="trash-can-outline" color='red' size={15} />
            </View>
          </MenuOption>
        </MenuOptions>
      </Menu>
    )
  }

  const width = Dimensions.get("window").width

  useEffect(() => {
    getLectureInfo()
  }, [])

  if (!lecture) {
    return (
      <View className='bg-white mt-2 justify-center items-center' style={{ width: width, height: 60 }}>
        <ActivityIndicator size="small" color="#0D509D" />
      </View>
    )
  }

  return (
    <View className='bg-white mt-2 justify-center' style={{ width: width }}>
      <Pressable>
        <View className='flex-row justify-between px-2'>
          <Link href={{
            pathname: '/myPrograms/quran/QuranVideo',
            params: {
              youtube_id: lecture.youtube_id,
              quran_id: lecture.id,
              surah: lecture.surah,
              speaker_name: speakerInfo?.speaker_name || 'Unknown',
              speaker_img: speakerInfo?.speaker_img || '',
              speaker_id: lecture.reciter
            }
          }}>
            <View className=''>
              <Image
                source={speakerInfo?.speaker_img ? { uri: speakerInfo.speaker_img } : require("@/assets/images/QuranImg.png")}
                style={{ width: 50, height: 50, borderRadius: 8 }}
              />
            </View>
            <View className='flex-col justify-center' style={{ width: width / 1.5, height: 50 }}>
              <Text className='text-md font-bold ml-2 text-black' style={{ flexShrink: 1 }} numberOfLines={1}>{lecture.surah}</Text>
              <View className='flex-row' style={{ flexShrink: 1, width: width / 1.5 }}>
                <Text className='ml-2 text-gray-500' style={{ flexShrink: 1 }} numberOfLines={1}>{speakerInfo?.speaker_name || 'Unknown Speaker'}</Text>
              </View>
            </View>
          </Link>
          <View className='flex-row mt-3 justify-center px-2'>
            <DotsButton />
          </View>
        </View>
      </Pressable>
    </View>
  )
}

export default RenderAddedProgramLectures