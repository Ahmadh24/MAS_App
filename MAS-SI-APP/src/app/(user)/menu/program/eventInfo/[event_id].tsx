import { View, Text, ScrollView, Image, Pressable, Dimensions, Linking, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { EventsType } from '@/src/types'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/src/providers/AuthProvider'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { isBefore } from 'date-fns'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const formatTime = (timeString: string) => {
  try {
    if (timeString && timeString.includes(':')) {
      const parts = timeString.split(':')
      let hours = parseInt(parts[0])
      const minutes = parts[1]?.substring(0, 2) || '00'
      const ampm = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12 || 12
      return `${hours}:${minutes} ${ampm}`
    }
    return timeString || ''
  } catch {
    return timeString || ''
  }
}

export default function EventInfoPage() {
  const params = useLocalSearchParams<{ event_id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  
  const [event, setEvent] = useState<EventsType | null>(null)
  const [speakerString, setSpeakerString] = useState('')
  const [loading, setLoading] = useState(true)
  const [eventInNotifications, setEventInNotifications] = useState(false)
  const [eventInPrograms, setEventInPrograms] = useState(false)

  const eventId = params.event_id

  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      if (!eventId) return
      
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('event_id', eventId)
          .single()
        
        if (!mounted) return
        
        if (data && !error) {
          setEvent(data)
          
          // Fetch speaker names
          const speakerArray = Array.isArray(data.event_speaker) 
            ? data.event_speaker 
            : (data.event_speaker ? [data.event_speaker] : [])
          
          if (speakerArray.length > 0) {
            const speakerNames: string[] = []
            for (const speaker_id of speakerArray) {
              const { data: speakerInfo } = await supabase
                .from('speaker_data')
                .select('speaker_name')
                .eq('speaker_id', speaker_id)
                .single()
              if (speakerInfo && mounted) {
                speakerNames.push(speakerInfo.speaker_name)
              }
            }
            if (mounted) setSpeakerString(speakerNames.join(' & '))
          }
          
          // Check user status
          if (session?.user.id && mounted) {
            const { data: notifData } = await supabase
              .from('program_notification_schedule')
              .select('*')
              .eq('user_id', session.user.id)
              .eq('program_event_name', data.event_name)
              .maybeSingle()
            if (mounted) setEventInNotifications(!!notifData)
            
            const { data: progData } = await supabase
              .from('user_programs')
              .select('*')
              .eq('user_id', session.user.id)
              .eq('program_event_id', eventId)
              .maybeSingle()
            if (mounted) setEventInPrograms(!!progData)
          }
        }
      } catch (err) {
        console.log('Error fetching event:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    fetchData()
    
    return () => { mounted = false }
  }, [eventId])

  const handleNotificationPress = async () => {
    if (!session?.user.id || !event || !eventId) return
    
    try {
      if (eventInNotifications) {
        await supabase
          .from('program_notification_schedule')
          .delete()
          .eq('user_id', session.user.id)
          .eq('program_event_name', event.event_name)
        setEventInNotifications(false)
      } else {
        await supabase
          .from('program_notification_schedule')
          .insert({
            user_id: session.user.id,
            program_event_name: event.event_name,
            notification_type: 'event',
            title: event.event_name
          })
        setEventInNotifications(true)
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err) {
      console.log('Error toggling notification:', err)
    }
  }

  const handleAddToEventsPress = async () => {
    if (!session?.user.id || !event || !eventId) return
    
    try {
      if (eventInPrograms) {
        await supabase
          .from('user_programs')
          .delete()
          .eq('user_id', session.user.id)
          .eq('program_event_id', eventId)
        setEventInPrograms(false)
      } else {
        await supabase
          .from('user_programs')
          .insert({
            user_id: session.user.id,
            program_event_id: eventId,
            program_event_name: event.event_name,
            program_event_type: 'event'
          })
        setEventInPrograms(true)
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err) {
      console.log('Error toggling event:', err)
    }
  }

  const isOngoing = event && isBefore(new Date(), new Date(event.event_end_date || ''))
  const isPace = event?.pace
  const accentColor = isPace ? '#7C3AED' : '#059669'

  const getDaysDisplay = () => {
    if (!event?.event_days) return null
    const days = Array.isArray(event.event_days) ? event.event_days : [event.event_days]
    return days.map(d => d.substring(0, 3)).join(' · ')
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />

      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
      }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#F3F4F6',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </Pressable>
        
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>Event Details</Text>
        
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {isOngoing && (
            <Pressable
              onPress={handleNotificationPress}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: eventInNotifications ? accentColor : '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons 
                name={eventInNotifications ? "notifications" : "notifications-outline"} 
                size={18} 
                color={eventInNotifications ? "#FFFFFF" : "#374151"} 
              />
            </Pressable>
          )}
          <Pressable
            onPress={handleAddToEventsPress}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: eventInPrograms ? accentColor : '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons 
              name={eventInPrograms ? "bookmark" : "bookmark-outline"} 
              size={18} 
              color={eventInPrograms ? "#FFFFFF" : "#374151"} 
            />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      ) : (
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          <View style={{ position: 'relative' }}>
            {event?.event_img && (
              <Image
                source={{ uri: event.event_img }}
                style={{ width: SCREEN_WIDTH, height: 180 }}
                resizeMode="cover"
              />
            )}
            {isPace && (
              <View style={{
                position: 'absolute',
                top: 12,
                left: 12,
                backgroundColor: '#7C3AED',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 6,
              }}>
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>PACE</Text>
              </View>
            )}
          </View>

          <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 }}>
              {event?.event_name || 'Event'}
            </Text>
            
            {speakerString ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: isPace ? '#F3E8FF' : '#E0F7FA',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}>
                  <Ionicons name="person" size={14} color={accentColor} />
                </View>
                <Text style={{ fontSize: 15, color: accentColor, fontWeight: '600' }}>
                  {speakerString}
                </Text>
              </View>
            ) : null}
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {event?.event_start_time && (
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  backgroundColor: '#F0F4F8',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                }}>
                  <Ionicons name="time-outline" size={16} color="#5A6978" />
                  <Text style={{ fontSize: 13, color: '#3A4754', marginLeft: 6, fontWeight: '600' }}>
                    {formatTime(event.event_start_time)}
                  </Text>
                </View>
              )}
              {getDaysDisplay() && (
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  backgroundColor: '#F0F4F8',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                }}>
                  <Ionicons name="calendar-outline" size={16} color="#5A6978" />
                  <Text style={{ fontSize: 13, color: '#3A4754', marginLeft: 6, fontWeight: '600' }}>
                    {getDaysDisplay()}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ height: 1, backgroundColor: '#E8ECF0', marginBottom: 20 }} />

            <Text style={{ 
              fontSize: 12, 
              fontWeight: '700', 
              color: '#8A94A6',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}>
              About this Event
            </Text>
            <Text style={{ fontSize: 15, color: '#4A5568', lineHeight: 24 }}>
              {event?.event_desc || 'No description available.'}
            </Text>
          </View>
        </ScrollView>
      )}

      {event?.is_paid && event?.paid_link && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 1,
          borderTopColor: '#E8ECF0',
        }}>
          <Pressable
            onPress={() => Linking.openURL(event.paid_link || '')}
            style={{
              backgroundColor: accentColor,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="flash" size={18} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginLeft: 6 }}>
              Register Now
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}
