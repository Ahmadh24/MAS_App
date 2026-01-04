import { View, Text, Image, Pressable } from 'react-native'
import React from 'react'
import { useRouter } from "expo-router";
import Animated, { FadeInLeft } from 'react-native-reanimated';
const Volunteers = () => {
  const Router = useRouter()
  return (
    <View className='justify-center'>
        <Pressable onPress={() => Router.back()}>
            <Image source={require("@/assets/images/jummahSheetBackImg.jpeg")} style={{height: 200, width: "100%", alignItems: "center"}} resizeMode='stretch' />
            <Animated.Text entering={FadeInLeft.duration(900)} className="text-black text-2xl">Hello</Animated.Text>
        </Pressable>
    </View>
  )
}

export default Volunteers