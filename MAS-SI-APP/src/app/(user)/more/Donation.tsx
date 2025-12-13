import { View, Text, ScrollView, useWindowDimensions, Pressable, Image, FlatList } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import DonationChart from '@/src/components/DonationChart'
import { format } from 'date-fns'
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedRef, useAnimatedStyle, useDerivedValue, useSharedValue, withSequence, withTiming } from 'react-native-reanimated'
import { Canvas, SkFont, useFont } from '@shopify/react-native-skia'
import AnimatedDonationAmount from '@/src/components/AnimatedDonationText'
import { LinearGradient } from 'expo-linear-gradient'
import YoutubePlayer from "react-native-youtube-iframe"
import { Button, Divider, Icon, ProgressBar } from 'react-native-paper'
import { Link, router, Stack } from 'expo-router'
import { initializePaymentSheet, openPaymentSheet } from '@/src/lib/stripe'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import OtherAmountDonationSheet from '@/src/components/ShopComponets/OtherAmountDonationSheet'
import { supabase } from '@/src/lib/supabase'
import { useStripe } from '@stripe/stripe-react-native'
import Svg, { Path } from 'react-native-svg'
import * as Clipboard from 'expo-clipboard';
import LottieView from 'lottie-react-native'
import Toast from 'react-native-toast-message'

type DonationGoalType = {
    date : string
    amount : number
    amountGiven : number
}

{
  /*
    header : () => 
          (
          <View style={{ borderBottomLeftRadius: 20, borderBottomRightRadius : 20, backgroundColor : '#D9D9D9', height : 90, marginBottom : '10%' }} 
          className='items-end justify-center flex flex-row'>
            <Svg width="29" height="29" viewBox="0 0 29 29" fill="none">
              <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="#1B85FF" stroke-width="2"/>
            </Svg>
            <Text>Donation</Text>
          </View>
          )
  */
}

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);

