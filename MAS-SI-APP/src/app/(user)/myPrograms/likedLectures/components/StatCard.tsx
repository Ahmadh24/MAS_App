import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { COLORS, GRADIENTS } from '../constants'
import { StatCardProps } from '../types'

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  count,
  label,
  isTotal = false,
  animatedStyle,
  displayCount,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(
      isTotal ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
    )
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isTotal && styles.cardTotal,
        pressed && styles.cardPressed,
      ]}
      onPress={handlePress}
    >
      <LinearGradient
        colors={isTotal ? GRADIENTS.statTotal : GRADIENTS.statIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.iconWrapper, isTotal && styles.iconWrapperTotal]}
      >
        <Icon
          color={isTotal ? '#fff' : COLORS.primary}
          size={22}
          strokeWidth={2}
          fill={isTotal ? '#fff' : COLORS.primary}
        />
      </LinearGradient>
      <Animated.Text style={[styles.number, isTotal && styles.numberTotal, animatedStyle]}>
        {displayCount}
      </Animated.Text>
      <Text style={[styles.label, isTotal && styles.labelTotal]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.background.white,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border.lighter,
  },
  cardTotal: {
    backgroundColor: COLORS.primary,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowOpacity: 0.15,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrapperTotal: {
    backgroundColor: 'transparent',
  },
  number: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 6,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
    minHeight: 32,
    textAlign: 'center',
  },
  numberTotal: {
    color: '#fff',
  },
  label: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '600',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  labelTotal: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
})

