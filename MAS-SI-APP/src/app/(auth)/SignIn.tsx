import { View, Text, Dimensions, StatusBar, Pressable, Platform, KeyboardAvoidingView, ScrollView } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { Icon, TextInput, ActivityIndicator } from 'react-native-paper'
import { Link, Stack } from "expo-router"
import { supabase } from '@/src/lib/supabase'
import * as AppleAuthentication from 'expo-apple-authentication'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withDelay,
  withSequence,
  FadeIn,
  FadeInUp,
  interpolateColor,
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

// Animated geometric pattern component
const GeometricPattern = () => {
  const rotation = useSharedValue(0)
  const scale = useSharedValue(0.8)

  useEffect(() => {
    rotation.value = withTiming(360, { duration: 60000 })
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
      bottom: -150,
      left: -100,
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

const SignIn = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({ email: '', password: '' })
  const [emailFocused, setEmailFocused] = useState(false)
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

  const validateForm = () => {
    let valid = true
    const newErrors = { email: '', password: '' }

    if (!email.trim()) {
      newErrors.email = 'Email is required'
      valid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email'
      valid = false
    }

    if (!password) {
      newErrors.password = 'Password is required'
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleGoogleSignIn = async () => {
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
          alert(error?.message || 'Google sign-in failed')
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
        alert(`Sign-in error: ${error.message || 'Unknown error'}`)
      }
    }
  }

  const handleAppleSignIn = async () => {
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

  async function signInWithEmail() {
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
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (error) {
        alert(error.message)
      }
    } catch (error: any) {
      alert(error.message || 'An error occurred during sign in')
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
            <Animated.View style={[{ paddingTop: height * 0.1, paddingHorizontal: 24 }, headerStyle]}>
              <Text style={{ 
                fontFamily: 'Poppins_700Bold',
                fontSize: 42,
                color: '#0f172a',
                letterSpacing: -1,
              }}>
                Welcome
              </Text>
              <Text style={{ 
                fontFamily: 'Poppins_400Regular',
                fontSize: 42,
                color: '#0F4184',
                marginTop: -10,
                letterSpacing: -1,
              }}>
                Back
              </Text>
              <Text style={{
                fontFamily: 'Poppins_400Regular',
                fontSize: 16,
                color: 'rgba(15, 23, 42, 0.6)',
                marginTop: 8,
              }}>
                Sign in to continue
              </Text>

              {/* New member link */}
              <Link href='/SignUp' asChild>
                <Pressable style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 20,
                  backgroundColor: 'rgba(15, 65, 132, 0.08)',
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 30,
                  alignSelf: 'flex-start',
                  borderWidth: 1,
                  borderColor: 'rgba(15, 65, 132, 0.15)',
                }}>
                  <Text style={{ 
                    color: '#0f172a', 
                    fontFamily: 'Poppins_500Medium',
                    marginRight: 8,
                  }}>
                    New member?
                  </Text>
                  <Icon source='arrow-right' size={18} color='#0F4184' />
                </Pressable>
              </Link>
            </Animated.View>

            {/* Form Section */}
            <Animated.View style={[{ 
              flex: 1, 
              paddingHorizontal: 24, 
              paddingTop: 50,
            }, formStyle]}>
              
              {/* Email Input */}
              <View style={{ marginBottom: 16 }}>
                <View style={{
                  backgroundColor: 'rgba(15, 65, 132, 0.06)',
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: errors.email ? '#EF4444' : emailFocused ? '#0F4184' : 'rgba(15, 65, 132, 0.15)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                }}>
                  <Icon 
                    source="email-outline" 
                    size={22} 
                    color={errors.email ? '#EF4444' : emailFocused ? '#0F4184' : 'rgba(15, 65, 132, 0.5)'} 
                  />
                  <TextInput
                    mode='flat'
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text)
                      if (errors.email) {
                        setErrors(prev => ({ ...prev, email: '' }))
                      }
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    style={{ 
                      flex: 1,
                      backgroundColor: 'transparent',
                      fontSize: 16,
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
                  <Text style={{ 
                    color: '#EF4444', 
                    fontSize: 12, 
                    marginTop: 4, 
                    marginLeft: 16,
                    fontFamily: 'Poppins_400Regular',
                  }}>
                    {errors.email}
                  </Text>
                )}
              </View>

              {/* Password Input */}
              <View style={{ marginBottom: 16 }}>
                <View style={{
                  backgroundColor: 'rgba(15, 65, 132, 0.06)',
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: errors.password ? '#EF4444' : passwordFocused ? '#0F4184' : 'rgba(15, 65, 132, 0.15)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                }}>
                  <Icon 
                    source="lock-outline" 
                    size={22} 
                    color={errors.password ? '#EF4444' : passwordFocused ? '#0F4184' : 'rgba(15, 65, 132, 0.5)'} 
                  />
                  <TextInput
                    mode='flat'
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text)
                      if (errors.password) {
                        setErrors(prev => ({ ...prev, password: '' }))
                      }
                    }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    style={{ 
                      flex: 1,
                      backgroundColor: 'transparent',
                      fontSize: 16,
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
                      size={22} 
                      color='rgba(15, 65, 132, 0.5)' 
                    />
                  </Pressable>
                </View>
                {errors.password && (
                  <Text style={{ 
                    color: '#EF4444', 
                    fontSize: 12, 
                    marginTop: 4, 
                    marginLeft: 16,
                    fontFamily: 'Poppins_400Regular',
                  }}>
                    {errors.password}
                  </Text>
                )}
              </View>

              {/* Forgot Password */}
              <Animated.View entering={FadeInUp.delay(600).duration(400)}>
                <Pressable style={{ alignSelf: 'flex-end', marginBottom: 24 }}>
                  <Text style={{
                    color: '#0F4184',
                    fontFamily: 'Poppins_500Medium',
                    fontSize: 14,
                  }}>
                    Forgot Password?
                  </Text>
                </Pressable>
              </Animated.View>

              {/* Sign In Button */}
              <Animated.View 
                entering={FadeInUp.delay(700).duration(400)}
                style={[buttonAnimatedStyle]}
              >
                <Pressable
                  onPress={signInWithEmail}
                  disabled={loading}
                  style={{
                    backgroundColor: '#0F4184',
                    paddingVertical: 16,
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
                    <ActivityIndicator color='#fff' size={24} />
                  ) : (
                    <>
                      <Text style={{
                        color: '#fff',
                        fontFamily: 'Poppins_600SemiBold',
                        fontSize: 18,
                        marginRight: 8,
                      }}>
                        Sign In
                      </Text>
                      <Icon source='arrow-right' size={20} color='#fff' />
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
                  marginVertical: 32,
                }}
              >
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(15, 65, 132, 0.15)' }} />
                <Text style={{ 
                  color: 'rgba(15, 23, 42, 0.5)', 
                  marginHorizontal: 16,
                  fontFamily: 'Poppins_400Regular',
                }}>
                  or continue with
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(15, 65, 132, 0.15)' }} />
              </Animated.View>

              {/* Social Sign In Buttons */}
              <Animated.View 
                entering={FadeInUp.delay(900).duration(400)}
                style={{ gap: 12, paddingBottom: 40 }}
              >
                {Platform.OS === 'ios' && (
                  <Pressable
                    onPress={handleAppleSignIn}
                    style={{
                      backgroundColor: '#0f172a',
                      paddingVertical: 14,
                      borderRadius: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon source='apple' size={24} color='#fff' />
                    <Text style={{
                      color: '#fff',
                      fontFamily: 'Poppins_600SemiBold',
                      fontSize: 16,
                      marginLeft: 12,
                    }}>
                      Continue with Apple
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={handleGoogleSignIn}
                  style={{
                    backgroundColor: 'rgba(15, 65, 132, 0.08)',
                    paddingVertical: 14,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(15, 65, 132, 0.15)',
                  }}
                >
                  <Icon source='google' size={24} color='#0f172a' />
                  <Text style={{
                    color: '#0f172a',
                    fontFamily: 'Poppins_600SemiBold',
                    fontSize: 16,
                    marginLeft: 12,
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

export default SignIn
