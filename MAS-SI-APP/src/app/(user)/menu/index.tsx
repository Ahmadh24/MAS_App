import { Image, StyleSheet, View, Text, FlatList, ScrollView, Dimensions, useWindowDimensions, ImageBackground, StatusBar, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef, useContext, useCallback} from 'react';
import { gettingPrayerData, prayerTimesType, Profile } from '@/src/types';
import { format, parse, setHours, setMinutes, subMinutes } from 'date-fns';
import { ThePrayerData} from '@/src/components/getPrayerData';
import { usePrayer } from '@/src/providers/prayerTimesProvider';
import SalahDisplayWidget from '@/src/components/salahDisplayWidget';
import {JummahTable} from '@/src/components/jummahTable';
import ProgramsCircularCarousel from '@/src/components/programsCircularCarousel';
import BottomSheet, { BottomSheetModal } from "@gorhom/bottom-sheet";
import { JummahBottomSheetProp } from '@/src/types';
import LinkToVolunteersModal from '@/src/components/linkToVolunteersModal';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Animated,{ interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset, useSharedValue, useAnimatedScrollHandler, withTiming, Easing, FadeIn } from 'react-native-reanimated';
import { Button, TextInput, Portal, Modal, Icon  } from 'react-native-paper';
import { Link } from 'expo-router';
import LinkToDonationModal from '@/src/components/LinkToDonationModal';
import LottieView from 'lottie-react-native';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import ApprovedAds from '@/src/components/BusinessAdsComponets/ApprovedAds';
import { BlurView } from 'expo-blur';
import SocialPlatforms from '@/src/components/SocialPlatforms';
import IconsMarquee from '@/src/components/Marquee';
import MASQuestionaire from '@/src/components/MASQuestionaire';

