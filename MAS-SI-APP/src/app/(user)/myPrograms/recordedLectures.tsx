import { View, Text, ScrollView, StatusBar, RefreshControl, ActivityIndicator, FlatList, Pressable, Dimensions, useWindowDimensions, Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native'
import React, { useEffect, useState, useRef, useMemo } from 'react'
import { Stack, useRouter, useNavigation } from 'expo-router'
import { Icon, Searchbar, Modal, Portal } from 'react-native-paper'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { supabase } from '@/src/lib/supabase'
import { Program, EventsType } from '@/src/types'
import FlyerImageComponent from '@/src/components/FlyerImageComponent'
import EventImageComponent from '@/src/components/EventImageComponent'
import DeckSwiper from 'react-native-deck-swiper'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { BlurView } from 'expo-blur'

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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
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
        <View style={{ padding: 16 }}>
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
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
        <View style={{ padding: 16 }}>
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
  const tabBarHeight = useBottomTabBarHeight()
  const router = useRouter()
  const navigation = useNavigation()
  const { width } = useWindowDimensions()
  const [programsWithLectures, setProgramsWithLectures] = useState<Program[]>([])
  const [eventsWithLectures, setEventsWithLectures] = useState<EventsType[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'programs' | 'events'>('programs')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchModalVisible, setSearchModalVisible] = useState(false)
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

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Recorded Lectures', 
          headerTintColor: 'white', 
          headerTitleStyle: { color: 'white' }, 
          headerStyle: { backgroundColor: '#214E91' },
          headerLeft: () => (
            <Pressable 
              style={{ paddingLeft: 8, paddingRight: 8, height: 44, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => {
                navigation.getParent()?.getState().index == 0 ? router.replace('/myPrograms') : router.back()
              }}
            >
              <Icon source={'chevron-left'} color='white' size={28} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable 
              style={{ paddingRight: 16, height: 44, alignItems: 'center', justifyContent: 'center', minWidth: 44 }}
              onPress={() => {
                console.log('Search button pressed')
                setSearchModalVisible(true)
              }}
            >
              <Icon source={'magnify'} color='white' size={24} />
            </Pressable>
          ),
        }}
      />
      <StatusBar barStyle="light-content" />
      {loading ? (
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : programsWithLectures.length === 0 && eventsWithLectures.length === 0 ? (
        <ScrollView 
          contentContainerStyle={{ paddingBottom: tabBarHeight + 20, paddingHorizontal: 16, paddingTop: 16 }}
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
                contentContainerStyle={{ paddingTop: 16, paddingBottom: tabBarHeight + 30 }}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              />
            ) : (
              <ScrollView 
                contentContainerStyle={{ paddingBottom: tabBarHeight + 30, paddingTop: 40, flexGrow: 1 }}
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
                contentContainerStyle={{ paddingTop: 16, paddingBottom: tabBarHeight + 30 }}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              />
            ) : (
              <ScrollView 
                contentContainerStyle={{ paddingBottom: tabBarHeight + 30, paddingTop: 40, flexGrow: 1 }}
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

      {/* Search Modal */}
      <Portal>
        <Modal
          visible={searchModalVisible}
          onDismiss={() => {
            console.log('Modal dismissed')
            setSearchModalVisible(false)
          }}
          contentContainerStyle={{
            backgroundColor: 'white',
            padding: 24,
            margin: 20,
            borderRadius: 24,
            maxHeight: '85%',
            minHeight: 200,
          }}
          style={{ 
            justifyContent: 'flex-start',
            paddingTop: Platform.OS === 'ios' ? 60 : 40,
          }}
          dismissable
          dismissableBackButton
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
          >
            <ScrollView 
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <Searchbar
                placeholder="Search programs and events..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={{
                  backgroundColor: '#F3F4F6',
                  borderRadius: 12,
                  elevation: 0,
                  marginBottom: 16,
                }}
                inputStyle={{ color: '#1F2937', fontSize: 15 }}
                iconColor="#6B7280"
                placeholderTextColor="#9CA3AF"
                autoFocus
              />

              {searchQuery.trim() && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 15, color: '#6B7280', fontWeight: '500' }}>
                    {activeTab === 'programs' 
                      ? `Found ${filteredPrograms.length} program${filteredPrograms.length !== 1 ? 's' : ''}`
                      : `Found ${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''}`}
                  </Text>
                </View>
              )}

              <Pressable
                onPress={() => {
                  setSearchQuery('')
                  setSearchModalVisible(false)
                }}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  backgroundColor: '#F3F4F6',
                  borderRadius: 12,
                  alignItems: 'center',
                  marginTop: 8,
                }}
              >
                <Text style={{ color: '#214E91', fontWeight: '600', fontSize: 15 }}>
                  Clear Search
                </Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </>
  )
}

export default RecordedLectures

