import { View, Text, Dimensions, StatusBar, Pressable, Platform, ScrollView } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { Icon, ActivityIndicator, Checkbox } from 'react-native-paper'
import { Stack, router } from "expo-router"
import { supabase } from '@/src/lib/supabase'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withDelay,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '@/src/providers/AuthProvider'

const { width, height } = Dimensions.get('window')

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

// Generate birth years
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

// Step indicator component
const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <Animated.View
          key={index}
          style={{
            width: index === currentStep ? 32 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: index <= currentStep ? '#0F4184' : 'rgba(15, 65, 132, 0.2)',
          }}
        />
      ))}
    </View>
  )
}

// Radio button component
const RadioOption = ({ 
  selected, 
  label, 
  onPress 
}: { 
  selected: boolean
  label: string
  onPress: () => void 
}) => (
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
      {selected && (
        <View style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: '#0F4184',
        }} />
      )}
    </View>
    <Text style={{
      fontFamily: 'Poppins_500Medium',
      fontSize: 15,
      color: selected ? '#0F4184' : '#0f172a',
    }}>
      {label}
    </Text>
  </Pressable>
)

// Checkbox option component
const CheckOption = ({ 
  checked, 
  label, 
  sublabel,
  icon,
  onPress,
  compact = false,
}: { 
  checked: boolean
  label: string
  sublabel?: string
  icon?: string
  onPress: () => void
  compact?: boolean
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
    {icon && (
      <Icon 
        source={icon} 
        size={20} 
        color={checked ? '#0F4184' : 'rgba(15, 65, 132, 0.5)'} 
      />
    )}
    <View style={{ flex: 1, marginLeft: icon ? 12 : 0 }}>
      <Text style={{
        fontFamily: 'Poppins_500Medium',
        fontSize: compact ? 13 : 15,
        color: checked ? '#0F4184' : '#0f172a',
      }}>
        {label}
      </Text>
      {sublabel && (
        <Text style={{
          fontFamily: 'Poppins_400Regular',
          fontSize: 11,
          color: checked ? 'rgba(15, 65, 132, 0.7)' : 'rgba(15, 23, 42, 0.5)',
          marginTop: 2,
        }}>
          {sublabel}
        </Text>
      )}
    </View>
    <View style={{
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: checked ? '#0F4184' : 'rgba(15, 65, 132, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: checked ? '#0F4184' : 'transparent',
    }}>
      {checked && (
        <Icon source="check" size={14} color="#fff" />
      )}
    </View>
  </Pressable>
)

// Year Picker Component
const YearPicker = ({ 
  selectedYear, 
  onSelect 
}: { 
  selectedYear: string
  onSelect: (year: string) => void 
}) => {
  const scrollRef = useRef<ScrollView>(null)
  
  return (
    <View style={{
      height: 200,
      backgroundColor: 'rgba(15, 65, 132, 0.04)',
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'rgba(15, 65, 132, 0.1)',
      overflow: 'hidden',
    }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 10 }}
      >
        {birthYears.map((year) => (
          <Pressable
            key={year}
            onPress={() => onSelect(year)}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 20,
              backgroundColor: selectedYear === year ? 'rgba(15, 65, 132, 0.15)' : 'transparent',
            }}
          >
            <Text style={{
              fontFamily: selectedYear === year ? 'Poppins_600SemiBold' : 'Poppins_400Regular',
              fontSize: 16,
              color: selectedYear === year ? '#0F4184' : '#0f172a',
              textAlign: 'center',
            }}>
              {year}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

// Step content components
const StepDemographics = ({ 
  data, 
  setData 
}: { 
  data: OnboardingData
  setData: React.Dispatch<React.SetStateAction<OnboardingData>> 
}) => (
  <Animated.View entering={FadeInDown.duration(400)} style={{ flex: 1 }}>
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        fontFamily: 'Poppins_700Bold',
        fontSize: 28,
        color: '#0f172a',
        marginBottom: 8,
      }}>
        Help us serve you better
      </Text>
      <Text style={{
        fontFamily: 'Poppins_400Regular',
        fontSize: 15,
        color: 'rgba(15, 23, 42, 0.6)',
        lineHeight: 22,
      }}>
        This helps us recommend programs, events, and resources tailored specifically to your life stage and family.
      </Text>
    </View>

    {/* Birth Year */}
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 16,
        color: '#0f172a',
        marginBottom: 12,
      }}>
        Birth Year
      </Text>
      <YearPicker 
        selectedYear={data.birthYear} 
        onSelect={(year) => setData(prev => ({ ...prev, birthYear: year }))} 
      />
    </View>

    {/* Gender */}
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 16,
        color: '#0f172a',
        marginBottom: 12,
      }}>
        Gender
      </Text>
      {GENDER_OPTIONS.map((option) => (
        <RadioOption
          key={option.value}
          selected={data.gender === option.value}
          label={option.label}
          onPress={() => setData(prev => ({ ...prev, gender: option.value as any }))}
        />
      ))}
    </View>

    {/* Marital Status */}
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 16,
        color: '#0f172a',
        marginBottom: 12,
      }}>
        Marital Status
      </Text>
      {MARITAL_STATUS_OPTIONS.map((option) => (
        <RadioOption
          key={option.value}
          selected={data.maritalStatus === option.value}
          label={option.label}
          onPress={() => setData(prev => ({ ...prev, maritalStatus: option.value as any }))}
        />
      ))}
    </View>

    {/* Children's Ages */}
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 16,
        color: '#0f172a',
        marginBottom: 4,
      }}>
        Children's Ages
      </Text>
      <Text style={{
        fontFamily: 'Poppins_400Regular',
        fontSize: 13,
        color: 'rgba(15, 23, 42, 0.5)',
        marginBottom: 12,
      }}>
        (if applicable - select all that apply)
      </Text>
      {CHILDREN_AGES.map((option) => (
        <CheckOption
          key={option.value}
          checked={data.childrenAges.includes(option.value)}
          label={option.label}
          onPress={() => {
            setData(prev => ({
              ...prev,
              childrenAges: prev.childrenAges.includes(option.value)
                ? prev.childrenAges.filter(v => v !== option.value)
                : [...prev.childrenAges, option.value]
            }))
          }}
        />
      ))}
    </View>
  </Animated.View>
)

