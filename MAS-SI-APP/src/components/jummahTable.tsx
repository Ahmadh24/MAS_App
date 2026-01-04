import { View, Text, TouchableOpacity, Dimensions, StyleSheet, ImageBackground } from 'react-native';
import React, { useRef, forwardRef, useState, useEffect } from 'react';
import { Icon } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { JummahBottomSheet, JummahBottomSheetRef } from './jummahBottomSheet';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Theme colors
const COLORS = {
  primary: '#214E91',
  accent: '#57BA47',
  gold: '#62E090',
  white: '#FFFFFF',
  lightBlue: '#E8F4FD',
  darkBlue: '#1A3A5C',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
};

type Ref = JummahBottomSheetRef;

// Jummah card data type
interface JummahCardData {
  id: number;
  time: string;
  label: string;
  subtitle?: string;
  backgroundColor: string;
  icon: string;
}

const defaultJummahCards: JummahCardData[] = [
  { 
    id: 0, 
    time: '12:15 PM', 
    label: 'Jummah 1', 
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    icon: 'mosque'
  },
  { 
    id: 1, 
    time: '1:00 PM', 
    label: 'Jummah 2', 
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    icon: 'mosque'
  },
  { 
    id: 2, 
    time: '1:45 PM', 
    label: 'Jummah 3', 
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    icon: 'mosque'
  },
  { 
    id: 3, 
    time: '3:40 PM', 
    label: 'Student Jummah', 
    subtitle: 'School days only',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    icon: 'school'
  },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface JummahCardProps {
  card: JummahCardData;
  index: number;
  onPress: () => void;
}

const JummahCard = ({ card, index, onPress }: JummahCardProps) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(400).springify()}
      style={[styles.cardWrapper, animatedStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.cardTouchable, { backgroundColor: card.backgroundColor }]}
      >
        {/* Left accent bar */}
        <View style={styles.accentBar} />
        
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Icon source={card.icon} size={28} color={COLORS.gold} />
        </View>
        
        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.timeText}>{card.time}</Text>
          <Text style={styles.labelText}>{card.label}</Text>
          {card.subtitle && (
            <Text style={styles.subtitleText}>{card.subtitle}</Text>
          )}
        </View>
        
        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <Icon source="chevron-right" size={24} color="rgba(255,255,255,0.7)" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const JummahTable = forwardRef<Ref, {}>((_, ref) => {
  const [clickedState, setClickedState] = useState(0);
  const [jummah, setJummah] = useState<any[]>([]);
  const [speakerInfo, setSpeakerInfo] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const bottomSheetRef = useRef<JummahBottomSheetRef>(null);

  const handlePresentModalPress = (index: number) => {
    setClickedState(index);
    setTimeout(() => {
      bottomSheetRef.current?.snapToIndex(0);
    }, 50);
  };

  const getJummahData = async () => {
    try {
      const { data, error } = await supabase.from('jummah').select('*').order('id', { ascending: true });
      if (data && data.length > 0) {
        setJummah(data);
        const speakers = await Promise.all(
          data?.map(async (jummah) => {
            const { data: speakerInfo, error: speakerInfoError } = await supabase
              .from('speaker_data')
              .select('*')
              .eq('speaker_id', jummah.speaker)
              .single();
            if (speakerInfo) return speakerInfo;
            return null;
          })
        );
        setSpeakerInfo(speakers);
      }
    } catch (error) {
      console.log('Error fetching jummah data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getJummahData();
    const channel = supabase
      .channel("Jummah Data")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jummah",
        },
        async (payload) => await getJummahData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Container with all content */}
      <ImageBackground 
        source={require('@/assets/images/JumaBlue.png')}
        style={styles.cardsBackgroundContainer}
        imageStyle={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          {/* Header */}
          <Animated.View 
            entering={FadeInUp.duration(500)}
            style={styles.header}
          >
            <View style={styles.headerIconContainer}>
              <Icon source="calendar-clock" size={20} color={COLORS.white} />
            </View>
            <Text style={styles.headerSubtitle}>Every Friday</Text>
          </Animated.View>

          {/* Cards Container */}
          <View style={styles.cardsContainer}>
            {defaultJummahCards.map((card, index) => (
              <JummahCard
                key={card.id}
                card={card}
                index={index}
                onPress={() => handlePresentModalPress(index)}
              />
            ))}
          </View>

          {/* Footer hint */}
          <Animated.View 
            entering={FadeInUp.delay(500).duration(400)}
            style={styles.footer}
          >
            <Icon source="information-outline" size={14} color={COLORS.white} />
            <Text style={styles.footerText}>Tap for speaker & topic details</Text>
          </Animated.View>
        </View>
      </ImageBackground>

      {/* Bottom Sheet */}
      <JummahBottomSheet
        speaker={speakerInfo[clickedState] || null}
        topic={jummah[clickedState]?.topic || defaultJummahCards[clickedState]?.label || 'Jummah Prayer'}
        desc={jummah[clickedState]?.desc || 'Join us for the blessed Friday prayer. Check back soon for more details about this week\'s topic and speaker.'}
        jummah_time={jummah[clickedState]?.prayer_time || defaultJummahCards[clickedState]?.time || ''}
        ref={bottomSheetRef}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  headerIconContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 6,
    borderRadius: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardsBackgroundContainer: {
    borderRadius: 20,
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  backgroundImage: {
    borderRadius: 20,
  },
  overlay: {
    padding: 16,
  },
  cardsContainer: {
    gap: 12,
  },
  cardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.gold,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  timeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  labelText: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: '700',
    marginTop: 2,
  },
  subtitleText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '400',
    marginTop: 2,
    fontStyle: 'italic',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '500',
  },
});
