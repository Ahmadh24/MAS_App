import React from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated'
import { Heart, BookOpen, Calendar } from 'lucide-react-native'
import { COLORS, ANIMATION_CONFIG } from '../constants'
import { StatCard } from './StatCard'

interface HeroSectionProps {
  programCount: number
  eventCount: number
  totalCount: number
  programCountStyle: any
  eventCountStyle: any
  totalCountStyle: any
  displayProgramCount: number
  displayEventCount: number
  displayTotalCount: number
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  programCount,
  eventCount,
  totalCount,
  programCountStyle,
  eventCountStyle,
  totalCountStyle,
  displayProgramCount,
  displayEventCount,
  displayTotalCount,
}) => {
  return (
    <Animated.View
      entering={FadeInUp.delay(ANIMATION_CONFIG.delays.hero).springify()}
      style={styles.container}
    >
      <Animated.View entering={FadeInUp.delay(ANIMATION_CONFIG.delays.heroText).springify()}>
        <Text style={styles.title}>Favorite Lectures</Text>
        <Text style={styles.subtitle}>Your curated collection of saved content</Text>
      </Animated.View>

      <View style={styles.statsContainer}>
        <Animated.View entering={FadeInDown.delay(ANIMATION_CONFIG.delays.stats[0]).springify()}>
          <StatCard
            icon={BookOpen}
            count={programCount}
            label="Program"
            animatedStyle={programCountStyle}
            displayCount={displayProgramCount}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(ANIMATION_CONFIG.delays.stats[1]).springify()}>
          <StatCard
            icon={Calendar}
            count={eventCount}
            label="Event"
            animatedStyle={eventCountStyle}
            displayCount={displayEventCount}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(ANIMATION_CONFIG.delays.stats[2]).springify()}>
          <StatCard
            icon={Heart}
            count={totalCount}
            label="Total"
            isTotal
            animatedStyle={totalCountStyle}
            displayCount={displayTotalCount}
          />
        </Animated.View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
    paddingBottom: 32,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 6,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.text.secondary,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    paddingHorizontal: 0,
  },
})