export default function homeScreen() {
  const { onSetPrayerTimesWeek, prayerTimesWeek } = usePrayer()
  const { session } = useAuth()
  const [isRendered, setIsRendered ] = useState(false)
  const [ profile, setProfile ] = useState<Profile>()
  const [ profileFirstName , setProfileFirstName ] = useState('')
  const [ profileLastName , setProfileLastName ] = useState('')
  const [ profileEmail, setProfileEmail ] = useState('')
  const [ confirmProfile, setConfirmProfile ] = useState(true)
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = React.useState(false);
  const [ showQuestionaire, setShowQuestionaire ] = useState(false)
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const tabBarHeight = useBottomTabBarHeight();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const animation = useRef<LottieView>(null);
  const { width } = Dimensions.get("window")
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollOffset = useSharedValue(0)
    const scrollHandler = useAnimatedScrollHandler(event => {
      scrollOffset.value = interpolate(event.contentOffset.y, [ -1, 1], [-1, 1]);
    });
    const HeaderRadius = useAnimatedStyle(() => {
      return {
        transform: [
          {
            translateY: interpolate(scrollOffset.value, [-width / 2, 0, width / 2], [-width/4, 0, width / 2] )
          }
        ],
      }
    })
    const imageAnimatedStyle = useAnimatedStyle(() => {
      return{
        height: interpolate(scrollOffset.value, [0, 75-50], [75, 50], 'clamp'),
        width: interpolate(scrollOffset.value, [0, (width / 1.8) - (width / 2.8)], [width / 1.8, width / 2.8], 'clamp'),

      }
    })

    const getProfile = async () => {
      if( session?.user.is_anonymous){
        return
      }
      const { data, error } = await supabase.from('profiles').select('*').eq('id', session?.user.id).single()
      if( data ){
        if ( !data?.first_name || !data?.last_name || !data?.profile_email ){
          setTimeout(() => {setVisible(true)}, 4150)
        }
        setProfile(data)
      }
    }
    // const onConfirmButton = async () => {
    //   console.log(profileFirstName, profileLastName, profileEmail)
    //   const { data, error } = await supabase.from('profiles').update({ first_name : profileFirstName, last_name : profileLastName, profile_email : profileEmail}).eq('id', session?.user.id)
    //   if( data ){
    //     console.log(data)
    //   }
    //   if( error ){
    //     console.log(error)
    //   }
    //   else{
    //   setVisible(false)
    //   }
    // }
    const getPrayer = async () => {
      const prayerTimesInfo = await supabase.from('prayers').select('*').eq('id', 1).single()
        const prayerTimes = prayerTimesInfo.data
        const weekInfo  : gettingPrayerData[] = ThePrayerData({prayerTimes})
        onSetPrayerTimesWeek(weekInfo)
        setLoading(false)
    }
    useEffect( () => {
      getProfile();
      getPrayer();
    }, [session])
    useEffect(() => {
      if( profileFirstName && profileLastName && profileEmail ){
        setConfirmProfile(true)
      }
      else{
        setConfirmProfile(false)
      }
    }, [profileFirstName, profileLastName, profileEmail])
    if (loading){
      return(
        <View className='justify-center items-center'>
          <Text>Loading...</Text>
        </View>
      )
    }
    const prayer = prayerTimesWeek
    return (
           <Animated.ScrollView ref={scrollRef} className="bg-white h-full z-[0]" onScroll={scrollHandler} 
            >
                  <StatusBar barStyle={"dark-content"}/>
                  <Animated.View className='justify-center items-center pt-[14%] bg-white w-full overflow-clip z-[1]' style={HeaderRadius} > 
                    <Animated.Image source={require("@/assets/images/massiLogo2.png")} style={[{width: width / 1.3, justifyContent: "center", objectFit : 'fill' }, imageAnimatedStyle]}  />
                  </Animated.View>
                  
                  <View style={{height: 250, overflow: "hidden", justifyContent:"center", borderEndStartRadius: 30 ,borderEndEndRadius: 30}} className=''>
                    <SalahDisplayWidget prayer={prayer[0]} nextPrayer={prayer[1]}/>
                  </View>
                <Link href={'/menu/program'} asChild>
                  <Pressable className='pt-7 flex-row justify-between w-[100%] px-3'>
                    <Text className='font-bold text-2xl text-[#0D509D]'>Weekly Programs</Text>
                    <View className='flex-row items-center'>
                      <Text className='text-gray-400'>View All</Text>
                      <Icon source={'chevron-right'} size={20}/>
                    </View>
                  </Pressable>
                </Link>
                    <View className='pt-3' style={{height: 250}}>
                      <ProgramsCircularCarousel />
                    </View>
      
                    <ApprovedAds setRenderedFalse={() => setIsRendered(false)} setRenderedTrue={() => setIsRendered(true) }/>
                      
                    <View className='pl-3 flex-row pt-4'>
                        <Text className='text-[#0D509D] font-bold text-2xl'>Donate</Text>
                    </View>
                    <View className='pt-2'>
                      <LinkToDonationModal />
                    </View>
                  <View className='flex-row pl-3 pt-5'>
                    <Text className='text-[#0D509D] font-bold text-2xl'>Volunteers</Text>
                  </View>
                  <View className='pt-2'>
                    <LinkToVolunteersModal />
                  </View>
                  <View className='flex-row pl-3 pt-6'>
                    <Text className='text-[#0D509D] font-bold text-2xl' >Jummah Schedule</Text>
                  </View>
                  <View className='justify-center items-center w-[95%] m-auto pt-2' style={{shadowColor: "black", shadowOffset: { width: 0, height: 0},shadowOpacity: 0.6}}>
                    <ImageBackground style={{width:"100%", height: 450, justifyContent: "center"}} source={require("@/assets/images/jummahSheetBackImg.jpeg")} resizeMode='stretch' imageStyle={{ borderRadius: 20 }}>
                      <JummahTable ref={bottomSheetRef}/>
                    </ImageBackground>
                  </View>
      
                  <View className='flex-row pl-3 pt-6'>
                    <Text className='text-[#0D509D] font-bold text-2xl'>Connect With Us</Text>
                  </View>
                  <IconsMarquee />
                  {/* <Portal >
                    <Modal visible style={{
                      backgroundColor : 'white'
                    }}>
                      <MASQuestionaire onCloseQuestionaire={() => setShowQuestionaire(false)}/>
                    </Modal>
                  </Portal> */}

                  <View style={[{paddingBottom : tabBarHeight}]}></View>
           </Animated.ScrollView>
    )
    
  }

