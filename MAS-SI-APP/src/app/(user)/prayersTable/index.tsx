import { View, Text, Animated, FlatList, Image, FlatListProps, Pressable, StatusBar, Dimensions, ImageBackground } from 'react-native';
import Paginator from '@/src/components/paginator';
import Table from "@/src/components/prayerTimeTable";
import React, {useEffect, useRef, useState } from 'react';
import { usePrayer } from '@/src/providers/prayerTimesProvider';
import { gettingPrayerData } from '@/src/types';
import { Divider, Icon } from 'react-native-paper';
import { Link } from 'expo-router';
import ApprovedAds from '@/src/components/BusinessAdsComponets/ApprovedAds';
import { BlurView } from 'expo-blur';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { ScrollView } from 'react-native';
import { format, isAfter, isBefore } from 'date-fns';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Svg, { Path } from 'react-native-svg';
import moment from 'moment';


export default function Index() {
  const { prayerTimesWeek } = usePrayer();
  const { currentPrayer, upcomingPrayer } = usePrayer();
  if( prayerTimesWeek.length == 0 ){
    return
  }
  const { timeToNextPrayer } = usePrayer()
  const tabBar = useBottomTabBarHeight()
  const todaysDate = new Date()
  const { session } = useAuth()
  const [isRendered, setIsRendered ] = useState(false)
  const [ currentSurah, setCurrentSurah ] = useState({surah : 1, ayah_num : 1, ayah : 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', surah_name : 'Surah Al-Fatiha'})
  const [ showRamadanTrackerInfo, setShowRamadanTrackerInfo ] = useState(false)
  const { height } = Dimensions.get('window')
  const tableWidth = Dimensions.get('screen').width * .95
  const [ tableIndex, setTableIndex ] = useState(0)
  const  [ UserSettings, setUserSettings ] = useState<{ prayer : string, notification_settings : string[] }[]>()
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold : 50}).current;
  const handleScroll = (event : any) => {
    const scrollPositon = event.nativeEvent.contentOffset.x;
    const index = Math.floor(scrollPositon / tableWidth);
    setTableIndex(index)
  }
  const flatlistRef = useRef<FlatList>(null)
  useEffect(() => {
    flatlistRef.current?.scrollToIndex({
      index : tableIndex,
      animated : true
    })  
  }, [tableIndex])
    
  {/* Get Time to Suhoor or Iftar */}


  const getUserSetting = async () => {
      const { data , error } = await supabase.from('prayer_notification_settings').select('*').eq('user_id', session?.user.id)
      if( data ){
        setUserSettings(data)
      }
    if( error ){
      console.log(error)
    }
  }

  const GetRamadanTracker = async ( ) => {
    const { data, error } = await supabase.from('ramadan_quran_tracker').select('*').eq('id', 1).single()
    if( data ){
      setCurrentSurah(data)
    }
  }
  useEffect(() => {
    getUserSetting()
    GetRamadanTracker()
    const listenForSettings = supabase.channel('Listen for user settings change').on(
      'postgres_changes',
      {
        event : '*',
        schema : 'public',
        table : 'prayer_notification_settings',
        filter : `user_id=eq.${session?.user.id}`
      },
      async (payload) => await getUserSetting()
    ).subscribe()

    const listenForQuranTrackerChanges = supabase.channel('Listen for Quran Tracker Changes').on(
      'postgres_changes',
      {
        event : '*',
        schema : 'public',
        table : 'ramadan_quran_tracker',
        filter : `id=eq.${1}`
      },
      async (payload) => await GetRamadanTracker()
    ).subscribe()

    return () => { supabase.removeChannel(listenForSettings); supabase.removeChannel(listenForQuranTrackerChanges) }
  }, [])

  

  const FirstTaraweehTime = setTimeToCurrentDate(convertTo24Hour(prayerTimesWeek[0].iqa_isha))
  const FirstTaraweehEndTime = new Date(FirstTaraweehTime).setHours(FirstTaraweehTime.getHours() + 1)
  const SecondTaraweehTime = new Date(FirstTaraweehTime).setHours(FirstTaraweehTime.getHours() + 1, FirstTaraweehTime.getMinutes() + 20)
  const SecondTaraweehEndTime = new Date(FirstTaraweehTime).setHours(FirstTaraweehTime.getHours() + 2,  FirstTaraweehTime.getMinutes() + 20)
  return (
    <View className='flex flex-1 h-screen'>
      <ScrollView className='h-full  bg-white flex flex-col ' contentContainerStyle={{ paddingBottom : tabBar + 50 }} bounces={false}>
      <StatusBar barStyle={"dark-content"} />
      <ImageBackground
        source={require('@/assets/images/PrayerTimesHeader.jpg')}
        style={{ justifyContent : 'flex-start', height: '100%' }}
        imageStyle={{ height : height / 3.5 , opacity : 0.9, borderBottomLeftRadius : 10, borderBottomRightRadius : 10 , width : '100%'}}
        className='flex flex-col w-full'
      >
        {/* Weekly Prayer Times */}
          <FlatList 
            data={prayerTimesWeek}
            renderItem={({item, index}) => <Table prayerData={item} setTableIndex={setTableIndex} tableIndex={tableIndex} index={index} userSettings={UserSettings}/>}
            horizontal
            bounces={false}
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            scrollEventThrottle={32}
            viewabilityConfig={viewConfig}
            contentContainerStyle={{justifyContent: "center", alignItems: "center"}}
            ref={flatlistRef}
            className='h-[100%] mt-[50%] p-0'
          />
          {/* Business Ads */}          
          <ApprovedAds setRenderedFalse={() => setIsRendered(false)} setRenderedTrue={() => setIsRendered(true) }/>           
          {
            ( isBefore(todaysDate, new Date(2025, 2, 30)) && isAfter(todaysDate, new Date(2025, 1, 28)) ) ? 
            <>
            {/* Taraweeh Times */}
            <View className='flex flex-row w-[95%] my-2 space-x-2 px-1 self-center'>
              <ImageBackground source={require('@/assets/images/TaraweehCard.png')} 
              style={{height: 130, width: '50%', shadowColor : 'rgba(0, 0, 0, 0.25)', shadowOffset : { width : 0,  height : 6}, shadowOpacity : 1, shadowRadius : 4, elevation : 5 
            }} imageStyle={{borderRadius: 15, width :'100%'}}
              className='flex flex-col '
              >
                <View className='p-[15]'>
                  <Text className='text-black text-[10px] text-start'>Starting</Text>
                  <Text className='text-[#06F] text-[13px] text-start'>Taraweeh One</Text>
                  <Text className='text-black font-bold text-[15px] mt-4'>{format(FirstTaraweehTime, 'p')}</Text>
                  <Text className='text-[10px] my-1'>End Time: <Text className='font-bold text-md'>{format(FirstTaraweehEndTime, 'p')}</Text></Text>
                </View>
              </ImageBackground>
              <ImageBackground source={require('@/assets/images/TaraweehCard.png')} 
              style={{height: 130, width: '50%', shadowColor : 'rgba(0, 0, 0, 0.25)', shadowOffset : { width : 0,  height : 6}, shadowOpacity : 1, shadowRadius : 4, elevation : 5 
            }} imageStyle={{borderRadius: 15, width :'100%'}}
              className='flex flex-col'
              >
                <View className='p-[15]'>             
                  <Text className='text-black text-[10px] text-start'>Following</Text>
                  <Text className='text-[#06F] text-[13px] text-start'>Taraweeh Two</Text>
                  <Text className='text-black font-bold text-[15px] mt-4'>{format(SecondTaraweehTime, 'p')}</Text>
                  <Text className='text-[10px] my-1'>End Time: <Text className='font-bold text-md'>{format(SecondTaraweehEndTime, 'p')}</Text></Text>
                </View>
              </ImageBackground>
            </View> 
  
            {/* Suhoor & Iftar Timer */}
            <ImageBackground 
            source={require('@/assets/images/SuhoorIftarBG.png')}
            style={{ width : '95%', height : 60, borderRadius : 15, alignSelf : 'center', shadowColor : 'rgba(0, 0, 0, 0.25)', shadowOffset : { width : 0,  height : 6}, shadowOpacity : 1, shadowRadius : 4, elevation : 5 
          }}
            imageStyle={{ width : '100%', height : 60,  borderRadius : 15 }}
            className='my-2 flex flex-row justify-between'
            >
              <View className='flex flex-col w-[50%] items-center justify-center'>
                {
                   currentPrayer == 'Isha' || currentPrayer == '' || currentPrayer == 'Fajr'  ? 
                  <>
                    <Text className='text-black'>Time Until Suhoor Ends</Text>
                    <Text className='font-bold text-[24px]'>{timeToNextPrayer}</Text>
                  </>
                  :
                  <>
                    <Text className='text-start w-[50%] px-1 text-black'>Suhoor</Text>
                    <Text className='font-bold text-[24px]'>{prayerTimesWeek[1].athan_fajr}</Text>
                  </>
                }
              </View>
  
              <View className='w-[1px] h-[55%] border self-center'/>
              <View className='w-[50%] items-center justify-center'>
              {
                   currentPrayer == 'Dhuhr' || currentPrayer == 'Asr' || currentPrayer == 'Maghrib' ? 
                  <>
                    <Text className='text-black'>Time To Iftar</Text>
                    <Text className='font-bold text-[24px]'>{timeToNextPrayer}</Text>
                  </>
                  :
                  <>
                    <Text className='text-start w-[50%] px-1 text-black'>Iftar</Text>
                    <Text className='font-bold text-[24px]'>{currentPrayer == 'Isha' ? prayerTimesWeek[1].athan_maghrib : prayerTimesWeek[0].athan_maghrib} </Text>
                  </>
                }
              </View>
            </ImageBackground>
  
            {/* Ramadan Quran Tracker */}
            <View className=' self-center flex flex-row w-[95%] bg-white rounded-[15px] mt-4 h-[130] relative'
              
            >
              <View className='flex flex-col w-[60%] p-2 h-full z-[1] bg-white rounded-bl-[15px]'
              style={{ 
                shadowColor : 'rgba(0, 0, 0, 0.25)', shadowOffset : { width : 0,  height : 6}, shadowOpacity : 1, shadowRadius : 4, elevation : 5 
              }}
              >
                <Text className='text-black font-bold text-[13px]'>Ramadan Quran Tracker</Text>
                <View className='h-[60%] overflow-hidden items-center justify-center'><Text className='' numberOfLines={5}>{currentSurah?.ayah}</Text></View>
                <Text className='text-[#767676] text-[11px] '>Last Ayah Read:</Text>
                <Text className='text-[#F6D169] text-[14px] font-bold'>Surah {currentSurah.surah_name} - {currentSurah.surah}:{currentSurah.ayah_num}</Text>
              </View>
  
              <View className='w-[40%] h-full  z-[1]'
              style={{ 
                shadowColor : 'rgba(0, 0, 0, 0.25)', shadowOffset : { width : 3,  height : 6}, shadowOpacity : 1, shadowRadius : 4, elevation : 5 
              }}
              >
                <Image 
                  source={require('@/assets/images/QuranImg.png')}
                  className='w-[100%] h-[130] object-cover '
                  style={{
                    borderBottomRightRadius : 15,
                    borderTopRightRadius : 15
                  }}
                />
                <Pressable className=' absolute top-1 left-[80%]'
                onPress={() => setShowRamadanTrackerInfo(!showRamadanTrackerInfo)}
                >
                <Icon 
                  source={'information-outline'}
                  size={24}
                  color='black'
                />
                </Pressable>
              </View>
  
              <View 
              className='w-[100%] bg-[#D9D9D9] rounded-b-[30px] self-center pt-6 pb-2 items-center justify-center -bottom-[43%] absolute z-[-2] left-0 right-0 mx-auto'
              style={{
                display : showRamadanTrackerInfo ? 'flex' : 'none'
              }}
              >
                <Text className='text-center w-[85%]'>Check after Taraweeh One,  Taraweeh Two, and Fajr. 
                The ayah updates automatically.</Text>
              </View>
  
            </View>
          </>
          : <></>
          }
         
  
      </ImageBackground>
        {/* <ApprovedAds setRenderedFalse={() => setIsRendered(false)} setRenderedTrue={() => setIsRendered(true) }/> */}
    </ScrollView>
    </View>
  )
}



