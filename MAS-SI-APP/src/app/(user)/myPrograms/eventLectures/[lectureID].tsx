import { View, Text, useWindowDimensions, ScrollView, FlatList, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import React, { useState, useCallback, useEffect } from 'react';
import { useProgram } from '@/src/providers/programProvider';
import YoutubePlayer from "react-native-youtube-iframe"
import { EventLectureType, Lectures, SheikDataType } from '@/src/types';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useAuth } from "@/src/providers/AuthProvider"
import { supabase } from '@/src/lib/supabase';
import { setDate } from 'date-fns';
import LectureKeyNotesCard from '@/src/components/LectureKeyNotesCard';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { Modal, Portal, Icon } from 'react-native-paper';

export default function LecturesData() {
  const { session } = useAuth()
  const [playing, setPlaying] = useState(false)
  const { lectureID } = useLocalSearchParams();
  const [currentLecture, setLecture] = useState<EventLectureType>()
  const [visible, setVisible] = useState(false);
  const [speakerData, setSpeakerData] = useState<SheikDataType[]>()
  const [speakerString, setSpeakerString] = useState<string[]>()
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const layout = useWindowDimensions().width
  const [index, setIndex] = useState(0)
  const layoutHeight = useWindowDimensions().height
  const KEYNOTECARDHEIGHT = layoutHeight / 4
  const KEYNOTECARDWIDTH = layout * 0.85

  async function getLecture() {
    const { data, error } = await supabase.from("events_lectures").select("*").eq("event_lecture_id", lectureID).single()
    if (error) {
      console.log("event id", error)
    }
    if (data) {
      setLecture(data)
      let speaker_string: string[] = data.event_lecture_speaker.map(() => { return '' })
      const speakers = await Promise.all(
        data.event_lecture_speaker.map(async (speaker_id, index) => {
          const { data: speakerInfo, error: speakerInfoError } = await supabase.from('speaker_data').select('*').eq('speaker_id', speaker_id).single()
          if (speakerInfo) {
            speaker_string[index] = speakerInfo.speaker_name
            return speakerInfo
          }

        })
      )
      setSpeakerData(speakers)
      setSpeakerString(speaker_string)
    }
  }
  const GetSheikData = () => {
    return (
      <View className='flex-1'>

        {
          speakerData?.map((speakerData) => (
            <View className='border-2 border-gray-400 border-solid rounded-[25px] p-2 my-1'>
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
  useEffect(() => {
    getLecture()
  }, [session])

  const onStateChange = useCallback((state: any) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  const togglePlaying = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);


  const LectureAIKeyNotes = () => {
    const [scrollY, setScrollY] = useState(0)
    const [active, setActive] = useState(0)
    const handleScroll = (event: any) => {
      const scrollPositon = event.nativeEvent.contentOffset.y;
      const index = Math.ceil(scrollPositon / (KEYNOTECARDHEIGHT + 20));
      setActive(index)
    }
    const array = currentLecture?.event_lecture_keynotes
    return (
      <View className='items-center bg=[#ededed]'>

        <View className='mt-2' />
        <ScrollView
          onScroll={(event) => { handleScroll(event); setScrollY(event.nativeEvent.contentOffset.y) }}
          contentContainerStyle={{ alignItems: "center", paddingBottom: 0 }}
          decelerationRate={0.6}
          snapToInterval={KEYNOTECARDHEIGHT + (20 * 0.2)}
          showsVerticalScrollIndicator={false}
        >
          <View className='flex-col items-center mt-3'>
            <Text className='font-bold text-black text-2xl text-center'>{currentLecture?.event_lecture_name}</Text>
            <Text className='font-bold  text-blue-500' onPress={showModal}>{speakerString ? speakerString.join(' & ') : ''}</Text>
          </View>
          {array ? array.map((item, index) => {
            return (
              <>
                <LectureKeyNotesCard height={KEYNOTECARDHEIGHT} width={KEYNOTECARDWIDTH} index={index} scrollY={scrollY} keynote={item} active={active} />
                <View style={{ height: 20 }} />
              </>
            )
          }) : <></>}

        </ScrollView>
      </View>
    )
  }
  const LectureAISummay = () => {
    return (
      <ScrollView className='flex-1' contentContainerStyle={{ alignItems: "center", backgroundColor: "#ededed" }}>
        <View className='flex-col items-center mt-3'>
          <Text className='font-bold text-black text-2xl text-center'>{currentLecture?.event_lecture_name}</Text>
          <Text className='font-bold  text-blue-500' onPress={showModal}>{speakerString ? speakerString.join(' & ') : ''}</Text>
        </View>
        <View className='h-[350] w-[85%] mt-2'>
          <ScrollView className=' bg-white' style={{ borderRadius: 10 }} contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 5 }}>
            <Text>{currentLecture?.event_lecture_desc}</Text>
          </ScrollView>
        </View>
      </ScrollView>
    )
  }

  const renderScene = SceneMap({
    first: LectureAISummay,
    second: LectureAIKeyNotes,
  });

  const routes = [
    { key: 'first', title: 'Summary' },
    { key: 'second', title: 'Key Notes' },
  ];

  // const renderTabBar = (props : any) => (
  //   <TabBar
  //   {...props}
  //   indicatorStyle={{ backgroundColor : "#57BA47", position: "absolute", zIndex : -1, bottom : "5%", height: "90%", width : "40%", left : "5%", borderRadius : 20  }}
  //   style={{ backgroundColor: '#0D509D', width : "80%", alignSelf : "center", borderRadius : 20}}
  //   labelStyle={{ color : "white", fontWeight : "bold" }}
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
  return (
    <View className='flex-1 bg-[#ededed]'>
      <Stack.Screen options={{ title: currentLecture?.event_lecture_name, headerTintColor: '#007AFF', headerTitleStyle: { color: 'black' }, headerStyle: { backgroundColor: 'white' } }} />
      <View
        style={{
          width: layout * 0.98,
          height: layoutHeight / 4,
          borderRadius: 20, marginLeft: '1%', marginTop: 8, backgroundColor: "#ededed", overflow: 'hidden'
        }}
      >
        <YoutubePlayer
          height={layoutHeight / 4}
          width={layout * 0.98}
          webViewStyle={{ borderRadius: 20, marginLeft: '2%', marginTop: 8, backgroundColor: "#ededed" }}
          play={playing}
          videoId={currentLecture?.event_lecture_link}
          onChangeState={onStateChange}
        />
      </View>
      <View className='mt-[5]' />
      {loading && (
        <Animated.View style={[{ zIndex: 1, position: 'absolute', width: '100%', height: '55%', justifyContent: 'center', top: '36%', backgroundColor: '#ededed', alignItems: 'center' }, playMASAnimation]}>
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
      )}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout }}
        // renderTabBar={renderTabBar}
        style={{ backgroundColor: "#ededed" }}
      />
      <Portal>
        <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={{ backgroundColor: 'white', padding: 20, minHeight: 400, maxHeight: "70%", width: "95%", borderRadius: 35, alignSelf: "center" }} >
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


