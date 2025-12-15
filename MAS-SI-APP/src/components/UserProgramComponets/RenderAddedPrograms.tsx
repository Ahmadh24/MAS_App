import { Text, View, Pressable, Alert, Button, StyleSheet, Image } from 'react-native'
import {Program} from "@/src/types"
import React, { useState, useRef, useEffect } from 'react'
import { Link, router } from 'expo-router';
import  Swipeable, { SwipeableProps }  from 'react-native-gesture-handler/Swipeable';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { supabase } from "@/src/lib/supabase";
import { useAuth } from '@/src/providers/AuthProvider'; 
import * as Haptics from "expo-haptics"
import { ActivityIndicator } from 'react-native-paper';
import { LayoutInfo } from '@/src/components/HeroTransitionModal';

type ProgramsListProgramProps = {
    program_id: string,
}

interface RenderAddedProgramsProps {
  programInfo: Program;
  onHeroPress?: (program: Program, layout: LayoutInfo) => void;
}

export default function RenderAddedPrograms({ programInfo, onHeroPress }: RenderAddedProgramsProps) {
    const imageRef = useRef<View>(null);

    const handlePress = () => {
      if (onHeroPress && imageRef.current) {
        imageRef.current.measureInWindow((x, y, width, height) => {
          onHeroPress(programInfo, { x, y, width, height });
        });
      } else {
        // Fallback to normal navigation
        router.push(`/myPrograms/notifications/ClassesAndLectures/${programInfo?.program_id}`);
      }
    };

    // If hero transition is enabled, use custom press handler
    if (onHeroPress) {
      return (
        <View style={{ justifyContent: "center", alignItems: "center", marginHorizontal: 8 }}>
          <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
            <View ref={imageRef} collapsable={false}>
              <Image 
                source={programInfo?.program_img ? { uri: programInfo.program_img } : require("@/assets/images/MASHomeLogo.png")} 
                style={{ width: 170, height: 170, borderRadius: 8 }}
              />
            </View>
            <View className='flex-col w-[170] h-[40] flex-shrink'>
              <Text className='text-black font-bold' numberOfLines={1}>{programInfo?.program_name}</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    // Default behavior with Link navigation
    return(
        <View style={{ justifyContent: "center", alignItems: "center", marginHorizontal: 8 }} className=''>
        <Link href={`/myPrograms/notifications/ClassesAndLectures/${programInfo?.program_id}`} asChild>
            <TouchableOpacity>
              <Image 
                source={programInfo?.program_img ? { uri: programInfo.program_img } : require("@/assets/images/MASHomeLogo.png")} 
                style={{ width: 170, height: 170, borderRadius: 8 }}
              />
              <View className='flex-col w-[170] h-[40] flex-shrink'>
                  <Text className='text-black font-bold' numberOfLines={1}>{programInfo?.program_name}</Text>
              </View>
            </TouchableOpacity>
        </Link>
    </View>
    )
}

const styles = StyleSheet.create({
    dot: {
      width: 4,
      height: 4,
      borderRadius: 5,
      backgroundColor: '#bbb',
      margin: 5,
    },
    activeDot: {
      backgroundColor: '#000',
    },
  });