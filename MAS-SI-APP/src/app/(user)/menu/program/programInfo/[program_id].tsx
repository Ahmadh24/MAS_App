import { View, Text, ScrollView, Image, Pressable, Dimensions, Linking, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { Program } from '@/src/types'
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

export default function ProgramInfoPage() {
  const params = useLocalSearchParams<{ program_id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  
  const [program, setProgram] = useState<Program | null>(null)
  const [speakerString, setSpeakerString] = useState('')
  const [loading, setLoading] = useState(true)
  const [programInNotifications, setProgramInNotifications] = useState(false)
  const [programInPrograms, setProgramInPrograms] = useState(false)

  const programId = params.program_id

  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      if (!programId) return
      
      try {
        const { data, error } = await supabase
          .from('programs')
          .select('*')
          .eq('program_id', programId)
          .single()
        
        if (!mounted) return
        
        if (data && !error) {
          setProgram(data)
          
          // Fetch speaker names
          const speakerArray = Array.isArray(data.program_speaker) 
            ? data.program_speaker 
            : (data.program_speaker ? [data.program_speaker] : [])
          
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
              .from('added_notifications_programs')
              .select('*')
              .eq('user_id', session.user.id)
              .eq('program_id', programId)
              .maybeSingle()
            if (mounted) setProgramInNotifications(!!notifData)
            
            const { data: progData } = await supabase
              .from('added_programs')
              .select('*')
              .eq('user_id', session.user.id)
              .eq('program_id', programId)
              .maybeSingle()
            if (mounted) setProgramInPrograms(!!progData)
          }
        }
      } catch (err) {
        console.log('Error fetching program:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    fetchData()
    
    return () => { mounted = false }
  }, [programId])

  const handleNotificationPress = async () => {
    if (!session?.user.id || !program || !programId) return
    
    try {
      if (programInNotifications) {
        await supabase
          .from('added_notifications_programs')
          .delete()
          .eq('user_id', session.user.id)
          .eq('program_id', programId)
        setProgramInNotifications(false)
      } else {
        await supabase
          .from('added_notifications_programs')
          .insert({
            user_id: session.user.id,
            program_id: programId,
            has_lectures: program.has_lectures
          })
        setProgramInNotifications(true)
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err) {
      console.log('Error toggling notification:', err)
    }
  }

  const handleAddToProgramsPress = async () => {
    if (!session?.user.id || !programId) return
    
    try {
      if (programInPrograms) {
        await supabase
          .from('added_programs')
          .delete()
          .eq('user_id', session.user.id)
          .eq('program_id', programId)
        setProgramInPrograms(false)
      } else {
        await supabase
          .from('added_programs')
          .insert({
            user_id: session.user.id,
            program_id: programId
          })
        setProgramInPrograms(true)
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err) {
      console.log('Error toggling program:', err)
    }
  }

  const isOngoing = program && isBefore(new Date(), new Date(program.program_end_date || ''))

  const getDaysDisplay = () => {
    if (!program?.program_days) return null
    const days = Array.isArray(program.program_days) ? program.program_days : [program.program_days]
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
        
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>Program Details</Text>
        
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {isOngoing && (
            <Pressable
              onPress={handleNotificationPress}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: programInNotifications ? '#0D509D' : '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons 
                name={programInNotifications ? "notifications" : "notifications-outline"} 
                size={18} 
                color={programInNotifications ? "#FFFFFF" : "#374151"} 
              />
            </Pressable>
          )}
          <Pressable
            onPress={handleAddToProgramsPress}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: programInPrograms ? '#0D509D' : '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons 
              name={programInPrograms ? "bookmark" : "bookmark-outline"} 
              size={18} 
              color={programInPrograms ? "#FFFFFF" : "#374151"} 
            />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#0D509D" />
        </View>
      ) : (
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {program?.program_img && (
            <Image
              source={{ uri: program.program_img }}
              style={{ width: SCREEN_WIDTH, height: 180 }}
              resizeMode="cover"
            />
          )}

          <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 }}>
              {program?.program_name || 'Program'}
            </Text>
            
            {speakerString ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#E8F0FE',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}>
                  <Ionicons name="person" size={14} color="#0D509D" />
                </View>
                <Text style={{ fontSize: 15, color: '#0D509D', fontWeight: '600' }}>
                  {speakerString}
                </Text>
              </View>
            ) : null}
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {program?.program_start_time && (
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
                    {formatTime(program.program_start_time)}
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
              About this Program
            </Text>
            <Text style={{ fontSize: 15, color: '#4A5568', lineHeight: 24 }}>
              {program?.program_desc || 'No description available.'}
            </Text>
          </View>
        </ScrollView>
      )}

      {program?.program_is_paid && program?.paid_link && (
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
            onPress={() => Linking.openURL(program.paid_link || '')}
            style={{
              backgroundColor: '#0D509D',
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
