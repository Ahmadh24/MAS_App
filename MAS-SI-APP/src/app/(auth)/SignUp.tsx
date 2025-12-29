import { View, Text, Dimensions, StatusBar, Pressable, Platform, KeyboardAvoidingView, ScrollView, Image } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Button, Icon, TextInput, ActivityIndicator } from 'react-native-paper'
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
  interpolate,
  interpolateColor,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import {
  GoogleSignin,
  GoogleSigninButton,
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

// Animated geometric pattern component
const GeometricPattern = () => {
  const rotation = useSharedValue(0)
  const scale = useSharedValue(0.8)

  useEffect(() => {
    rotation.value = withTiming(360, { duration: 60000, easing: Easing.linear })
    scale.value = withSequence(
      withTiming(1, { duration: 2000 }),
      withTiming(0.95, { duration: 3000 }),
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value }
    ],
    opacity: 0.08,
  }))

  return (
    <Animated.View style={[{
      position: 'absolute',
      top: -100,
      right: -100,
      width: 400,
      height: 400,
    }, animatedStyle]}>
      <View style={{
        width: '100%',
        height: '100%',
        borderWidth: 2,
        borderColor: '#0F4184',
        borderRadius: 200,
      }} />
      <View style={{
        position: 'absolute',
        top: 50,
        left: 50,
        width: 300,
        height: 300,
        borderWidth: 2,
        borderColor: '#6FA66C',
        borderRadius: 150,
      }} />
      <View style={{
        position: 'absolute',
        top: 100,
        left: 100,
        width: 200,
        height: 200,
        borderWidth: 2,
        borderColor: '#0F4184',
        borderRadius: 100,
      }} />
    </Animated.View>
  )
}

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
      style={{ marginTop: 8, paddingHorizontal: 4 }}
    >
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              backgroundColor: level <= strength.level ? strength.color : 'rgba(15, 65, 132, 0.15)',
            }}
          />
        ))}
      </View>
      <Text style={{ color: strength.color, fontSize: 12, fontFamily: 'Poppins_400Regular' }}>
        {strength.text}
      </Text>
    </Animated.View>
  )
}