const StepAvailability = ({ 
  data, 
  setData 
}: { 
  data: OnboardingData
  setData: React.Dispatch<React.SetStateAction<OnboardingData>> 
}) => (
  <Animated.View entering={FadeInDown.duration(400)} style={{ flex: 1 }}>
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        fontFamily: 'Poppins_700Bold',
        fontSize: 28,
        color: '#0f172a',
        marginBottom: 8,
      }}>
        When can you usually attend?
      </Text>
      <Text style={{
        fontFamily: 'Poppins_400Regular',
        fontSize: 15,
        color: 'rgba(15, 23, 42, 0.6)',
        lineHeight: 22,
      }}>
        We'll prioritize showing programs that fit your schedule, so you never miss what matters most to you.
      </Text>
    </View>

    {/* Weekdays */}
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 16,
        color: '#0f172a',
        marginBottom: 12,
      }}>
        Weekdays
      </Text>
      {WEEKDAY_TIMES.map((option) => (
        <CheckOption
          key={option.value}
          checked={data.weekdayAvailability.includes(option.value)}
          label={option.label}
          sublabel={option.sublabel}
          icon={option.icon}
          onPress={() => {
            setData(prev => ({
              ...prev,
              weekdayAvailability: prev.weekdayAvailability.includes(option.value)
                ? prev.weekdayAvailability.filter(v => v !== option.value)
                : [...prev.weekdayAvailability, option.value]
            }))
          }}
        />
      ))}
    </View>

    {/* Weekends */}
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 16,
        color: '#0f172a',
        marginBottom: 12,
      }}>
        Weekends
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {WEEKEND_TIMES.map((option) => (
          <CheckOption
            key={option.value}
            checked={data.weekendAvailability.includes(option.value)}
            label={option.label}
            icon={option.icon}
            compact
            onPress={() => {
              setData(prev => ({
                ...prev,
                weekendAvailability: prev.weekendAvailability.includes(option.value)
                  ? prev.weekendAvailability.filter(v => v !== option.value)
                  : [...prev.weekendAvailability, option.value]
              }))
            }}
          />
        ))}
      </View>
    </View>

    {/* Language Preferences */}
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 16,
        color: '#0f172a',
        marginBottom: 12,
      }}>
        Prefer programs in
      </Text>
      {LANGUAGES.map((option) => (
        <CheckOption
          key={option.value}
          checked={data.languagePreferences.includes(option.value)}
          label={`${option.flag}  ${option.label}`}
          onPress={() => {
            setData(prev => ({
              ...prev,
              languagePreferences: prev.languagePreferences.includes(option.value)
                ? prev.languagePreferences.filter(v => v !== option.value)
                : [...prev.languagePreferences, option.value]
            }))
          }}
        />
      ))}
    </View>
  </Animated.View>
)

