import { View, Text, ScrollView, FlatList, RefreshControl, Pressable, Dimensions, TouchableOpacity, StatusBar, Animated as RNAnimated, Modal } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate, runOnJS } from 'react-native-reanimated'
import { supabase } from '@/src/lib/supabase'
import { EventsType, Program } from '@/src/types'
import { Stack, useRouter } from 'expo-router'
import { Icon } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import FlyerImageComponent from '@/src/components/FlyerImageComponent'
import EventImageComponent from '@/src/components/EventImageComponent'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const formatTimeDisplay = (timeString: string) => {
  try {
    if (timeString && timeString.includes(':')) {
      const parts = timeString.split(':')
      let hours = parseInt(parts[0])
      const minutes = parts[1]?.substring(0, 2) || '00'
      const ampm = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12 || 12
      return { time: `${hours}:${minutes}`, period: ampm }
    }
    return { time: timeString || '', period: '' }
  } catch {
    return { time: timeString || '', period: '' }
  }
}

const UpcomingEvents = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [upcoming, setUpcoming] = useState<Program[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<EventsType[]>([])
  const [refreshing, setRefreshing] = useState(false)
  
  // Calendar state
  const [calendarVisible, setCalendarVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedProgramFromCalendar, setSelectedProgramFromCalendar] = useState<Program | null>(null)
  const [selectedEventFromCalendar, setSelectedEventFromCalendar] = useState<EventsType | null>(null)
  
  // Animation
  const progress = useSharedValue(0)
  
  // Button position (top-right of header)
  const BUTTON_SIZE = 36
  const BUTTON_RIGHT = 20
  const BUTTON_TOP = insets.top + 10

  const openCalendar = () => {
    setCalendarVisible(true)
    progress.value = withTiming(1, { duration: 300 })
  }

  const closeCalendar = () => {
    progress.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) {
        runOnJS(setCalendarVisible)(false)
      }
    })
  }

  const animatedStyle = useAnimatedStyle(() => {
    // Start from button position, expand to full screen
    const scale = interpolate(progress.value, [0, 1], [0, 1])
    
    // Calculate translation to make it appear from button
    // When scale is 0, we want the "center" to be at the button position
    // Button center: x = SCREEN_WIDTH - BUTTON_RIGHT - BUTTON_SIZE/2, y = BUTTON_TOP + BUTTON_SIZE/2
    const buttonCenterX = SCREEN_WIDTH - BUTTON_RIGHT - BUTTON_SIZE / 2
    const buttonCenterY = BUTTON_TOP + BUTTON_SIZE / 2
    const screenCenterX = SCREEN_WIDTH / 2
    const screenCenterY = SCREEN_HEIGHT / 2
    
    const translateX = interpolate(progress.value, [0, 1], [buttonCenterX - screenCenterX, 0])
    const translateY = interpolate(progress.value, [0, 1], [buttonCenterY - screenCenterY, 0])
    const borderRadius = interpolate(progress.value, [0, 0.5, 1], [BUTTON_SIZE / 2, 20, 0])
    const opacity = interpolate(progress.value, [0, 0.2, 1], [0, 1, 1])

    return {
      transform: [
        { translateX },
        { translateY },
        { scale },
      ],
      borderRadius,
      opacity,
    }
  })

  // Month animation
  const fadeAnim = useRef(new RNAnimated.Value(1)).current
  const isAnimating = useRef(false)

  const animateMonthChange = (changeMonth: () => void) => {
    if (isAnimating.current) return
    isAnimating.current = true
    RNAnimated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      changeMonth()
      setTimeout(() => {
        RNAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start(() => {
          isAnimating.current = false
        })
      }, 30)
    })
  }

  const GetUpcomingEvents = async () => {
    setRefreshing(true)
    const date = new Date()
    const isoString = date.toISOString()
    const { data: programs } = await supabase.from('programs').select('*').gte('program_end_date', isoString)
    const { data: events } = await supabase.from('events').select('*').gte('event_end_date', isoString)

    if (programs) setUpcoming(programs)
    if (events) setUpcomingEvents(events)
    setRefreshing(false)
  }

  useEffect(() => {
    GetUpcomingEvents()
  }, [])

  // Calendar helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days: (number | null)[] = []
    
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    const daysInPrevMonth = getDaysInMonth(prevMonth)
    for (let i = firstDay - 1; i >= 0; i--) days.push(-(daysInPrevMonth - i))
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) days.push(-i - 100)
    
    return days
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day > 0 && day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear()
  }

  const isSelected = (day: number) => {
    return day > 0 && day === selectedDate.getDate() && 
           currentMonth.getMonth() === selectedDate.getMonth() && 
           currentMonth.getFullYear() === selectedDate.getFullYear()
  }

  const handlePrevMonth = () => animateMonthChange(() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)))
  const handleNextMonth = () => animateMonthChange(() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)))
  const handleSelectDay = (day: number) => { if (day > 0) setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)) }
  const handleTodayPress = () => { const today = new Date(); setSelectedDate(today); setCurrentMonth(today) }

  const getEventsForSelectedDate = () => {
    const dayName = DAY_NAMES[selectedDate.getDay()]
    const selectedDateStr = selectedDate.toISOString().split('T')[0]
    
    const programsOnDay = upcoming.filter(program => {
      const startDate = new Date(program.program_start_date).toISOString().split('T')[0]
      const endDate = new Date(program.program_end_date).toISOString().split('T')[0]
      return selectedDateStr >= startDate && selectedDateStr <= endDate && program.program_days.includes(dayName)
    })
    
    const eventsOnDay = upcomingEvents.filter(event => {
      const startDate = new Date(event.event_start_date).toISOString().split('T')[0]
      const endDate = new Date(event.event_end_date).toISOString().split('T')[0]
      return selectedDateStr >= startDate && selectedDateStr <= endDate && event.event_days.includes(dayName)
    })
    
    return { programsOnDay, eventsOnDay }
  }

  const { programsOnDay, eventsOnDay } = getEventsForSelectedDate()
  const hasEventsOnSelectedDay = programsOnDay.length > 0 || eventsOnDay.length > 0
  const totalEventsCount = programsOnDay.length + eventsOnDay.length

  const hasEventsOnDay = (day: number) => {
    if (day <= 0) return false
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dayName = DAY_NAMES[checkDate.getDay()]
    const checkDateStr = checkDate.toISOString().split('T')[0]
    
    return upcoming.some(program => {
      const startDate = new Date(program.program_start_date).toISOString().split('T')[0]
      const endDate = new Date(program.program_end_date).toISOString().split('T')[0]
      return checkDateStr >= startDate && checkDateStr <= endDate && program.program_days.includes(dayName)
    }) || upcomingEvents.some(event => {
      const startDate = new Date(event.event_start_date).toISOString().split('T')[0]
      const endDate = new Date(event.event_end_date).toISOString().split('T')[0]
      return checkDateStr >= startDate && checkDateStr <= endDate && event.event_days.includes(dayName)
    })
  }

  const kidsPrograms = upcoming.filter(p => p.is_kids == true)
  const regularPrograms = upcoming.filter(p => p.is_kids == false)
  const events = upcomingEvents.filter(e => e.pace == false)
  const paceEvents = upcomingEvents.filter(e => e.pace == true)

  return (
    <View className='bg-white flex-1'>
      <Stack.Screen 
        options={{ 
          title: 'Upcoming Events',
          headerTitleAlign: 'center',
          headerBackVisible: true,
          headerRight: () => (
            <Pressable 
              style={{ 
                marginRight: 2,
                marginTop: -4,
                width: 36,
                height: 36,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={openCalendar}
            >
              <Ionicons name="calendar-outline" size={22} color="white" />
            </Pressable>
          ),
        }}
      />

      {/* Programs List */}
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100, paddingRight: 16, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={GetUpcomingEvents} />}
          showsVerticalScrollIndicator={false}
        >
          {kidsPrograms.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-4" style={{ paddingLeft: 8 }}>
                <View className="w-8 h-8 rounded-full mr-3 items-center justify-center" style={{ backgroundColor: '#F59E0B' }}>
                  <Icon source="star" size={18} color="#FFFFFF" />
                </View>
                <Text className="text-gray-800 font-semibold text-lg">Kids Programs</Text>
              </View>
              <View style={{ marginRight: -50 }}>
                <FlatList data={kidsPrograms} renderItem={({ item }) => <FlyerImageComponent item={item} key={item.program_id} />} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }} />
              </View>
            </View>
          )}

          {regularPrograms.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-4" style={{ paddingLeft: 8 }}>
                <View className="w-8 h-8 rounded-full mr-3 items-center justify-center" style={{ backgroundColor: '#0D509D' }}>
                  <Icon source="book-open-variant" size={18} color="#FFFFFF" />
                </View>
                <Text className="text-gray-800 font-semibold text-lg">Programs</Text>
              </View>
              <View style={{ marginRight: -50 }}>
                <FlatList data={regularPrograms} renderItem={({ item }) => <FlyerImageComponent item={item} key={item.program_id} />} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }} />
              </View>
            </View>
          )}

          {events.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-4" style={{ paddingLeft: 8 }}>
                <View className="w-8 h-8 rounded-full mr-3 items-center justify-center" style={{ backgroundColor: '#10B981' }}>
                  <Icon source="calendar-star" size={18} color="#FFFFFF" />
                </View>
                <Text className="text-gray-800 font-semibold text-lg">Events</Text>
              </View>
              <View style={{ marginRight: -50 }}>
                <FlatList data={events} renderItem={({ item }) => <EventImageComponent item={item} key={item.event_id} />} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }} />
              </View>
            </View>
          )}

          {paceEvents.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-4" style={{ paddingLeft: 8 }}>
                <View className="w-8 h-8 rounded-full mr-3 items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}>
                  <Icon source="account-group" size={18} color="#FFFFFF" />
                </View>
                <Text className="text-gray-800 font-semibold text-lg">PACE</Text>
              </View>
              <View style={{ marginRight: -50 }}>
                <FlatList data={paceEvents} renderItem={({ item }) => <EventImageComponent item={item} key={item.event_id} />} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }} />
              </View>
            </View>
          )}

          {kidsPrograms.length === 0 && regularPrograms.length === 0 && events.length === 0 && paceEvents.length === 0 && (
            <View className="items-center justify-center py-20">
              <Icon source="calendar-blank" size={64} color="#D1D5DB" />
              <Text className="text-gray-400 text-lg font-semibold mt-4">No upcoming events</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Calendar Modal - Expands from button */}
      <Modal
        visible={calendarVisible}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
        onRequestClose={closeCalendar}
      >
        <Animated.View 
          style={[
            {
              flex: 1,
              backgroundColor: '#FFFFFF',
            },
            animatedStyle
          ]}
        >
          <StatusBar barStyle="dark-content" />
          {/* Calendar Header - White themed */}
          <View style={{ backgroundColor: '#FFFFFF', paddingTop: insets.top }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}>
              <Pressable onPress={closeCalendar} hitSlop={12} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={22} color="#1F2937" />
              </Pressable>
              
              <RNAnimated.Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '600', opacity: fadeAnim }}>
                {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </RNAnimated.Text>
              
              <Pressable onPress={handleTodayPress} hitSlop={12} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: '#F3F4F6' }}>
                <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>Today</Text>
              </Pressable>
            </View>
          </View>
          
          <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} bounces={true}>
              {/* Days of Week */}
              <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                {DAYS_OF_WEEK.map((day, index) => (
                  <View key={index} style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>{day}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar Grid */}
              <RNAnimated.View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 16, opacity: fadeAnim }}>
                {[0, 1, 2, 3, 4, 5].map((weekIndex) => (
                  <View key={weekIndex} style={{ flexDirection: 'row' }}>
                    {generateCalendarDays().slice(weekIndex * 7, weekIndex * 7 + 7).map((day, dayIndex) => {
                      const isCurrentMonth = day !== null && day > 0
                      const dayNumber = day !== null ? (day > 0 ? day : (day > -100 ? Math.abs(day) : Math.abs(day) - 100)) : 0
                      const isTodayDate = isToday(day || 0)
                      const isSelectedDate = isSelected(day || 0)
                      const hasDot = isCurrentMonth && hasEventsOnDay(day || 0)
                      const cellWidth = (SCREEN_WIDTH - 24) / 7
                      
                      return (
                        <Pressable key={dayIndex} onPress={() => day !== null && handleSelectDay(day)} style={{ width: cellWidth, height: cellWidth + 8, alignItems: 'center', paddingTop: 6 }}>
                          <View style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: isSelectedDate ? '#0D509D' : 'transparent' }}>
                            <Text style={{ color: isSelectedDate ? '#FFFFFF' : isCurrentMonth ? '#1F2937' : '#D1D5DB', fontSize: 18, fontWeight: isTodayDate || isSelectedDate ? '600' : '400' }}>{dayNumber}</Text>
                          </View>
                          {hasDot && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: isSelectedDate ? '#FFFFFF' : '#0D509D', marginTop: 2 }} />}
                        </Pressable>
                      )
                    })}
                  </View>
                ))}
                
                {/* Month Navigation */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, paddingHorizontal: 60 }}>
                  <Pressable onPress={handlePrevMonth} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="chevron-back" size={22} color="#0D509D" />
                  </Pressable>
                  <Pressable onPress={handleNextMonth} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="chevron-forward" size={22} color="#0D509D" />
                  </Pressable>
                </View>
              </RNAnimated.View>

              {/* Selected Date Header */}
              <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#F8F9FA' }}>
                <Text style={{ fontSize: 20 }}>
                  <Text style={{ color: '#0D509D', fontWeight: '600' }}>{selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                  {totalEventsCount > 0 && <Text style={{ color: '#1F2937', fontWeight: '600' }}> · {totalEventsCount} {totalEventsCount === 1 ? 'Program' : 'Programs'}</Text>}
                </Text>
              </View>

              {/* Events for Selected Day */}
              <View style={{ flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 16, paddingTop: 4, paddingBottom: insets.bottom + 16 }}>
                {hasEventsOnSelectedDay ? (
                  <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, overflow: 'hidden' }}>
                    {programsOnDay.map((program, index) => {
                      const { time, period } = formatTimeDisplay(program.program_start_time)
                      const isLast = index === programsOnDay.length - 1 && eventsOnDay.length === 0
                      return (
                        <TouchableOpacity 
                          key={program.program_id} 
                          onPress={() => {
                            closeCalendar()
                            setTimeout(() => {
                              setSelectedProgramFromCalendar(program)
                            }, 350)
                          }} 
                          activeOpacity={0.6} 
                          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: '#F3F4F6' }}
                        >
                          <View style={{ width: 55, alignItems: 'center' }}>
                            <Text style={{ color: '#374151', fontSize: 17, fontWeight: '600' }}>{time}</Text>
                            <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '500' }}>{period}</Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: 16 }}>
                            <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '600', marginBottom: 5 }} numberOfLines={1}>{program.program_name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                              <View style={{ marginLeft: 6, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: program.is_kids ? 'rgba(245, 158, 11, 0.12)' : 'rgba(13, 80, 157, 0.1)', borderRadius: 8 }}>
                                <Text style={{ color: program.is_kids ? '#D97706' : '#0D509D', fontSize: 12, fontWeight: '600' }}>{program.is_kids ? 'Class' : 'Program'}</Text>
                              </View>
                            </View>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                        </TouchableOpacity>
                      )
                    })}
                    {eventsOnDay.map((event, index) => {
                      const { time, period } = formatTimeDisplay(event.event_start_time)
                      const isLast = index === eventsOnDay.length - 1
                      return (
                        <TouchableOpacity 
                          key={event.event_id} 
                          onPress={() => {
                            closeCalendar()
                            setTimeout(() => {
                              setSelectedEventFromCalendar(event)
                            }, 350)
                          }} 
                          activeOpacity={0.6} 
                          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: '#F3F4F6' }}
                        >
                          <View style={{ width: 55, alignItems: 'center' }}>
                            <Text style={{ color: '#374151', fontSize: 17, fontWeight: '600' }}>{time}</Text>
                            <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '500' }}>{period}</Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: 16 }}>
                            <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '600', marginBottom: 5 }} numberOfLines={1}>{event.event_name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                              <View style={{ marginLeft: 6, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: event.pace ? 'rgba(139, 92, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)', borderRadius: 8 }}>
                                <Text style={{ color: event.pace ? '#7C3AED' : '#059669', fontSize: 12, fontWeight: '600' }}>{event.pace ? 'PACE' : 'Event'}</Text>
                              </View>
                            </View>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <Text style={{ color: '#9CA3AF', fontSize: 15 }}>No events scheduled</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </Modal>

      {/* Program Slide-Up Modal */}
      {selectedProgramFromCalendar && (
        <FlyerImageComponent 
          key={`calendar-program-${selectedProgramFromCalendar.program_id}`}
          item={selectedProgramFromCalendar} 
          autoOpen={true}
          onModalClose={() => setSelectedProgramFromCalendar(null)}
        />
      )}

      {/* Event Slide-Up Modal */}
      {selectedEventFromCalendar && (
        <EventImageComponent 
          key={`calendar-event-${selectedEventFromCalendar.event_id}`}
          item={selectedEventFromCalendar} 
          autoOpen={true}
          onModalClose={() => setSelectedEventFromCalendar(null)}
        />
      )}
    </View>
  )
}

export default UpcomingEvents
