import { View, Text, TouchableOpacity,  Image, useWindowDimensions, Pressable} from 'react-native'
import React, {useRef, useState}from 'react';
import { Program } from '../types';
import { Link } from 'expo-router';
import Animated, {interpolate, Extrapolation, useSharedValue, useAnimatedStyle} from "react-native-reanimated";
import { transform } from '@babel/core';
import { FlyerSkeleton } from './FlyerSkeleton';
type ProgramsCircularCarouselCardProp = {
    program : Program,
    index : number,
    listItemWidth : number,
    itemSpacer : number,
    lastIndex: number | undefined,
    scrollX : number,
    spacing : number
    disabled : boolean
}

export default function ProgramsCircularCarouselCard( {program, index, listItemWidth, scrollX, itemSpacer, spacing, lastIndex, disabled}: ProgramsCircularCarouselCardProp) {
    const {width : windowWidth} = useWindowDimensions();
    const size = useSharedValue(0.6);
    const [ imageReady, setImageReady ] = useState(false)

    const inputRange = [
      (index - 1) * listItemWidth,
      index * listItemWidth,
      (index  + 1) * listItemWidth
    ]
  
    size.value = interpolate(
      scrollX,
      inputRange,
      [0.6, 1, 0.6],
      Extrapolation.CLAMP
    )

    const cardStyle = useAnimatedStyle(() =>{
      return{
        transform : [{scaleY : size.value}]
      }
    })

  if( lastIndex == null ) {
    return
  }
  return (
    <Animated.View style={[{width: listItemWidth, marginLeft: spacing, marginRight: spacing}, cardStyle, {marginLeft : index == 0 ? itemSpacer : spacing, marginRight : index == lastIndex - 1 ? itemSpacer : spacing}]} className=''>
      <Link href={"/menu/program/programsAndEventsScreen"} asChild>
        <Pressable style={{justifyContent: "center" , alignItems : "center"}} disabled={!disabled}
        >
        <View style={{width: listItemWidth , height: 200, shadowColor: "black", shadowOffset: { width: 0, height: 0},shadowOpacity: 0.6, justifyContent: "center", alignItems: "center", borderRadius: 20, elevation : 8, position : 'relative' }} >
         { !imageReady && 
         <FlyerSkeleton width={listItemWidth} height={200} style={{position : 'absolute', top : 0, zIndex : 2}}/>
         }
         <Image 
          source={ program.program_img ?  { uri: program.program_img } : require("@/assets/images/MASHomeLogo.png")}
          style={{width: "100%", height: "100%", resizeMode: "stretch", overflow :"hidden", borderRadius: 20}} 
          width={listItemWidth}
          height={200}
          onLoad={() => setImageReady(true)}
          onError={() => setImageReady(false)}
          /> 
        </View>
          <Text className='text-center mt-3 font-bold' numberOfLines={2} >{program.program_name}</Text>
        </Pressable>
      </Link>
    </Animated.View>
  )
}