const StepNotificationIntro = ({ onContinue }: { onContinue: () => void }) => (
  <Animated.View entering={FadeInDown.duration(400)} style={{ flex: 1, justifyContent: 'center' }}>
    {/* Illustration placeholder - phone with notifications */}
    <View style={{
      alignItems: 'center',
      marginBottom: 40,
    }}>
      <View style={{
        width: 180,
        height: 320,
        backgroundColor: '#0f172a',
        borderRadius: 32,
        padding: 8,
        shadowColor: '#0F4184',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 40,
        elevation: 20,
      }}>
        <View style={{
          flex: 1,
          backgroundColor: '#fff',
          borderRadius: 24,
          padding: 16,
          overflow: 'hidden',
        }}>
          {/* Mock notification cards */}
          <Animated.View 
            entering={FadeInDown.delay(200).duration(400)}
            style={{
              backgroundColor: 'rgba(15, 65, 132, 0.1)',
              borderRadius: 12,
              padding: 12,
              marginBottom: 10,
              borderLeftWidth: 3,
              borderLeftColor: '#0F4184',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Icon source="bell" size={14} color="#0F4184" />
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: '#0F4184', marginLeft: 6 }}>
                For You
              </Text>
            </View>
            <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 11, color: '#0f172a' }}>
              Sisters' Halaqa Tomorrow
            </Text>
          </Animated.View>
          
          <Animated.View 
            entering={FadeInDown.delay(400).duration(400)}
            style={{
              backgroundColor: 'rgba(111, 166, 108, 0.15)',
              borderRadius: 12,
              padding: 12,
              marginBottom: 10,
              borderLeftWidth: 3,
              borderLeftColor: '#6FA66C',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Icon source="star" size={14} color="#6FA66C" />
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: '#6FA66C', marginLeft: 6 }}>
                Recommended
              </Text>
            </View>
            <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 11, color: '#0f172a' }}>
              Youth Group Meeting
            </Text>
          </Animated.View>
          
          <Animated.View 
            entering={FadeInDown.delay(600).duration(400)}
            style={{
              backgroundColor: 'rgba(15, 65, 132, 0.05)',
              borderRadius: 12,
              padding: 12,
            }}
          >
            <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 11, color: '#0f172a' }}>
              Fiqh Class at 7pm
            </Text>
          </Animated.View>
        </View>
      </View>
    </View>

    <Text style={{
      fontFamily: 'Poppins_700Bold',
      fontSize: 26,
      color: '#0f172a',
      textAlign: 'center',
      marginBottom: 16,
    }}>
      Get notified only about{'\n'}programs you care about
    </Text>

    <View style={{ gap: 16, marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(111, 166, 108, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        }}>
          <Icon source="bell-off-outline" size={20} color="#6FA66C" />
        </View>
        <Text style={{
          fontFamily: 'Poppins_500Medium',
          fontSize: 15,
          color: '#0f172a',
          flex: 1,
        }}>
          No more notification overload
        </Text>
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(15, 65, 132, 0.1)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        }}>
          <Icon source="account-group" size={20} color="#0F4184" />
        </View>
        <Text style={{
          fontFamily: 'Poppins_500Medium',
          fontSize: 15,
          color: '#0f172a',
          flex: 1,
        }}>
          Never miss programs for your age group
        </Text>
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(111, 166, 108, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        }}>
          <Icon source="clock-outline" size={20} color="#6FA66C" />
        </View>
        <Text style={{
          fontFamily: 'Poppins_500Medium',
          fontSize: 15,
          color: '#0f172a',
          flex: 1,
        }}>
          Set personalized reminders
        </Text>
      </View>
    </View>
  </Animated.View>
)