const Donation = () => {
  const { retrievePaymentIntent } = useStripe()
  const layout = useWindowDimensions().width
  const layoutHeight = useWindowDimensions().height
  const [ playing, setPlaying ] = useState(false)
  const [ buttonOn, setButtonOn ] = useState(true)
  const [ categories, setCategories ] = useState<{ project_id : string, project_name : string, project_goal : number | null, project_linked_to : string | null, thumbnail : string | null }[]>([]) 
  const [ currentDonations, setCurrentDonations ] = useState<{amountGiven : number, date : string, project_donated_to : string[]}[]>([])
  const [ progressBar, setProgressBar ] = useState(0)
  const [ progressCircleLeft, setProgressCircle ] = useState(0)  
  const layoutWidth = useWindowDimensions().width
  const VenmoCopyRef = useAnimatedRef<LottieView>()
  const VenmoAnimationProgress = useSharedValue(0.5)
  const ZelleCopyRef = useAnimatedRef<LottieView>()
  const ZelleAnimationProgress = useSharedValue(0.5)
  const progressCircle = useAnimatedStyle(() => {
    return {
      left : withTiming(progressCircleLeft - 1.5, { duration : 2000 })
    }
  })

  const progressBarAnim = useAnimatedStyle(() => {
    return { 
      width : withTiming(progressBar, { duration : 2000 })
    }
  })

  const onStateChange = useCallback((state : any) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);
  const togglePlaying = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const handlePresentModalPress = () => bottomSheetRef.current?.present();

  const callForDonationAmount = async (amount : number) => {
    setButtonOn(false)
    const paymentIntent = await initializePaymentSheet(Math.floor(amount * 100))
    const paymentSuccess = await openPaymentSheet()
    if(paymentSuccess){
      const { data : getLatestTotal , error } = await supabase.from('donations').select('*').order('date', { ascending : false }).limit(1).single()
      const { error : insertError } = await supabase.from('donations').insert({ amount : getLatestTotal.amount + amount, amountGiven : amount })
      const { error : emailError } = await supabase.functions.invoke('donation-confirmation-email',{ body : { donation_amount : amount } })
      if( emailError ){
        console.log(emailError)
      }
      if( insertError ){
        console.log(insertError)
      }
      setButtonOn(true)
    }else{
      console.log('Failed')
      setButtonOn(true)
    }
    setButtonOn(true)
  }

  { /* 1857000, 3714000, 5571000, 7428000, 9285000, 11142000, 13000000 */ }
  const getDonations = async ( ) => {
    const From2022 = new Date('2022-01').toISOString()
    const { data , error } = await supabase.from('donations').select('*').gte('date', From2022)
    if( data ){
      setCurrentDonations(data)
      const totalAmount = data.reduce((sum, donation) => sum + donation.amountGiven, 0);
      const Percentage = (totalAmount / 13000000) * 100
      const progressCircleInterpolate = interpolate(totalAmount, [0, 13000000 ], [0, layoutWidth * .3], Extrapolation.CLAMP)
      const progressBarInterpolate = interpolate(Percentage, [0, 100], [0, layoutWidth * .3], Extrapolation.CLAMP)
      setProgressCircle(progressCircleInterpolate)
      setProgressBar(progressBarInterpolate)
    }
  }
  const getCategories = async () => {
    const { data , error } = await supabase.from('projects').select('*')
    if( data ){
      setCategories(data)
    }
  }

  const PressVenmo =  async () => {
    await copyToClipboard('@massiscenter')
    Toast.show({
       type: 'info',
        text1: '@massiscenter copied to clipboard',
        
    })
    VenmoAnimationProgress.value = withSequence(withTiming(1, { duration : 200 }), withTiming(0.5, { duration : 400 }))
  }

  const PressZelle = async () => {
    await copyToClipboard('massi10304@gmail.com')
    Toast.show({
       type: 'info',
        text1: 'massi10304@gmail.com copied to clipboard'
    })
    ZelleAnimationProgress.value = withSequence(withTiming(1, { duration : 200 }), withTiming(0.5, { duration : 400 }))
  }
  useEffect(() => {
    getDonations()
    getCategories()
    const DonationUpdate = supabase.channel('Check for new donations').on(
      'postgres_changes',
     {
       event: '*',
       schema: 'public',
       table: 'donations',
     },
     (payload) => getDonations()
     )
     .subscribe()
     VenmoCopyRef.current?.play(30, 30)
     ZelleCopyRef.current?.play(30, 30);

     return () => { supabase.removeChannel( DonationUpdate ) }
  }, [])
  const copyToClipboard = async ( text : string ) => {
    await Clipboard.setStringAsync(text);
  };

  return (
    <ScrollView style={{ width : layout, height : layoutHeight, backgroundColor : "white" }} contentContainerStyle={{ paddingBottom : 60, paddingTop : 100, paddingHorizontal : 10 }}> 
        <Stack.Screen options={{ 
        headerTransparent : true,
        headerShown : true,
        header : () => 
          (
          <View style={{ borderBottomLeftRadius: 20, borderBottomRightRadius : 20, backgroundColor : '#D9D9D9', height : 100 }} 
          className='items-end justify-center flex flex-row'>
            
            <View className='mb-[1%] flex flex-row items-center w-[100%]'>

              <Pressable className='self-start ml-4' onPress={() => router.back()}>
                <Svg width="35" height="35" viewBox="0 0 29 29" fill="none">
                  <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="#1B85FF" stroke-width="2"/>
                </Svg>
              </Pressable>

              <Text className='font-bold text-xl text-center self-center ml-[26%]'>Donation</Text>
            </View>
          </View>
          )
      }}/>
        <View>
          <Text className='text-black font-[600] text-xl mt-[8%]'>Categories</Text>
          <Text className='text-gray-400 text-md mb-3 mt-1 font-[300]'>Select To Contribute Directly </Text>
          
          <FlatList 
            data={categories}
            renderItem={({item}) => (
              <Link className='flex flex-col gap-y-2 w-[160px] mt-[10] items-center justify-center mx-2' 
              href={{
                pathname : '/more/DonationCategoires/[project_id]',
                params : { project_id : item.project_id, project_name : item.project_name, project_linked_to : item.project_linked_to, project_goal : item.project_goal, thumbnail : item.thumbnail, }
              }}
              >
                <View
                style={{ shadowColor : 'gray', shadowOffset : { width : 0, height : 2}, shadowOpacity : 1, shadowRadius : 2 }}
                >
                  {
                    item.thumbnail ? 
                    <Image src={item.thumbnail} className='w-[154px] h-[138px] bg-gray-400 rounded-[15px] object-cover'               
                    />
                    :
                    <Image source={require('@/assets/images/Donations5.png')} className='w-[154px] h-[138px] bg-gray-400 rounded-[15px] object-fill'               
                    />
                  }
                </View>
                <Text numberOfLines={1} className='text-[10px] text-black text-center bg-white self-center'>{item.project_name}</Text>
              </Link>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
        {/* Progress and Donation History*/}
        <View className='flex flex-row justify-between mt-7'>
          <View className='items-center flex-row h-[90px]'  style={{ backgroundColor :"linear-gradient(180deg, #FFF 0%, rgba(140, 178, 222, 0.60) 100%)", width : '62%', alignSelf : 'start', marginTop : 2,  borderRadius : 15, paddingHorizontal : 8, paddingVertical : 8 }} >
              
                <View 
                style={{ shadowColor : 'gray', shadowOffset : { width : 0, height : 2}, shadowOpacity : 1, shadowRadius : 2 }}
                >
                  <Image  source={require('@/assets/images/MASHomeLogo.png')} style={{ backgroundColor : 'white', borderRadius : 50, width : 50, height : 50}}/>
                </View>              
                <View className='flex flex-col'>
                <Text className='text-[#8D8D8D] font-bold ml-2 mb-3'>MAS STATEN ISLAND</Text>
                <Text className='text-[#8D8D8D] ml-2 text-[8px] mb-1 font-[300]'>Phase 2 Progress </Text>
                <View className='ml-2'
                style={{ shadowColor : 'gray', shadowOffset : { width : 0, height : 2}, shadowOpacity : 1, shadowRadius : 2 }}
                >
                     <View className='w-[85%] relative' >
                        {/* Range 0-320*/}
                        <Animated.View className=' absolute h-[6px] w-[6px] bottom-7.5 z-[2] bg-[#57BA49] rounded-full' 
                        style={[{ shadowColor : 'black', shadowOffset : { width : 0, height : 4}, shadowOpacity : 1, shadowRadius : 4}, progressCircle ]}/>

                        <Animated.View style={[progressBarAnim, { height : 6}]} className='bg-green-800 absolute bottom-7.5 rounded-l-xl z-[1]'/>
                        <View className='bg-[#0D509E] rounded-xl self-center h-[6px]' style={{width : layoutWidth * .3}}/>
                    </View>
                </View>
              </View>
  
          </View>
  
          <View className='h-[90px] bg-[#CDCDCD] flex flex-col rounded-[15px] w-[35%]'>
            <View className='bg-white rounded-[15px] w-[90%] h-[20%] mt-[11] self-center items-center justify-center flex flex-row'>
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <Path d="M18 3.00001V3.00001C19.6569 3.00001 21 4.34315 21 6.00001L21 8.14286C21 8.47698 21 8.64405 20.9234 8.76602C20.8834 8.82962 20.8296 8.8834 20.766 8.92336C20.644 9 20.477 9 20.1429 9L15 9M18 3.00001V3.00001C16.3431 3.00001 15 4.34315 15 6.00001L15 9M18 3.00001L7 3.00001C5.11438 3.00001 4.17157 3.00001 3.58579 3.58579C3 4.17158 3 5.11439 3 7.00001L3 21L6 20L9 21L12 20L15 21L15 9" stroke="#222222"/>
                <Path d="M7 7L11 7" stroke="#222222" stroke-linecap="round"/>
                <Path d="M8 11H7" stroke="#222222" stroke-linecap="round"/>
                <Path d="M7 15L10 15" stroke="#222222" stroke-linecap="round"/>
              </Svg>
              <Text className='text-black text-[10px] font-[300]'>Donation History</Text>
            </View>
            <View className='self-end mt-[30%] flex flex-row items-center justify-between px-1 w-[50%]'>
              <Text className='text-white text-[10px] font-[300]'>view all</Text>
              <Svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                <Path d="M11.5 1L15 5.5M15 5.5L11.5 10M15 5.5H1" stroke="#6077F5" stroke-linecap="round"/>
              </Svg>
            </View>
          </View>

        </View>

        { /*Donate Call to Action & Other platforms */ }
      <View className='flex flex-row justify-between'>

          <Link
           href={{
            pathname : '/more/DonationCategoires/[project_id]',
            params : { project_id : '1fcda08a-c61d-4d44-af5f-f32ff3af58f9', project_name : 'General Masjid Support' }
           }}
           className='h-[145px] w-[174px] rounded-[15px] flex flex-col mt-3'>
              <Image source={require('@/assets/images/Donations5.png')} className='h-[101] w-[174px]' style={{ borderTopLeftRadius : 15, borderTopRightRadius : 15 }} />
  
              <LinearGradient 
                colors={['#6ee96e', '#57BA49']}
                className='h-[44px] w-[174px] flex flex-row rounded-br-[15px] rounded-bl-[15px] px-3 justify-between items-start pt-1 '
                start={{ x : 0.5, y: 0.1 }}
                end={{ x : 0.5, y : 0.6 }}
                dither
              >
                <View className='items-center  flex flex-row justify-between w-[100%]'>
                  <View className='flex flex-col'>
                    <Text className='text-[#0F4E97] font-bold text-[15px]'>Donate</Text>
                    <View className='flex flex-row '>
                      <Text className='text-white text-[10px] font-[300]'>Your Help is Needed</Text>
                    </View>
                  </View>
                  <Svg width="16" height="11" viewBox="0 0 16 11" fill="none" className='mr-1'>
                      <Path d="M11.5 1L15 5.5M15 5.5L11.5 10M15 5.5H1" stroke="#6077F5" stroke-linecap="round"/>
                  </Svg>
                </View>
  
              </LinearGradient>
          </Link>

          <View 
            className='h-[145px] w-[184px] flex flex-col bg-[#EAEBED] rounded-[15px] mt-3'
          >
            <Text className='font-bold text-black mt-3 ml-3 mb-1 text-[11px]'>Other Platforms</Text>

            <Pressable className='items-center justify-center flex flex-row relative' onPress={ async () => await PressVenmo()}>
              <View style={{ shadowColor : 'gray', shadowOffset : { width : 0, height : 5 }, shadowOpacity : 1, shadowRadius : 5 }} className=' absolute left-1 z-[1]'>
                <Image source={require('@/assets/images/VenmoLogo.png')} className='rounded-full w-[25px] h-[25px] '/>
              </View> 
              <View className='bg-white w-[80%] rounded-[15px] flex flex-row justify-evenly h-[38px] items-center ml-8'>
                <Text className='text-[12px] font-[300]'>@massiscenter</Text>
                <AnimatedLottieView 
                   source={require('@/assets/lottie/CopyAnimation.json')}
                   style={{width : 25, height : 25 }}
                   ref={VenmoCopyRef}
                   progress={VenmoAnimationProgress}
                  />
              </View>           
            </Pressable>


            <Pressable className='items-center justify-center flex flex-row relative mt-5' onPress={ async () => await PressZelle()}>
              <View style={{ shadowColor : 'gray', shadowOffset : { width : 0, height : 5 }, shadowOpacity : 1, shadowRadius : 5 }} className=' absolute left-1 z-[1]'>
                <Image source={require('@/assets/images/ZelleLogo.png')} className='rounded-full w-[25px] h-[25px] '/>
              </View> 
              <View className='bg-white w-[80%] rounded-[15px] flex flex-row justify-evenly h-[38px] items-center ml-8'>
                <Text className='text-[9px] font-[300]' numberOfLines={1} adjustsFontSizeToFit>massi10304@gmail.com</Text>
                <AnimatedLottieView 
                  source={require('@/assets/lottie/CopyAnimation.json')}
                  style={{width : 25, height : 25 }}
                  loop={true}
                  ref={ZelleCopyRef}
                  progress={ZelleAnimationProgress}
                /> 
              </View>           
          </Pressable>


          </View>

          

      </View>

        <Text className='text-black font-bold text-lg mt-10'>Where Does My Donation Go To?</Text>
        <View
        style={{ shadowColor : 'gray', shadowOffset : { width : 0, height : 2}, shadowOpacity : 1, shadowRadius : 2 }}
        >
            <YoutubePlayer
                height={layoutHeight / 4}
                width={layout * 0.95}
                webViewStyle={{ borderRadius : 20, marginTop : 8, backgroundColor : "#ededed" }}
                play={playing}
                videoId={'pTKXtYdCg9c'}
                onChangeState={onStateChange}
            />
        </View>
       
        <OtherAmountDonationSheet ref={bottomSheetRef} />
    </ScrollView>
  )
}

export default Donation


{
  /*
    <View className='items-center flex-row mt-[100px]'  style={{ backgroundColor : "#0D509D", width : '90%', alignSelf : 'center', marginTop : 2, borderTopLeftRadius : 20, borderTopRightRadius : 20, paddingHorizontal : 8, paddingVertical : 8 }} >
        <Image  source={require('@/assets/images/MASHomeLogo.png')} style={{ backgroundColor : 'white', borderRadius : 50, width : 50, height : 50}}/>
        <Text className='text-white text-2xl font-bold ml-4'>MAS Staten Island</Text>
    </View>
    <Divider style={{width : '90%', alignSelf : 'center'}}/>
    <View style={{ backgroundColor : "#0D509D", width : '90%', alignSelf : 'center', borderBottomLeftRadius : 20, borderBottomRightRadius : 20}} className='flex-row'>
        <View style={{ width : (layout * .9) / 1.5}}>
          <AnimatedDonationAmount font={font} selectedValue={selectedValue} percantageToGoal={perctangeToGoal}/>
        </View>
        <View style={{ width : (layout * .9) / 3}} className='items-center justify-center flex-row'>
          <Text className='text-xl font-bold text-[#57BA47]'>{perctangeToGoal}%</Text>
          <Icon size={20} source={'arrow-up-thin'} color='#57BA47'/>
        </View>
    </View>


    <View style={{ width : '90%', height: layoutHeight / 2.8, shadowColor : 'black', shadowOffset : { width : 0, height : 0}, shadowOpacity : 1, shadowRadius : 2, borderRadius : 20, justifyContent : 'center', alignItems : 'center', backgroundColor : 'white', marginTop : 5, alignSelf : 'center' }}> 
          {currentDonations.length > 0 &&<DonationChart CHART_HEIGHT={layoutHeight / 3} CHART_WIDTH={layout * .89}  DONATION_GOAL={DONATIONGOAL} CHART_MARGIN={layoutMargin} CURR_DONATIONS={currentDonations} setSelectedDate={setSelectedDate} selectedValue={selectedValue} setNewDonationAnimation={setNewDonationAnimation} newDonationAnimation={newDonationAnimation}/>}        
        </View> 
        <View style={{ width : layout, height : layoutHeight / 5, backgroundColor : 'white', flexWrap : "wrap", flexDirection : 'row', columnGap : 5, justifyContent : 'center', marginTop : "10%", rowGap : 5 }}>
            {DonationButtonBoxs.map((item, index) => (
                  <Pressable style={{ width : layout / 2.2, height : 50, shadowColor : 'black', shadowOffset : { width : 0, height : 2}, shadowOpacity : 1, shadowRadius : 3 }} onPress={ () =>  callForDonationAmount(DonationButtonBoxs[index]) } key={index} disabled={!buttonOn}>
                      <LinearGradient colors={['#0D509D', '#57BA47']} style={{ width : '100%', height : '100%', opacity : 0.8, borderRadius  : 20, justifyContent : "center" }}>
                          <Text className='text-white text-xl font-bold text-center'>${item}</Text>
                      </LinearGradient>
                  </Pressable>
            ))}
             <Pressable style={{ width : layout / 2.2, height : 50, shadowColor : 'black', shadowOffset : { width : 0, height : 2}, shadowOpacity : 1, shadowRadius : 3  }} onPress={handlePresentModalPress} disabled={!buttonOn}>
                 <LinearGradient colors={['#0D509D', '#57BA47']} style={{ width : '100%', height : '100%', opacity : 0.8, borderRadius  : 20, justifyContent : "center"}}>
                     <Text className='text-white text-xl font-bold text-center'>Other Amount...</Text>
                 </LinearGradient>
             </Pressable>
        </View>


         <View>
            <YoutubePlayer
                height={layoutHeight / 4}
                width={layout * 0.98}
                webViewStyle={{ borderRadius : 20, marginLeft : '2%', marginTop : 8, backgroundColor : "#ededed" }}
                play={playing}
                videoId={'pTKXtYdCg9c'}
                onChangeState={onStateChange}
            />
        </View>
  */
}