import { View, Text, Pressable, Dimensions, Platform, Modal, Animated, KeyboardAvoidingView, ScrollView } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { Button, Divider, TextInput, Icon } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import * as AppleAuthentication from 'expo-apple-authentication'
import { useAuth } from '../providers/AuthProvider';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';

const { height, width } = Dimensions.get('window')

type SignInAnonModalProps = {
  visible: boolean
  setVisible: () => void
}

const SignInAnonModal = ({ visible, setVisible }: SignInAnonModalProps) => {
  const [signIn, setSignIn] = useState(true)
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  
  const slideAnim = useRef(new Animated.Value(height)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 10,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      slideAnim.setValue(height)
      fadeAnim.setValue(0)
    }
  }, [visible])

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible()
      setSignIn(true)
      setEmail('')
      setPassword('')
      setName('')
    })
  }

  const handleGoogleSignIn = async () => {
    GoogleSignin.configure({
      iosClientId: '991344123272-nk55l8nc7dcloc56m6mmnvnkhdtjfcbf.apps.googleusercontent.com'
    })

    try {
      await GoogleSignin.hasPlayServices()
      const response = await GoogleSignin.signIn()
      const idToken = (response as any).data?.idToken || (response as any).idToken;
      const user = (response as any).data?.user || (response as any).user;
      if (idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        })
        if (!error) {
          const { data: Profile, error: ProfileError } = await supabase.from('profiles').update({ first_name: user?.name, profile_email: user?.email }).eq('id', data?.user.id)
          handleDismiss()
        }
      } else {
        throw new Error('no ID token present!')
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
      } else {
        // some other error happened
      }
    }
  }

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) { alert(error.message); setLoading(false); return };
    handleDismiss()
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true)
    if (email && password && name) {
      const {
        data: { session },
        error,
      } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            first_name: name,
            profile_email: email,
          },
        },
      })

      if (error) { alert(error.message); setLoading(false); return }
      setLoading(false)
      handleDismiss()
    }
    else {
      alert("Enter Name")
      setLoading(false)
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
        const {
          error,
          data: { user },
        } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        })
        if (!error) {
          await supabase.from('profiles').update({ profile_email: credential.email, first_name: credential.fullName?.givenName }).eq('id', user?.id)
          handleDismiss()
        }
      } else {
        throw new Error('No identityToken.')
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // handle that the user canceled the sign-in flow
      } else {
        // handle other errors
      }
    }
  }

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
            opacity: fadeAnim
          }}
        >
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={handleDismiss}
          />

          <Animated.View
            style={{
              backgroundColor: '#ffffff',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: height * 0.9,
              transform: [{ translateY: slideAnim }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -5 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 20,
            }}
          >
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
              <View style={{
                width: 40,
                height: 4,
                backgroundColor: '#e0e0e0',
                borderRadius: 2,
              }} />
            </View>

            {/* Header */}
            <LinearGradient
              colors={['#0E519F', '#1a6bc7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                marginHorizontal: 16,
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}>
                <Icon source={signIn ? "login" : "account-plus"} size={22} color="#ffffff" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: '#ffffff',
                }}>
                  {signIn ? 'Welcome Back' : 'Create Account'}
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginTop: 2,
                }}>
                  {signIn ? 'Sign in to continue' : 'Join the MAS community'}
                </Text>
              </View>

              {/* Close Button */}
              <Pressable
                onPress={handleDismiss}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Icon source="close" size={18} color="#ffffff" />
              </Pressable>
            </LinearGradient>

            <ScrollView 
              style={{ paddingHorizontal: 24 }}
              contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Form */}
              {signIn ? (
                // Sign In Form
                <View style={{ gap: 16 }}>
                  <TextInput
                    mode='outlined'
                    label="Email"
                    style={{ backgroundColor: "#f8f9fa" }}
                    outlineColor='#e0e0e0'
                    activeOutlineColor='#0E519F'
                    value={email}
                    onChangeText={setEmail}
                    left={<TextInput.Icon icon="email-outline" color="#6b7280" />}
                    textColor='#1f2937'
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <TextInput
                    mode='outlined'
                    label="Password"
                    style={{ backgroundColor: "#f8f9fa" }}
                    outlineColor='#e0e0e0'
                    activeOutlineColor='#0E519F'
                    value={password}
                    onChangeText={setPassword}
                    left={<TextInput.Icon icon="lock-outline" color="#6b7280" />}
                    secureTextEntry
                    textColor='#1f2937'
                  />

                  <Pressable
                    onPress={signInWithEmail}
                    disabled={loading}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? '#0a4080' : '#0E519F',
                      borderRadius: 12,
                      paddingVertical: 16,
                      alignItems: 'center',
                      opacity: loading ? 0.7 : 1,
                      marginTop: 8,
                    })}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff' }}>
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                // Sign Up Form
                <View style={{ gap: 16 }}>
                  <TextInput
                    mode='outlined'
                    label="Name"
                    style={{ backgroundColor: "#f8f9fa" }}
                    outlineColor='#e0e0e0'
                    activeOutlineColor='#0E519F'
                    value={name}
                    onChangeText={setName}
                    left={<TextInput.Icon icon="account-outline" color="#6b7280" />}
                    textColor='#1f2937'
                  />

                  <TextInput
                    mode='outlined'
                    label="Email"
                    style={{ backgroundColor: "#f8f9fa" }}
                    outlineColor='#e0e0e0'
                    activeOutlineColor='#0E519F'
                    value={email}
                    onChangeText={setEmail}
                    left={<TextInput.Icon icon="email-outline" color="#6b7280" />}
                    textColor='#1f2937'
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <TextInput
                    mode='outlined'
                    label="Password"
                    style={{ backgroundColor: "#f8f9fa" }}
                    outlineColor='#e0e0e0'
                    activeOutlineColor='#0E519F'
                    value={password}
                    onChangeText={setPassword}
                    left={<TextInput.Icon icon="lock-outline" color="#6b7280" />}
                    secureTextEntry
                    textColor='#1f2937'
                  />

                  <Pressable
                    onPress={signUpWithEmail}
                    disabled={loading}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? '#0a4080' : '#0E519F',
                      borderRadius: 12,
                      paddingVertical: 16,
                      alignItems: 'center',
                      opacity: loading ? 0.7 : 1,
                      marginTop: 8,
                    })}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff' }}>
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Divider */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
                <Text style={{ paddingHorizontal: 16, color: '#9ca3af', fontSize: 14 }}>OR</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
              </View>

              {/* Social Sign In */}
              <View style={{ gap: 12 }}>
                {Platform.OS === 'ios' && (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={12}
                    style={{ width: '100%', height: 50 }}
                    onPress={handleAppleSignIn}
                  />
                )}
                <View style={{ borderRadius: 20, overflow: 'hidden' }}>
                  <GoogleSigninButton
                    size={GoogleSigninButton.Size.Wide}
                    color={GoogleSigninButton.Color.Dark}
                    style={{ width: '100%', height: 65 }}
                    onPress={handleGoogleSignIn}
                  />
                </View>
              </View>

              {/* Switch Form */}
              <Pressable
                onPress={() => setSignIn(!signIn)}
                style={{ paddingVertical: 20, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 14, color: '#6b7280' }}>
                  {signIn ? "Don't have an account? " : "Already have an account? "}
                  <Text style={{ color: '#0E519F', fontWeight: '600' }}>
                    {signIn ? 'Sign Up' : 'Sign In'}
                  </Text>
                </Text>
              </Pressable>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default SignInAnonModal
