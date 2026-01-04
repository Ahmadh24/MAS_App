import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { Program } from '../../types'
import { Link, router } from "expo-router"
import { useProgram } from '../../providers/programProvider'
import RenderMyLibraryProgramLectures from './RenderMyLibraryProgramLectures'
import { useAuth } from "@/src/providers/AuthProvider"
import { supabase } from '@/src/lib/supabase'
import { EventsType } from '../../types'
import { LayoutInfo } from '@/src/components/HeroTransitionModal'
import { LinearGradient } from 'expo-linear-gradient'

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
          <LinearGradient
            colors={['#87CEEB', '#214E91', '#2A2A2A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <View ref={imageRef} collapsable={false} style={styles.imageContainer}>
              <Image 
                source={eventsInfo?.event_img ? { uri: eventsInfo?.event_img } : require("@/assets/images/MASHomeLogo.png")} 
                style={styles.image}
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // Default behavior with Link navigation
  return (
    <View style={{ justifyContent: "center", alignItems: "center", marginHorizontal: 8 }} className=''>
        <Link href={`/myPrograms/notifications/${eventsInfo?.event_id}`} asChild>
            <TouchableOpacity>
              <LinearGradient
                colors={['#87CEEB', '#214E91', '#2A2A2A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBorder}
              >
                <View style={styles.imageContainer}>
                  <Image 
                    source={eventsInfo?.event_img ? { uri: eventsInfo?.event_img } : require("@/assets/images/MASHomeLogo.png")} 
                    style={styles.image}
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
        </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  gradientBorder: {
    padding: 3,
    borderRadius: 12,
  },
  imageContainer: {
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  image: {
    width: 164,
    height: 164,
    borderRadius: 9,
  },
});

export default RenderAddedEvents
