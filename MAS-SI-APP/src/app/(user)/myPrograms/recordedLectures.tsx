import { View, Text, ScrollView, StatusBar, RefreshControl, ActivityIndicator, FlatList, Pressable, Dimensions, useWindowDimensions, Image, TextInput, Platform } from 'react-native'
import React, { useEffect, useState, useRef, useMemo } from 'react'
import { Stack, useRouter, useNavigation } from 'expo-router'
import { Icon } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/src/lib/supabase'
import { Program, EventsType } from '@/src/types'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Program Card Component
const ProgramCard = ({ item, onPress }: { item: Program, onPress: () => void }) => {
  const [imageError, setImageError] = useState(false)
  
  return (
    <Pressable 
      onPress={onPress}
      style={{ marginHorizontal: 16, marginBottom: 20 }}
    >
      <View style={{
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
      }}>
        {/* Image */}
        <View style={{ width: '100%', height: 200, backgroundColor: '#F3F4F6' }}>
          <Image
            source={(imageError || !item.program_img || item.program_img.trim() === '') 
              ? require("@/assets/images/massicliquidglassicon.png") 
              : { uri: item.program_img }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        </View>
        
        {/* Content */}
        <View style={{ 
          padding: 16, 
          borderTopWidth: 1, 
          borderTopColor: '#D1D5DB' 
        }}>
          <Text 
            className="text-xl font-bold text-gray-900 mb-2"
            numberOfLines={2}
          >
            {item.program_name}
          </Text>
          
          {item.program_desc && (
            <Text 
              className="text-sm text-gray-600 leading-5"
              numberOfLines={3}
              style={{ marginTop: 8 }}
            >
              {item.program_desc}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  )
}

// Event Card Component
const EventCard = ({ item, onPress }: { item: EventsType, onPress: () => void }) => {
  const [imageError, setImageError] = useState(false)
  
  return (
    <Pressable 
      onPress={onPress}
      style={{ marginHorizontal: 16, marginBottom: 20 }}
    >
      <View style={{
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
      }}>
        {/* Image */}
        <View style={{ width: '100%', height: 200, backgroundColor: '#F3F4F6' }}>
          <Image
            source={(imageError || !item.event_img || item.event_img.trim() === '') 
              ? require("@/assets/images/massicliquidglassicon.png") 
              : { uri: item.event_img }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        </View>
        
        {/* Content */}
        <View style={{ 
          padding: 16, 
          borderTopWidth: 1, 
          borderTopColor: '#D1D5DB' 
        }}>
          <Text 
            className="text-xl font-bold text-gray-900 mb-2"
            numberOfLines={2}
          >
            {item.event_name}
          </Text>
          
          {item.event_desc && (
            <Text 
              className="text-sm text-gray-600 leading-5"
              numberOfLines={3}
              style={{ marginTop: 8 }}
            >
              {item.event_desc}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  )
}

const RecordedLectures = () => {
  const router = useRouter()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [programsWithLectures, setProgramsWithLectures] = useState<Program[]>([])
  const [eventsWithLectures, setEventsWithLectures] = useState<EventsType[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'programs' | 'events'>('programs')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchActive, setIsSearchActive] = useState(false)
  const searchInputRef = useRef<TextInput>(null)
  const tabPosition = useSharedValue(0)

  const fetchAllLectures = async () => {
    try {
      setLoading(true)
      const date = new Date()
      const isoString = date.toISOString()
      
      // Get all programs with recorded lectures (both past and upcoming) - matching UpcomingEvents
      const { data: allProgramsWithLectures, error: lecturesError } = await supabase
        .from('programs')
        .select('*')
        .eq('has_lectures', true)
      
      // Filter programs to only include those with YouTube video links
      if (allProgramsWithLectures) {
        const programsWithYouTubeLectures: Program[] = []
        for (const program of allProgramsWithLectures) {
          const { data: programLectures } = await supabase
            .from('program_lectures')
            .select('lecture_link')
            .eq('lecture_program', program.program_id)
          
          // Check if any lecture has a YouTube link
          const hasYouTubeLink = programLectures?.some(lecture => 
            lecture.lecture_link && 
            lecture.lecture_link.trim() !== '' && 
            lecture.lecture_link !== 'N/A'
          )
          
          if (hasYouTubeLink) {
            programsWithYouTubeLectures.push(program)
          }
        }
        setProgramsWithLectures(programsWithYouTubeLectures)
      }

      // Fetch all events with lectures (both past and upcoming) for recorded lectures
      const { data: allEventsWithLectures, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('pace', false)
        .eq('has_lecture', true)

      if (!eventsError && allEventsWithLectures) {
        // Filter events to only include those with YouTube video links
        const eventsWithYouTubeLectures: EventsType[] = []
        for (const event of allEventsWithLectures) {
          const { data: eventLectures } = await supabase
            .from('events_lectures')
            .select('event_lecture_link')
            .eq('event_id', event.event_id)
          
          // Check if any lecture has a YouTube link
          const hasYouTubeLink = eventLectures?.some(lecture => 
            lecture.event_lecture_link && 
            lecture.event_lecture_link.trim() !== '' && 
            lecture.event_lecture_link !== 'N/A'
          )
          
          if (hasYouTubeLink) {
            eventsWithYouTubeLectures.push(event)
          }
        }
        setEventsWithLectures(eventsWithYouTubeLectures)
      }
    } catch (error) {
      console.error('Error fetching lectures:', error)
      setProgramsWithLectures([])
      setEventsWithLectures([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAllLectures()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    fetchAllLectures()
  }

  const handleTabChange = (tab: 'programs' | 'events') => {
    setActiveTab(tab)
    tabPosition.value = withTiming(tab === 'programs' ? 0 : 1, { duration: 200 })
  }

  useEffect(() => {
    tabPosition.value = activeTab === 'programs' ? 0 : 1
  }, [activeTab])

  const containerPadding = 32 // 16px padding on each side
  const tabWidth = (width - containerPadding) / 2

  const tabAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: tabPosition.value * tabWidth }]
    }
  })

  // Filter programs and events based on search query
  const filteredPrograms = useMemo(() => {
    if (!searchQuery.trim()) {
      return programsWithLectures
    }
    const query = searchQuery.toLowerCase().trim()
    return programsWithLectures.filter(program => 
      program.program_name?.toLowerCase().includes(query) ||
      program.program_desc?.toLowerCase().includes(query)
    )
  }, [programsWithLectures, searchQuery])

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) {
      return eventsWithLectures
    }
    const query = searchQuery.toLowerCase().trim()
    return eventsWithLectures.filter(event => 
      event.event_name?.toLowerCase().includes(query) ||
      event.event_desc?.toLowerCase().includes(query)
    )
  }, [eventsWithLectures, searchQuery])

  // Render Program Card
  const renderProgramCard = ({ item }: { item: Program }) => {
    return (
      <ProgramCard 
        item={item} 
        onPress={() => router.push(`/menu/program/${item.program_id}` as any)}
      />
    )
  }

  // Render Event Card
  const renderEventCard = ({ item }: { item: EventsType }) => {
    return (
      <EventCard 
        item={item} 
        onPress={() => router.push(`/menu/program/events/${item.event_id}` as any)}
      />
    )
  }

  const activateSearch = () => {
    setIsSearchActive(true)
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }

  const deactivateSearch = () => {
    searchInputRef.current?.blur()
    setIsSearchActive(false)
    setSearchQuery('')
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }}
      />
      <StatusBar barStyle="light-content" />
      
      {/* Custom Header with integrated search */}
      <View style={{ backgroundColor: '#214E91', paddingTop: insets.top }}>
        <View style={{ 
          height: 56, 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingHorizontal: 16,
        }}>
          {isSearchActive ? (
            // Search Mode
            <Animated.View 
              entering={FadeIn.duration(150)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
            >
              <View style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 10,
                paddingHorizontal: 12,
                height: 40,
              }}>
                <Ionicons name="search" size={18} color="rgba(255, 255, 255, 0.6)" />
                <TextInput
                  ref={searchInputRef}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  style={{
                    flex: 1,
                    color: 'white',
                    fontSize: 16,
                    marginLeft: 8,
                    paddingVertical: 0,
                  }}
                  autoFocus
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color="rgba(255, 255, 255, 0.5)" />
                  </Pressable>
                )}
              </View>
              <Pressable 
                onPress={deactivateSearch}
                style={{ paddingLeft: 12 }}
              >
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '500' }}>Cancel</Text>
              </Pressable>
            </Animated.View>
          ) : (
            // Normal Header
            <>
              <Pressable 
                onPress={() => {
                  navigation.getParent()?.getState().index == 0 ? router.replace('/myPrograms') : router.back()
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="chevron-back" size={22} color="white" />
              </Pressable>
              
              <Text style={{ 
                flex: 1,
                color: 'white', 
                fontSize: 17, 
                fontWeight: '600',
                textAlign: 'center',
              }}>
                Recorded Lectures
              </Text>
              
              <Pressable 
                onPress={activateSearch}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="search" size={18} color="white" />
              </Pressable>
            </>
          )}
        </View>
      </View>
      {loading ? (
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : programsWithLectures.length === 0 && eventsWithLectures.length === 0 ? (
        <ScrollView 
          contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16, paddingTop: 16 }}
          className="bg-white flex-1"
        >
          <View className="items-center justify-center" style={{ minHeight: 400 }}>
            <Icon source="video-off" size={64} color="#9CA3AF" />
            <Text className="text-2xl font-bold mt-4 text-center text-gray-700">No Recorded Lectures</Text>
            <Text className="text-gray-500 text-center mt-2">
              There are no programs or events with YouTube videos at this time.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View className="bg-white flex-1">
          {/* Custom Tab Bar */}
          <View className="bg-white" style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
            <View className="flex-row relative" style={{ backgroundColor: '#F3F4F6', borderRadius: 20, padding: 2 }}>
              <Animated.View 
                style={[
                  {
                    position: 'absolute',
                    backgroundColor: '#214E91',
                    borderRadius: 18,
                    height: '100%',
                    width: '50%',
                  },
                  tabAnimatedStyle
                ]}
              />
              <Pressable 
                onPress={() => handleTabChange('programs')}
                style={{ flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
              >
                <View className="flex-row items-center">
                  <Icon 
                    source="book-open-variant" 
                    size={18} 
                    color={activeTab === 'programs' ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text 
                    className="font-semibold ml-2"
                    style={{ color: activeTab === 'programs' ? '#FFFFFF' : '#6B7280', fontSize: 14 }}
                  >
                    Programs
                  </Text>
                  {filteredPrograms.length > 0 && (
                    <View style={{ 
                      marginLeft: 6, 
                      backgroundColor: activeTab === 'programs' ? 'rgba(255,255,255,0.3)' : '#D1D5DB',
                      borderRadius: 10,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      minWidth: 20,
                      alignItems: 'center'
                    }}>
                      <Text style={{ 
                        color: activeTab === 'programs' ? '#FFFFFF' : '#6B7280',
                        fontSize: 11,
                        fontWeight: 'bold'
                      }}>
                        {filteredPrograms.length}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
              <Pressable 
                onPress={() => handleTabChange('events')}
                style={{ flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
              >
                <View className="flex-row items-center">
                  <Icon 
                    source="calendar-star" 
                    size={18} 
                    color={activeTab === 'events' ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text 
                    className="font-semibold ml-2"
                    style={{ color: activeTab === 'events' ? '#FFFFFF' : '#6B7280', fontSize: 14 }}
                  >
                    Events
                  </Text>
                  {filteredEvents.length > 0 && (
                    <View style={{ 
                      marginLeft: 6, 
                      backgroundColor: activeTab === 'events' ? 'rgba(255,255,255,0.3)' : '#D1D5DB',
                      borderRadius: 10,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      minWidth: 20,
                      alignItems: 'center'
                    }}>
                      <Text style={{ 
                        color: activeTab === 'events' ? '#FFFFFF' : '#6B7280',
                        fontSize: 11,
                        fontWeight: 'bold'
                      }}>
                        {filteredEvents.length}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </View>
          </View>

          {/* Tab Content */}
          {activeTab === 'programs' ? (
            filteredPrograms.length > 0 ? (
              <FlatList 
                data={filteredPrograms}
                renderItem={renderProgramCard}
                keyExtractor={(item) => item.program_id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              />
            ) : (
              <ScrollView 
                contentContainerStyle={{ paddingBottom: 100, paddingTop: 40, flexGrow: 1 }}
                className="bg-white flex-1"
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
              >
                <View className="items-center justify-center" style={{ minHeight: 400 }}>
                  <Icon source="book-open-variant" size={64} color="#9CA3AF" />
                  <Text className="text-xl font-bold mt-4 text-center text-gray-700">
                    {searchQuery.trim() ? 'No Programs Found' : 'No Programs'}
                  </Text>
                  <Text className="text-gray-500 text-center mt-2">
                    {searchQuery.trim() 
                      ? 'Try adjusting your search terms.'
                      : 'There are no programs with YouTube videos at this time.'}
                  </Text>
                </View>
              </ScrollView>
            )
          ) : (
            filteredEvents.length > 0 ? (
              <FlatList 
                data={filteredEvents}
                renderItem={renderEventCard}
                keyExtractor={(item) => item.event_id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              />
            ) : (
              <ScrollView 
                contentContainerStyle={{ paddingBottom: 100, paddingTop: 40, flexGrow: 1 }}
                className="bg-white flex-1"
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
              >
                <View className="items-center justify-center" style={{ minHeight: 400 }}>
                  <Icon source="calendar-star" size={64} color="#9CA3AF" />
                  <Text className="text-xl font-bold mt-4 text-center text-gray-700">
                    {searchQuery.trim() ? 'No Events Found' : 'No Events'}
                  </Text>
                  <Text className="text-gray-500 text-center mt-2">
                    {searchQuery.trim() 
                      ? 'Try adjusting your search terms.'
                      : 'There are no events with YouTube videos at this time.'}
                  </Text>
                </View>
              </ScrollView>
            )
          )}
        </View>
      )}

    </>
  )
}

export default RecordedLectures