const StepInterests = ({ 
  data, 
  setData 
}: { 
  data: OnboardingData
  setData: React.Dispatch<React.SetStateAction<OnboardingData>> 
}) => (
  <Animated.View entering={FadeInDown.duration(400)} style={{ flex: 1 }}>
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        fontFamily: 'Poppins_700Bold',
        fontSize: 28,
        color: '#0f172a',
        marginBottom: 8,
      }}>
        Select your interests
      </Text>
      <Text style={{
        fontFamily: 'Poppins_400Regular',
        fontSize: 15,
        color: 'rgba(15, 23, 42, 0.6)',
        lineHeight: 22,
      }}>
        Choose topics and activities that matter to you. We'll highlight relevant programs and send timely reminders.
      </Text>
    </View>

    {Object.entries(INTERESTS).map(([category, options]) => (
      <View key={category} style={{ marginBottom: 24 }}>
        <Text style={{
          fontFamily: 'Poppins_600SemiBold',
          fontSize: 14,
          color: '#0F4184',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 12,
        }}>
          {category}
        </Text>
        {options.map((option) => (
          <CheckOption
            key={option.value}
            checked={data.interests.includes(option.value)}
            label={option.label}
            onPress={() => {
              setData(prev => ({
                ...prev,
                interests: prev.interests.includes(option.value)
                  ? prev.interests.filter(v => v !== option.value)
                  : [...prev.interests, option.value]
              }))
            }}
          />
        ))}
      </View>
    ))}
  </Animated.View>
)

