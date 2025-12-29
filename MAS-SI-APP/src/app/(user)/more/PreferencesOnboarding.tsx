import { View, Text, Pressable, Platform, ScrollView, SafeAreaView } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { Icon, ActivityIndicator } from 'react-native-paper'
import { Stack, router } from "expo-router"
import { supabase } from '@/src/lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '@/src/providers/AuthProvider'

// Types for our onboarding data
type OnboardingData = {
  birthYear: string
  gender: 'brother' | 'sister' | 'prefer_not_to_say' | null
  maritalStatus: 'single' | 'married' | 'prefer_not_to_say' | null
  childrenAges: string[]
  weekdayAvailability: string[]
  weekendAvailability: string[]
  languagePreferences: string[]
  interests: string[]
  highPriorityReminders: string[]
  otherReminders: string[]
  quietHoursStart: string
  quietHoursEnd: string
}

// Generate birth years (1940-2015)
const birthYears = Array.from({ length: 76 }, (_, i) => (2015 - i).toString())

// Constants for options
const GENDER_OPTIONS = [
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const MARITAL_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const CHILDREN_AGES = [
  { value: '0-4', label: '0-4 years' },
  { value: '5-9', label: '5-9 years' },
  { value: '10-13', label: '10-13 years' },
  { value: '14-17', label: '14-17 years' },
  { value: '18+', label: '18+ years' },
  { value: 'none', label: 'No children' },
]

const WEEKDAY_TIMES = [
  { value: 'mornings', label: 'Mornings', sublabel: '6am - 12pm', icon: 'weather-sunny' },
  { value: 'afternoons', label: 'Afternoons', sublabel: '12pm - 5pm', icon: 'weather-partly-cloudy' },
  { value: 'evenings', label: 'Evenings', sublabel: '5pm - 9pm', icon: 'weather-sunset' },
  { value: 'nights', label: 'Nights', sublabel: 'After Isha', icon: 'moon-waning-crescent' },
]

const WEEKEND_TIMES = [
  { value: 'saturday_am', label: 'Saturday AM', icon: 'calendar-weekend' },
  { value: 'saturday_pm', label: 'Saturday PM', icon: 'calendar-weekend' },
  { value: 'sunday_am', label: 'Sunday AM', icon: 'calendar-weekend-outline' },
  { value: 'sunday_pm', label: 'Sunday PM', icon: 'calendar-weekend-outline' },
]

const LANGUAGES = [
  { value: 'english', label: 'English', flag: '🇺🇸' },
  { value: 'arabic', label: 'Arabic', flag: '🇸🇦' },
  { value: 'urdu', label: 'Urdu', flag: '🇵🇰' },
  { value: 'albanian', label: 'Albanian', flag: '🇦🇱' },
  { value: 'no_preference', label: 'No preference', flag: '🌍' },
]

const INTERESTS = {
  'Islamic Education': [
    { value: 'quran_memorization', label: 'Quran Memorization' },
    { value: 'quran_tafsir', label: 'Quran Tafsir' },
    { value: 'arabic_classes', label: 'Arabic Classes' },
    { value: 'fiqh', label: 'Fiqh/Islamic Law' },
    { value: 'seerah', label: 'Seerah/History' },
  ],
  'Community': [
    { value: 'brothers_halaqas', label: "Brothers' Halaqas" },
    { value: 'sisters_halaqas', label: "Sisters' Halaqas" },
    { value: 'convert_support', label: 'Convert Support Circle' },
    { value: 'new_moms', label: 'New Moms Group' },
    { value: 'seniors', label: 'Seniors Gathering' },
  ],
  'Youth & Children': [
    { value: 'after_school', label: 'After School Program' },
    { value: 'weekend_school', label: 'Weekend School' },
    { value: 'youth_group', label: 'Youth Group (13-17)' },
    { value: 'young_professionals', label: 'Young Professionals (18-25)' },
  ],
  'Sports & Activities': [
    { value: 'basketball', label: 'Basketball (Men/Boys)' },
    { value: 'soccer', label: 'Soccer' },
    { value: 'martial_arts', label: 'Martial Arts' },
    { value: 'swimming', label: 'Swimming' },
  ],
}

const HIGH_PRIORITY_REMINDERS = [
  { value: '1_week', label: '1 week before' },
  { value: '3_days', label: '3 days before' },
  { value: '1_day', label: '1 day before' },
  { value: 'morning_of', label: 'Morning of' },
  { value: '1_hour', label: '1 hour before' },
  { value: '30_min', label: '30 min before' },
]

const OTHER_REMINDERS = [
  { value: '1_day', label: '1 day before' },
  { value: 'morning_of', label: 'Morning of' },
]

// Radio button component
const RadioOption = ({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) => (
  <Pressable
    onPress={onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 14,
      backgroundColor: selected ? 'rgba(15, 65, 132, 0.12)' : 'rgba(15, 65, 132, 0.04)',
      borderWidth: 2,
      borderColor: selected ? '#0F4184' : 'rgba(15, 65, 132, 0.1)',
      marginBottom: 10,
    }}
  >
    <View style={{
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: selected ? '#0F4184' : 'rgba(15, 65, 132, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    }}>
      {selected && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#0F4184' }} />}
    </View>
    <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 15, color: selected ? '#0F4184' : '#0f172a' }}>
      {label}
    </Text>
  </Pressable>
)

// Checkbox option component
const CheckOption = ({ checked, label, sublabel, icon, onPress, compact = false }: { 
  checked: boolean; label: string; sublabel?: string; icon?: string; onPress: () => void; compact?: boolean 
}) => (
  <Pressable
    onPress={onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: compact ? 10 : 14,
      paddingHorizontal: compact ? 14 : 18,
      borderRadius: 14,
      backgroundColor: checked ? 'rgba(15, 65, 132, 0.12)' : 'rgba(15, 65, 132, 0.04)',
      borderWidth: 2,
      borderColor: checked ? '#0F4184' : 'rgba(15, 65, 132, 0.1)',
      marginBottom: 10,
      flex: compact ? 1 : undefined,
    }}
  >
    {icon && <Icon source={icon} size={20} color={checked ? '#0F4184' : 'rgba(15, 65, 132, 0.5)'} />}
    <View style={{ flex: 1, marginLeft: icon ? 12 : 0 }}>
      <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: compact ? 13 : 15, color: checked ? '#0F4184' : '#0f172a' }}>
        {label}
      </Text>
      {sublabel && (
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 11, color: checked ? 'rgba(15, 65, 132, 0.7)' : 'rgba(15, 23, 42, 0.5)', marginTop: 2 }}>
          {sublabel}
        </Text>
      )}
    </View>
    <View style={{
      width: 22, height: 22, borderRadius: 6, borderWidth: 2,
      borderColor: checked ? '#0F4184' : 'rgba(15, 65, 132, 0.3)',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: checked ? '#0F4184' : 'transparent',
    }}>
      {checked && <Icon source="check" size={14} color="#fff" />}
    </View>
  </Pressable>
)