{/* <View className='h-[100%]  bg-white'>
<StatusBar barStyle={"dark-content"} />
<View className='items-center justify-center '>
<ImageBackground
  source={require('@/assets/images/PrayerTimesHeader.jpg')}
  style={{ height : isRendered ? height / 1.85 : height / 1.3 , justifyContent : 'flex-end' }}
  imageStyle={{ height : isRendered ? height / 4.5 : height / 3.5 , opacity : 0.9, borderBottomLeftRadius : 10, borderBottomRightRadius : 10}}
  className='border-2 border-orange-500'
>
  <View className='items-center justify-center border border-black h-[100%]'>
    <FlatList 
      data={prayerTimesWeek}
      renderItem={({item, index}) => <Table prayerData={item} setTableIndex={setTableIndex} tableIndex={tableIndex} index={index} userSettings={UserSettings}/>}
      horizontal
      bounces={false}
      showsHorizontalScrollIndicator={false}
      pagingEnabled
      scrollEventThrottle={32}
      viewabilityConfig={viewConfig}
      contentContainerStyle={{justifyContent: "center", alignItems: "center"}}
      ref={flatlistRef}
    />
  </View>
  </ImageBackground>



</View>
</View> */}

{
  /*
  
   <View className='flex-row items-center justify-between  flex-wrap mt-[10]'>
              <View className='flex-col items-center justify-center ml-[10]'>
                  <View className='w-[95] h-[80] items-center justify-center bg-white' style={{shadowColor: "black", shadowOffset: {width : 0, height: 0}, shadowOpacity: 1, shadowRadius: 3, borderRadius: 8}}>
                    <Image source={{ uri : "https://cdn-icons-png.freepik.com/512/10073/10073987.png" || undefined}} style={{width: 50, height: 50, objectFit: "contain"}} />
                  </View>
                    <Text className='text-xl font-bold'> Qibla </Text>
                </View>

                <View className='flex-col items-center justify-center '>
                  <View className='w-[95] h-[80] items-center justify-center bg-white' style={{shadowColor: "black", shadowOffset: {width : 0, height: 0}, shadowOpacity: 1, shadowRadius: 3, borderRadius: 8}}>
                    <Image source={{ uri : "https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678116-calendar-512.png" || undefined}} style={{width: 50, height: 50, objectFit: "contain"}} />
                  </View>
                    <Text className='text-xl font-bold'> Calender </Text>
                </View>

                <View className='flex-col items-center justify-center mr-[10]'>
                  <View className='w-[95] h-[80] items-center justify-center bg-white' style={{shadowColor: "black", shadowOffset: {width : 0, height: 0}, shadowOpacity: 1, shadowRadius: 3, borderRadius: 8}}>
                    <Image source={{ uri : "https://cdn-icons-png.flaticon.com/512/5195/5195218.png" || undefined}} style={{width: 50, height: 50, objectFit: "contain"}} />
                  </View>
                    <Text className='text-xl font-bold'> 99 Names</Text>
                </View>
            </View>
  */
}
      {/* <ApprovedAds setRenderedFalse={() => setIsRendered(false)} setRenderedTrue={() => setIsRendered(true) }/>
        <View className='flex flex-row space-x-2 items-center justify-center w-full '>
          <ImageBackground source={require('@/assets/images/TaraweehCard.png')} 
          style={{height: 130, width: 190, padding: 15}} imageStyle={{borderRadius: 15}}
          className='flex flex-col '
          >
            <Text className='text-black text-xs text-start'>Starting</Text>
            <Text className='text-[#06F] text-md text-start'>Tarawih One</Text>
            <Text className='text-black font-bold text-lg mt-4'>{format(FirstTaraweehTime, 'p')}</Text>
            <Text className='text-xs'>End Time: <Text className='font-bold text-md'>{format(FirstTaraweehEndTime, 'p')}</Text></Text>
          </ImageBackground>
          <ImageBackground source={require('@/assets/images/TaraweehCard.png')} 
          style={{height: 130, width: 190, padding: 15 }} imageStyle={{borderRadius: 15}}
          >
            <Text className='text-black text-xs text-start'>Following</Text>
            <Text className='text-[#06F] text-md text-start'>Tarawih Two</Text>
            <Text className='text-black font-bold text-lg mt-4'>{format(SecondTaraweehTime, 'p')}</Text>
            <Text className='text-xs'>End Time: <Text className='font-bold text-md'>{format(SecondTaraweehEndTime, 'p')}</Text></Text>
          </ImageBackground>
        </View> */}

function setTimeToCurrentDate(timeString : string) {

  const currentDate = new Date(); // Get current date

   // Split the time string into hours, minutes, and seconds
   const [hours, minutes, seconds] = timeString.split(':').map(Number);
   // Create a new Date object with the current date
   const timestampWithTimeZone = new Date();
 
   // Set the time with setHours (adjust based on local timezone or UTC as needed)
   timestampWithTimeZone.setHours(hours, minutes, seconds, 0); // No milliseconds
 
   // Convert to ISO format with timezone (to ensure it's interpreted as a TIMESTAMPTZ)
   const timestampISO = timestampWithTimeZone // This gives a full timestamp with timezone in UTC
 
   return timestampISO
 }

 function convertTo24Hour(timeStr : string) {
  // Extract the period ("AM"/"PM") and the time part ("7:15")
  const period = timeStr.slice(-2).toUpperCase();
  const [hourStr, minuteStr] = timeStr.slice(0, -2).split(":");
  let hour = parseInt(hourStr, 10);
  
  // Adjust hour based on period
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  
  // Format hour and minute to two digits and add seconds ":00"
  const hh = hour.toString().padStart(2, '0');
  const mm = minuteStr.padStart(2, '0');
  return `${hh}:${mm}:00`;
}