const StepReminders = ({ 
  data, 
  setData 
}: { 
  data: OnboardingData
  setData: React.Dispatch<React.SetStateAction<OnboardingData>> 
}) => (
  <Animated.View entering={FadeInDown.duration(400)} style={{ flex: 1 }}>
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        fontFamily: 'Poppins_700Bold',
        fontSize: 28,
        color: '#0f172a',
        marginBottom: 8,
      }}>
        Customize your reminders
      </Text>
      <Text style={{
        fontFamily: 'Poppins_400Regular',
        fontSize: 15,
        color: 'rgba(15, 23, 42, 0.6)',
        lineHeight: 22,
      }}>
        Choose when you'd like to be reminded about upcoming programs.
      </Text>
    </View>

    {/* High Priority Programs */}
    <View style={{ marginBottom: 24 }}>
      <View style={{
        backgroundColor: 'rgba(15, 65, 132, 0.08)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
        borderLeftWidth: 4,
        borderLeftColor: '#0F4184',
      }}>
        <Text style={{
          fontFamily: 'Poppins_600SemiBold',
          fontSize: 15,
          color: '#0F4184',
          marginBottom: 4,
        }}>
          For HIGH PRIORITY programs
        </Text>
        <Text style={{
          fontFamily: 'Poppins_400Regular',
          fontSize: 12,
          color: 'rgba(15, 23, 42, 0.6)',
        }}>
          Programs matching all your preferences
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {HIGH_PRIORITY_REMINDERS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => {
              setData(prev => ({
                ...prev,
                highPriorityReminders: prev.highPriorityReminders.includes(option.value)
                  ? prev.highPriorityReminders.filter(v => v !== option.value)
                  : [...prev.highPriorityReminders, option.value]
              }))
            }}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 20,
              backgroundColor: data.highPriorityReminders.includes(option.value) 
                ? '#0F4184' 
                : 'rgba(15, 65, 132, 0.08)',
              borderWidth: 1,
              borderColor: data.highPriorityReminders.includes(option.value) 
                ? '#0F4184' 
                : 'rgba(15, 65, 132, 0.15)',
            }}
          >
            <Text style={{
              fontFamily: 'Poppins_500Medium',
              fontSize: 13,
              color: data.highPriorityReminders.includes(option.value) ? '#fff' : '#0f172a',
            }}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>

    {/* Other Programs */}
    <View style={{ marginBottom: 24 }}>
      <View style={{
        backgroundColor: 'rgba(111, 166, 108, 0.12)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
        borderLeftWidth: 4,
        borderLeftColor: '#6FA66C',
      }}>
        <Text style={{
          fontFamily: 'Poppins_600SemiBold',
          fontSize: 15,
          color: '#6FA66C',
          marginBottom: 4,
        }}>
          For OTHER matching programs
        </Text>
        <Text style={{
          fontFamily: 'Poppins_400Regular',
          fontSize: 12,
          color: 'rgba(15, 23, 42, 0.6)',
        }}>
          Programs partially matching your interests
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {OTHER_REMINDERS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => {
              setData(prev => ({
                ...prev,
                otherReminders: prev.otherReminders.includes(option.value)
                  ? prev.otherReminders.filter(v => v !== option.value)
                  : [...prev.otherReminders, option.value]
              }))
            }}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 20,
              backgroundColor: data.otherReminders.includes(option.value) 
                ? '#6FA66C' 
                : 'rgba(111, 166, 108, 0.12)',
              borderWidth: 1,
              borderColor: data.otherReminders.includes(option.value) 
                ? '#6FA66C' 
                : 'rgba(111, 166, 108, 0.2)',
            }}
          >
            <Text style={{
              fontFamily: 'Poppins_500Medium',
              fontSize: 13,
              color: data.otherReminders.includes(option.value) ? '#fff' : '#0f172a',
            }}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>

    {/* Quiet Hours */}
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 16,
        color: '#0f172a',
        marginBottom: 8,
      }}>
        Quiet Hours
      </Text>
      <Text style={{
        fontFamily: 'Poppins_400Regular',
        fontSize: 13,
        color: 'rgba(15, 23, 42, 0.6)',
        marginBottom: 14,
      }}>
        Don't notify me between:
      </Text>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(15, 65, 132, 0.06)',
          borderRadius: 12,
          padding: 16,
          alignItems: 'center',
          borderWidth: 2,
          borderColor: 'rgba(15, 65, 132, 0.15)',
        }}>
          <Text style={{
            fontFamily: 'Poppins_600SemiBold',
            fontSize: 18,
            color: '#0F4184',
          }}>
            10:00 PM
          </Text>
          <Text style={{
            fontFamily: 'Poppins_400Regular',
            fontSize: 12,
            color: 'rgba(15, 23, 42, 0.5)',
          }}>
            Start
          </Text>
        </View>
        <Text style={{
          fontFamily: 'Poppins_500Medium',
          fontSize: 14,
          color: 'rgba(15, 23, 42, 0.4)',
        }}>
          to
        </Text>
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(15, 65, 132, 0.06)',
          borderRadius: 12,
          padding: 16,
          alignItems: 'center',
          borderWidth: 2,
          borderColor: 'rgba(15, 65, 132, 0.15)',
        }}>
          <Text style={{
            fontFamily: 'Poppins_600SemiBold',
            fontSize: 18,
            color: '#0F4184',
          }}>
            6:00 AM
          </Text>
          <Text style={{
            fontFamily: 'Poppins_400Regular',
            fontSize: 12,
            color: 'rgba(15, 23, 42, 0.5)',
          }}>
            End
          </Text>
        </View>
      </View>
    </View>
  </Animated.View>
)

