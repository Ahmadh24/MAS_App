import { View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { Program } from '../../types'
import { Link, router } from "expo-router"
import { useProgram } from '../../providers/programProvider'
import RenderMyLibraryProgramLectures from './RenderMyLibraryProgramLectures'
import { useAuth } from "@/src/providers/AuthProvider"
import { supabase } from '@/src/lib/supabase'
import { EventsType } from '../../types'
import { LayoutInfo } from '@/src/components/HeroTransitionModal'

type RenderEventProp = {
    event_id: string
}

interface RenderAddedEventsProps {
  eventsInfo: EventsType;
  onHeroPress?: (event: EventsType, layout: LayoutInfo) => void;
}

const RenderAddedEvents = ({ eventsInfo, onHeroPress }: RenderAddedEventsProps) => {
  const imageRef = useRef<View>(null);

  const handlePress = () => {
    if (onHeroPress && imageRef.current) {
      imageRef.current.measureInWindow((x, y, width, height) => {
        onHeroPress(eventsInfo, { x, y, width, height });
      });
    } else {
      router.push(`/myPrograms/notifications/${eventsInfo?.event_id}`);
    }
  };

  // If hero transition is enabled, use custom press handler
  if (onHeroPress) {
    return (
      <View style={{ justifyContent: "center", alignItems: "center", marginHorizontal: 8 }}>
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
          <View ref={imageRef} collapsable={false}>
            <Image 
              source={eventsInfo?.event_img ? { uri: eventsInfo?.event_img } : require("@/assets/images/MASHomeLogo.png")} 
              style={{ width: 170, height: 170, borderRadius: 8 }}
            />
          </View>
          <View className='flex-col w-[170] h-[40] flex-shrink'>
            <Text className='text-black font-bold' numberOfLines={1}>{eventsInfo?.event_name}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // Default behavior with Link navigation
  return (
    <View style={{ justifyContent: "center", alignItems: "center", marginHorizontal: 8 }} className=''>
        <Link href={`/myPrograms/notifications/${eventsInfo?.event_id}`} asChild>
            <TouchableOpacity>
              <Image 
                source={eventsInfo?.event_img ? { uri: eventsInfo?.event_img } : require("@/assets/images/MASHomeLogo.png")} 
                style={{ width: 170, height: 170, borderRadius: 8 }}
              />
              <View className='flex-col w-[170] h-[40] flex-shrink'>
                  <Text className='text-black font-bold' numberOfLines={1}>{eventsInfo?.event_name}</Text>
              </View>
            </TouchableOpacity>
        </Link>
    </View>
  )
}

export default RenderAddedEvents