import { useState, useEffect } from 'react'
import {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated'
import { ANIMATION_CONFIG } from '../constants'

export const useAnimatedCounters = (
  programCount: number,
  eventCount: number,
  totalCount: number
) => {
  const programCountValue = useSharedValue(0)
  const eventCountValue = useSharedValue(0)
  const totalCountValue = useSharedValue(0)

  const [displayProgramCount, setDisplayProgramCount] = useState(0)
  const [displayEventCount, setDisplayEventCount] = useState(0)
  const [displayTotalCount, setDisplayTotalCount] = useState(0)

  useEffect(() => {
    programCountValue.value = withSpring(programCount, ANIMATION_CONFIG.spring)
    eventCountValue.value = withSpring(eventCount, ANIMATION_CONFIG.spring)
    totalCountValue.value = withSpring(totalCount, ANIMATION_CONFIG.spring)
  }, [programCount, eventCount, totalCount])

  useAnimatedReaction(
    () => programCountValue.value,
    (value) => {
      runOnJS(setDisplayProgramCount)(Math.round(value))
    }
  )

  useAnimatedReaction(
    () => eventCountValue.value,
    (value) => {
      runOnJS(setDisplayEventCount)(Math.round(value))
    }
  )

  useAnimatedReaction(
    () => totalCountValue.value,
    (value) => {
      runOnJS(setDisplayTotalCount)(Math.round(value))
    }
  )

  const programCountStyle = useAnimatedStyle(() => ({
    opacity: interpolate(programCountValue.value, [0, 1], [0.6, 1], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(programCountValue.value, [0, 1], [0.95, 1], Extrapolation.CLAMP) },
    ],
  }))

  const eventCountStyle = useAnimatedStyle(() => ({
    opacity: interpolate(eventCountValue.value, [0, 1], [0.6, 1], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(eventCountValue.value, [0, 1], [0.95, 1], Extrapolation.CLAMP) },
    ],
  }))

  const totalCountStyle = useAnimatedStyle(() => ({
    opacity: interpolate(totalCountValue.value, [0, 1], [0.6, 1], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(totalCountValue.value, [0, 1], [0.95, 1], Extrapolation.CLAMP) },
    ],
  }))

  return {
    displayProgramCount,
    displayEventCount,
    displayTotalCount,
    programCountStyle,
    eventCountStyle,
    totalCountStyle,
  }
}