const Onboarding = () => {
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

  const totalSteps = 5
  const scrollRef = useRef<ScrollView>(null)

  const buttonScale = useSharedValue(1)
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }))

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1)
      scrollRef.current?.scrollTo({ y: 0, animated: true })
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      scrollRef.current?.scrollTo({ y: 0, animated: true })
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = async () => {
    setLoading(true)
    buttonScale.value = withTiming(0.98, { duration: 100 })

    try {
      if (session?.user) {
        // Save onboarding data to Supabase
        const { error } = await supabase
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
            onboarding_completed: true,
          })
          .eq('id', session.user.id)

        if (error) {
          console.error('Error saving onboarding data:', error)
        }
      }

      // Navigate to main app
      router.replace('/(user)/')
    } catch (error) {
      console.error('Error completing onboarding:', error)
    } finally {
      setLoading(false)
      buttonScale.value = withSpring(1)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepDemographics data={data} setData={setData} />
      case 1:
        return <StepAvailability data={data} setData={setData} />
      case 2:
        return <StepNotificationIntro onContinue={handleNext} />
      case 3:
        return <StepInterests data={data} setData={setData} />
      case 4:
        return <StepReminders data={data} setData={setData} />
      default:
        return null
    }
  }

  const getButtonText = () => {
    if (currentStep === totalSteps - 1) return "Complete Setup"
    if (currentStep === 2) return "Let's customize"
    return "Continue"
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      
      <LinearGradient
        colors={['#ffffff', '#f8fafc', '#f1f5f9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Decorative elements */}
        <View style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: 'rgba(15, 65, 132, 0.04)',
        }} />
        <View style={{
          position: 'absolute',
          bottom: -50,
          left: -50,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: 'rgba(111, 166, 108, 0.06)',
        }} />

        {/* Header with progress */}
        <View style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          paddingHorizontal: 24,
          paddingBottom: 16,
        }}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 20,
          }}>
            {currentStep > 0 ? (
              <Pressable onPress={handleBack} style={{ padding: 8, marginLeft: -8 }}>
                <Icon source="arrow-left" size={24} color="#0f172a" />
              </Pressable>
            ) : (
              <View style={{ width: 40 }} />
            )}
            
            <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
            
            <Pressable onPress={handleSkip} style={{ padding: 8, marginRight: -8 }}>
              <Text style={{
                fontFamily: 'Poppins_500Medium',
                fontSize: 14,
                color: 'rgba(15, 23, 42, 0.5)',
              }}>
                Skip
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingHorizontal: 24,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>

        {/* Bottom Button */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingBottom: Platform.OS === 'ios' ? 40 : 24,
          paddingTop: 16,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(15, 65, 132, 0.08)',
        }}>
          <Animated.View style={buttonAnimatedStyle}>
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
                shadowColor: '#0F4184',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              {loading ? (
                <ActivityIndicator color='#fff' size={22} />
              ) : (
                <>
                  <Text style={{
                    color: '#fff',
                    fontFamily: 'Poppins_600SemiBold',
                    fontSize: 17,
                    marginRight: 8,
                  }}>
                    {getButtonText()}
                  </Text>
                  <Icon source='arrow-right' size={18} color='#fff' />
                </>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  )
}

export default Onboarding

