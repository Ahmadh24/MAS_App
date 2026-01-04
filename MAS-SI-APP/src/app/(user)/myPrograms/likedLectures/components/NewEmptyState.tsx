import React from 'react'
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { Bookmark } from 'lucide-react-native'
import { COLORS, ANIMATION_CONFIG, GRADIENTS } from '../constants'
import { useRouter } from 'expo-router'

interface NewEmptyStateProps {
  onExplorePress?: () => void
}

export const NewEmptyState: React.FC<NewEmptyStateProps> = ({ onExplorePress }) => {
  const router = useRouter()

  const handleExplorePress = () => {
    if (onExplorePress) {
      onExplorePress()
    } else {
      router.push('/(user)/menu')
    }
  }

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInUp.delay(ANIMATION_CONFIG.delays.empty[0]).springify()}
        style={styles.illustrationContainer}
      >
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['rgba(33, 78, 145, 0.15)', 'rgba(33, 78, 145, 0.08)', 'rgba(33, 78, 145, 0.05)']}
            style={styles.iconGradient}
          >
            <Bookmark color={COLORS.primary} size={52} fill={COLORS.primary} strokeWidth={2} />
          </LinearGradient>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(ANIMATION_CONFIG.delays.empty[1]).springify()}
        style={styles.textContainer}
      >
        <Text style={styles.title}>No favorites yet</Text>
        <Text style={styles.subtitle}>Save lectures that resonate with your heart.</Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(ANIMATION_CONFIG.delays.empty[1] + 100).springify()}
      >
        <Pressable style={styles.exploreButton} onPress={handleExplorePress}>
          <Text style={styles.exploreButtonText}>Explore Lectures</Text>
        </Pressable>

        <Pressable
          style={styles.helpLink}
          onPress={() => {
            // Handle help link press
          }}
        >
          <Text style={styles.helpLinkText}>How favorites work</Text>
        </Pressable>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(33, 78, 145, 0.12)',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
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
  },
  exploreButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 16,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helpLink: {
    alignItems: 'center',
  },
  helpLinkText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    fontWeight: '400',
  },
})

