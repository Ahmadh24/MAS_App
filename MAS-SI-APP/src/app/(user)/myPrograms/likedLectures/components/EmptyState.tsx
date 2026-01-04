import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { COLORS, GRADIENTS, ANIMATION_CONFIG } from '../constants'

interface EmptyStateProps {
  icon: React.ComponentType<{ color: string; size: number; strokeWidth: number; fill?: string }>
  title: string
  subtitle: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, subtitle }) => {
  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInUp.delay(ANIMATION_CONFIG.delays.empty[0]).springify()}
        style={styles.iconContainer}
      >
        <LinearGradient colors={GRADIENTS.emptyIcon} style={styles.iconGradient}>
          <View style={styles.iconInner}>
            <Icon color={COLORS.primary} size={48} strokeWidth={2} fill={COLORS.primary} />
          </View>
        </LinearGradient>
      </Animated.View>
      <Animated.View 
        entering={FadeInUp.delay(ANIMATION_CONFIG.delays.empty[1]).springify()}
        style={styles.textContainer}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    marginBottom: 28,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    paddingHorizontal: 20,
  },
})

