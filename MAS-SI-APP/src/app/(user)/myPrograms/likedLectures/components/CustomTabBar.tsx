import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Animated, { FadeInDown, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { COLORS, ANIMATION_CONFIG } from '../constants'

interface CustomTabBarProps {
  navigationState: {
    index: number
    routes: Array<{ key: string; title: string }>
  }
  jumpTo: (key: string) => void
  programCount: number
  eventCount: number
  [key: string]: any // Allow any other props from TabView
}

export const CustomTabBar: React.FC<CustomTabBarProps> = ({
  navigationState,
  jumpTo,
  programCount,
  eventCount,
  ...rest // Accept any other props but don't use them
}) => {
  const tabScale = useSharedValue(1)

  const handleTabPress = (routeKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    tabScale.value = withSpring(0.95, { damping: 15 }, () => {
      tabScale.value = withSpring(1, { damping: 15 })
    })
    jumpTo(routeKey)
  }

  const tabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tabScale.value }],
  }))

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {navigationState.routes.map((route, i) => {
          const isActive = i === navigationState.index
          const count = i === 0 ? programCount : eventCount

          return (
            <Animated.View
              key={route.key}
              entering={FadeInDown.delay(i * 100).springify()}
              style={tabAnimatedStyle}
            >
              <Pressable
                onPress={() => handleTabPress(route.key)}
                style={({ pressed }) => [
                  styles.tab,
                  isActive && styles.tabActive,
                  pressed && styles.tabPressed,
                ]}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {route.title}
                </Text>
                {count > 0 && (
                  <Animated.View
                    entering={FadeInDown.delay(150).springify()}
                    style={[styles.badge, isActive && styles.badgeActive]}
                  >
                    <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                      {count}
                    </Text>
                  </Animated.View>
                )}
              </Pressable>
            </Animated.View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.gray,
    borderRadius: 16,
    padding: 6,
    shadowColor: COLORS.shadow.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  tabPressed: {
    opacity: 0.7,
  },
  tabActive: {
    backgroundColor: COLORS.background.white,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.secondary,
    letterSpacing: 0.1,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: COLORS.primary,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text.tertiary,
    letterSpacing: 0.2,
  },
  badgeTextActive: {
    color: '#fff',
  },
})

