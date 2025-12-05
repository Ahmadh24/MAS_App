import { View, Text, ScrollView, FlatList, Pressable, RefreshControl, Modal } from 'react-native'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import { EventsType, Program } from '@/src/types'
import { Stack, useRouter } from 'expo-router'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { Icon } from 'react-native-paper'
import { BlurView } from 'expo-blur'
import FlyerImageComponent from '@/src/components/FlyerImageComponent'
import EventImageComponent from '@/src/components/EventImageComponent'
import { LinearGradient } from 'expo-linear-gradient'
// import FadeInView from '@/src/components/FadeInView'
// import FadeOnScrollItem from '@/src/components/FadeOnScrollItem'

const UpcomingEvents = () => {
  const router = useRouter()
  const TabBarHeight = useBottomTabBarHeight()
  const [ upcoming, setUpcoming ] = useState<Program[]>([])
  const [ upcomingEvents, setUpcomingEvents ] = useState<EventsType[]>([])
  const [ programsWithLectures, setProgramsWithLectures ] = useState<Program[]>([])
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  
  // Scroll positions for each carousel (removed - no longer needed for fade effects)
  // const [kidsScrollX, setKidsScrollX] = useState(0);
  // const [programsScrollX, setProgramsScrollX] = useState(0);
  // const [eventsScrollX, setEventsScrollX] = useState(0);
  // const [paceScrollX, setPaceScrollX] = useState(0);
  
  const GetUpcomingEvents = async () => {
    setRefreshing(true)
    const date = new Date()
    const isoString = date.toISOString();
    const { data : programs , error } = await supabase.from('programs').select('*').gte('program_end_date', isoString)
    const { data : events , error : eventsError } = await supabase.from('events').select('*').gte('event_end_date', isoString)
    // Get all programs with recorded lectures (both past and upcoming)
    const { data : allProgramsWithLectures , error : lecturesError } = await supabase.from('programs').select('*').eq('has_lectures', true)
    
    // Filter programs to only include those with YouTube video links
    if( allProgramsWithLectures ){
        const programsWithYouTubeLectures = []
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
    
    if( programs ){
        setUpcoming(programs)
    } 
    if( events ){
        setUpcomingEvents(events)
    }
    setRefreshing(false)
  }

  useEffect(() => {
    GetUpcomingEvents()
  }, [])

  // Get programs for selected day (or all days if no day selected)
  const selectedDayPrograms = selectedDay 
    ? upcoming.filter(programs => programs.program_days.includes(selectedDay))
    : upcoming
  const selectedDayKidsPrograms = selectedDayPrograms.filter(programs => programs.is_kids == true)
  const selectedDayRegularPrograms = selectedDayPrograms.filter(programs => programs.is_kids == false)
  const selectedDayEvents = selectedDay
    ? upcomingEvents.filter(events => events.event_days.includes(selectedDay) && events.pace == false)
    : upcomingEvents.filter(events => events.pace == false)
  const selectedDayPace = selectedDay
    ? upcomingEvents.filter(events => events.event_days.includes(selectedDay) && events.pace == true)
    : upcomingEvents.filter(events => events.pace == true)

  return (
    <View className='bg-[#548EBE] flex-1'>
      <View className="bg-white flex-1" style={{borderTopLeftRadius: 40, borderTopRightRadius: 40 }}>
        <Stack.Screen options={{ 
            headerStyle : { backgroundColor : '#548EBE' },
            headerTintColor : 'white',
            headerShown: false
        }} />
        
        {/* Header with Back Button, Title, and Category Filter */}
        <View className="flex-row items-center justify-between px-4 pt-16 pb-4" style={{ backgroundColor: '#548EBE' }}>
          <BlurView intensity={20} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <Pressable 
              onPress={() => router.back()}
              style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon source="chevron-left" size={20} color="white" />
            </Pressable>
          </BlurView>
          
          <Text className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>
            Upcoming Events
          </Text>
          
          <BlurView intensity={20} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <Pressable
              onPress={() => setShowCategoryModal(true)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 4 }}
            >
              <Text className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                {selectedDay || 'All Days'}
              </Text>
              <Icon source="chevron-down" size={16} color="white" />
            </Pressable>
          </BlurView>
        </View>

        {/* Category Modal/Dropdown */}
        <Modal
          visible={showCategoryModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <Pressable 
            className="flex-1 bg-black/10"
            onPress={() => setShowCategoryModal(false)}
          >
            <BlurView
              intensity={40}
              tint="light"
              className="rounded-2xl mx-4 overflow-hidden"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                maxWidth: 180,
                alignSelf: 'flex-end',
                marginRight: 16,
                marginTop: 100,
                maxHeight: 200,
              }}
            >
              <ScrollView 
                showsVerticalScrollIndicator={true}
                style={{ maxHeight: 200 }}
                nestedScrollEnabled={true}
              >
                <View className="p-3">
                  <Pressable
                    onPress={() => {
                      setSelectedDay('');
                      setShowCategoryModal(false);
                    }}
                    className="flex-row items-center justify-between py-2 px-2"
                  >
                    <Text className="text-sm font-medium" style={{ color: '#1F2937' }}>
                      All Days
                    </Text>
                    {selectedDay === '' && (
                      <Icon source="check" size={18} color="#214E91" />
                    )}
                  </Pressable>
                  
                  {days.map((day) => (
                    <Pressable
                      key={day}
                      onPress={() => {
                        setSelectedDay(day);
                        setShowCategoryModal(false);
                      }}
                      className="flex-row items-center justify-between py-2 px-2 border-t"
                      style={{ borderTopColor: 'rgba(243, 244, 246, 0.5)' }}
                    >
                      <Text className="text-sm font-medium" style={{ color: '#1F2937' }}>
                        {day}
                      </Text>
                      {selectedDay === day && (
                        <Icon source="check" size={18} color="#214E91" />
                      )}
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </BlurView>
          </Pressable>
        </Modal>

        {/* Programs List Below */}
        <View style={{ position: 'relative', flex: 1 }}>
          <ScrollView 
            contentContainerStyle={{ paddingBottom: TabBarHeight + 30, paddingRight: 16, paddingTop: 8 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={GetUpcomingEvents} />}
            showsVerticalScrollIndicator={false}
          >
          {selectedDayKidsPrograms.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-4" style={{ paddingLeft: 8 }}>
                <View className="w-8 h-8 rounded-full mr-3 items-center justify-center" style={{ backgroundColor: '#F59E0B' }}>
                  <Icon source="star" size={18} color="#FFFFFF" />
                </View>
                <Text className="text-gray-800 font-semibold text-lg">Kids Programs</Text>
              </View>
              <View style={{ marginRight: -50 }}>
                <FlatList 
                  data={selectedDayKidsPrograms}
                  renderItem={({item, index}) => (
                    <FlyerImageComponent item={item} key={item.program_id} />
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16 }}
                  // onScroll={(event) => {
                  //   setKidsScrollX(event.nativeEvent.contentOffset.x);
                  // }}
                  // scrollEventThrottle={16}
                />
              </View>
            </View>
          )}

          {selectedDayRegularPrograms.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-4" style={{ paddingLeft: 8 }}>
                <View className="w-8 h-8 rounded-full mr-3 items-center justify-center" style={{ backgroundColor: '#0D509D' }}>
                  <Icon source="book-open-variant" size={18} color="#FFFFFF" />
                </View>
                <Text className="text-gray-800 font-semibold text-lg">Programs</Text>
              </View>
              <View style={{ marginRight: -50 }}>
                <FlatList 
                  data={selectedDayRegularPrograms}
                  renderItem={({item, index}) => (
                    <FlyerImageComponent item={item} key={item.program_id} />
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16 }}
                  // onScroll={(event) => {
                  //   setProgramsScrollX(event.nativeEvent.contentOffset.x);
                  // }}
                  // scrollEventThrottle={16}
                />
              </View>
            </View>
          )}

          {selectedDayEvents.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-4" style={{ paddingLeft: 8 }}>
                <View className="w-8 h-8 rounded-full mr-3 items-center justify-center" style={{ backgroundColor: '#10B981' }}>
                  <Icon source="calendar-star" size={18} color="#FFFFFF" />
                </View>
                <Text className="text-gray-800 font-semibold text-lg">Events</Text>
              </View>
              <View style={{ marginRight: -50 }}>
                <FlatList 
                  data={selectedDayEvents}
                  renderItem={({item, index}) => (
                    <EventImageComponent item={item} key={item.event_id} />
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16 }}
                  // onScroll={(event) => {
                  //   setEventsScrollX(event.nativeEvent.contentOffset.x);
                  // }}
                  // scrollEventThrottle={16}
                />
              </View>
            </View>
          )}

          {selectedDayPace.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-4" style={{ paddingLeft: 8 }}>
                <View className="w-8 h-8 rounded-full mr-3 items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}>
                  <Icon source="account-group" size={18} color="#FFFFFF" />
                </View>
                <Text className="text-gray-800 font-semibold text-lg">PACE</Text>
              </View>
              <View style={{ marginRight: -50 }}>
                <FlatList 
                  data={selectedDayPace}
                  renderItem={({item, index}) => (
                    <EventImageComponent item={item} key={item.event_id} />
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16 }}
                  // onScroll={(event) => {
                  //   setPaceScrollX(event.nativeEvent.contentOffset.x);
                  // }}
                  // scrollEventThrottle={16}
                />
              </View>
            </View>
          )}

          {programsWithLectures.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-4" style={{ paddingLeft: 8 }}>
                <View className="w-8 h-8 rounded-full mr-3 items-center justify-center" style={{ backgroundColor: '#EF4444' }}>
                  <Icon source="play-circle" size={18} color="#FFFFFF" />
                </View>
                <Text className="text-gray-800 font-semibold text-lg">Recorded Lectures</Text>
              </View>
              <View style={{ marginRight: -50 }}>
                <FlatList 
                  data={programsWithLectures}
                  renderItem={({item, index}) => (
                    <FlyerImageComponent item={item} key={item.program_id} />
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16 }}
                />
              </View>
            </View>
          )}

          {selectedDayKidsPrograms.length === 0 && 
           selectedDayRegularPrograms.length === 0 && 
           selectedDayEvents.length === 0 && 
           selectedDayPace.length === 0 && 
           programsWithLectures.length === 0 && (
            <View className="items-center justify-center py-20">
              <Icon source="calendar-blank" size={64} color="#D1D5DB" />
              <Text className="text-gray-400 text-lg font-semibold mt-4">No programs scheduled</Text>
              {selectedDay && (
                <Text className="text-gray-400 text-sm mt-2">for {selectedDay}</Text>
              )}
            </View>
          )}
          </ScrollView>
        </View>
      </View>
   </View>
  )
}

export default UpcomingEvents