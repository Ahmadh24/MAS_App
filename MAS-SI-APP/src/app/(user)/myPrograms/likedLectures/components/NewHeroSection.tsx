import React from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { Heart } from 'lucide-react-native'
import { COLORS, ANIMATION_CONFIG } from '../constants'

interface NewHeroSectionProps {
  totalCount: number
  programCount: number
  eventCount: number
  displayTotalCount: number
  displayProgramCount: number
  displayEventCount: number
}

export const NewHeroSection: React.FC<NewHeroSectionProps> = ({
  totalCount,
  programCount,
  eventCount,
  displayTotalCount,
  displayProgramCount,
  displayEventCount,
}) => {
  return (
    <Animated.View
      entering={FadeInUp.delay(ANIMATION_CONFIG.delays.hero).springify()}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Favorite Lectures</Text>
        <Text style={styles.subtitle}>Lectures you've saved for reflection and return</Text>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summarySection}>
          <Heart color={COLORS.primary} size={20} fill={COLORS.primary} />
          <Text style={styles.savedLabel}>Saved</Text>
          <Text style={styles.savedCount}>{displayTotalCount} Total</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.summarySection}>
          <Text style={styles.countNumber}>{displayTotalCount}</Text>
          <Text style={styles.countLabel}>Total</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.summarySection}>
          <Text style={styles.countNumber}>{displayProgramCount}</Text>
          <Text style={styles.countLabel}>Lectures</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.summarySection}>
          <Text style={styles.countNumber}>{displayEventCount}</Text>
          <Text style={styles.countLabel}>Events</Text>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
    paddingBottom: 24,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summarySection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 4,
  },
  savedCount: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  countNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  countLabel: {
    fontSize: 11,
    color: COLORS.text.secondary,
  },
})

