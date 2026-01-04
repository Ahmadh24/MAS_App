import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { COLORS } from '../constants'

interface NewTabBarProps {
  navigationState: {
    index: number
    routes: Array<{ key: string; title: string }>
  }
  jumpTo: (key: string) => void
  [key: string]: any
}

export const NewTabBar: React.FC<NewTabBarProps> = ({
  navigationState,
  jumpTo,
  ...rest
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {navigationState.routes.map((route, i) => {
          const isActive = i === navigationState.index

          return (
            <Pressable
              key={route.key}
              onPress={() => jumpTo(route.key)}
              style={styles.tab}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {route.title}
              </Text>
              {isActive && <View style={styles.underline} />}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
  },
})

