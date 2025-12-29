import { View, Text, ScrollView, FlatList, Pressable, RefreshControl, Modal } from 'react-native'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import { EventsType, Program } from '@/src/types'
import { Stack, useRouter } from 'expo-router'
import { Icon } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LiquidGlassView, isLiquidGlassSupported } from '@/src/lib/liquidGlass'
import FlyerImageComponent from '@/src/components/FlyerImageComponent'
import EventImageComponent from '@/src/components/EventImageComponent'

const UpcomingEvents = () => {
  const router = useRouter()
  const [upcoming, setUpcoming] = useState<Program[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<EventsType[]>([])
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const GetUpcomingEvents = async () => {
    setRefreshing(true)
    const date = new Date()
    const isoString = date.toISOString();
    const { data: programs, error } = await supabase.from('programs').select('*').gte('program_end_date', isoString)
    const { data: events, error: eventsError } = await supabase.from('events').select('*').gte('event_end_date', isoString)

    if (programs) {
      setUpcoming(programs)
    }
    if (events) {
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
    <View className='bg-white flex-1'>
      <Stack.Screen 
        options={{ 
          title: 'Upcoming Events',
          headerTitleAlign: 'center',
          headerBackVisible: true,
          headerRight: () => (
            isLiquidGlassSupported ? (
              <LiquidGlassView 
                style={{ 
                  marginRight: 4,
                  borderRadius: 10,
                }}
                interactive
                effect="clear"
              >
                <Pressable 
                  style={{ 
                    flexDirection: 'row',
                    alignItems: 'center', 
                    paddingHorizontal: 6,
                    paddingVertical: 3,
                    gap: 2,
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: '500' }}>
                    {selectedDay || 'All Days'}
                  </Text>
                  <Ionicons name="chevron-down" size={10} color="white" />
                </Pressable>
              </LiquidGlassView>
            ) : (
              <Pressable 
                style={{ 
                  marginRight: 4,
                  flexDirection: 'row',
                  alignItems: 'center', 
                  paddingHorizontal: 6,
                  paddingVertical: 3,
                  gap: 2,
                  borderRadius: 10,
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={{ color: 'white', fontSize: 10, fontWeight: '500' }}>
                  {selectedDay || 'All Days'}
                </Text>
                <Ionicons name="chevron-down" size={10} color="white" />
              </Pressable>
            )
          ),
        }}
      />

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
            className="rounded-2xl overflow-hidden"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 10,
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              maxWidth: 140,
              alignSelf: 'flex-end',
              marginRight: 8,
              marginTop: 100,
              maxHeight: 250,
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator={true}
              style={{ maxHeight: 250 }}
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
          contentContainerStyle={{ paddingBottom: 100, paddingRight: 16, paddingTop: 8 }}
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
                  renderItem={({ item, index }) => (
                    <FlyerImageComponent item={item} key={item.program_id} />
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16 }}
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
                  renderItem={({ item, index }) => (
                    <FlyerImageComponent item={item} key={item.program_id} />
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16 }}
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
                  renderItem={({ item, index }) => (
                    <EventImageComponent item={item} key={item.event_id} />
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16 }}
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
                  renderItem={({ item, index }) => (
                    <EventImageComponent item={item} key={item.event_id} />
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
            selectedDayPace.length === 0 && (
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
  )
}

export default UpcomingEvents