const PreferencesOnboarding = () => {
  const { session } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    birthYear: '',
    gender: null,
    maritalStatus: null,
    childrenAges: [],
    weekdayAvailability: [],
    weekendAvailability: [],
    languagePreferences: [],
    interests: [],
    highPriorityReminders: ['1_day', 'morning_of'],
    otherReminders: ['morning_of'],
    quietHoursStart: '22:00',
    quietHoursEnd: '06:00',
  })

  const totalSteps = 4

  // Load existing preferences once
  useEffect(() => {
    const loadPreferences = async () => {
      if (!session?.user?.id) return
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setData({
            birthYear: profile.birth_year || '',
            gender: profile.gender || null,
            maritalStatus: profile.marital_status || null,
            childrenAges: profile.children_ages || [],
            weekdayAvailability: profile.weekday_availability || [],
            weekendAvailability: profile.weekend_availability || [],
            languagePreferences: profile.language_preferences || [],
            interests: profile.interests || [],
            highPriorityReminders: profile.high_priority_reminders || ['1_day', 'morning_of'],
            otherReminders: profile.other_reminders || ['morning_of'],
            quietHoursStart: profile.quiet_hours_start || '22:00',
            quietHoursEnd: profile.quiet_hours_end || '06:00',
          })
        }
      } catch (error) {
        console.error('Error loading preferences:', error)
      }
    }

    loadPreferences()
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }, [currentStep])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    } else {
      router.back()
    }
  }, [currentStep])

  const handleComplete = async () => {
    if (!session?.user?.id) return
    setLoading(true)

    try {
      await supabase
        .from('profiles')
        .update({
          birth_year: data.birthYear || null,
          gender: data.gender,
          marital_status: data.maritalStatus,
          children_ages: data.childrenAges,
          weekday_availability: data.weekdayAvailability,
          weekend_availability: data.weekendAvailability,
          language_preferences: data.languagePreferences,
          interests: data.interests,
          high_priority_reminders: data.highPriorityReminders,
          other_reminders: data.otherReminders,
          quiet_hours_start: data.quietHoursStart,
          quiet_hours_end: data.quietHoursEnd,
        })
        .eq('id', session.user.id)

      router.back()
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateData = useCallback((key: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleArrayItem = useCallback((key: keyof OnboardingData, value: string) => {
    setData(prev => {
      const arr = prev[key] as string[]
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
      }
    })
  }, [])

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#0f172a', marginBottom: 8 }}>
              Help us serve you better
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, color: 'rgba(15, 23, 42, 0.6)', lineHeight: 22, marginBottom: 24 }}>
              This helps us recommend programs tailored to your life stage and family.
            </Text>

            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#0f172a', marginBottom: 12 }}>Birth Year</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {birthYears.map((year) => (
                  <Pressable
                    key={year}
                    onPress={() => updateData('birthYear', year)}
                    style={{
                      paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20,
                      backgroundColor: data.birthYear === year ? '#0F4184' : 'rgba(15, 65, 132, 0.08)',
                      borderWidth: 1, borderColor: data.birthYear === year ? '#0F4184' : 'rgba(15, 65, 132, 0.15)',
                    }}
                  >
                    <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: data.birthYear === year ? '#fff' : '#0f172a' }}>
                      {year}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#0f172a', marginBottom: 12 }}>Gender</Text>
            {GENDER_OPTIONS.map((opt) => (
              <RadioOption key={opt.value} selected={data.gender === opt.value} label={opt.label} onPress={() => updateData('gender', opt.value)} />
            ))}

            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#0f172a', marginBottom: 12, marginTop: 12 }}>Marital Status</Text>
            {MARITAL_STATUS_OPTIONS.map((opt) => (
              <RadioOption key={opt.value} selected={data.maritalStatus === opt.value} label={opt.label} onPress={() => updateData('maritalStatus', opt.value)} />
            ))}

            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#0f172a', marginBottom: 12, marginTop: 12 }}>Children's Ages</Text>
            {CHILDREN_AGES.map((opt) => (
              <CheckOption key={opt.value} checked={data.childrenAges.includes(opt.value)} label={opt.label} onPress={() => toggleArrayItem('childrenAges', opt.value)} />
            ))}
          </View>
        )

      case 1:
        return (
          <View>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#0f172a', marginBottom: 8 }}>
              When can you attend?
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, color: 'rgba(15, 23, 42, 0.6)', lineHeight: 22, marginBottom: 24 }}>
              We'll prioritize programs that fit your schedule.
            </Text>

            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#0f172a', marginBottom: 12 }}>Weekdays</Text>
            {WEEKDAY_TIMES.map((opt) => (
              <CheckOption key={opt.value} checked={data.weekdayAvailability.includes(opt.value)} label={opt.label} sublabel={opt.sublabel} icon={opt.icon} onPress={() => toggleArrayItem('weekdayAvailability', opt.value)} />
            ))}

            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#0f172a', marginBottom: 12, marginTop: 12 }}>Weekends</Text>
            {WEEKEND_TIMES.map((opt) => (
              <CheckOption key={opt.value} checked={data.weekendAvailability.includes(opt.value)} label={opt.label} icon={opt.icon} onPress={() => toggleArrayItem('weekendAvailability', opt.value)} />
            ))}

            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#0f172a', marginBottom: 12, marginTop: 24 }}>Prefer programs in</Text>
            {LANGUAGES.map((opt) => (
              <CheckOption key={opt.value} checked={data.languagePreferences.includes(opt.value)} label={`${opt.flag}  ${opt.label}`} onPress={() => toggleArrayItem('languagePreferences', opt.value)} />
            ))}
          </View>
        )

      case 2:
        return (
          <View>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#0f172a', marginBottom: 8 }}>
              Select your interests
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, color: 'rgba(15, 23, 42, 0.6)', lineHeight: 22, marginBottom: 24 }}>
              Choose topics and activities that matter to you.
            </Text>

            {Object.entries(INTERESTS).map(([category, options]) => (
              <View key={category} style={{ marginBottom: 24 }}>
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#0F4184', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                  {category}
                </Text>
                {options.map((opt) => (
                  <CheckOption key={opt.value} checked={data.interests.includes(opt.value)} label={opt.label} onPress={() => toggleArrayItem('interests', opt.value)} />
                ))}
              </View>
            ))}
          </View>
        )

      case 3:
        return (
          <View>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#0f172a', marginBottom: 8 }}>
              Customize reminders
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, color: 'rgba(15, 23, 42, 0.6)', lineHeight: 22, marginBottom: 24 }}>
              Choose when you'd like to be reminded.
            </Text>

            <View style={{ backgroundColor: 'rgba(15, 65, 132, 0.08)', borderRadius: 12, padding: 14, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#0F4184' }}>
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#0F4184', marginBottom: 4 }}>HIGH PRIORITY programs</Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: 'rgba(15, 23, 42, 0.6)' }}>Matching all your preferences</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {HIGH_PRIORITY_REMINDERS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => toggleArrayItem('highPriorityReminders', opt.value)}
                  style={{
                    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20,
                    backgroundColor: data.highPriorityReminders.includes(opt.value) ? '#0F4184' : 'rgba(15, 65, 132, 0.08)',
                    borderWidth: 1, borderColor: data.highPriorityReminders.includes(opt.value) ? '#0F4184' : 'rgba(15, 65, 132, 0.15)',
                  }}
                >
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: data.highPriorityReminders.includes(opt.value) ? '#fff' : '#0f172a' }}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={{ backgroundColor: 'rgba(111, 166, 108, 0.12)', borderRadius: 12, padding: 14, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#6FA66C' }}>
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#6FA66C', marginBottom: 4 }}>OTHER programs</Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: 'rgba(15, 23, 42, 0.6)' }}>Partially matching your interests</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {OTHER_REMINDERS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => toggleArrayItem('otherReminders', opt.value)}
                  style={{
                    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20,
                    backgroundColor: data.otherReminders.includes(opt.value) ? '#6FA66C' : 'rgba(111, 166, 108, 0.12)',
                    borderWidth: 1, borderColor: data.otherReminders.includes(opt.value) ? '#6FA66C' : 'rgba(111, 166, 108, 0.2)',
                  }}
                >
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: data.otherReminders.includes(opt.value) ? '#fff' : '#0f172a' }}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )

      default:
        return null
    }
  }

  return (
    <LinearGradient colors={['#ffffff', '#f8fafc', '#f1f5f9']} style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false, presentation: 'card' }} />
      
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable onPress={handleBack} style={{ padding: 8 }}>
              <Icon source="arrow-left" size={24} color="#0f172a" />
            </Pressable>
            
            {/* Percentage */}
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#0F4184' }}>
                {Math.round(((currentStep + 1) / totalSteps) * 100)}%
              </Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 11, color: 'rgba(15, 23, 42, 0.5)' }}>
                Complete
              </Text>
            </View>
            
            {/* Skip button */}
            <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
              <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: 'rgba(15, 23, 42, 0.5)' }}>
                Skip
              </Text>
            </Pressable>
          </View>
          
          {/* Progress bar */}
          <View style={{ marginTop: 16, height: 6, backgroundColor: 'rgba(15, 65, 132, 0.1)', borderRadius: 3 }}>
            <View 
              style={{ 
                width: `${((currentStep + 1) / totalSteps) * 100}%`, 
                height: '100%', 
                backgroundColor: '#0F4184', 
                borderRadius: 3 
              }} 
            />
          </View>
          
          {/* Step indicators */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View key={i} style={{ alignItems: 'center' }}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: i <= currentStep ? '#0F4184' : 'rgba(15, 65, 132, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i < currentStep ? (
                    <Icon source="check" size={14} color="#fff" />
                  ) : (
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: i === currentStep ? '#fff' : 'rgba(15, 65, 132, 0.4)' }}>
                      {i + 1}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Content */}
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>

        {/* Bottom Button */}
        <View style={{
          paddingHorizontal: 20,
          paddingBottom: Platform.OS === 'ios' ? 30 : 20,
          paddingTop: 16,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(15, 65, 132, 0.08)',
        }}>
          <Pressable
            onPress={handleNext}
            disabled={loading}
            style={{
              backgroundColor: '#0F4184',
              paddingVertical: 16,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size={22} />
            ) : (
              <>
                <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 17, marginRight: 8 }}>
                  {currentStep === totalSteps - 1 ? 'Save Preferences' : 'Continue'}
                </Text>
                <Icon source={currentStep === totalSteps - 1 ? 'check' : 'arrow-right'} size={18} color="#fff" />
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

export default PreferencesOnboarding
