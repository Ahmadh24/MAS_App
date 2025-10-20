import { View, Text, Pressable, FlatList, Image, TouchableOpacity, Dimensions, Easing, Alert, StatusBar, Linking, Platform } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { useLocalSearchParams, Stack, useRouter, Link, useNavigation } from 'expo-router';
import LecturesListLecture from '@/src/components/LectureListLecture';
import { Divider, Portal, Modal, IconButton, Icon, Button, Badge } from 'react-native-paper';
import { Lectures, SheikDataType, Program } from '@/src/types';
import { ScrollView } from 'react-native-gesture-handler';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Animated,{ FadeInLeft, interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { UserPlaylistType } from '@/src/types';
import RenderAddToUserPlaylistsListProgram from '@/src/components/RenderAddToUserPlaylistsList';
import { SharedTransition, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import CreatePlaylistBottomSheet from '@/src/components/UserProgramComponets/CreatePlaylistBottomSheet';
import * as Haptics from "expo-haptics"
import LottieView from 'lottie-react-native';
import Toast from 'react-native-toast-message';
import { isBefore } from 'date-fns';
import { FlyerSkeleton } from '@/src/components/FlyerSkeleton';
function setTimeToCurrentDate(timeString : string ) {

  // Split the time string into hours, minutes, and seconds
  const [hours, minutes, seconds] = timeString.split(':').map(Number);

  // Create a new Date object with the current date
  const timestampWithTimeZone = new Date();

  // Set the time with setHours (adjust based on local timezone or UTC as needed)
  timestampWithTimeZone.setHours(hours , minutes, seconds, 0); // No milliseconds

  // Convert to ISO format with timezone (to ensure it's interpreted as a TIMESTAMPTZ)
  const timestampISO = timestampWithTimeZone // This gives a full timestamp with timezone in UTC

  return timestampISO
}
const schedule_notification = async ( user_id : string, push_notification_token : string , message : string, notification_type : string, program_event_name : string, notification_time : Date ) => {
  console.log(program_event_name)
  const { error } = await supabase.from('program_notification_schedule').insert({ user_id : user_id, push_notification_token : push_notification_token, message : message, notification_type : notification_type, program_event_name : program_event_name, notification_time : notification_time, title : program_event_name})
  if( error ){
    console.log(error)
  }
}
const ProgramLectures = () => {
  const { session } = useAuth()
  const { programId } = useLocalSearchParams();
  const [ lectures, setLectures ] = useState<Lectures[] | null>(null)
  const [ program, setProgram ] = useState<Program>()
  const [ visible, setVisible ] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const [ programInNotfications, setProgramInNotifications ] = useState(false)
  const [ programInPrograms, setProgramInPrograms ] = useState(false)
  const [ addToPlaylistVisible, setAddToPlaylistVisible ] = useState(false)
  const [ lectureToBeAddedToPlaylist, setLectureToBeAddedToPlaylist ] = useState<string>("")
  const [ playlistAddingTo, setPlaylistAddingTo ] = useState<string[]>([])
  const [ speakerData, setSpeakerData ] = useState<SheikDataType[]>()
  const [ usersPlaylists, setUsersPlaylists ] = useState<UserPlaylistType[]>()
  const [ speakerString, setSpeakerString ] = useState('')
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const handlePresentModalPress = () => bottomSheetRef.current?.present();
  const hideAddToPlaylist = () => setAddToPlaylistVisible(false)
  const navigation = useNavigation<any>()
  const Tab = useBottomTabBarHeight()
  const { width, height } = Dimensions.get("window")
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollOffset = useScrollViewOffset(scrollRef)
  const notifade = useSharedValue(1)

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
 async function getProgram(){
  const { data, error } = await supabase.from("programs").select("*").eq("program_id", programId).single()

  if( error ) {
    alert(error)
  }
  if ( data ) {
    const { data : checkIfExists , error } = await supabase.from("added_notifications_programs").select("*").eq("user_id", session?.user.id).eq("program_id", programId).single()
    const { data : programExists , error : programError } = await supabase.from('added_programs').select('*').eq('user_id', session?.user.id).eq('program_id', programId).single()
    const speakers : any[] = []
    let speaker_string : string[] = data.program_speaker.map(() => {return ''})
    await Promise.all(
      data.program_speaker.map( async ( speaker_id : string, index : number) => {
        const {data : speakerInfo, error : speakerInfoError } = await supabase.from('speaker_data').select('*').eq('speaker_id', speaker_id).single()
        if ( speakerInfo ){
          if (index == data.program_speaker.length - 1 ){
            speaker_string[index]=speakerInfo.speaker_name
          }
          else {
            speaker_string[index]= speakerInfo.speaker_name + ' & '
          }
          speakers.push(speakerInfo)
        }
      })
    )
    setSpeakerData(speakers)
    setSpeakerString(speaker_string.join(''))
    if( checkIfExists ){
      setProgramInNotifications(true)
    }
    if( programExists ){
      setProgramInPrograms(true)
    }
    setProgram(data)
  }
 }
 async function getProgramLectures() {
  const { data, error } = await supabase.from("program_lectures").select("*").eq("lecture_program", programId).order('lecture_date', { ascending : false })
  if( error ) {
    alert(error)
  }
  if ( data ) {
    setLectures(data)
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
const fadeOutNotification = useAnimatedStyle(() => ({
  opacity : notifade.value
}))
  useEffect(() => {
    getProgram()
    getProgramLectures()
    getUserPlaylists()
    notifade.value = withTiming(0, {duration : 6000})

    const listenForUserPlaylistChanges = supabase
    .channel('listen for user playlist adds')
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

    return () => { supabase.removeChannel( listenForUserPlaylistChanges )}
  }, [])

  useEffect(() => {
    setPlaylistAddingTo([])
  }, [!addToPlaylistVisible])

  const GetSheikData =  () => {
    return( 
      <View className='flex-1'>
        
        { 
          speakerData?.map((speakerData) => (
          <View className='border-2 border-gray-400 border-solid rounded-[25px] p-2 my-1'>
            <Animated.View className=' flex-row'>
                <Image source={speakerData?.speaker_img ? { uri : speakerData?.speaker_img }  : require("@/assets/images/MASHomeLogo.png")} style={{width: 110, height: 110, borderRadius: 50}} resizeMode='cover'/>
            <View className='flex-col px-1'>
              <Text className='text-xl font-bold'>Name: </Text>
              <Text className='pt-2 font-semibold' numberOfLines={1}> {speakerData?.speaker_name} </Text>
            </View>
          </Animated.View>
    
          <View className='flex-col py-3'>
            { speakerData?.speaker_name == "MAS" ? <Text className='font-bold'>Impact </Text> :  <Text className='font-bold'>Credentials: </Text> } 
            { speakerData?.speaker_creds.map( (cred, i) => {
              return <Text key={i}> <Icon source="cards-diamond-outline"  size={15} color='black'/> {cred} {'\n'}</Text>
            })}
          </View>
          </View>
          ))
        }
      </View>
    )
  } 

  const NotificationBell = () => {
  const addedToNoti = () => {
    const goToProgram = () => {
      navigation.navigate('myPrograms', { screen : 'notifications/ClassesAndLectures/[program_id]', params : { program_id : programId}, initial: false  })
    }
    Toast.show({
      type : 'addProgramToNotificationsToast',
      props : { props : program, onPress : goToProgram },
      position : 'top',
      topOffset : 50,
    })
  }
  const addToProgramsNoti = () => {
    const goToProgram = () => {
      navigation.navigate('myPrograms')
    }
    Toast.show({
      type : 'ProgramAddedToPrograms',
      props : { props : program, onPress : goToProgram },
      position : 'top',
      topOffset : 50,
    })
  }
   const handlePress = async () => {
    if( programInNotfications ) {
      const { error } = await supabase.from("added_notifications_programs").delete().eq("user_id" , session?.user.id).eq("program_id", programId)
      const { error : settingsError } = await supabase.from('program_notifications_settings').delete().eq('user_id', session?.user.id).eq("program_id", programId)
      const { error : ScheduleNotisError } = await supabase.from('program_notification_schedule').delete().eq('user_id', session?.user.id).eq("program_event_name", program?.program_name)
      setProgramInNotifications(false)
    }
    else{
      const { error } = await supabase.from("added_notifications_programs").insert({user_id :session?.user.id, program_id : programId, has_lectures : program?.has_lectures})
      const TodaysDate = new Date()
      const DaysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const programDays = program?.program_days
      const ProgramStartTime = setTimeToCurrentDate(program?.program_start_time!)

      if ( programDays && isBefore(TodaysDate, ProgramStartTime) ){
      await Promise.all(
        programDays?.map( async (day) => {
          const { data : user_push_token } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
          if( (TodaysDate.getDay() == DaysOfWeek.indexOf(day)) && (user_push_token?.push_notification_token) ){
            await schedule_notification(session?.user.id!, user_push_token?.push_notification_token,  `${program.program_name} is Starting Now!`, 'When Program Starts', program.program_name, ProgramStartTime)
          }
        })
      )
    }
      

      if( error ){
        console.log(error)
      }
      setProgramInNotifications(true)
      addedToNoti()
    }
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    )
  }
  const addToPrograms = async () => {
    if( programInPrograms ){
      const { error } = await supabase.from("added_programs").delete().eq("user_id" , session?.user.id).eq("program_id", programId)
      setProgramInPrograms(false)
    }
    else{
      const { error } = await supabase.from("added_programs").insert({user_id :session?.user.id, program_id : programId})
      if( error ){
        console.log(error)
      }
      setProgramInPrograms(true)
      addToProgramsNoti()
    }
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    )
  }
 
  
   return(
    <View className='flex-row items-center gap-x-5'>
      <Animated.View style={fadeOutNotification}>
        <View style={{ opacity : 1}} className='left-10 bottom-4 bg-gray-400 text-black h-[23px] w-[75px] text-[10px] items-center justify-center text-center z-[1] rounded-xl p-1 ' >
          <Text className='text-black text-[10px] font-semibold'>Notifications</Text>
        </View>
      </Animated.View>
      <Pressable onPress={handlePress} className='w-[30] h-[35] items-center justify-center'>
        {programInNotfications ?  <Icon source={"bell-check"} color='#007AFF' size={30}/> : <Icon source={"bell-outline"} color='#007AFF' size={30}/> }
      </Pressable>
      <Pressable onPress={addToPrograms}>
        { programInPrograms ?  <Icon source={'minus-circle-outline'} color='#007AFF' size={30}/> : <Icon source={"plus-circle-outline"} color='#007AFF' size={30}/>}
      </Pressable>
    </View>
   )
  }

  const AddToProgramsButton = () => {
    const addToProgramsNoti = () => {
      const goToProgram = () => {
        navigation.navigate('myPrograms')
      }
      Toast.show({
        type : 'ProgramAddedToPrograms',
        props : { props : program, onPress : goToProgram },
        position : 'top',
        topOffset : 50,
      })
    }
    const addToPrograms = async () => {
      if( programInPrograms ){
        const { error } = await supabase.from("added_programs").delete().eq("user_id" , session?.user.id).eq("program_id", programId)
        setProgramInPrograms(false)
      }
      else{
        const { error } = await supabase.from("added_programs").insert({user_id :session?.user.id, program_id : programId})
        if( error ){
          console.log(error)
        }
        setProgramInPrograms(true)
        addToProgramsNoti()
      }
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      )
    }
    return(
      <Pressable onPress={addToPrograms}>
        { programInPrograms ?  <Icon source={'minus-circle'} color='#007AFF' size={30}/> : <Icon source={"plus-circle-outline"} color='#007AFF' size={30}/>}
      </Pressable>
    )
  }
  
  const onDonePress = async () => {
    if( playlistAddingTo && playlistAddingTo.length > 0 ){
      playlistAddingTo.map( async (item) => {
          const { data : checkDupe , error : checkDupeError } = await supabase.from("user_playlist_lectures").select("*").eq("user_id ", session?.user.id).eq( "playlist_id" ,item).eq( "program_lecture_id", lectureToBeAddedToPlaylist).single()  
          console.log(checkDupe, checkDupeError)
            if( checkDupe ){
              const { data : dupePlaylistName, error  } = await supabase.from("user_playlist").select("playlist_name").eq("playlist_id", checkDupe.playlist_id).single()
              Alert.alert(`Lecture already found in ${dupePlaylistName?.playlist_name}`, "", [
                {
                  text: "Cancel",
                  onPress : () => setAddToPlaylistVisible(false)
                },
                {
                  text : "Continue",
                  onPress : async () => await supabase.from("user_playlist_lectures").insert({user_id : session?.user.id, playlist_id : item, program_lecture_id : lectureToBeAddedToPlaylist })
                }
              ]
            )
            }
            else{
              const { error } = await supabase.from("user_playlist_lectures").insert({user_id : session?.user.id, playlist_id : item, program_lecture_id : lectureToBeAddedToPlaylist })
              const getPlaylistAddedTo = usersPlaylists?.filter(playlist => playlist.playlist_id == playlistAddingTo[0])
              const goToPlaylist = () => { navigation.navigate('myPrograms', { screen : 'playlists/[playlist_id]', params: { playlist_id : playlistAddingTo }}) }
              if( getPlaylistAddedTo && getPlaylistAddedTo[0] ){
                Toast.show({
                  type : 'LectureAddedToPlaylist',
                  props: { props : getPlaylistAddedTo[0], onPress : goToPlaylist},
                  position : 'bottom',
                  bottomOffset : Tab * 2
                })
              }
          }})
        setAddToPlaylistVisible(false)
      }
    else{
      setAddToPlaylistVisible(false)
    }
  }
  useEffect(() => {
    onDonePress()
    setAddToPlaylistVisible(false)
  }, [playlistAddingTo.length > 0])
  const currDate = new Date().toISOString()
  return (
    <View className='flex-1 bg-white' style={{flexGrow: 1}}>
     <Stack.Screen options={ { title: "" , headerBackTitleVisible : false, headerRight : () => { if(isBefore(currDate, program?.program_end_date!)){ return ( <NotificationBell /> )} else{ return <AddToProgramsButton />}}, headerStyle : {backgroundColor : "white"} } } />
     <StatusBar barStyle={"dark-content"}/>
      <Animated.ScrollView ref={scrollRef}  scrollEventThrottle={16} contentContainerStyle={{justifyContent: "center", alignItems: "center", marginTop: "2%" }} >
          
          <View className=' relative' style={{width: width / 1.2, height: 300, borderRadius: 8 }}>
            {/* Show the skeleton until the image is loaded or errored */}
            { !imageReady && 
              <FlyerSkeleton 
                width={width / 1.2} 
                height={300} 
                style={{ position: 'absolute', top: 0, zIndex: 2 }} 
              />
            }
            <Animated.Image 
              source={
                // If there's an error or no URL, use the fallback image
                hasError || !program?.program_img 
                  ? require("@/assets/images/MASHomeLogo.png")
                  : { uri: program.program_img }
              }
              style={[
                { width: width / 1.2, height: 300, borderRadius: 8 },
                imageAnimatedStyle
              ]}
              resizeMode="stretch"
              onLoad={() => setImageReady(true)}
              onError={() => {
                // Mark that an error occurred and hide the skeleton
                setHasError(true);
                setImageReady(true);
              }}
            />
          </View>
       
          <View className='bg-white w-[100%]' style={{paddingBottom : Tab * 3}}>
            <Text className='text-center mt-2 text-xl text-black font-bold'>{program?.program_name}</Text>
            <Text className='text-center mt-2  text-[#0D509D] w-[60%] self-center' onPress={showModal} numberOfLines={1}>{speakerString}</Text>
              <View>
                {
                  program?.has_lectures  || ( lectures && lectures?.length >= 1) ? lectures?.map((item, index) => {
                    return(
                      <Animated.View key={index} entering={FadeInLeft.duration(400).delay(100)}>
                        <LecturesListLecture  lecture={item} index={index} speaker={program?.program_speaker} setAddToPlaylistVisible={setAddToPlaylistVisible} setLectureToBeAddedToPlaylist={setLectureToBeAddedToPlaylist} length={lectures.length}/>
                        <Divider style={{width: "95%", marginLeft: 8}}/>
                      </Animated.View>
                    )
                  }) : program?.has_lectures == false ? (
                    <View className=''> 
                      <View>
                        <Text className='text-left text-2xl font-bold text-black ml-4'>Description: </Text>
                      </View>

                      <View className='items-center justify-center'>
                        <View className='w-[95%] bg-white px-3 flex-wrap py-2' style={[{ borderRadius : 15, height : height / 3.7 , shadowColor : "gray", shadowOffset : { width : 0, height :0}, shadowOpacity : 2, shadowRadius : 1, elevation : 5 }, 
                          Platform.OS == 'android' ?  {
                            borderWidth: 1,
                            borderColor : '#D3D3D3',
                          } : {}
                        ]}>
                          <ScrollView><Text>{program?.program_desc}</Text></ScrollView>
                        </View>
                      </View>
                    </View>
                  ) : <></>
                }
                <View className='items-center justify-center'>
                    {
                      program?.program_is_paid ? 
                      (
                        <Pressable onPress={() => {
                        Linking.canOpenURL(program.paid_link).then(() => {
                        Linking.openURL(program.paid_link);
                        });
                        }}>
                        <Button icon={() => <Icon source={"cart-variant"} size={20} color='white'/>} mode='elevated' style={{ backgroundColor : "#57BA47", marginTop : 10, width: "90%"}}><Text className='text-white'>Sign Up Now</Text></Button>
                        </Pressable>
                      ) : <></>
                    }
                </View>
              </View>
          </View>
          
          <Portal>
            <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={{backgroundColor: 'white', padding: 20, minHeight : 400, maxHeight: "70%", width: "95%", borderRadius: 35, alignSelf: "center"}} >
              <ScrollView className='flex-1'
              showsVerticalScrollIndicator={true}
              
              >
                <GetSheikData />
              </ScrollView>
            </Modal>
          </Portal>

          <Portal>
            <Modal visible={addToPlaylistVisible} onDismiss={hideAddToPlaylist} contentContainerStyle={{backgroundColor: 'white', padding: 20, height: "50%", width: "90%", borderRadius: 35, alignSelf: "center"}} >
              <View className=' h-[100%]'>
                  <View className='flex-row items-center justify-between'>
                    <Text className='text-xl font-bold text-black'>Save To...</Text>
                    <Button style={{ alignItems : "center", justifyContent : "center"}} textColor='#007AFF' onPress={() => {setAddToPlaylistVisible(false); handlePresentModalPress()}}><Text className='text-2xl'>+</Text><Text> New Playlist</Text></Button>
                  </View>
                <Divider />
                  { usersPlaylists ?
                  <View className='flex-1'>
                    <ScrollView className='mt-2'>
                    {usersPlaylists.map(( item, index) => {
                        return(<View className='mt-2'><RenderAddToUserPlaylistsListProgram playlist={item} lectureToBeAdded={lectureToBeAddedToPlaylist} setAddToPlaylistVisible={setAddToPlaylistVisible} setPlaylistAddingTo={setPlaylistAddingTo} playListAddingTo={playlistAddingTo}/></View>)
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
        <CreatePlaylistBottomSheet ref={bottomSheetRef}/>
      </Animated.ScrollView>
      </View>
  )
}


export default ProgramLectures