import { View, Text, useWindowDimensions, ScrollView, StatusBar, Image } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useProgram } from '@/src/providers/programProvider';
import YoutubePlayer from "react-native-youtube-iframe"
import { Lectures, SheikDataType, Program } from '@/src/types';
// import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Pressable } from 'react-native';
import { useAuth } from "@/src/providers/AuthProvider"
import { supabase } from '@/src/lib/supabase';
import { setDate, format } from 'date-fns';
import LectureKeyNotesCard from '@/src/components/LectureKeyNotesCard';
import { FlatList } from 'react-native';
import { Divider, Icon, Modal, Portal } from 'react-native-paper';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import * as Haptics from "expo-haptics";
import Toast from 'react-native-toast-message';

export default function LecturesData() {
  const { session } = useAuth()
  const router = useRouter()
  const [ playing, setPlaying ] = useState(false)
  const { lectureID } = useLocalSearchParams();
  const lectureIdString = Array.isArray(lectureID) ? lectureID[0] : lectureID;
  const [ speakerData, setSpeakerData ] = useState<SheikDataType[]>()
  const [ currentLecture, setLecture ] = useState<Lectures>()
  const [ program, setProgram ] = useState<Program | null>(null)
  const [ allLectures, setAllLectures ] = useState<Lectures[]>([])
  const [ programInNotifications, setProgramInNotifications ] = useState(false)
  const layout  = useWindowDimensions().width
  const [index, setIndex] = useState(0)
  const layoutHeight = useWindowDimensions().height
  const KEYNOTECARDHEIGHT = layoutHeight / 4
  const KEYNOTECARDWIDTH = layout * 0.85
  const tabBarHeight = useBottomTabBarHeight() + 60
  const [ visible, setVisible ] = useState(false);
  const [ speakerString, setSpeakerString ] = useState<string[]>()
  const notifade = useSharedValue(0)
  
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

  async function getLecture(){
    const { data, error } = await supabase.from("program_lectures").select("*").eq("lecture_id", lectureIdString).single()
    if( error ){
      alert(error)
    }
    
    if(data){
      setLecture(data)
      let speaker_string : string[] = data.lecture_speaker.map(() => {return ''})
      const speakers  = await Promise.all(
        data.lecture_speaker.map( async(speaker_id: string, index: number) => {
            const {data : speakerInfo, error : speakerInfoError } = await supabase.from('speaker_data').select('*').eq('speaker_id', speaker_id).single()
            if( speakerInfo ){
              speaker_string[index]=speakerInfo.speaker_name
              return speakerInfo
            }
          
        })
      )
      setSpeakerData(speakers)
      setSpeakerString(speaker_string)
      
      // Get program information
      if(data.lecture_program) {
        console.log('Fetching program for:', data.lecture_program)
        await getProgram(data.lecture_program)
        await getProgramLectures(data.lecture_program)
      } else {
        console.log('No lecture_program found in lecture data')
      }
    }
  }

  async function getProgram(programId: string) {
    const { data, error } = await supabase.from("programs").select("*").eq("program_id", programId).single()
    if( error ) {
      console.log('Error fetching program:', error)
    }
    if ( data ) {
      console.log('Program fetched:', data.program_name)
      const { data : checkIfExists } = await supabase.from("added_notifications_programs").select("*").eq("user_id", session?.user.id).eq("program_id", programId).single()
      if( checkIfExists ){
        setProgramInNotifications(true)
      }
      setProgram(data)
    } else {
      console.log('No program data found')
    }
  }

  async function getProgramLectures(programId: string) {
    const { data, error } = await supabase.from("program_lectures").select("*").eq("lecture_program", programId).order('lecture_date', { ascending: false })
    if( error ) {
      console.log('Error fetching program lectures:', error)
    }
    if ( data ) {
      console.log('Fetched', data.length, 'lectures')
      setAllLectures(data)
    } else {
      console.log('No lectures found')
    }
  }
  
  const GetSheikData =  () => {
    return( 
      <View className='flex-1'>
        
        { 
          speakerData?.map((speakerData) => (
          <View className='border-2 border-gray-400 border-solid rounded-[15px] p-2 my-1'>
            <Animated.View className=' flex-row'>
                <Image source={speakerData?.speaker_img ? {uri : speakerData.speaker_img } : require("@/assets/images/MASHomeLogo.png")} style={{width: 110, height: 110, borderRadius: 50}} resizeMode='cover'/>
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
  useEffect(() => {
    getLecture()
  },[session])

  const onStateChange = useCallback((state : any) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  const togglePlaying = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);


  const LectureAIKeyNotes = () => {
    const [ scrollY, setScrollY ] = useState(0)
    const [ active, setActive ] = useState(0)
    const handleScroll = (event : any) =>{
      const scrollPositon = event.nativeEvent.contentOffset.y;
      const index = Math.ceil(scrollPositon / (KEYNOTECARDHEIGHT + 20));
      setActive(index)
    }
    const array = currentLecture?.lecture_key_notes
    return(
      <View className='items-center bg=[#ededed]'>
       <View className='mt-2'/>
          <ScrollView 
          onScroll={(event) => {handleScroll(event); setScrollY(event.nativeEvent.contentOffset.y)}} contentContainerStyle={{ alignItems : "center", paddingBottom : tabBarHeight }} 
          decelerationRate={0.6}
          snapToInterval={KEYNOTECARDHEIGHT + (20 * 0.2)}
          showsVerticalScrollIndicator={false}
          
          >
            <View className='flex-col items-center mt-3'>
              <Text className='font-bold text-black text-2xl text-center'>{currentLecture?.lecture_name}</Text>
              <Text className='font-bold text-[#0D509D]' onPress={showModal}>{speakerString ? speakerString.join(' & ') : ''}</Text>
            </View>
            {array ? array.map((item,index) => {
              return (
                <>
                <LectureKeyNotesCard height={KEYNOTECARDHEIGHT} width={KEYNOTECARDWIDTH} index={index}  scrollY={scrollY} keynote={item} active={active}/>
                <View style={{ height : 20 }}/> 
                </>             
              )
            }) : <></>}

          </ScrollView>
      </View>
    )
  }
  const LectureAISummay = () => {
    return(
      <ScrollView className='flex-1' contentContainerStyle={{ alignItems : "center", backgroundColor : "#ededed" }}>
        <View className='flex-col items-center mt-3'>
            <Text className='font-bold text-black text-2xl text-center'>{currentLecture?.lecture_name}</Text>
            <Text className='font-bold text-blue-500' onPress={showModal}>{speakerString ? speakerString.join(' & ') : ''}</Text>
        </View>
        <View className='h-[350] w-[85%] mt-2'>
          <ScrollView className=' bg-white' style={{ borderRadius : 10 }} contentContainerStyle={{ paddingHorizontal : 8, paddingVertical : 5}}>
            <Text>{currentLecture?.lecture_ai}</Text>
          </ScrollView>
        </View>
      </ScrollView>
    )
  }
  
  // const renderScene = SceneMap({
  //   first: LectureAISummay,
  //   second: LectureAIKeyNotes,
  // });
  
  const routes = [
    { key: 'first', title: 'Summary' },
    { key: 'second', title: 'Key Notes' },
  ];
  
  // const renderTabBar = (props : any) => (
  //   <TabBar
  //     {...props}
  //     indicatorStyle={{ backgroundColor : "#57BA47", position: "absolute", zIndex : -1, bottom : "5%", height: "90%", width : "40%", left : "5%", borderRadius : 20  }}
  //     style={{ backgroundColor: '#0D509D', width : "80%", alignSelf : "center", borderRadius : 20}}
  //     labelStyle={{ color : "white", fontWeight : "bold" }}
  //   />
  // );

  const [loading, setLoading] = useState(true);
  const opacity = useSharedValue(1);

  const playMASAnimation = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const handleAnimationEnd = () => {
    setLoading(false);
  };

  const fadeOutAnimation = () => {
    opacity.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.quad) }, () => {
      runOnJS(handleAnimationEnd)();
    });
  }

  const fadeOutNotification = useAnimatedStyle(() => ({
    opacity : notifade.value
  }))

  const NotificationBell = () => {
    const addedToNoti = () => {
      const goToProgram = () => {
        router.push(`/myPrograms/notifications/ClassesAndLectures/${program?.program_id}`)
      }
      Toast.show({
        type : 'addProgramToNotificationsToast',
        props : { props : program, onPress : goToProgram },
        position : 'top',
        topOffset : 50,
      })
    }
    
    const handlePress = async () => {
      if(!program) return
      
      if( programInNotifications ) {
        const { error } = await supabase.from("added_notifications_programs").delete().eq("user_id" , session?.user.id).eq("program_id", program.program_id)
        setProgramInNotifications(false)
      }
      else{
        const { error } = await supabase.from("added_notifications_programs").insert({user_id :session?.user.id, program_id : program.program_id, has_lectures : program?.has_lectures})
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
    
    return(
      <View className='flex-row items-center gap-x-5'>
        <Animated.View style={fadeOutNotification}>
          <View style={{ opacity : 1}} className='left-10 bottom-4 bg-gray-400 text-black h-[23px] w-[75px] text-[10px] items-center justify-center text-center z-[1] rounded-xl p-1 ' >
            <Text className='text-black text-[10px] font-semibold'>Notifications</Text>
          </View>
        </Animated.View>
        <Pressable onPress={handlePress} className='w-[30] h-[35] items-center justify-center'>
          {programInNotifications ?  <Icon source={"bell-check"} color='#007AFF' size={30}/> : <Icon source={"bell-outline"} color='#007AFF' size={30}/> }
        </Pressable>
      </View>
    )
  }

  const formatLectureDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'MMM d, yyyy')
    } catch {
      return dateString
    }
  }

  const getVideoIdFromUrl = (url: string) => {
    if (!url) return null
    // If it's already just a video ID (no slashes or special chars), return as is
    if (!url.includes('/') && !url.includes('?')) {
      return url
    }
    // Otherwise, try to extract from URL
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : url
  }

  return(
    <View className='flex-1 bg-[#ededed]'>
        <Stack.Screen 
          options={{ 
            title : program?.program_name || currentLecture?.lecture_name, 
            headerTintColor : '#007AFF' , 
            headerTitleStyle: { color : 'black'}, 
            headerStyle : {backgroundColor : 'white'},
            headerRight: () => program ? <NotificationBell /> : null
          }} 
        />
        <StatusBar barStyle={'dark-content'} />

        <ScrollView 
          className='flex-1'
          contentContainerStyle={{ paddingBottom: tabBarHeight }}
          showsVerticalScrollIndicator={false}
        >
          {/* YouTube Video Banner */}
          <View 
            style={{ 
              width : layout * 0.98,
              height : layoutHeight / 4,
              borderRadius : 20, 
              marginLeft : '1%', 
              marginTop : 8, 
              backgroundColor : "#ededed", 
              overflow : 'hidden'
            }}
          >
            <YoutubePlayer 
              height={layoutHeight / 4}
              width={layout * 0.98}
              play={playing}
              videoId={currentLecture?.lecture_link ? getVideoIdFromUrl(currentLecture.lecture_link) : undefined}
              onChangeState={onStateChange}
            /> 
          </View>

          { loading && (
            <Animated.View style={[{ zIndex: 1, position: 'absolute', width: '100%', height: '55%', justifyContent : 'center', top : '36%', backgroundColor : '#ededed', alignItems : 'center' }, playMASAnimation]}>
              <LottieView
                autoPlay
                loop={false}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                source={require('@/assets/lottie/MASLogoAnimation3.json')}
                onAnimationFinish={() => {
                  fadeOutAnimation();
                }}
                speed={3}
              />
            </Animated.View>
          ) }


          {/* Classes Section */}
          {allLectures.length > 0 ? (
            <View className='px-4 mt-4 mb-6'>
              <Text className='text-2xl font-bold text-black mb-4'>Classes</Text>
              {allLectures.map((lecture, idx) => {
                const isCurrentLecture = lecture.lecture_id === lectureIdString
                const videoId = lecture.lecture_link ? getVideoIdFromUrl(lecture.lecture_link) : null
                
                return (
                  <Pressable
                    key={lecture.lecture_id}
                    onPress={() => {
                      if (!isCurrentLecture) {
                        router.push(`/menu/program/lectures/${lecture.lecture_id}`)
                      }
                    }}
                    className='mb-3 bg-white rounded-xl overflow-hidden'
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <View className='flex-row'>
                      {/* Thumbnail */}
                      <View 
                        className='bg-gray-300'
                        style={{ 
                          width: 120, 
                          height: 90,
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        {videoId ? (
                          <Image
                            source={{ uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
                            style={{ width: 120, height: 90 }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Icon source="play-circle-outline" size={40} color="#666" />
                        )}
                        {isCurrentLecture && (
                          <View 
                            className='absolute bg-blue-500 px-2 py-1 rounded'
                            style={{ top: 4, left: 4 }}
                          >
                            <Text className='text-white text-xs font-bold'>NOW WATCHING</Text>
                          </View>
                        )}
                        {!isCurrentLecture && (
                          <View className='absolute inset-0 bg-black/20 items-center justify-center'>
                            <Icon source="play-circle" size={30} color="white" />
                          </View>
                        )}
                      </View>

                      {/* Content */}
                      <View className='flex-1 p-3 justify-between'>
                        <View>
                          <Text className='text-base font-semibold text-black mb-1' numberOfLines={2}>
                            {idx + 1} {lecture.lecture_name}
                          </Text>
                          <Text className='text-sm text-gray-500'>
                            {lecture.lecture_date ? formatLectureDate(lecture.lecture_date) : ''}
                          </Text>
                        </View>
                        {isCurrentLecture && (
                          <View className='flex-row items-center mt-2'>
                            <Icon source="check-circle" size={16} color="#10B981" />
                            <Text className='text-xs text-green-600 font-semibold ml-1'>Watched</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </Pressable>
                )
              })}
            </View>
          ) : program && (
            <View className='px-4 mt-4 mb-6'>
              <Text className='text-2xl font-bold text-black mb-4'>Classes</Text>
              <Text className='text-gray-500'>No classes found for this series.</Text>
            </View>
          )}

          {/* Custom Tab Bar */}
          <View className='flex-row bg-[#0D509D] w-[80%] self-center rounded-2xl overflow-hidden mt-2 mb-4' style={{ height: 50 }}>
            {routes.map((route, i) => (
              <Pressable
                key={route.key}
                onPress={() => setIndex(i)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: index === i ? '#57BA47' : 'transparent',
                  borderRadius: 20,
                  marginHorizontal: 2,
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>{route.title}</Text>
              </Pressable>
            ))}
          </View>

          {/* Tab Content */}
          <View style={{ minHeight: 300, backgroundColor: '#ededed' }}>
            {index === 0 && <LectureAISummay />}
            {index === 1 && <LectureAIKeyNotes />}
          </View>
        </ScrollView>

        <Portal>
          <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={{backgroundColor: 'white', padding: 20, height: "70%", width: "95%", borderRadius: 35, alignSelf: "center"}} >
            <ScrollView className='flex-1'
            showsVerticalScrollIndicator={true}
            
            >
              <GetSheikData />
            </ScrollView>
          </Modal>
        </Portal>
    </View>
  )
}


