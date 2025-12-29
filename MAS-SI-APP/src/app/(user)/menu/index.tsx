import { Image, StyleSheet, View, Text, FlatList, ScrollView, Dimensions, useWindowDimensions, ImageBackground, StatusBar, Pressable, RefreshControl, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { gettingPrayerData, prayerTimesType, Profile } from '@/src/types';
import { format, parse, setHours, setMinutes, subMinutes } from 'date-fns';
import { usePrayerTimes } from '@/src/hooks/usePrayerTimes';
import SalahDisplayWidget from '@/src/components/salahDisplayWidget';
import { JummahTable } from '@/src/components/jummahTable';
import ProgramsCircularCarousel from '@/src/components/programsCircularCarousel';
import BottomSheet, { BottomSheetModal } from "@gorhom/bottom-sheet";
import { JummahBottomSheetProp } from '@/src/types';
import LinkToVolunteersModal from '@/src/components/linkToVolunteersModal';
import Animated, { interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset, useSharedValue, useAnimatedScrollHandler, withTiming, Easing, FadeIn, runOnJS } from 'react-native-reanimated';
import { Button, TextInput, Portal, Modal, Icon } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import LinkToDonationModal from '@/src/components/LinkToDonationModal';
import LottieView from 'lottie-react-native';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import ApprovedAds from '@/src/components/BusinessAdsComponets/ApprovedAds';
import { BlurView } from 'expo-blur';
import SocialPlatforms from '@/src/components/SocialPlatforms';
import IconsMarquee from '@/src/components/Marquee';
import MASQuestionaire from '@/src/components/MASQuestionaire';
import DailyProgramsWidget from '@/src/components/DailyProgramsWidget';
import OverlappingWidget from '@/src/components/OverlappingWidget';
import DonationVolunteerCarousel, { DonationVolunteerCarouselRef } from '@/src/components/DonationVolunteerCarousel';

// Color Theme based on Figma design
const COLORS = {
  primary: '#214E91',      // Main blue
  accent: '#57BA47',       // Green accent
  white: '#FFFFFF',        // Pure white
  background: '#FFFFFF',   // White background
  black: '#000000',        // Primary text
  gray: '#6B7280',         // Secondary text
  lightGray: '#F3F4F6',    // Light backgrounds
  border: '#E5E7EB',       // Borders
  shadow: 'rgba(0, 0, 0, 0.1)', // Shadows
};

export default function homeScreen() {
  const { data: prayerTimesWeek, isLoading: prayerTimesLoading, refetch: refetchPrayerTimes } = usePrayerTimes()
  const router = useRouter()
  const { session } = useAuth()
  const [isRendered, setIsRendered] = useState(false)
  const [profile, setProfile] = useState<Profile>()
  const [profileFirstName, setProfileFirstName] = useState('')
  const [profileLastName, setProfileLastName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [confirmProfile, setConfirmProfile] = useState(true)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [visible, setVisible] = React.useState(false);
  const [showQuestionaire, setShowQuestionaire] = useState(false)
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const animation = useRef<LottieView>(null);
  const { width } = Dimensions.get("window")
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollOffset = useSharedValue(0)
  const donationCarouselRef = useRef<View>(null);
  const exploreFeaturesRef = useRef<View>(null);
  const [exploreFeaturesY, setExploreFeaturesY] = useState(0);
  const [donationCarouselRelativeY, setDonationCarouselRelativeY] = useState(0);
  const donationVolunteerCarouselRef = useRef<DonationVolunteerCarouselRef>(null);
  const [activeButton, setActiveButton] = useState<'donate' | 'volunteer' | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const updateBottomState = (isBottom: boolean) => {
    setIsAtBottom(isBottom);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = interpolate(event.contentOffset.y, [-1, 1], [-1, 1]);

      // Check if we're at the bottom - disable bounce well before reaching bottom to prevent background showing
      const { contentOffset, contentSize, layoutMeasurement } = event;
      const scrollPosition = contentOffset.y + layoutMeasurement.height;
      const totalContentHeight = contentSize.height;
      // Disable bounce when within 200px of bottom to completely prevent blue background from showing
      const isBottom = scrollPosition >= totalContentHeight - 200;
      runOnJS(updateBottomState)(isBottom);
    }
  });

  const handleScrollEndDrag = (event: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollPosition = contentOffset.y + layoutMeasurement.height;
    const totalContentHeight = contentSize.height;
    const isBottom = scrollPosition >= totalContentHeight - 200;
    setIsAtBottom(isBottom);
  };

  const handleMomentumScrollEnd = (event: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollPosition = contentOffset.y + layoutMeasurement.height;
    const totalContentHeight = contentSize.height;
    const isBottom = scrollPosition >= totalContentHeight - 200;
    setIsAtBottom(isBottom);
  };
  const HeaderRadius = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(scrollOffset.value, [-width / 2, 0, width / 2], [-width / 4, 0, width / 2])
        }
      ],
    }
  })
  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(scrollOffset.value, [0, 75 - 50], [75, 50], 'clamp'),
      width: interpolate(scrollOffset.value, [0, (width / 2.2) - (width / 3)], [width / 2.2, width / 3], 'clamp'),
    }
  })

  const getProfile = async () => {
    if (session?.user.is_anonymous) {
      return
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', session?.user.id).single()
    if (data) {
      if (!data?.first_name || !data?.last_name || !data?.profile_email) {
        setTimeout(() => { setVisible(true) }, 4150)
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
  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([refetchPrayerTimes(), getProfile()])
    } catch (error) {
      console.error('Error refreshing:', error)
    } finally {
      setRefreshing(false)
    }
  }
  useEffect(() => {
    getProfile();
  }, [session])

  useEffect(() => {
    if (!prayerTimesLoading && !refreshing) {
      setLoading(false)
    }
  }, [prayerTimesLoading, refreshing])
  useEffect(() => {
    if (profileFirstName && profileLastName && profileEmail) {
      setConfirmProfile(true)
    }
    else {
      setConfirmProfile(false)
    }
  }, [profileFirstName, profileLastName, profileEmail])

  const prayer = prayerTimesWeek || []

  if (loading || !prayerTimesWeek || prayerTimesWeek.length === 0) {
    return (
      <View style={{ backgroundColor: COLORS.background }} className='justify-center items-center h-full'>
        <Text style={{ color: COLORS.primary }} className='text-lg font-semibold'>Loading...</Text>
      </View>
    )
  }
  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={{ backgroundColor: '#214E91' }}
      contentContainerStyle={{ backgroundColor: COLORS.background, minHeight: '100%', paddingBottom: 100 + 20 }}
      className="h-full z-[0]"
      bounces={!isAtBottom}
      alwaysBounceVertical={false}
      overScrollMode="never"
      onScroll={scrollHandler}
      onScrollEndDrag={handleScrollEndDrag}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.white}
          colors={[COLORS.white]}
          progressViewOffset={0}
          style={{ backgroundColor: 'transparent' }}
        />
      }
    >
      <StatusBar barStyle={"light-content"} />

      <View style={{ height: 350, overflow: "hidden", justifyContent: "center" }} className=''>
        {prayer && prayer[0] && prayer[1] && (
          <SalahDisplayWidget
            key={`${prayer[0]?.date}-${prayer[0]?.athan_fajr}`}
            prayer={prayer[0]}
            nextPrayer={prayer[1]}
          />
        )}
      </View>

      {/* Overlapping Widget */}
      <OverlappingWidget />

      <Pressable
        className='pt-7 flex-row justify-between w-[100%] px-3'
        onPress={() => router.push('/menu/program/upcomingEvents')}
      >
        <Text style={{ color: COLORS.primary }} className='font-bold text-2xl'>Weekly Programs</Text>
        <View className='flex-row items-center'>
          <Text style={{ color: COLORS.gray }} className=''>View All</Text>
          <Icon source={'chevron-right'} size={20} color={COLORS.gray} />
        </View>
      </Pressable>
      <View className='pt-3' style={{ height: 250 }}>
        <ProgramsCircularCarousel />
      </View>

      {/* Ads */}
      <ApprovedAds setRenderedFalse={() => setIsRendered(false)} setRenderedTrue={() => setIsRendered(true)} />

      {/* Explore Features Section */}
      <View className='pt-4 px-3'>
        <View className='flex-row justify-between items-center mb-2'>
          <Pressable onPress={() => router.push('/(user)/more')}>
            <Text style={{ color: COLORS.primary }} className='font-bold text-lg'>Explore features</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(user)/more')}>
            <Text style={{ color: COLORS.gray }} className='text-xs'>See all</Text>
          </Pressable>
        </View>

        <View className='flex-row justify-between'>
          {/* Donate Button */}
          <Pressable
            className='flex-1 mr-2 items-center justify-center py-0.5 px-2.5 rounded-full'
            style={{
              backgroundColor: activeButton === 'donate' ? COLORS.primary : COLORS.lightGray
            }}
            onPress={() => {
              setActiveButton('donate');
              donationVolunteerCarouselRef.current?.scrollToDonation();
            }}
          >
            <Icon
              source={'hand-heart'}
              size={16}
              color={activeButton === 'donate' ? COLORS.white : COLORS.primary}
            />
            <Text
              className='font-semibold text-[9px] mt-0.5 text-center'
              numberOfLines={1}
              style={{ color: activeButton === 'donate' ? COLORS.white : '#374151' }}
            >
              Donate
            </Text>
          </Pressable>

          {/* Volunteers Button */}
          <Pressable
            className='flex-1 ml-2 items-center justify-center py-0.5 px-2.5 rounded-full'
            style={{
              backgroundColor: activeButton === 'volunteer' ? COLORS.primary : COLORS.lightGray
            }}
            onPress={() => {
              setActiveButton('volunteer');
              donationVolunteerCarouselRef.current?.scrollToVolunteer();
            }}
          >
            <Icon
              source={'account-group'}
              size={16}
              color={activeButton === 'volunteer' ? COLORS.white : COLORS.primary}
            />
            <Text
              className='font-semibold text-[9px] mt-0.5 text-center'
              numberOfLines={1}
              style={{ color: activeButton === 'volunteer' ? COLORS.white : '#374151' }}
            >
              Volunteers
            </Text>
          </Pressable>
        </View>

        {/* Donation and Volunteer Cards Carousel */}
        <View className='pt-3 px-3'>
          <DonationVolunteerCarousel ref={donationVolunteerCarouselRef} />
        </View>
      </View>

      {/* Commented out sections below Explore Features
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
      
                  Programs Carousel
                  <View className='pt-3' style={{height: 250}}>
                    <ProgramsCircularCarousel />
                  </View>
      
                  <ApprovedAds setRenderedFalse={() => setIsRendered(false)} setRenderedTrue={() => setIsRendered(true) }/>
                      
                  <View className='pl-3 flex-row pt-4'>
                      <Text style={{color: COLORS.primary}} className='font-bold text-2xl'>Donate</Text>
                  </View>
                  <View className='pt-2'>
                    <LinkToDonationModal />
                  </View>
                <View className='flex-row pl-3 pt-5'>
                  <Text style={{color: COLORS.primary}} className='font-bold text-2xl'>Volunteers</Text>
                </View>
                <View className='pt-2'>
                  <LinkToVolunteersModal />
                </View>
                <View className='flex-row pl-3 pt-6'>
                  <Text style={{color: COLORS.primary}} className='font-bold text-2xl' >Jummah Schedule</Text>
                </View>
                <View className='justify-center items-center w-[95%] m-auto pt-2' style={{shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 8}}>
                  <ImageBackground style={{width:"100%", height: 450, justifyContent: "center"}} source={require("@/assets/images/jummahSheetBackImg.jpeg")} resizeMode='stretch' imageStyle={{ borderRadius: 20 }}>
                    <JummahTable ref={bottomSheetRef}/>
                  </ImageBackground>
                </View>
                  */}

      <View className='flex-row pl-3 pt-6'>
        <Text style={{ color: COLORS.primary }} className='font-bold text-2xl'>Connect With Us</Text>
      </View>
      <IconsMarquee />

      {/* Today's Programs Widget
                <DailyProgramsWidget />
                
                <Portal >
                  <Modal visible style={{
                    backgroundColor : COLORS.background
                  }}>
                    <MASQuestionaire onCloseQuestionaire={() => setShowQuestionaire(false)}/>
                  </Modal>
                </Portal>
                */}

      <View style={[{ paddingBottom: 100 }]}></View>
    </Animated.ScrollView>
  )

}