const SignUp = () => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({ 
    firstName: '', 
    lastName: '', 
    username: '', 
    email: '', 
    phoneNumber: '',
    password: '' 
  })
  
  // Focus states
  const [firstNameFocused, setFirstNameFocused] = useState(false)
  const [lastNameFocused, setLastNameFocused] = useState(false)
  const [usernameFocused, setUsernameFocused] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [phoneNumberFocused, setPhoneNumberFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  // Animation values
  const headerTranslate = useSharedValue(-100)
  const formOpacity = useSharedValue(0)
  const formTranslate = useSharedValue(50)
  const buttonScale = useSharedValue(1)

  useEffect(() => {
    // Staggered entrance animations
    headerTranslate.value = withSpring(0, { damping: 15, stiffness: 80 })
    formOpacity.value = withDelay(300, withTiming(1, { duration: 600 }))
    formTranslate.value = withDelay(300, withSpring(0, { damping: 15, stiffness: 80 }))
  }, [])

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerTranslate.value }],
  }))

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslate.value }],
  }))

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

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to take a photo.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri)
    }
  }

  const validateForm = () => {
    let valid = true
    const newErrors = { firstName: '', lastName: '', username: '', email: '', phoneNumber: '', password: '' }

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required'
      valid = false
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required'
      valid = false
    }

    if (!username.trim()) {
      newErrors.username = 'Username is required'
      valid = false
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
      valid = false
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores'
      valid = false
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required'
      valid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email'
      valid = false
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required'
      valid = false
    }

    if (!password) {
      newErrors.password = 'Password is required'
      valid = false
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
      valid = false
    }

    setErrors(newErrors)
    return valid
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
    if (!validateForm()) {
      buttonScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1, { damping: 10 })
      )
      return
    }

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
            
            // Update profile with image URL
            await supabase.from('profiles').update({
              profile_image: urlData.publicUrl
            }).eq('id', user.id)
          }
        } catch (uploadErr) {
          console.error('Error uploading profile image:', uploadErr)
        }
      }

      // Update profile with additional fields (onboarding will be completed in Onboarding screen)
      if (user) {
        await supabase.from('profiles').update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          username: username.trim().toLowerCase(),
          phone_number: phoneNumber.trim(),
          onboarding_completed: false, // User will complete onboarding in the next screen
        }).eq('id', user.id)
      }

    } catch (error: any) {
      alert(error.message || 'An error occurred during sign up')
    } finally {
      setLoading(false)
      buttonScale.value = withSpring(1)
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
        <GeometricPattern />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Section */}
            <Animated.View style={[{ paddingTop: height * 0.06, paddingHorizontal: 24 }, headerStyle]}>
              <Text style={{ 
                fontFamily: 'Poppins_700Bold',
                fontSize: 38,
                color: '#0f172a',
                letterSpacing: -1,
              }}>
                Create
              </Text>
              <Text style={{ 
                fontFamily: 'Poppins_400Regular',
                fontSize: 38,
                color: '#0F4184',
                marginTop: -8,
                letterSpacing: -1,
              }}>
                Account
              </Text>
              <Text style={{
                fontFamily: 'Poppins_400Regular',
                fontSize: 15,
                color: 'rgba(15, 23, 42, 0.6)',
                marginTop: 6,
              }}>
                Join our community today
              </Text>

              {/* Already have account link */}
              <Link href='/SignIn' asChild>
                <Pressable style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 16,
                  backgroundColor: 'rgba(15, 65, 132, 0.08)',
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  borderRadius: 30,
                  alignSelf: 'flex-start',
                  borderWidth: 1,
                  borderColor: 'rgba(15, 65, 132, 0.15)',
                }}>
                  <Text style={{ 
                    color: '#0f172a', 
                    fontFamily: 'Poppins_500Medium',
                    fontSize: 14,
                    marginRight: 8,
                  }}>
                    Already a member?
                  </Text>
                  <Icon source='arrow-right' size={16} color='#0F4184' />
                </Pressable>
              </Link>
            </Animated.View>

            {/* Form Section */}
            <Animated.View style={[{ 
              flex: 1, 
              paddingHorizontal: 24, 
              paddingTop: 24,
            }, formStyle]}>

              {/* Profile Photo Section */}
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Pressable
                  onPress={pickImage}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: 'rgba(15, 65, 132, 0.08)',
                    borderWidth: 3,
                    borderColor: profileImage ? '#0F4184' : 'rgba(15, 65, 132, 0.2)',
                    borderStyle: profileImage ? 'solid' : 'dashed',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <Icon source="camera-plus-outline" size={28} color="rgba(15, 65, 132, 0.5)" />
                      <Text style={{ 
                        fontSize: 10, 
                        color: 'rgba(15, 65, 132, 0.5)', 
                        marginTop: 4, 
                        fontFamily: 'Poppins_500Medium' 
                      }}>
                        Add Photo
                      </Text>
                    </View>
                  )}
                </Pressable>
                {profileImage && (
                  <Pressable
                    onPress={() => setProfileImage(null)}
                    style={{ marginTop: 8 }}
                  >
                    <Text style={{ 
                      fontSize: 12, 
                      color: '#EF4444', 
                      fontFamily: 'Poppins_500Medium' 
                    }}>
                      Remove
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* First Name & Last Name Row */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                {/* First Name Input */}
                <View style={{ flex: 1 }}>
                  <View style={{
                    backgroundColor: 'rgba(15, 65, 132, 0.06)',
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: errors.firstName ? '#EF4444' : firstNameFocused ? '#0F4184' : 'rgba(15, 65, 132, 0.15)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                  }}>
                    <Icon 
                      source="account-outline" 
                      size={20} 
                      color={errors.firstName ? '#EF4444' : firstNameFocused ? '#0F4184' : 'rgba(15, 65, 132, 0.5)'} 
                    />
                    <TextInput
                      mode='flat'
                      value={firstName}
                      onChangeText={(text) => {
                        setFirstName(text)
                        if (errors.firstName) setErrors(prev => ({ ...prev, firstName: '' }))
                      }}
                      onFocus={() => setFirstNameFocused(true)}
                      onBlur={() => setFirstNameFocused(false)}
                      style={{ 
                        flex: 1,
                        backgroundColor: 'transparent',
                        fontSize: 15,
                        fontFamily: 'Poppins_400Regular',
                      }}
                      placeholder="First Name"
                      placeholderTextColor='rgba(15, 65, 132, 0.4)'
                      textColor='#0f172a'
                      underlineColor='transparent'
                      activeUnderlineColor='transparent'
                      selectionColor='#0F4184'
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                  {errors.firstName && (
                    <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 4, marginLeft: 14, fontFamily: 'Poppins_400Regular' }}>
                      {errors.firstName}
                    </Text>
                  )}
                </View>

                {/* Last Name Input */}
                <View style={{ flex: 1 }}>
                  <View style={{
                    backgroundColor: 'rgba(15, 65, 132, 0.06)',
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: errors.lastName ? '#EF4444' : lastNameFocused ? '#0F4184' : 'rgba(15, 65, 132, 0.15)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                  }}>
                    <TextInput
                      mode='flat'
                      value={lastName}
                      onChangeText={(text) => {
                        setLastName(text)
                        if (errors.lastName) setErrors(prev => ({ ...prev, lastName: '' }))
                      }}
                      onFocus={() => setLastNameFocused(true)}
                      onBlur={() => setLastNameFocused(false)}
                      style={{ 
                        flex: 1,
                        backgroundColor: 'transparent',
                        fontSize: 15,
                        fontFamily: 'Poppins_400Regular',
                      }}
                      placeholder="Last Name"
                      placeholderTextColor='rgba(15, 65, 132, 0.4)'
                      textColor='#0f172a'
                      underlineColor='transparent'
                      activeUnderlineColor='transparent'
                      selectionColor='#0F4184'
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                  {errors.lastName && (
                    <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 4, marginLeft: 14, fontFamily: 'Poppins_400Regular' }}>
                      {errors.lastName}
                    </Text>
                  )}
                </View>
              </View>

              {/* Username Input */}
              <View style={{ marginBottom: 14 }}>
                <View style={{
                  backgroundColor: 'rgba(15, 65, 132, 0.06)',
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: errors.username ? '#EF4444' : usernameFocused ? '#0F4184' : 'rgba(15, 65, 132, 0.15)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                }}>
                  <Icon 
                    source="at" 
                    size={20} 
                    color={errors.username ? '#EF4444' : usernameFocused ? '#0F4184' : 'rgba(15, 65, 132, 0.5)'} 
                  />
                  <TextInput
                    mode='flat'
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                      if (errors.username) setErrors(prev => ({ ...prev, username: '' }))
                    }}
                    onFocus={() => setUsernameFocused(true)}
                    onBlur={() => setUsernameFocused(false)}
                    style={{ 
                      flex: 1,
                      backgroundColor: 'transparent',
                      fontSize: 15,
                      fontFamily: 'Poppins_400Regular',
                    }}
                    placeholder="Username"
                    placeholderTextColor='rgba(15, 65, 132, 0.4)'
                    textColor='#0f172a'
                    underlineColor='transparent'
                    activeUnderlineColor='transparent'
                    selectionColor='#0F4184'
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {errors.username ? (
                  <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 4, marginLeft: 14, fontFamily: 'Poppins_400Regular' }}>
                    {errors.username}
                  </Text>
                ) : username.length > 0 && (
                  <Text style={{ color: 'rgba(15, 65, 132, 0.5)', fontSize: 11, marginTop: 4, marginLeft: 14, fontFamily: 'Poppins_400Regular' }}>
                    @{username}
                  </Text>
                )}
              </View>

              {/* Email Input */}
              <View style={{ marginBottom: 14 }}>
                <View style={{
                  backgroundColor: 'rgba(15, 65, 132, 0.06)',
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: errors.email ? '#EF4444' : emailFocused ? '#0F4184' : 'rgba(15, 65, 132, 0.15)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                }}>
                  <Icon 
                    source="email-outline" 
                    size={20} 
                    color={errors.email ? '#EF4444' : emailFocused ? '#0F4184' : 'rgba(15, 65, 132, 0.5)'} 
                  />
                  <TextInput
                    mode='flat'
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text)
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    style={{ 
                      flex: 1,
                      backgroundColor: 'transparent',
                      fontSize: 15,
                      fontFamily: 'Poppins_400Regular',
                    }}
                    placeholder="Email Address"
                    placeholderTextColor='rgba(15, 65, 132, 0.4)'
                    textColor='#0f172a'
                    underlineColor='transparent'
                    activeUnderlineColor='transparent'
                    selectionColor='#0F4184'
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {errors.email && (
                  <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 4, marginLeft: 14, fontFamily: 'Poppins_400Regular' }}>
                    {errors.email}
                  </Text>
                )}
              </View>

              {/* Phone Number Input */}
              <View style={{ marginBottom: 14 }}>
                <View style={{
                  backgroundColor: 'rgba(15, 65, 132, 0.06)',
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: errors.phoneNumber ? '#EF4444' : phoneNumberFocused ? '#0F4184' : 'rgba(15, 65, 132, 0.15)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                }}>
                  <Icon 
                    source="phone-outline" 
                    size={20} 
                    color={errors.phoneNumber ? '#EF4444' : phoneNumberFocused ? '#0F4184' : 'rgba(15, 65, 132, 0.5)'} 
                  />
                  <TextInput
                    mode='flat'
                    value={phoneNumber}
                    onChangeText={(text) => {
                      setPhoneNumber(text)
                      if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: '' }))
                    }}
                    onFocus={() => setPhoneNumberFocused(true)}
                    onBlur={() => setPhoneNumberFocused(false)}
                    style={{ 
                      flex: 1,
                      backgroundColor: 'transparent',
                      fontSize: 15,
                      fontFamily: 'Poppins_400Regular',
                    }}
                    placeholder="Phone Number"
                    placeholderTextColor='rgba(15, 65, 132, 0.4)'
                    textColor='#0f172a'
                    underlineColor='transparent'
                    activeUnderlineColor='transparent'
                    selectionColor='#0F4184'
                    keyboardType="phone-pad"
                    autoCorrect={false}
                  />
                </View>
                {errors.phoneNumber && (
                  <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 4, marginLeft: 14, fontFamily: 'Poppins_400Regular' }}>
                    {errors.phoneNumber}
                  </Text>
                )}
              </View>

              {/* Password Input */}
              <View style={{ marginBottom: 14 }}>
                <View style={{
                  backgroundColor: 'rgba(15, 65, 132, 0.06)',
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: errors.password ? '#EF4444' : passwordFocused ? '#0F4184' : 'rgba(15, 65, 132, 0.15)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                }}>
                  <Icon 
                    source="lock-outline" 
                    size={20} 
                    color={errors.password ? '#EF4444' : passwordFocused ? '#0F4184' : 'rgba(15, 65, 132, 0.5)'} 
                  />
                  <TextInput
                    mode='flat'
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text)
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
                    }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    style={{ 
                      flex: 1,
                      backgroundColor: 'transparent',
                      fontSize: 15,
                      fontFamily: 'Poppins_400Regular',
                    }}
                    placeholder="Password"
                    placeholderTextColor='rgba(15, 65, 132, 0.4)'
                    textColor='#0f172a'
                    underlineColor='transparent'
                    activeUnderlineColor='transparent'
                    secureTextEntry={!showPassword}
                    selectionColor='#0F4184'
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Icon
                      source={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color='rgba(15, 65, 132, 0.5)'
                    />
                  </Pressable>
                </View>
                {errors.password && (
                  <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 4, marginLeft: 14, fontFamily: 'Poppins_400Regular' }}>
                    {errors.password}
                  </Text>
                )}
                <PasswordStrength password={password} />
              </View>

              {/* Sign Up Button */}
              <Animated.View 
                entering={FadeInUp.delay(700).duration(400)}
                style={[{ marginTop: 12 }, buttonAnimatedStyle]}
              >
                <Pressable
                  onPress={signUpWithEmail}
                  disabled={loading}
                  style={{
                    backgroundColor: '#0F4184',
                    paddingVertical: 15,
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
                        Create Account
                      </Text>
                      <Icon source='arrow-right' size={18} color='#fff' />
                    </>
                  )}
                </Pressable>
              </Animated.View>

              {/* Divider */}
              <Animated.View 
                entering={FadeIn.delay(800).duration(400)}
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  marginVertical: 24,
                }}
              >
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
              </Animated.View>

              {/* Social Sign Up Buttons */}
              <Animated.View 
                entering={FadeInUp.delay(900).duration(400)}
                style={{ gap: 10, paddingBottom: 40 }}
              >
                {Platform.OS === 'ios' && (
                  <Pressable
                    onPress={handleAppleSignUp}
                    style={{
                      backgroundColor: '#0f172a',
                      paddingVertical: 13,
                      borderRadius: 14,
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
                    paddingVertical: 13,
                    borderRadius: 14,
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
              </Animated.View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  )
}

export default SignUp
