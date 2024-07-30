import { View, Text, Dimensions, Image, ScrollView, Alert } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { Stack, router } from "expo-router"
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Animated,{ FadeInLeft, interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset } from 'react-native-reanimated';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { defaultProgramImage }  from '@/src/components/ProgramsListProgram';
import { Divider, Portal, Modal, IconButton, Icon, Button } from 'react-native-paper';
import SheikData from "@/assets/data/sheikData";
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

type EventsLectureDisplayProp = {
    event_id : string
    event_name : string
    event_img : string
    event_speaker : string
}
const EventsLectureDisplay = ( {event_id, event_img, event_speaker, event_name} : EventsLectureDisplayProp ) => {
    const { session } = useAuth()    
    const [ eventLectures, setEventLectures ] = useState<EventLectureType[] | null>(null)
    const [ visible, setVisible ] = useState(false);
    const showModal = () => setVisible(true);
    const hideModal = () => setVisible(false);
    const [ playlistAddingTo, setPlaylistAddingTo ] = useState<string[]>([])
    const [ addToPlaylistVisible, setAddToPlaylistVisible ] = useState(false)
    const [ lectureToBeAddedToPlaylist, setLectureToBeAddedToPlaylist ] = useState<string>("")
    const [ playAnimation , setPlayAnimation ] = useState( false )
    const [ lectureInfoAnimation, setLectureInfoAnimation ] = useState<Lectures>()
    const [ usersPlaylists, setUsersPlaylists ] = useState<UserPlaylistType[]>()
    const hideAddToPlaylist = () => setAddToPlaylistVisible(false)
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const handlePresentModalPress = () => bottomSheetRef.current?.present();
    const Tab = useBottomTabBarHeight()
  
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
    const GetSheikData = () => {
        const sheik : SheikDataType[]  = SheikData.filter(sheik => sheik.name == event_speaker)
        return( 
          <View>
            <View className=' flex-row'>
              <Image source={{uri : sheik[0].image || defaultProgramImage}} style={{width: 110, height: 110, borderRadius: 50}} resizeMode='contain'/>
              <View className='flex-col px-5'>
                <Text className='text-xl font-bold'>Name: </Text>
                <Text className='pt-2 font-semibold'> {sheik[0].name} </Text>
              </View>
            </View>
      
            <View className='flex-col py-3'>
              { sheik[0].name == "MAS" ? <Text className='font-bold'>Impact </Text> :  <Text className='font-bold'>Credentials: </Text> } 
              { sheik[0].creds.map( (cred, i) => {
                return <Text key={i}> <Icon source="cards-diamond-outline"  size={15}/> {cred} </Text>
              })}
            </View>
          </View>
        )
      } 
    const fetchEventLectures = async () => {
        const { data, error } = await supabase.from("events_lectures").select("*").eq("event_id", event_id)
        if( error ){
            console.log(error)
        }
        if ( data ){
            setEventLectures(data)
        }
    }
    async function getUserPlaylists(){
      const { data, error } = await supabase.from("user_playlist").select("*").eq("user_id", session?.user.id)
      if( error ){
        console.log( error )
      }
      if( data ){
        setUsersPlaylists(data)
      }
    }

    const onDonePress = async () => {
      if(playlistAddingTo && playlistAddingTo.length > 0){
        playlistAddingTo.map( async (item) => {
            const { data : checkDupe , error : checkDupeError } = await supabase.from("user_playlist_lectures").select("*").eq("user_id ", session?.user.id).eq( "playlist_id" ,item).eq( "event_lecture_id", lectureToBeAddedToPlaylist).single()  
              if( checkDupeError ) {
                console.log( checkDupeError )
              }
              if( checkDupe ){
                const { data : dupePlaylistName, error  } = await supabase.from("user_playlist").select("playlist_name").eq("playlist_id", checkDupe.playlist_id).single()
                Alert.alert(`Lecture already found in ${dupePlaylistName?.playlist_name}`, "", [
                  {
                    text: "Cancel",
                    onPress : () => setAddToPlaylistVisible(false)
                  },
                  {
                    text : "Continue",
                    onPress : async () => await supabase.from("user_playlist_lectures").insert({user_id : session?.user.id, playlist_id : item, event_lecture_id : lectureToBeAddedToPlaylist })
                  }
                ]
              )
              }
              else{
                const { error } = await supabase.from("user_playlist_lectures").insert({user_id : session?.user.id, playlist_id : item, event_lecture_id : lectureToBeAddedToPlaylist })
                if( error ) {
                  console.log( error )
                }
            }})
        setAddToPlaylistVisible(false)
      }
      else{
        setAddToPlaylistVisible(false)
      }
    }
    useEffect(() => {
        fetchEventLectures()
        getUserPlaylists()
    }, [])

    useEffect(() => {
      setPlaylistAddingTo([])
    }, [!addToPlaylistVisible])
      return (
        <View className='flex-1 bg-white' style={{flexGrow: 1}}>
          <Animated.ScrollView ref={scrollRef}  scrollEventThrottle={16} contentContainerStyle={{justifyContent: "center", alignItems: "center", marginTop: "2%" }} >
              
              <Animated.Image 
                source={ { uri: event_img || defaultProgramImage } }
                style={ [{width: width / 1.2, height: 300, borderRadius: 8 }, imageAnimatedStyle] }
                resizeMode='stretch'
              />
    
              <View className='bg-white' style={{paddingBottom : Tab * 3}}>
                <Text className='text-center mt-2 text-xl text-black font-bold'>{event_name}</Text>
                <Text className='text-center mt-2  text-[#0D509D]' onPress={showModal}>{event_speaker}</Text>
                  <View className='ml-3'>
                    {
                        eventLectures ? eventLectures.map((item, index) => {
                            return (
                            <Animated.View key={index} entering={FadeInLeft.duration(400).delay(100)}> 
                            <RenderEventLectures lecture={item} index={index} speaker={item.event_lecture_speaker} setAddToPlaylistVisible={setAddToPlaylistVisible} setLectureToBeAddedToPlaylist={setLectureToBeAddedToPlaylist}/>
                            <Divider style={{width: "95%", marginLeft: 8}}/>
                            </Animated.View>
                            )
                        }) : <></>
                    }
                  </View>
              </View>
    
              <Portal>
                <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={{backgroundColor: 'white', padding: 20, height: "35%", width: "90%", borderRadius: 35, alignSelf: "center"}} >
                  <GetSheikData />
                </Modal>
              </Portal>
              <Portal>
              <Modal visible={addToPlaylistVisible} onDismiss={hideAddToPlaylist} contentContainerStyle={{backgroundColor: 'white', padding: 20, height: "50%", width: "90%", borderRadius: 35, alignSelf: "center"}} >
                <View className='h-[100%]'>
                  <View className='flex-row items-center justify-between'>
                      <Text className='text-xl font-bold text-black'>Save To...</Text>
                      <Button style={{ alignItems : "center", justifyContent : "center"}} textColor='#007AFF' onPress={() => {setAddToPlaylistVisible(false); handlePresentModalPress()}}><Text className='text-2xl'>+</Text><Text> New Playlist</Text></Button>
                    </View>
                    <Divider />
                      { usersPlaylists ? 
                      <View className='flex-1'>
                        <ScrollView className='mt-2'>
                          { usersPlaylists.map(( item, index) => {
                              return( <RenderAddToUserPlaylistsListEvent playlist={item} lectureToBeAdded={lectureToBeAddedToPlaylist} setAddToPlaylistVisible={setAddToPlaylistVisible} setPlaylistAddingTo={setPlaylistAddingTo} playListAddingTo={playlistAddingTo}/>)
                            }) }
                        </ScrollView>

                      <Divider />
                      <Button textColor='#007AFF' style={{ paddingHorizontal : 1}} onPress={onDonePress}><Icon source={"check-bold"} color='#007AFF' size={20}/><Text className='text-xl'>Done</Text></Button>
                      </View>
                      :( 
                      <View className=' items-center justify-center '> 
                          <Text> No User Playlists Yet </Text>
                      </View>
                      )
                    }
                </View>
              </Modal>
        </Portal>
        <CreatePlaylistBottomSheet ref={bottomSheetRef}/>
          </Animated.ScrollView>
          </View>
      )
}

export default EventsLectureDisplay