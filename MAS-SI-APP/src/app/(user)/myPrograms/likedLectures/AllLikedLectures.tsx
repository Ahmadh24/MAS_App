import React, { useState, useEffect } from 'react'
import { View, StyleSheet, StatusBar, useWindowDimensions } from 'react-native'
import { Stack } from 'expo-router'
import { TabView } from 'react-native-tab-view'
import { LinearGradient } from 'expo-linear-gradient'
import Animated from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useLikedLectures } from './hooks/useLikedLectures'
import { useAnimatedCounters } from './hooks/useAnimatedCounters'
import { NewHeroSection } from './components/NewHeroSection'
import { NewTabBar } from './components/NewTabBar'
import { ProgramLectureList, EventLectureList, LikedProgramsList } from './components/LectureList'
import { LoadingScreen } from './components/LoadingScreen'
import { COLORS, GRADIENTS, TAB_ROUTES, ANIMATION_CONFIG } from './constants'
const AllLikedLectures = () => {
  const layout = useWindowDimensions()
  const [index, setIndex] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const {
    likedLecture,
    likedEventLecture,
    likedPrograms,
    loading,
    refreshAll,
  } = useLikedLectures()

  const programCount = likedLecture?.length || 0
  const eventCount = likedEventLecture?.length || 0
  const savedCount = likedPrograms?.length || 0
  const totalCount = programCount + eventCount + savedCount

  const {
    displayProgramCount,
    displayEventCount,
    displayTotalCount,
    programCountStyle,
    eventCountStyle,
    totalCountStyle,
  } = useAnimatedCounters(programCount, eventCount, totalCount)

  const handleRefresh = async () => {
    setRefreshing(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await refreshAll()
    setTimeout(() => setRefreshing(false), 500)
  }

  const renderScene = ({ route }: any) => {
    switch (route.key) {
      case 'first':
        return (
          <ProgramLectureList
            likedLecture={likedLecture}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )
      case 'second':
        return (
          <EventLectureList
            likedEventLecture={likedEventLecture}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )
      case 'third':
        return (
          <LikedProgramsList
            likedPrograms={likedPrograms}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Stack.Screen
        options={{
          title: '',
          headerBackTitleVisible: false,
          headerTintColor: COLORS.primary,
          headerStyle: { backgroundColor: 'transparent' },
          headerTransparent: true,
          headerShadowVisible: false,
        }}
      />
      <StatusBar barStyle="dark-content" />

      <NewHeroSection
        totalCount={totalCount}
        programCount={programCount}
        eventCount={eventCount}
        displayTotalCount={displayTotalCount}
        displayProgramCount={displayProgramCount}
        displayEventCount={displayEventCount}
      />

      <View style={styles.tabViewContainer}>
    <TabView
          navigationState={{ index, routes: TAB_ROUTES }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
          renderTabBar={(props) => <NewTabBar {...props} />}
          style={styles.tabView}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabViewContainer: {
    backgroundColor: COLORS.background.white,
    flex: 1,
    zIndex: 2,
  },
  tabView: {
    flex: 1,
  },
})
export default AllLikedLectures