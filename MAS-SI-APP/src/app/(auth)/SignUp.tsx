import { View, Text, Dimensions, StatusBar, Pressable, Platform, KeyboardAvoidingView, Image, TextInput as RNTextInput, ScrollView } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { Icon, TextInput, ActivityIndicator } from 'react-native-paper'
import { Link, Stack } from "expo-router"
import { supabase } from '@/src/lib/supabase'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as ImagePicker from 'expo-image-picker'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withDelay,
  withSequence,
  Easing,
  FadeIn,
  FadeInUp,
  FadeOutLeft,
  FadeInRight,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin'

// Configure Google Sign-In once
GoogleSignin.configure({
  iosClientId: '991344123272-nk55l8nc7dcloc56m6mmnvnkhdtjfcbf.apps.googleusercontent.com',
  webClientId: '991344123272-p3p68bb5kk77j6f36fij21t42ovhcr93.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
  offlineAccess: false,
})

const { width, height } = Dimensions.get('window')

// Step configuration
// 0: Name, 1: Username, 2: Email, 3: Phone, 4: Verify, 5: Password, 6: Photo
const TOTAL_STEPS = 7

// Password strength indicator
const PasswordStrength = ({ password }: { password: string }) => {
  const getStrength = () => {
    if (password.length === 0) return { level: 0, text: '', color: 'transparent' }
    if (password.length < 6) return { level: 1, text: 'Weak', color: '#EF4444' }
    if (password.length < 8) return { level: 2, text: 'Fair', color: '#F59E0B' }
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { level: 4, text: 'Strong', color: '#6FA66C' }
    }
    return { level: 3, text: 'Good', color: '#0F4184' }
  }

  const strength = getStrength()

  if (password.length === 0) return null

  return (
    <Animated.View 
      entering={FadeIn.duration(300)}
      style={{ marginTop: 12, paddingHorizontal: 4 }}
    >
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: level <= strength.level ? strength.color : 'rgba(15, 65, 132, 0.15)',
            }}
          />
        ))}
      </View>
      <Text style={{ color: strength.color, fontSize: 13, fontFamily: 'Poppins_500Medium' }}>
        {strength.text}
      </Text>
    </Animated.View>
  )
}

// Progress indicator
const ProgressIndicator = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 32 }}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: index < currentStep ? '#0F4184' : 'rgba(15, 65, 132, 0.15)',
          }}
        />
      ))}
    </View>
  )
}

