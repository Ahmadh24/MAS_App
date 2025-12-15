import { View, Text, Pressable, FlatList, Image, TouchableOpacity, Dimensions, Easing, Alert, StatusBar, Linking, Platform, ImageBackground, ScrollView as RNScrollView } from 'react-native'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, Stack, useRouter, Link, useNavigation } from 'expo-router';
import { Divider, Portal, Modal, IconButton, Icon, Button, Badge } from 'react-native-paper';
import { EventLectureType, SheikDataType, EventsType } from '@/src/types';
import { ScrollView } from 'react-native-gesture-handler';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Animated,{ FadeInLeft, interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { UserPlaylistType } from '@/src/types';
import RenderAddToUserPlaylistsListEvent from '@/src/components/RenderAddToUserPlaylistsList';
import { withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import CreatePlaylistBottomSheet from '@/src/components/UserProgramComponets/CreatePlaylistBottomSheet';
import * as Haptics from "expo-haptics"
import LottieView from 'lottie-react-native';
import Toast from 'react-native-toast-message';
import { isBefore, format } from 'date-fns';
import { FlyerSkeleton } from '@/src/components/FlyerSkeleton';
import YoutubePlayer from "react-native-youtube-iframe";

function setTimeToCurrentDate(timeString : string ) {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  const timestampWithTimeZone = new Date();
  timestampWithTimeZone.setHours(hours , minutes, seconds, 0);
  return timestampWithTimeZone
}

const schedule_notification = async ( user_id : string, push_notification_token : string , message : string, notification_type : string, program_event_name : string, notification_time : Date ) => {
  console.log(program_event_name)
  const { error } = await supabase.from('program_notification_schedule').insert({ user_id : user_id, push_notification_token : push_notification_token, message : message, notification_type : notification_type, program_event_name : program_event_name, notification_time : notification_time, title : program_event_name})
  if( error ){
    console.log(error)
  }
}

const EventLectures = () => {
  const { session } = useAuth()
  const router = useRouter()
  const { event_id } = useLocalSearchParams();
  const [ eventLectures, setEventLectures ] = useState<EventLectureType[] | null>(null)
  const [ event, setEvent ] = useState<EventsType>()
  const [ visible, setVisible ] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const [ eventInNotifications, setEventInNotifications ] = useState(false)
  const [ addToPlaylistVisible, setAddToPlaylistVisible ] = useState(false)
  const [ lectureToBeAddedToPlaylist, setLectureToBeAddedToPlaylist ] = useState<string>("")
  const [ playlistAddingTo, setPlaylistAddingTo ] = useState<string[]>([])
  const [ speakerData, setSpeakerData ] = useState<SheikDataType[]>([])
  const [ usersPlaylists, setUsersPlaylists ] = useState<UserPlaylistType[]>()
  const [ speakerString, setSpeakerString ] = useState('')
  const [ selectedLecture, setSelectedLecture ] = useState<EventLectureType | null>(null)
  const [ playing, setPlaying ] = useState(false)
  const [ watchedLectures, setWatchedLectures ] = useState<Set<string>>(new Set())
  const [ startedLectures, setStartedLectures ] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'description' | 'classes'>('description')
  const [videoTab, setVideoTab] = useState<'keynotes' | 'summary'>('summary')
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0)
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
    return{}
  })

 async function getEvent(){
  const { data, error } = await supabase.from("events").select("*").eq("event_id", event_id).single()

  if( error ) {
    alert(error)
  }
  if ( data ) {
    const { data : checkIfExists , error } = await supabase.from("added_notifications_events").select("*").eq("user_id", session?.user.id).eq("event_id", event_id).single()
    const speakers : any[] = []
    let speaker_string : string[] = []
    
    if (data.event_speaker && Array.isArray(data.event_speaker) && data.event_speaker.length > 0) {
      speaker_string = data.event_speaker.map(() => {return ''})
      await Promise.all(
        data.event_speaker.map( async ( speaker_id : string, index : number) => {
          const {data : speakerInfo, error : speakerInfoError } = await supabase.from('speaker_data').select('*').eq('speaker_id', speaker_id).single()
          if ( speakerInfo ){
            if (index == data.event_speaker.length - 1 ){
              speaker_string[index]=speakerInfo.speaker_name
            }
            else {
              speaker_string[index]= speakerInfo.speaker_name + ' & '
            }
            speakers.push(speakerInfo)
          }
        })
      )
    }
    
    setSpeakerData(speakers)
    setSpeakerString(speaker_string.join(''))
    if( checkIfExists ){
      setEventInNotifications(true)
    }
    setEvent(data)
  }
 }

 async function getEventLectures() {
  const { data, error } = await supabase.from("events_lectures").select("*").eq("event_id", event_id).order('event_lecture_date', { ascending : false })
  if( error ) {
    alert(error)
  }
  if ( data ) {
    setEventLectures(data)
    checkWatchedStatus(data)
  }
}

  const checkWatchedStatus = async (lecturesData: EventLectureType[]) => {
    try {
      const watchedKeys = lecturesData.map(lecture => `watched_lecture_${lecture.event_lecture_id}`);
      const startedKeys = lecturesData.map(lecture => `started_lecture_${lecture.event_lecture_id}`);
      const allKeys = [...watchedKeys, ...startedKeys];
      const allValues = await AsyncStorage.multiGet(allKeys);
      const watched = new Set<string>();
      const started = new Set<string>();
      allValues.forEach(([key, value]) => {
        if (value === 'true') {
          if (key.startsWith('watched_lecture_')) {
            const lectureId = key.replace('watched_lecture_', '');
            watched.add(lectureId);
          } else if (key.startsWith('started_lecture_')) {
            const lectureId = key.replace('started_lecture_', '');
            if (!watched.has(lectureId)) {
              started.add(lectureId);
            }
          }
        }
      });
      setWatchedLectures(watched);
      setStartedLectures(started);
    } catch (error) {
      console.log('Error checking watched status:', error);
    }
  };

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

  const getVideoIdFromUrl = (url: string) => {
    if (!url) return null
    if (!url.includes('/') && !url.includes('?')) {
      return url
    }
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : url
  }

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setPlaying(false);
      if (selectedLecture) {
        markAsWatched(selectedLecture.event_lecture_id);
      }
    } else if (state === "playing" && selectedLecture) {
      markAsStarted(selectedLecture.event_lecture_id);
    }
  }, [selectedLecture]);

  const markAsWatched = async (lectureId: string) => {
    try {
      const watchedKey = `watched_lecture_${lectureId}`;
      await AsyncStorage.setItem(watchedKey, 'true');
      setWatchedLectures(prev => new Set([...prev, lectureId]));
      setStartedLectures(prev => {
        const newSet = new Set(prev);
        newSet.delete(lectureId);
        return newSet;
      });
    } catch (error) {
      console.log('Error marking lecture as watched:', error);
    }
  };

  const markAsStarted = async (lectureId: string) => {
    try {
      if (!watchedLectures.has(lectureId)) {
        const startedKey = `started_lecture_${lectureId}`;
        await AsyncStorage.setItem(startedKey, 'true');
        setStartedLectures(prev => new Set([...prev, lectureId]));
      }
    } catch (error) {
      console.log('Error marking lecture as started:', error);
    }
  };

  useEffect(() => {
    getEvent()
    getEventLectures()
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

  useEffect(() => {
    if (visible) {
      setCurrentSpeakerIndex(0);
    }
  }, [visible])

  const renderSpeakerCard = (speakerData: SheikDataType) => {
    const cardWidth = width * 0.75;
    const maxCardHeight = height * 0.45;
    
    return (
      <View 
        key={speakerData.speaker_name}
        style={{ 
          width: width,
          height: maxCardHeight,
          justifyContent: 'center', 
          alignItems: 'center',
        }}
      >
        <BlurView
          intensity={80}
          tint="dark"
          style={{
            borderRadius: 50,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
            backgroundColor: 'rgba(107, 114, 128, 0.6)',
            overflow: 'hidden',
            width: cardWidth,
            height: maxCardHeight,
          }}
        >
          <RNScrollView
            showsVerticalScrollIndicator={true}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingTop: 24,
              paddingBottom: 30,
              paddingHorizontal: 24,
            }}
            style={{ flex: 1 }}
          >
            <View className='flex-row items-center mb-4'>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                overflow: 'hidden',
                borderWidth: 3,
                borderColor: '#E5E7EB',
                marginRight: 16,
              }}>
                <Image 
                  source={speakerData?.speaker_img ? { uri : speakerData.speaker_img }  : require("@/assets/images/MASHomeLogo.png")} 
                  style={{width: '100%', height: '100%'}} 
                  resizeMode='cover'
                />
              </View>
              <View className='flex-1'>
                <Text className='text-xs text-gray-300 font-medium mb-1'>SPEAKER</Text>
                <Text className='text-xl font-bold text-white' numberOfLines={2}>
                  {speakerData?.speaker_name}
                </Text>
              </View>
            </View>
    
            <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(156, 163, 175, 0.4)', paddingTop: 16, marginTop: 4 }}>
              { speakerData?.speaker_name == "MAS" ? (
                <Text className='text-sm font-bold text-white mb-3'>Impact</Text>
              ) : (
                <Text className='text-sm font-bold text-white mb-3'>Credentials</Text>
              )}
              <View className='flex-col'>
                { speakerData?.speaker_creds?.map( (cred, i) => {
                  return (
                    <View key={i} className='flex-row items-start mb-2'>
                      <View style={{ marginRight: 8, marginTop: 2 }}>
                        <Icon source="cards-diamond-outline" size={16} color='#60A5FA'/>
                      </View>
                      <Text className='text-sm text-gray-100 flex-1'>{cred}</Text>
                    </View>
                  )
                })}
              </View>
            </View>
          </RNScrollView>
        </BlurView>
      </View>
    );
  };

  const GetSheikData =  () => {
    if (!speakerData || speakerData.length === 0) {
      return (
        <View className='flex-1 items-center justify-center'>
          <Text className='text-white'>No speaker data available</Text>
        </View>
      );
    }

    const cardWidth = width * 0.75;
    const maxCardHeight = height * 0.45;
    const buttonSize = 32;
    const buttonMargin = 12;
    const cardLeft = (width - cardWidth) / 2;
    const cardRight = cardLeft + cardWidth;
    
    const goToNext = () => {
      if (currentSpeakerIndex < speakerData.length - 1) {
        setCurrentSpeakerIndex(currentSpeakerIndex + 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    };

    const goToPrevious = () => {
      if (currentSpeakerIndex > 0) {
        setCurrentSpeakerIndex(currentSpeakerIndex - 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    };
    
    const currentSpeaker = speakerData[currentSpeakerIndex];
    
    return (
      <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: '100%', position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
          {currentSpeaker && renderSpeakerCard(currentSpeaker)}
          
          {speakerData.length > 1 && (
            <>
              {currentSpeakerIndex > 0 && (
                <TouchableOpacity
                  onPress={goToPrevious}
                  activeOpacity={0.7}
                  style={{
                    position: 'absolute',
                    left: cardLeft - buttonSize / 2 - buttonMargin,
                    top: '50%',
                    transform: [{ translateY: -buttonSize / 2 }],
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: buttonSize / 2,
                    width: buttonSize,
                    height: buttonSize,
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10,
                  }}
                >
                  <Icon source="chevron-left" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {currentSpeakerIndex < speakerData.length - 1 && (
                <TouchableOpacity
                  onPress={goToNext}
                  activeOpacity={0.7}
                  style={{
                    position: 'absolute',
                    left: cardRight - buttonSize / 2 + buttonMargin,
                    top: '50%',
                    transform: [{ translateY: -buttonSize / 2 }],
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: buttonSize / 2,
                    width: buttonSize,
                    height: buttonSize,
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10,
                  }}
                >
                  <Icon source="chevron-right" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
        {speakerData.length > 1 && (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 20,
            gap: 8,
            paddingBottom: 10,
          }}>
            {speakerData.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setCurrentSpeakerIndex(index);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
                style={{
                  width: currentSpeakerIndex === index ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: currentSpeakerIndex === index ? '#60A5FA' : 'rgba(255, 255, 255, 0.3)',
                }}
              />
            ))}
          </View>
        )}
      </View>
    )
  } 

  const NotificationBell = () => {
    const addedToNoti = () => {
      const goToProgram = () => {
        navigation.navigate('myPrograms', { screen : 'notifications/[event_id]', params : { event_id : event_id}, initial: false  })
      }
      Toast.show({
        type : 'addEventToNotificationsToast',
      props : { props : event, onPress : goToProgram },
        position : 'top',
        topOffset : 50,
      })
    }
     const handlePress = async () => {
    if( eventInNotifications ) {
        const { error } = await supabase.from("added_notifications_events").delete().eq("user_id" , session?.user.id).eq("event_id", event_id)
        const { error : settingsError } = await supabase.from('event_notification_settings').delete().eq('user_id', session?.user.id).eq("event_id", event_id)
      const { error : ScheduleNotisError } = await supabase.from('program_notification_schedule').delete().eq('user_id', session?.user.id).eq("program_event_name", event?.event_name)
      setEventInNotifications(false)
      }
      else{
        const { error } = await supabase.from("added_notifications_events").insert({user_id :session?.user.id, event_id : event_id})
         const TodaysDate = new Date()
              const DaysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const eventDays = event?.event_days
      const EventStartTime = setTimeToCurrentDate(event?.event_start_time!)
        
      if ( eventDays && isBefore(TodaysDate, EventStartTime) ){
              await Promise.all(
        eventDays?.map( async (day) => {
                  const { data : user_push_token } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
                  if( (TodaysDate.getDay() == DaysOfWeek.indexOf(day)) && (user_push_token?.push_notification_token) ){
            await schedule_notification(session?.user.id!, user_push_token?.push_notification_token,  `${event.event_name} is Starting Now!`, 'When Program Starts', event.event_name, EventStartTime)
                  }
                })
              )
            }
      

        if( error ){
          console.log(error)
        }
      setEventInNotifications(true)
        addedToNoti()
      }
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      )
    }
 
  
     return(
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <BlurView intensity={20} tint="dark" style={{ borderRadius: 16, overflow: 'hidden', width: 36, height: 36 }}>
        <Pressable onPress={handlePress} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
          {eventInNotifications ?  <Icon source={"bell-check"} color='black' size={18}/> : <Icon source={"bell-outline"} color='black' size={18}/> }
        </Pressable>
      </BlurView>
      </View>
     )
    }

  const onDonePress = async () => {
    if( playlistAddingTo && playlistAddingTo.length > 0 ){
      playlistAddingTo.map( async (item) => {
          const { data : checkDupe , error : checkDupeError } = await supabase.from("user_playlist_lectures").select("*").eq("user_id ", session?.user.id).eq( "playlist_id" ,item).eq( "event_lecture_id", lectureToBeAddedToPlaylist).single()  
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
                  onPress : async () => await supabase.from("user_playlist_lectures").insert({user_id : session?.user.id, playlist_id : item, event_lecture_id : lectureToBeAddedToPlaylist })
                }
              ]
            )
            }
            else{
              const { error } = await supabase.from("user_playlist_lectures").insert({user_id : session?.user.id, playlist_id : item, event_lecture_id : lectureToBeAddedToPlaylist })
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
    <View className='flex-1' style={{flexGrow: 1, backgroundColor: '#FFFFFF'}}>
     <Stack.Screen options={ { 
       headerShown: false
     } } />
     <StatusBar barStyle={"light-content"}/>
     {/* Header with Back Button and Action Buttons */}
     <View className="flex-row items-center justify-between px-4 pt-16 pb-4" style={{ backgroundColor: '#214E91', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
       <BlurView intensity={20} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
         <Pressable 
           onPress={() => {
             if (selectedLecture && selectedLecture.event_lecture_link && selectedLecture.event_lecture_link.trim() !== '' && selectedLecture.event_lecture_link !== 'N/A') {
               setSelectedLecture(null);
               setPlaying(false);
               scrollRef.current?.scrollTo({ y: 0, animated: true });
             } else {
               // Navigate back smoothly - try to go back, or navigate to recorded lectures
               if (navigation.canGoBack()) {
                 router.back();
               } else {
                 router.push('/myPrograms/recordedLectures');
               }
             }
           }}
           style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
         >
           <Icon source="chevron-left" size={20} color="black" />
         </Pressable>
       </BlurView>
       
       <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
         {isBefore(currDate, event?.event_end_date!) ? <NotificationBell /> : <></>}
       </View>
     </View>
      <Animated.ScrollView ref={scrollRef}  scrollEventThrottle={16} contentContainerStyle={{justifyContent: "flex-start", alignItems: "stretch" }} style={{ flex: 1 }}>
          <View className=' relative' style={{width: '100%', height: height * 0.5, borderBottomLeftRadius: 20, borderBottomRightRadius: 10, overflow: 'hidden', marginTop: 105, alignSelf: 'stretch' }}>
            {selectedLecture && selectedLecture.event_lecture_link && selectedLecture.event_lecture_link.trim() !== '' && selectedLecture.event_lecture_link !== 'N/A' ? (
              <YoutubePlayer 
                height={height * 0.5}
                width={width}
                play={playing}
                videoId={getVideoIdFromUrl(selectedLecture.event_lecture_link)}
                onChangeState={onStateChange}
                initialPlayerParams={{
                  modestbranding: 1,
                  rel: 0,
                  playsinline: 1,
                }}
                webViewStyle={{
                  opacity: 0.99,
                  borderBottomLeftRadius: 20,
                  borderBottomRightRadius: 20,
                }}
                webViewProps={{
                  androidLayerType: 'hardware',
                  androidHardwareAccelerationDisabled: false,
                }}
              />
            ) : selectedLecture && (!selectedLecture.event_lecture_link || selectedLecture.event_lecture_link.trim() === '' || selectedLecture.event_lecture_link === 'N/A') ? (
              <View style={{ width: '100%', height: '100%', backgroundColor: '#1A2332', justifyContent: 'center', alignItems: 'center' }}>
                <Icon source="play-circle-outline" size={64} color="#9CA3AF" />
                <Text className="text-gray-400 text-lg font-semibold mt-4">No video available</Text>
                <Text className="text-gray-500 text-sm mt-2">View keynotes and summary below</Text>
              </View>
            ) : (
              <>
                { !imageReady && 
                  <FlyerSkeleton 
                    width={width} 
                    height={height * 0.5} 
                    style={{ position: 'absolute', top: 0, zIndex: 2 }} 
                  />
                }
                <Animated.Image 
                  source={
                    hasError || !event?.event_img 
                      ? require("@/assets/images/MASHomeLogo.png")
                      : { uri: event.event_img }
                  }
                  style={[
                    { width: '100%', height: '100%', borderRadius: 0 },
                    imageAnimatedStyle
                  ]}
                  resizeMode="contain"
                  onLoad={() => setImageReady(true)}
                  onError={() => {
                    setHasError(true);
                    setImageReady(true);
                  }}
                />
              </>
            )}
          </View>

          {/* Keynotes and Summary Tabs with Recommended Section - Shown when video IS playing */}
          {selectedLecture && selectedLecture.event_lecture_link && selectedLecture.event_lecture_link.trim() !== '' && selectedLecture.event_lecture_link !== 'N/A' && (
            <View style={{ 
              paddingHorizontal: 16,
              paddingTop: 0,
              paddingBottom: 8,
              width: '100%',
              backgroundColor: '#FFFFFF',
              marginTop: -170,
              zIndex: 2,
            }}>
              <View style={{
                flexDirection: 'row',
                gap: 6,
                marginBottom: 8,
              }}>
                {/* Summary Tab */}
                <Pressable
                  onPress={() => {
                    setVideoTab('summary');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    borderRadius: 20,
                    backgroundColor: videoTab === 'summary' ? '#60A5FA' : '#F3F4F6',
                    borderWidth: videoTab === 'summary' ? 0 : 1,
                    borderColor: '#E5E7EB',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Icon 
                    source={videoTab === 'summary' ? 'file-document' : 'file-document-outline'} 
                    size={14} 
                    color={videoTab === 'summary' ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text style={{ 
                    fontSize: 13, 
                    fontWeight: videoTab === 'summary' ? '600' : '400',
                    color: videoTab === 'summary' ? '#FFFFFF' : '#374151',
                    marginLeft: 4,
                  }}>
                    Summary
                  </Text>
                </Pressable>
                
                {/* Keynotes Tab */}
                <Pressable
                  onPress={() => {
                    setVideoTab('keynotes');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    borderRadius: 20,
                    backgroundColor: videoTab === 'keynotes' ? '#60A5FA' : '#F3F4F6',
                    borderWidth: videoTab === 'keynotes' ? 0 : 1,
                    borderColor: '#E5E7EB',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Icon 
                    source={videoTab === 'keynotes' ? 'text-box' : 'text-box-outline'} 
                    size={14} 
                    color={videoTab === 'keynotes' ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text style={{ 
                    fontSize: 13, 
                    fontWeight: videoTab === 'keynotes' ? '600' : '400',
                    color: videoTab === 'keynotes' ? '#FFFFFF' : '#374151',
                    marginLeft: 4,
                  }}>
                    Keynotes
                  </Text>
                </Pressable>
              </View>

              {/* Video Tab Content */}
              {videoTab === 'keynotes' ? (
                selectedLecture.event_lecture_keynotes && selectedLecture.event_lecture_keynotes.length > 0 ? (
                  <View className='rounded-xl' style={{
                    backgroundColor: '#1A2332',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                    maxHeight: 300,
                  }}>
                    <ScrollView 
                      style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      {selectedLecture.event_lecture_keynotes.map((keynote, index) => (
                        <Text key={index} className='text-base text-gray-300 leading-6 mb-2'>
                          • {keynote}
                        </Text>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <View className='px-4 py-3 rounded-xl' style={{
                    backgroundColor: '#1A2332',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                    <Text className='text-base text-gray-400 leading-6 text-center'>
                      No keynotes available for this lecture
                    </Text>
                  </View>
                )
              ) : (
                selectedLecture.event_lecture_desc && selectedLecture.event_lecture_desc !== "N/A" ? (
                  <View className='px-4 py-3 rounded-xl' style={{
                    backgroundColor: '#1A2332',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                    <Text className='text-base text-gray-300 leading-6'>
                      {selectedLecture.event_lecture_desc}
                    </Text>
                  </View>
                ) : (
                  <View className='px-4 py-3 rounded-xl' style={{
                    backgroundColor: '#1A2332',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                    <Text className='text-base text-gray-400 leading-6 text-center'>
                      No summary available for this lecture
                    </Text>
                  </View>
                )
              )}

              {/* Recommended Videos Section - Below the tabs */}
              {eventLectures && eventLectures.length > 1 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: '#000000', 
                    marginBottom: 12,
                    paddingHorizontal: 4,
                  }}>
                    Recommended
                  </Text>
                  <View>
                    {eventLectures
                      .filter(lecture => 
                        lecture.event_lecture_id !== selectedLecture.event_lecture_id &&
                        lecture.event_lecture_link && 
                        lecture.event_lecture_link.trim() !== '' && 
                        lecture.event_lecture_link !== 'N/A'
                      )
                      .sort((a, b) => {
                        if (a.event_lecture_date && b.event_lecture_date) {
                          return new Date(a.event_lecture_date).getTime() - new Date(b.event_lecture_date).getTime();
                        }
                        return 0;
                      })
                      .map((lecture) => {
                        const formatLectureDate = (dateString: string) => {
                          try {
                            const date = new Date(dateString)
                            return format(date, 'MMM d, yyyy')
                          } catch {
                            return dateString
                          }
                        }

                        const videoId = lecture.event_lecture_link ? getVideoIdFromUrl(lecture.event_lecture_link) : null
                        
                        return (
                          <Pressable
                            key={lecture.event_lecture_id}
                            onPress={() => {
                              setSelectedLecture(lecture)
                              setPlaying(true)
                              scrollRef.current?.scrollTo({ y: 0, animated: true })
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                            }}
                            className='mb-3 rounded-xl overflow-hidden'
                            style={{
                              backgroundColor: '#1A2332',
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.3,
                              shadowRadius: 4,
                              elevation: 3,
                            }}
                          >
                            <View className='flex-row'>
                              {/* Thumbnail */}
                              <View 
                                className='bg-gray-700'
                                style={{ 
                                  width: 140, 
                                  height: 105,
                                  justifyContent: 'center',
                                  alignItems: 'center'
                                }}
                              >
                                {videoId ? (
                                  <Image
                                    source={{ uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
                                    style={{ width: 140, height: 105 }}
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <Icon source="play-circle-outline" size={40} color="#9CA3AF" />
                                )}
                                <View className='absolute inset-0 bg-black/30 items-center justify-center'>
                                  <Icon source="play-circle" size={30} color="white" />
                                </View>
                                {watchedLectures.has(lecture.event_lecture_id) && (
                                  <View className='absolute top-2 right-2 bg-green-500 px-2 py-1 rounded-full'>
                                    <Icon source="check" size={14} color="white" />
                                  </View>
                                )}
                                {startedLectures.has(lecture.event_lecture_id) && !watchedLectures.has(lecture.event_lecture_id) && (
                                  <View className='absolute top-2 right-2 bg-blue-500 px-2 py-1 rounded-full'>
                                    <Icon source="play" size={14} color="white" />
                                  </View>
                                )}
                              </View>

                              {/* Content */}
                              <View className='flex-1 p-3 justify-between'>
                                <View>
                                  <Text className='text-base font-semibold text-white mb-1' numberOfLines={2}>
                                    {lecture.event_lecture_name || 'Class'}
                                  </Text>
                                  <Text className='text-sm text-gray-400 mt-1'>
                                    {lecture.event_lecture_date ? formatLectureDate(lecture.event_lecture_date) : ''}
                                  </Text>
                                  {watchedLectures.has(lecture.event_lecture_id) ? (
                                    <View className='flex-row items-center mt-2'>
                                      <Icon source="check-circle" size={16} color="#10B981" />
                                      <Text className='text-green-500 text-sm font-semibold ml-1'>Watched</Text>
                                    </View>
                                  ) : startedLectures.has(lecture.event_lecture_id) ? (
                                    <View className='flex-row items-center mt-2'>
                                      <Icon source="play-circle" size={16} color="#60A5FA" />
                                      <Text className='text-blue-400 text-sm font-semibold ml-1'>Continue</Text>
                                    </View>
                                  ) : null}
                                </View>
                              </View>
                            </View>
                          </Pressable>
                        )
                      })}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Keynotes and Summary Tabs - Only shown when NO video is available */}
          {selectedLecture && (!selectedLecture.event_lecture_link || selectedLecture.event_lecture_link.trim() === '' || selectedLecture.event_lecture_link === 'N/A') && (
            <View style={{ 
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 8,
              width: '100%',
              backgroundColor: '#FFFFFF',
              zIndex: 2,
            }}>
              <View style={{
                flexDirection: 'row',
                gap: 6,
                marginBottom: 12,
              }}>
                {/* Summary Tab */}
                <Pressable
                  onPress={() => {
                    setVideoTab('summary');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    borderRadius: 20,
                    backgroundColor: videoTab === 'summary' ? '#60A5FA' : '#1A2332',
                    borderWidth: videoTab === 'summary' ? 0 : 1,
                    borderColor: '#2D3748',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <Icon 
                    source={videoTab === 'summary' ? 'file-document' : 'file-document-outline'} 
                    size={14} 
                    color={videoTab === 'summary' ? '#FFFFFF' : '#9CA3AF'} 
                  />
                  <Text style={{ 
                    fontSize: 13, 
                    fontWeight: videoTab === 'summary' ? '600' : '400',
                    color: videoTab === 'summary' ? '#FFFFFF' : '#9CA3AF',
                    marginLeft: 4,
                  }}>
                    Summary
                  </Text>
                </Pressable>
                
                {/* Keynotes Tab */}
                <Pressable
                  onPress={() => {
                    setVideoTab('keynotes');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    borderRadius: 20,
                    backgroundColor: videoTab === 'keynotes' ? '#60A5FA' : '#1A2332',
                    borderWidth: videoTab === 'keynotes' ? 0 : 1,
                    borderColor: '#2D3748',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <Icon 
                    source={videoTab === 'keynotes' ? 'text-box' : 'text-box-outline'} 
                    size={14} 
                    color={videoTab === 'keynotes' ? '#FFFFFF' : '#9CA3AF'} 
                  />
                  <Text style={{ 
                    fontSize: 13, 
                    fontWeight: videoTab === 'keynotes' ? '600' : '400',
                    color: videoTab === 'keynotes' ? '#FFFFFF' : '#9CA3AF',
                    marginLeft: 4,
                  }}>
                    Keynotes
                  </Text>
                </Pressable>
              </View>

              {/* Video Tab Content */}
              {videoTab === 'keynotes' ? (
                selectedLecture.event_lecture_keynotes && selectedLecture.event_lecture_keynotes.length > 0 ? (
                  <View className='rounded-xl' style={{
                    backgroundColor: '#1A2332',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                    maxHeight: 300,
                  }}>
                    <ScrollView 
                      style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      {selectedLecture.event_lecture_keynotes.map((keynote, index) => (
                        <Text key={index} className='text-base text-gray-300 leading-6 mb-2'>
                          • {keynote}
                        </Text>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <View className='px-4 py-3 rounded-xl' style={{
                    backgroundColor: '#1A2332',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                    <Text className='text-base text-gray-400 leading-6 text-center'>
                      No keynotes available for this lecture
                    </Text>
                  </View>
                )
              ) : (
                selectedLecture.event_lecture_desc && selectedLecture.event_lecture_desc !== "N/A" ? (
                  <View className='px-4 py-3 rounded-xl' style={{
                    backgroundColor: '#1A2332',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                    <Text className='text-base text-gray-300 leading-6'>
                      {selectedLecture.event_lecture_desc}
                    </Text>
                  </View>
                ) : (
                  <View className='px-4 py-3 rounded-xl' style={{
                    backgroundColor: '#1A2332',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                    <Text className='text-base text-gray-400 leading-6 text-center'>
                      No summary available for this lecture
                    </Text>
                  </View>
                )
              )}
            </View>
          )}
       
          {/* Hide everything below when a YouTube video is selected */}
          {!(selectedLecture && selectedLecture.event_lecture_link && selectedLecture.event_lecture_link.trim() !== '' && selectedLecture.event_lecture_link !== 'N/A') && (
          <View className='w-[100%]' style={{paddingBottom : Tab * 3, backgroundColor: '#FFFFFF', marginTop: -50}}>
            <Text className='text-center text-2xl text-black font-bold' style={{ marginTop: 0, marginBottom: 0, paddingTop: 0 }}>{event?.event_name}</Text>
            <Pressable onPress={showModal} style={{ marginTop: 0 }}>
              <Text className='text-center text-[#60A5FA] w-[60%] self-center font-semibold' numberOfLines={1} style={{ marginTop: 0, marginBottom: 0, paddingTop: 0 }}>{speakerString}</Text>
            </Pressable>

            {/* Tab Buttons - Description, Classes, and Keynotes */}
            <View style={{ paddingHorizontal: 16, marginTop: 8, marginBottom: 8, width: '100%' }}>
              <View style={{
                flexDirection: 'row',
                gap: 6,
                marginBottom: 12,
              }}>
                {/* Description Button */}
                <Pressable
                  onPress={() => {
                    setActiveTab('description');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    borderRadius: 20,
                    backgroundColor: activeTab === 'description' ? '#60A5FA' : '#1A2332',
                    borderWidth: activeTab === 'description' ? 0 : 1,
                    borderColor: '#2D3748',
                  }}
                >
                  <Icon 
                    source={activeTab === 'description' ? 'text-box' : 'text-box-outline'} 
                    size={14} 
                    color={activeTab === 'description' ? '#FFFFFF' : '#9CA3AF'} 
                  />
                  <Text style={{ 
                    fontSize: 13, 
                    fontWeight: activeTab === 'description' ? '600' : '400',
                    color: activeTab === 'description' ? '#FFFFFF' : '#9CA3AF',
                    marginLeft: 4,
                  }}>
                    Description
                  </Text>
                </Pressable>
                
                {/* Classes Button */}
                <Pressable
                  onPress={() => {
                    setActiveTab('classes');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    borderRadius: 20,
                    backgroundColor: activeTab === 'classes' ? '#60A5FA' : '#1A2332',
                    borderWidth: activeTab === 'classes' ? 0 : 1,
                    borderColor: '#2D3748',
                  }}
                >
                  <Icon 
                    source={activeTab === 'classes' ? 'play-circle' : 'play-circle-outline'} 
                    size={14} 
                    color={activeTab === 'classes' ? '#FFFFFF' : '#9CA3AF'} 
                  />
                  <Text style={{ 
                    fontSize: 13, 
                    fontWeight: activeTab === 'classes' ? '600' : '400',
                    color: activeTab === 'classes' ? '#FFFFFF' : '#9CA3AF',
                    marginLeft: 4,
                  }}>
                    Classes
                  </Text>
                </Pressable>
                
              </View>

              {/* Tab Content */}
              {activeTab === 'description' ? (
                // Description Tab Content
                event?.event_desc ? (
                  <View className='px-4 py-3 rounded-xl' style={{
                    backgroundColor: '#1A2332',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                    <Text className='text-base text-gray-300 leading-6'>{event.event_desc}</Text>
                  </View>
                ) : (
                  <View className='px-4 py-3 rounded-xl' style={{
                    backgroundColor: '#1A2332',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                    <Text className='text-base text-gray-400 leading-6 text-center'>
                      No description available
                    </Text>
                  </View>
                )
              ) : activeTab === 'classes' ? (
                // Classes Tab Content
                eventLectures && eventLectures.length > 0 ? (
                  <View>
                {eventLectures.map((lecture, idx) => {
                  const formatLectureDate = (dateString: string) => {
                    try {
                      const date = new Date(dateString)
                      return format(date, 'MMM d, yyyy')
                    } catch {
                      return dateString
                    }
                  }

                  const videoId = lecture.event_lecture_link ? getVideoIdFromUrl(lecture.event_lecture_link) : null
                  const isSelected = selectedLecture?.event_lecture_id === lecture.event_lecture_id
                  
                  return (
                    <Pressable
                      key={lecture.event_lecture_id}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedLecture(null)
                          setPlaying(false)
                        } else {
                          setSelectedLecture(lecture)
                          const hasVideoLink = !!(lecture.event_lecture_link && lecture.event_lecture_link.trim() !== '' && lecture.event_lecture_link !== 'N/A')
                          setPlaying(hasVideoLink)
                          scrollRef.current?.scrollTo({ y: 0, animated: true })
                        }
                      }}
                      className='mb-3 rounded-xl overflow-hidden'
                      style={{
                        backgroundColor: isSelected ? '#2D4A6E' : '#1A2332',
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 3,
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: '#60A5FA',
                      }}
                    >
                      <View className='flex-row'>
                        {/* Thumbnail */}
                        <View 
                          className='bg-gray-700'
                          style={{ 
                            width: 140, 
                            height: 105,
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          {videoId ? (
                            <Image
                              source={{ uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
                              style={{ width: 140, height: 105 }}
                              resizeMode="cover"
                            />
                          ) : (
                            <Icon source="play-circle-outline" size={40} color="#9CA3AF" />
                          )}
                          {!isSelected && (
                            <View className='absolute inset-0 bg-black/30 items-center justify-center'>
                              <Icon source="play-circle" size={30} color="white" />
                            </View>
                          )}
                          {isSelected && (
                            <View className='absolute top-2 left-2 bg-blue-500 px-2 py-1 rounded'>
                              <Text className='text-white text-xs font-bold'>NOW PLAYING</Text>
                            </View>
                          )}
                          {watchedLectures.has(lecture.event_lecture_id) && !isSelected && (
                            <View className='absolute top-2 right-2 bg-green-500 px-2 py-1 rounded-full'>
                              <Icon source="check" size={14} color="white" />
                            </View>
                          )}
                          {startedLectures.has(lecture.event_lecture_id) && !watchedLectures.has(lecture.event_lecture_id) && !isSelected && (
                            <View className='absolute top-2 right-2 bg-blue-500 px-2 py-1 rounded-full'>
                              <Icon source="play" size={14} color="white" />
                            </View>
                          )}
                        </View>

                        {/* Content */}
                        <View className='flex-1 p-3 justify-between'>
                          <View>
                            <Text className='text-base font-semibold text-white mb-1' numberOfLines={2}>
                              {lecture.event_lecture_name || `Class ${eventLectures.length - idx}`}
                            </Text>
                            <Text className='text-sm text-gray-400 mt-1'>
                              {lecture.event_lecture_date ? formatLectureDate(lecture.event_lecture_date) : ''}
                            </Text>
                            {watchedLectures.has(lecture.event_lecture_id) ? (
                              <View className='flex-row items-center mt-2'>
                                <Icon source="check-circle" size={16} color="#10B981" />
                                <Text className='text-green-500 text-sm font-semibold ml-1'>Watched</Text>
                              </View>
                            ) : startedLectures.has(lecture.event_lecture_id) ? (
                              <View className='flex-row items-center mt-2'>
                                <Icon source="play-circle" size={16} color="#60A5FA" />
                                <Text className='text-blue-400 text-sm font-semibold ml-1'>Continue</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  )
                })}
                  </View>
                ) : (
                  <View className='px-4 py-3 rounded-xl' style={{
                    backgroundColor: '#1A2332',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                    <Text className='text-base text-gray-400 leading-6 text-center'>
                      No classes available
                    </Text>
                  </View>
                )
              ) : null}
            </View>

                <View className='items-center justify-center'>
                    {
                      event?.is_paid ? 
                      (
                        <Pressable onPress={() => {
                        Linking.canOpenURL(event.paid_link).then(() => {
                        Linking.openURL(event.paid_link);
                        });
                        }}>
                        <Button icon={() => <Icon source={"cart-variant"} size={20} color='white'/>} mode='elevated' style={{ backgroundColor : "#57BA47", marginTop : 10, width: "90%"}}><Text className='text-white'>Sign Up Now</Text></Button>
                        </Pressable>
                      ) : <></>
                    }
                </View>
          </View>
          )}
          
          <Portal>
            <Modal 
              visible={visible} 
              onDismiss={() => {
                hideModal();
                setCurrentSpeakerIndex(0);
              }} 
              contentContainerStyle={{
                backgroundColor: 'transparent', 
                padding: 0, 
                margin: 0,
                height: '100%', 
                width: '100%', 
                borderRadius: 0, 
                alignSelf: "center",
                justifyContent: 'center',
                alignItems: 'center',
              }}
              style={{
                margin: 0,
                padding: 0,
              }}
            >
              <View style={{ 
                position: 'absolute',
                top: -1000,
                left: 0,
                width: Dimensions.get('screen').width,
                height: Dimensions.get('screen').height + 1000,
              }}>
                <BlurView
                  intensity={30}
                  tint="dark"
                  style={{
                    width: Dimensions.get('screen').width,
                    height: Dimensions.get('screen').height + 1000,
                  }}
                />
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: Dimensions.get('screen').width,
                  height: Dimensions.get('screen').height + 1000,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                }} />
              </View>
              <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
                <TouchableOpacity
                  onPress={() => {
                    hideModal();
                    setCurrentSpeakerIndex(0);
                  }}
                  style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    zIndex: 10,
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Icon source="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <GetSheikData />
              </View>
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
                        return(<View className='mt-2'><RenderAddToUserPlaylistsListEvent playlist={item} lectureToBeAdded={lectureToBeAddedToPlaylist} setAddToPlaylistVisible={setAddToPlaylistVisible} setPlaylistAddingTo={setPlaylistAddingTo} playListAddingTo={playlistAddingTo}/></View>)
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

export default EventLectures
