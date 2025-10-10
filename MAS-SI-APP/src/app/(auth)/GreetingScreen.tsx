import { View, Text, StatusBar, Image, Dimensions, ImageBackground, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import Animated, { clamp, Easing, ReduceMotion, useAnimatedStyle, useFrameCallback, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { Link, Stack } from 'expo-router'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { Icon } from 'react-native-paper'
import { supabase } from '@/src/lib/supabase'

const BlinkingIcon = () => {
  const blink = useSharedValue(0.4)
  const blinkAnimation = useAnimatedStyle(() => ({
    opacity : blink.value
  }))
  useEffect(() => {
    blink.value = withRepeat(
      withTiming(blink.value == 0.4 ? 1 : 0.4, { duration: 1000 }),
      -1,
      true
    )
  }) 

 return(
    <Animated.View style={[blinkAnimation, { width : 80, justifyContent : 'center', alignItems : 'center' }]}>
      <Icon  source={'fast-forward'} size={20}/>
    </Animated.View>
 )

}

const GreetingScreen = () => {
    const { height, width } = Dimensions.get('window')
    const logoAnime = useSharedValue(0)
    const logoBounce = useSharedValue(-200)
    const guestSwipeTranslateX = useSharedValue(0)
    const leftBorderWidth = useSharedValue(1)
    const prevTranslationX = useSharedValue(0)
    const prevLeftBorderWidth = useSharedValue(0)
    const maxTranslateX = (width * .7) - 80 
    const swipedToEnd = useSharedValue<boolean>(false)

    const swipeTextOpacity = useAnimatedStyle(() => ({
      opacity: guestSwipeTranslateX.value > 70 ? 0 : 1,
    }));
    const forTextOpacity = useAnimatedStyle(() => ({
      opacity: guestSwipeTranslateX.value > 100 ? 0 : 1,
    }));
    const guestTextOpacity = useAnimatedStyle(() => ({
      opacity: guestSwipeTranslateX.value > 150 ? 0 : 1,
    }));
    const accessTextOpacity = useAnimatedStyle(() => ({
      opacity: guestSwipeTranslateX.value > 200 ? 0 : 1,
    }));

    
    const guestSwipeAnimation = useAnimatedStyle(() => {
        return{
        transform: [
            { translateX: guestSwipeTranslateX.value },
          ]
        }
    })
    const setGuestSwipeBack = () => {
        const minTranslate = -(width * .7) + 275
        guestSwipeTranslateX.value = withTiming(minTranslate, { duration : 800 })
        leftBorderWidth.value = 0
    }
    const coverText = useAnimatedStyle(() => {
      return{
        opacity : leftBorderWidth.value
      }
    })

    const pan = Gesture.Pan()
    .minDistance(1)
    .onStart(() => {
      prevTranslationX.value = guestSwipeTranslateX.value;
    })
    .onUpdate((event) => {
      const maxTranslateX = width * .7;
      guestSwipeTranslateX.value = clamp(
        prevTranslationX.value + event.translationX,
        -maxTranslateX + 275,
        maxTranslateX - 80
      );
    })
    .onEnd(() => onSwipe())
    .runOnJS(true)

    const logoMountAnimeStyle = useAnimatedStyle(() => {
        return {
        opacity : logoAnime.value,
        transform: [{translateY : logoBounce.value}]
        }
    })
    const logoMountAnimeFunc = () => {
        logoBounce.value = withTiming(15, {
          duration: 2000,
          easing: Easing.elastic(1.3),
          reduceMotion: ReduceMotion.System,
        })
  
        logoAnime.value = withTiming(1, {duration: 2000})
      }
    const guestSignIn = async () => {
      const { data, error } = await supabase.auth.signInAnonymously()
      if( error ){
          console.log( error )
        }
    }
    const onFrameCallback = useFrameCallback((frameInfo) => {
        if( guestSwipeTranslateX.value == maxTranslateX ){
            swipedToEnd.value = true
        }
      })
      useEffect(() => {
        logoMountAnimeFunc()
      }, [])
     const onSwipe = () => {
        if( swipedToEnd.value ){
            guestSignIn()
        }else{
            setGuestSwipeBack()
        }
     }
  return (
    <View className='bg-white h-[100%]'>
      <Stack.Screen options={{ headerShown : false}} />
      <StatusBar barStyle={"dark-content"}/>
      <Animated.View className='w-[100%] h-[160] justify-center, items-center  mt-[1%]' style={[logoMountAnimeStyle]}>
        <Image source={require("@/assets/images/massiLogo.webp")} style={{width: "90%", height: "100%", objectFit: "contain"}}/>
      </Animated.View>
      <ImageBackground source={require('@/assets/images/MASGreetingScreen.png')} style={{ height : height, width : width, alignItems : 'center', alignSelf : 'center', justifyContent : 'center' }} imageStyle={{ height : height , width : width, borderRadius : 20, alignSelf : 'center', objectFit : 'cover'  }} >
        <View style={{ width : width, height : height, backgroundColor : 'rgba(255, 255, 255, 0.6)'}} className='items-center '>
            <View>
              <Image source={require('@/assets/images/MASGreetingScreen.png')} style={{height : height / 2.5, width : width * .98, borderRadius : 20 }}/>
            </View>
            <View className='bg-white p-2 flex-row items-center justify-between mt-2 h-[10%]' style={{ width : width * .95, opacity : 0.95, borderRadius : 30 }}>
                <GestureDetector gesture={pan} >
                    <Animated.View  style={[guestSwipeAnimation,{backgroundColor : 'gray', alignItems : 'center', borderRadius : 40, height : '90%', justifyContent : 'center', padding : 1}]}>
                      <BlinkingIcon />
                    </Animated.View>
                </GestureDetector>
                <Animated.View className="flex-row z-[-1]">
              <Animated.Text style={[swipeTextOpacity]} className="text-center text-gray-400">
                swipe{" "}
              </Animated.Text>
              <Animated.Text style={[forTextOpacity]} className="text-center text-gray-400">
                for{" "}
              </Animated.Text>
              <Animated.Text style={[guestTextOpacity]} className="text-center text-gray-400">
                guest{" "}
              </Animated.Text>
              <Animated.Text style={[accessTextOpacity]} className="text-center text-gray-400">
                access
              </Animated.Text>
            </Animated.View>
                <Pressable style={{backgroundColor : 'gray', height: '90%', width : 80, alignItems : 'center', borderRadius : 40, justifyContent : 'center' }} className='z-[2]' onPress={async () => await guestSignIn()}>
                    <Icon source={'arrow-right-top'} size={20}/>
                </Pressable>
            </View>
            <View style={{ width : width * .94, backgroundColor : 'rgba(255, 255, 255, 0.85)', alignSelf : 'center', borderRadius : 20, justifyContent : 'center', height : '28%' }} className='mt-1'>
                <Link href={'/SignUp'} asChild>
                  <Pressable className='bg-gray-400 p-2 w-[90%] self-center mt-2 h-[25%] justify-center' style={{ borderRadius : 50 }}>
                      <Text className='text-[#007AFF] text-center text-xl'>create an account</Text>
                  </Pressable>
                </Link>
                <Link href={'/SignIn'} asChild> 
                  <Pressable className='bg-gray-300 p-2  w-[90%] self-center h-[25%] justify-center mt-3' style={{ borderRadius : 50 }}>
                      <Text className='text-white text-center font-bold text-xl'>login</Text>
                  </Pressable>
                </Link>
                <View className='justify-center h-[30%]'>
                  <View>
                      <Text className='text-center text-gray-400'>created by AppFlowCreations</Text>
                  </View>
                </View>
            </View>
        </View>
      </ImageBackground>
    </View>
  )
}

export default GreetingScreen