const SignUp = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  
  // Verification code states
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [generatedCode, setGeneratedCode] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const codeInputRefs = useRef<(RNTextInput | null)[]>([])
  
  // Focus states - tracks which input field is currently focused
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Animation values
  const buttonScale = useSharedValue(1)
  
  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  // Generate and "send" verification code
  const sendVerificationCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedCode(code)
    setResendCountdown(30)
    setCodeError(false)
    setVerificationCode(['', '', '', '', '', ''])
    console.log('Verification code:', code)
    alert(`Your verification code is: ${code}`) // For demo - remove in production
  }

  // Handle code input
  const handleCodeInput = (text: string, index: number) => {
    setCodeError(false)
    const newCode = [...verificationCode]
    
    // Handle paste of full code
    if (text.length > 1) {
      const pastedCode = text.replace(/\D/g, '').slice(0, 6).split('')
      pastedCode.forEach((digit, i) => {
        if (i < 6) newCode[i] = digit
      })
      setVerificationCode(newCode)
      if (pastedCode.length === 6) {
        codeInputRefs.current[5]?.blur()
      }
      return
    }
    
    newCode[index] = text.replace(/\D/g, '')
    setVerificationCode(newCode)
    
    // Auto-focus next input
    if (text && index < 5) {
      codeInputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace
  const handleCodeKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }
  }

  // Format phone number as (XXX) XXX-XXXX
  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 10)
    let formatted = ''
    if (cleaned.length > 0) {
      formatted = '(' + cleaned.slice(0, 3)
    }
    if (cleaned.length >= 3) {
      formatted += ') ' + cleaned.slice(3, 6)
    }
    if (cleaned.length >= 6) {
      formatted += '-' + cleaned.slice(6, 10)
    }
    return formatted || cleaned
  }

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }))

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to add a profile picture.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri)
    }
  }

  const validateCurrentStep = () => {
    setError('')
    
    switch (currentStep) {
      case 0: // Name
        if (!firstName.trim()) {
          setError('Please enter your first name')
          return false
        }
        if (!lastName.trim()) {
          setError('Please enter your last name')
          return false
        }
        return true
      case 1: // Username
        if (!username.trim()) {
          setError('Please choose a username')
          return false
        }
        if (username.length < 3) {
          setError('Username must be at least 3 characters')
          return false
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          setError('Username can only contain letters, numbers, and underscores')
          return false
        }
        return true
      case 2: // Email
        if (!email.trim()) {
          setError('Please enter your email')
          return false
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
          setError('Please enter a valid email address')
          return false
        }
        return true
      case 3: // Phone
        if (phoneNumber.replace(/\D/g, '').length !== 10) {
          setError('Please enter a valid 10-digit phone number')
          return false
        }
        return true
      case 4: // Verification
        if (!verificationCode.every(digit => digit !== '')) {
          setError('Please enter the complete verification code')
          return false
        }
        // Verify the code
        const enteredCode = verificationCode.join('')
        if (enteredCode !== generatedCode) {
          setCodeError(true)
          setError('Incorrect verification code')
          return false
        }
        return true
      case 5: // Password
        if (!password) {
          setError('Please create a password')
          return false
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters')
          return false
        }
        return true
      case 6: // Photo (optional)
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (!validateCurrentStep()) {
      buttonScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1, { damping: 10 })
      )
      return
    }

    // If on phone step, send verification code before moving forward
    if (currentStep === 3) {
      sendVerificationCode()
    }

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1)
      setError('')
    } else {
      signUpWithEmail()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setError('')
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      await GoogleSignin.hasPlayServices()
      const response = await GoogleSignin.signIn()

      const idToken = (response as any).data?.idToken || (response as any).idToken
      const user = (response as any).data?.user || (response as any).user

      if (idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        })

        if (!error && data?.user) {
          const { error: ProfileError } = await supabase
            .from('profiles')
            .update({
              first_name: user?.name || user?.givenName,
              profile_email: user?.email
            })
            .eq('id', data.user.id)

          if (ProfileError) {
            console.error('Profile update error:', ProfileError)
          }
        } else {
          console.error('Supabase sign-in error:', error)
          alert(error?.message || 'Google sign-up failed')
        }
      } else {
        throw new Error('No ID token present!')
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow')
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in is in progress already')
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available or outdated')
      } else {
        alert(`Sign-up error: ${error.message || 'Unknown error'}`)
      }
    }
  }

  const handleAppleSignUp = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })

      if (credential.identityToken) {
        const { error, data: { user } } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        })

        if (!error && user) {
          await supabase.from('profiles').update({ 
            profile_email: credential.email, 
            first_name: credential.fullName?.givenName 
          }).eq('id', user.id)
        }
      } else {
        throw new Error('No identityToken.')
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        console.error('Apple sign-in error:', e)
      }
    }
  }

  async function signUpWithEmail() {
    setLoading(true)
    buttonScale.value = withTiming(0.98, { duration: 100 })

    try {
      const { data: { session, user }, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            username: username.trim().toLowerCase(),
            profile_email: email.trim(),
            phone_number: phoneNumber.trim(),
          },
        },
      })

      if (error) {
        alert(error.message)
        return
      }

      // Upload profile image if selected
      if (user && profileImage) {
        try {
          const response = await fetch(profileImage)
          const blob = await response.blob()
          const fileExt = profileImage.split('.').pop()?.toLowerCase() || 'jpg'
          const fileName = `${user.id}/profile.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('profile-images')
            .upload(fileName, blob, {
              upsert: true,
              contentType: `image/${fileExt}`,
            })

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('profile-images')
              .getPublicUrl(fileName)
            
            await supabase.from('profiles').update({
              profile_image: urlData.publicUrl
            }).eq('id', user.id)
          }
        } catch (uploadErr) {
          console.error('Error uploading profile image:', uploadErr)
        }
      }

      if (user) {
        await supabase.from('profiles').update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          username: username.trim().toLowerCase(),
          phone_number: phoneNumber.trim(),
          onboarding_completed: false,
        }).eq('id', user.id)
      }

    } catch (error: any) {
      alert(error.message || 'An error occurred during sign up')
    } finally {
      setLoading(false)
      buttonScale.value = withSpring(1)
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 0: return "What's your name?"
      case 1: return "Choose a username"
      case 2: return "What's your email?"
      case 3: return "Your phone number"
      case 4: return "Verify your number"
      case 5: return "Create a password"
      case 6: return "Add a profile photo"
      default: return ""
    }
  }

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 0: return "Let's get to know you"
      case 1: return "This is how others will find you"
      case 2: return "We'll use this to keep you updated"
      case 3: return "We'll use this to keep your account secure"
      case 4: return `Enter the 6-digit code sent to +1 ${phoneNumber}`
      case 5: return "Make it strong and memorable"
      case 6: return "Help others recognize you (optional)"
      default: return ""
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Animated.View 
            key="step-0"
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
          >
            {/* First Name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ 
                fontFamily: 'Poppins_500Medium', 
                fontSize: 14, 
                color: focusedField === 'firstName' ? '#0F4184' : '#0f172a',
                marginBottom: 8,
                marginLeft: 4,
              }}>
                First Name
              </Text>
              <View style={{
                backgroundColor: focusedField === 'firstName' ? 'rgba(15, 65, 132, 0.08)' : 'rgba(15, 65, 132, 0.06)',
                borderRadius: 16,
                borderWidth: 2,
                borderColor: focusedField === 'firstName' ? '#0F4184' : 'rgba(15, 65, 132, 0.15)',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
              }}>
                <Icon source="account-outline" size={22} color={focusedField === 'firstName' ? '#0F4184' : 'rgba(15, 65, 132, 0.5)'} />
                <TextInput
                  mode='flat'
                  value={firstName}
                  onChangeText={setFirstName}
                  onFocus={() => setFocusedField('firstName')}
                  onBlur={() => setFocusedField(null)}
                  style={{ 
                    flex: 1,
                    backgroundColor: 'transparent',
                    fontSize: 16,
                    fontFamily: 'Poppins_400Regular',
                  }}
                  placeholder="Enter your first name"
                  placeholderTextColor='rgba(15, 65, 132, 0.4)'
                  textColor='#0f172a'
                  underlineColor='transparent'
                  activeUnderlineColor='transparent'
                  autoCapitalize="words"
                  autoCorrect={false}
                  cursorColor='#0F4184'
                />
              </View>
            </View>

            {/* Last Name */}
            <View>
              <Text style={{ 
                fontFamily: 'Poppins_500Medium', 
                fontSize: 14, 
                color: focusedField === 'lastName' ? '#0F4184' : '#0f172a',
                marginBottom: 8,
                marginLeft: 4,
              }}>
                Last Name
              </Text>
              <View style={{
                backgroundColor: focusedField === 'lastName' ? 'rgba(15, 65, 132, 0.08)' : 'rgba(15, 65, 132, 0.06)',
                borderRadius: 16,
                borderWidth: 2,
                borderColor: focusedField === 'lastName' ? '#0F4184' : 'rgba(15, 65, 132, 0.15)',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
              }}>
                <Icon source="account-outline" size={22} color={focusedField === 'lastName' ? '#0F4184' : 'rgba(15, 65, 132, 0.5)'} />
                <TextInput
                  mode='flat'
                  value={lastName}
                  onChangeText={setLastName}
                  onFocus={() => setFocusedField('lastName')}
                  onBlur={() => setFocusedField(null)}
                  style={{ 
                    flex: 1,
                    backgroundColor: 'transparent',
                    fontSize: 16,
                    fontFamily: 'Poppins_400Regular',
                  }}
                  placeholder="Enter your last name"
                  placeholderTextColor='rgba(15, 65, 132, 0.4)'
                  textColor='#0f172a'
                  underlineColor='transparent'
                  activeUnderlineColor='transparent'
                  autoCapitalize="words"
                  autoCorrect={false}
                  cursorColor='#0F4184'
                />
              </View>
            </View>
          </Animated.View>
        )

      case 1:
        return (
          <Animated.View 
            key="step-1"
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
          >
            <View style={{
              backgroundColor: focusedField === 'username' ? 'rgba(15, 65, 132, 0.08)' : 'rgba(15, 65, 132, 0.06)',
              borderRadius: 16,
              borderWidth: 2,
              borderColor: focusedField === 'username' ? '#0F4184' : 'rgba(15, 65, 132, 0.15)',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
            }}>
              <Icon source="at" size={22} color={focusedField === 'username' ? '#0F4184' : 'rgba(15, 65, 132, 0.5)'} />
              <TextInput
                mode='flat'
                value={username}
                onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                style={{ 
                  flex: 1,
                  backgroundColor: 'transparent',
                  fontSize: 16,
                  fontFamily: 'Poppins_400Regular',
                }}
                placeholder="Choose a username"
                placeholderTextColor='rgba(15, 65, 132, 0.4)'
                textColor='#0f172a'
                underlineColor='transparent'
                activeUnderlineColor='transparent'
                autoCapitalize="none"
                autoCorrect={false}
                cursorColor='#0F4184'
              />
            </View>
            {username.length > 0 && (
              <Text style={{ 
                color: 'rgba(15, 65, 132, 0.6)', 
                fontSize: 14, 
                marginTop: 12, 
                marginLeft: 4, 
                fontFamily: 'Poppins_500Medium' 
              }}>
                @{username}
              </Text>
            )}
          </Animated.View>
        )

      case 2:
        return (
          <Animated.View 
            key="step-2"
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
          >
            <View style={{
              backgroundColor: focusedField === 'email' ? 'rgba(15, 65, 132, 0.08)' : 'rgba(15, 65, 132, 0.06)',
              borderRadius: 16,
              borderWidth: 2,
              borderColor: focusedField === 'email' ? '#0F4184' : 'rgba(15, 65, 132, 0.15)',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
            }}>
              <Icon source="email-outline" size={22} color={focusedField === 'email' ? '#0F4184' : 'rgba(15, 65, 132, 0.5)'} />
              <TextInput
                mode='flat'
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={{ 
                  flex: 1,
                  backgroundColor: 'transparent',
                  fontSize: 16,
                  fontFamily: 'Poppins_400Regular',
                }}
                placeholder="Enter your email"
                placeholderTextColor='rgba(15, 65, 132, 0.4)'
                textColor='#0f172a'
                underlineColor='transparent'
                activeUnderlineColor='transparent'
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                cursorColor='#0F4184'
              />
            </View>
          </Animated.View>
        )

      case 3:
        return (
          <Animated.View 
            key="step-3"
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
          >
            {/* Professional Phone Input */}
            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 20,
              overflow: 'hidden',
              shadowColor: '#0F4184',
              shadowOffset: { width: 0, height: focusedField === 'phone' ? 8 : 4 },
              shadowOpacity: focusedField === 'phone' ? 0.15 : 0.1,
              shadowRadius: focusedField === 'phone' ? 16 : 12,
              elevation: focusedField === 'phone' ? 6 : 4,
              borderWidth: 2,
              borderColor: focusedField === 'phone' ? '#0F4184' : 'transparent',
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                {/* Country Code Section */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingVertical: 20,
                  borderRightWidth: 1,
                  borderRightColor: focusedField === 'phone' ? 'rgba(15, 65, 132, 0.2)' : 'rgba(15, 65, 132, 0.1)',
                  backgroundColor: focusedField === 'phone' ? 'rgba(15, 65, 132, 0.06)' : 'rgba(15, 65, 132, 0.03)',
                }}>
                  <Text style={{ fontSize: 24 }}>🇺🇸</Text>
                  <Text style={{ 
                    fontSize: 18, 
                    color: focusedField === 'phone' ? '#0F4184' : '#0f172a', 
                    fontFamily: 'Poppins_600SemiBold',
                    marginLeft: 8,
                  }}>
                    +1
                  </Text>
                </View>

                {/* Phone Number Input */}
                <TextInput
                  mode='flat'
                  value={phoneNumber}
                  onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="(555) 123-4567"
                  keyboardType="phone-pad"
                  style={{ 
                    flex: 1,
                    backgroundColor: 'transparent',
                    fontSize: 18,
                    fontFamily: 'Poppins_500Medium',
                    paddingHorizontal: 16,
                  }}
                  placeholderTextColor='rgba(15, 65, 132, 0.35)'
                  textColor='#0f172a'
                  underlineColor='transparent'
                  activeUnderlineColor='transparent'
                  selectionColor='#0F4184'
                  cursorColor='#0F4184'
                />

                {/* Checkmark when valid */}
                {phoneNumber.replace(/\D/g, '').length === 10 && (
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#22c55e',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 16,
                  }}>
                    <Icon source="check" size={18} color="#ffffff" />
                  </View>
                )}
              </View>
            </View>

            {/* Helper text */}
            <Text style={{
              fontSize: 13,
              color: 'rgba(15, 23, 42, 0.5)',
              textAlign: 'center',
              marginTop: 16,
              fontFamily: 'Poppins_400Regular',
            }}>
              We'll send you a verification code via SMS
            </Text>
          </Animated.View>
        )

      case 4:
        return (
          <Animated.View 
            key="step-4"
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
          >
            {/* Verification Code Input Boxes */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 24,
            }}>
              {verificationCode.map((digit, index) => (
                <RNTextInput
                  key={index}
                  ref={(ref) => { codeInputRefs.current[index] = ref }}
                  value={digit}
                  onChangeText={(text) => handleCodeInput(text, index)}
                  onKeyPress={({ nativeEvent }) => handleCodeKeyPress(nativeEvent.key, index)}
                  onFocus={() => setFocusedField(`code-${index}`)}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  style={{
                    width: 50,
                    height: 60,
                    backgroundColor: codeError 
                      ? 'rgba(239, 68, 68, 0.1)' 
                      : focusedField === `code-${index}` 
                        ? 'rgba(15, 65, 132, 0.08)' 
                        : '#ffffff',
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: codeError 
                      ? '#ef4444' 
                      : focusedField === `code-${index}`
                        ? '#0F4184'
                        : digit 
                          ? '#22c55e' 
                          : 'rgba(15, 65, 132, 0.2)',
                    fontSize: 24,
                    fontWeight: '700',
                    textAlign: 'center',
                    color: codeError ? '#ef4444' : '#0f172a',
                    shadowColor: focusedField === `code-${index}` ? '#0F4184' : '#0F4184',
                    shadowOffset: { width: 0, height: focusedField === `code-${index}` ? 4 : 2 },
                    shadowOpacity: focusedField === `code-${index}` ? 0.15 : 0.05,
                    shadowRadius: focusedField === `code-${index}` ? 8 : 4,
                  }}
                />
              ))}
            </View>

            {/* Error Message */}
            {codeError && (
              <Animated.View entering={FadeIn.duration(200)}>
                <Text style={{
                  fontSize: 14,
                  color: '#ef4444',
                  textAlign: 'center',
                  marginBottom: 16,
                  fontFamily: 'Poppins_500Medium',
                }}>
                  Incorrect code. Please try again.
                </Text>
              </Animated.View>
            )}

            {/* Resend Code */}
            <View style={{ alignItems: 'center' }}>
              {resendCountdown > 0 ? (
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(15, 23, 42, 0.5)',
                  textAlign: 'center',
                  fontFamily: 'Poppins_400Regular',
                }}>
                  Resend code in {resendCountdown}s
                </Text>
              ) : (
                <Pressable onPress={sendVerificationCode}>
                  <Text style={{
                    fontSize: 15,
                    color: '#0F4184',
                    fontFamily: 'Poppins_600SemiBold',
                    textAlign: 'center',
                  }}>
                    Resend Code
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Change number link */}
            <Pressable 
              onPress={handleBack}
              style={{ marginTop: 24, alignItems: 'center' }}
            >
              <Text style={{
                fontSize: 14,
                color: 'rgba(15, 23, 42, 0.6)',
                fontFamily: 'Poppins_400Regular',
              }}>
                Wrong number? <Text style={{ color: '#0F4184', fontFamily: 'Poppins_600SemiBold' }}>Change it</Text>
              </Text>
            </Pressable>
          </Animated.View>
        )

      case 5:
        return (
          <Animated.View 
            key="step-5"
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
          >
            <View style={{
              backgroundColor: focusedField === 'password' ? 'rgba(15, 65, 132, 0.08)' : 'rgba(15, 65, 132, 0.06)',
              borderRadius: 16,
              borderWidth: 2,
              borderColor: focusedField === 'password' ? '#0F4184' : 'rgba(15, 65, 132, 0.15)',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
            }}>
              <Icon source="lock-outline" size={22} color={focusedField === 'password' ? '#0F4184' : 'rgba(15, 65, 132, 0.5)'} />
              <TextInput
                mode='flat'
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={{ 
                  flex: 1,
                  backgroundColor: 'transparent',
                  fontSize: 16,
                  fontFamily: 'Poppins_400Regular',
                }}
                placeholder="Create a password"
                placeholderTextColor='rgba(15, 65, 132, 0.4)'
                textColor='#0f172a'
                underlineColor='transparent'
                activeUnderlineColor='transparent'
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                cursorColor='#0F4184'
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Icon
                  source={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={focusedField === 'password' ? '#0F4184' : 'rgba(15, 65, 132, 0.5)'}
                />
              </Pressable>
            </View>
            <PasswordStrength password={password} />
          </Animated.View>
        )

      case 6:
        return (
          <Animated.View 
            key="step-6"
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
            style={{ alignItems: 'center' }}
          >
            {/* Profile Photo */}
            <Pressable
              onPress={pickImage}
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: 'rgba(15, 65, 132, 0.08)',
                borderWidth: 4,
                borderColor: profileImage ? '#0F4184' : 'rgba(15, 65, 132, 0.2)',
                borderStyle: profileImage ? 'solid' : 'dashed',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                marginBottom: 24,
              }}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Icon source="camera-plus-outline" size={48} color="rgba(15, 65, 132, 0.4)" />
                  <Text style={{ 
                    fontSize: 14, 
                    color: 'rgba(15, 65, 132, 0.5)', 
                    marginTop: 8, 
                    fontFamily: 'Poppins_500Medium' 
                  }}>
                    Tap to add
                  </Text>
                </View>
              )}
            </Pressable>

            {profileImage ? (
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <Pressable
                  onPress={pickImage}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    backgroundColor: 'rgba(15, 65, 132, 0.08)',
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ 
                    fontSize: 14, 
                    color: '#0F4184', 
                    fontFamily: 'Poppins_600SemiBold' 
                  }}>
                    Change
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setProfileImage(null)}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ 
                    fontSize: 14, 
                    color: '#EF4444', 
                    fontFamily: 'Poppins_600SemiBold' 
                  }}>
                    Remove
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text style={{ 
                fontSize: 14, 
                color: 'rgba(15, 23, 42, 0.5)', 
                fontFamily: 'Poppins_400Regular',
                textAlign: 'center',
                marginTop: 8,
              }}>
                You can always add one later
              </Text>
            )}
          </Animated.View>
        )

      default:
        return null
    }
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
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ flex: 1, paddingHorizontal: 24, minHeight: height - 50 }}>
              {/* Header */}
              <View style={{ paddingTop: height * 0.08 }}>
                {/* Back button */}
                {currentStep > 0 && (
                  <Pressable 
                    onPress={handleBack}
                    style={{ 
                      marginBottom: 24,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Icon source="arrow-left" size={24} color="#0F4184" />
                    <Text style={{ 
                      marginLeft: 8, 
                      fontFamily: 'Poppins_500Medium', 
                      fontSize: 16, 
                      color: '#0F4184' 
                    }}>
                      Back
                    </Text>
                  </Pressable>
                )}

                {/* Progress */}
                <ProgressIndicator currentStep={currentStep + 1} totalSteps={TOTAL_STEPS} />

                {/* Title */}
                <Text style={{ 
                  fontFamily: 'Poppins_700Bold',
                  fontSize: 32,
                  color: '#0f172a',
                  letterSpacing: -0.5,
                }}>
                  {getStepTitle()}
                </Text>
                <Text style={{
                  fontFamily: 'Poppins_400Regular',
                  fontSize: 16,
                  color: 'rgba(15, 23, 42, 0.6)',
                  marginTop: 8,
                  marginBottom: 32,
                }}>
                  {getStepSubtitle()}
                </Text>
              </View>

              {/* Content */}
              <View style={{ flex: 1 }}>
                {renderStepContent()}

                {/* Error message */}
                {error ? (
                  <Animated.View entering={FadeIn.duration(200)} style={{ marginTop: 16 }}>
                    <Text style={{ 
                      color: '#EF4444', 
                      fontSize: 14, 
                      fontFamily: 'Poppins_500Medium',
                      textAlign: 'center',
                    }}>
                      {error}
                    </Text>
                  </Animated.View>
                ) : null}
              </View>

            {/* Bottom Section */}
            <View style={{ paddingBottom: 40 }}>
              {/* Continue/Create Account Button */}
              <Animated.View style={[{ marginBottom: 16 }, buttonAnimatedStyle]}>
                <Pressable
                  onPress={handleNext}
                  disabled={loading}
                  style={{
                    backgroundColor: '#0F4184',
                    paddingVertical: 18,
                    borderRadius: 16,
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
                        {currentStep === TOTAL_STEPS - 1 
                          ? 'Create Account' 
                          : currentStep === 4 
                            ? 'Verify' 
                            : 'Continue'}
                      </Text>
                      <Icon 
                        source={currentStep === 4 ? 'shield-check' : 'arrow-right'} 
                        size={20} 
                        color='#fff' 
                      />
                    </>
                  )}
                </Pressable>
              </Animated.View>

              {/* Social sign up - only show on first step */}
              {currentStep === 0 && (
                <>
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    marginVertical: 20,
                  }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(15, 65, 132, 0.15)' }} />
                    <Text style={{ 
                      color: 'rgba(15, 23, 42, 0.5)', 
                      marginHorizontal: 16,
                      fontFamily: 'Poppins_400Regular',
                      fontSize: 13,
                    }}>
                      or continue with
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(15, 65, 132, 0.15)' }} />
                  </View>

                  <View style={{ gap: 12 }}>
                    {Platform.OS === 'ios' && (
                      <Pressable
                        onPress={handleAppleSignUp}
                        style={{
                          backgroundColor: '#0f172a',
                          paddingVertical: 15,
                          borderRadius: 16,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon source='apple' size={22} color='#fff' />
                        <Text style={{
                          color: '#fff',
                          fontFamily: 'Poppins_600SemiBold',
                          fontSize: 15,
                          marginLeft: 10,
                        }}>
                          Continue with Apple
                        </Text>
                      </Pressable>
                    )}

                    <Pressable
                      onPress={handleGoogleSignUp}
                      style={{
                        backgroundColor: 'rgba(15, 65, 132, 0.08)',
                        paddingVertical: 15,
                        borderRadius: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(15, 65, 132, 0.15)',
                      }}
                    >
                      <Icon source='google' size={22} color='#0f172a' />
                      <Text style={{
                        color: '#0f172a',
                        fontFamily: 'Poppins_600SemiBold',
                        fontSize: 15,
                        marginLeft: 10,
                      }}>
                        Continue with Google
                      </Text>
                    </Pressable>
                  </View>

                  {/* Already have account link */}
                  <Link href='/SignIn' asChild>
                    <Pressable style={{
                      marginTop: 20,
                      alignItems: 'center',
                    }}>
                      <Text style={{ 
                        color: 'rgba(15, 23, 42, 0.6)', 
                        fontFamily: 'Poppins_400Regular',
                        fontSize: 14,
                      }}>
                        Already have an account?{' '}
                        <Text style={{ color: '#0F4184', fontFamily: 'Poppins_600SemiBold' }}>
                          Sign In
                        </Text>
                      </Text>
                    </Pressable>
                  </Link>
                </>
              )}
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  )
}

export default SignUp
