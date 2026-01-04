import React from 'react'
import { View, FlatList, RefreshControl, StyleSheet, Text, Image, Pressable } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import RenderLikedLectures from '@/src/components/UserProgramComponets/RenderLikedLectures'
import RenderLikedEventLectures from '@/src/components/UserProgramComponets/RenderLikedEventLectures'
import { EmptyState } from './EmptyState'
import { NewEmptyState } from './NewEmptyState'
import { BookOpen, Calendar } from 'lucide-react-native'
import { COLORS } from '../constants'
import { LikedLecturesProps, LikedEventLecturesProps, LikedProgramsProps } from '../types'
import { Link } from 'expo-router'

export const ProgramLectureList: React.FC<LikedLecturesProps> = ({
  likedLecture,
  refreshing,
  onRefresh,
}) => {
  const filteredLectures = likedLecture?.filter((lecture) => lecture !== null) || []

  if (filteredLectures.length === 0) {
    return <NewEmptyState />
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredLectures}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 30).springify()}>
            <RenderLikedLectures
              lecture={item}
              index={index}
              speaker={item.lecture_speaker}
            />
          </Animated.View>
        )}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) => `program-${item.lecture_id}-${index}`}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing || false}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          ) : undefined
        }
      />
    </View>
  )
}

export const EventLectureList: React.FC<LikedEventLecturesProps> = ({
  likedEventLecture,
  refreshing,
  onRefresh,
}) => {
  const filteredLectures = likedEventLecture?.filter((lecture) => lecture !== null) || []

  if (filteredLectures.length === 0) {
    return <NewEmptyState />
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredLectures}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 30).springify()}>
            <RenderLikedEventLectures
              lecture={item}
              index={index}
              speaker={item.event_lecture_speaker}
            />
          </Animated.View>
        )}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) => `event-${item.event_lecture_id}-${index}`}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing || false}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          ) : undefined
        }
      />
    </View>
  )
}

export const LikedProgramsList: React.FC<LikedProgramsProps> = ({
  likedPrograms,
  refreshing,
  onRefresh,
}) => {
  const filteredPrograms = likedPrograms?.filter((program) => program !== null) || []

  if (filteredPrograms.length === 0) {
    return <NewEmptyState />
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredPrograms}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 30).springify()}>
            <Link href={`/menu/program/${item.program_id}` as any} asChild>
              <Pressable style={styles.programCard}>
                <Image
                  source={item.program_img ? { uri: item.program_img } : require('@/assets/images/MASHomeLogo.png')}
                  style={styles.programImage}
                />
                <View style={styles.programInfo}>
                  <Text style={styles.programName} numberOfLines={2}>{item.program_name}</Text>
                  {item.program_desc && (
                    <Text style={styles.programDesc} numberOfLines={2}>{item.program_desc}</Text>
                  )}
                </View>
              </Pressable>
            </Link>
          </Animated.View>
        )}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) => `program-${item.program_id}-${index}`}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing || false}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          ) : undefined
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.white,
  },
  content: {
    paddingBottom: 24,
    paddingTop: 8,
  },
  programCard: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: COLORS.background.white,
    borderRadius: 12,
    shadowColor: COLORS.shadow.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border.lighter,
  },
  programImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  programInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  programName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  programDesc: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
})

