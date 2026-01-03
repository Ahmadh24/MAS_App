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
import { LinearGradient } from 'expo-linear-gradient';

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
            <LinearGradient
              colors={['#87CEEB', '#214E91', '#2A2A2A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBorder}
            >
              <View ref={imageRef} collapsable={false} style={styles.imageContainer}>
                <Image 
                  source={programInfo?.program_img ? { uri: programInfo.program_img } : require("@/assets/images/MASHomeLogo.png")} 
                  style={styles.image}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    // Default behavior with Link navigation
    return(
        <View style={{ justifyContent: "center", alignItems: "center", marginHorizontal: 8 }} className=''>
        <Link href={`/myPrograms/notifications/ClassesAndLectures/${programInfo?.program_id}`} asChild>
            <TouchableOpacity>
              <LinearGradient
                colors={['#87CEEB', '#214E91', '#2A2A2A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBorder}
              >
                <View style={styles.imageContainer}>
                  <Image 
                    source={programInfo?.program_img ? { uri: programInfo.program_img } : require("@/assets/images/MASHomeLogo.png")} 
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
