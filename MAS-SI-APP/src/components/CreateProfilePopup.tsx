import { View, Text, Pressable, Dimensions, Modal, Animated, Platform } from 'react-native'
import React, { forwardRef, useState, useImperativeHandle, useRef, useEffect } from 'react'
import { Icon } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'

const { height, width } = Dimensions.get('window')

type Ref = {
  present: () => void
  dismiss: () => void
}

interface CreateProfilePopupProps {
  onCreateProfile?: () => void
  onSignIn?: () => void
  onDismiss?: () => void
}

export const CreateProfilePopup = forwardRef<Ref, CreateProfilePopupProps>(
  ({ onCreateProfile, onSignIn, onDismiss }, ref) => {
    const [visible, setVisible] = useState(false)
    const slideAnim = useRef(new Animated.Value(height)).current
    const fadeAnim = useRef(new Animated.Value(0)).current
    const router = useRouter()

    useImperativeHandle(ref, () => ({
      present: () => {
        setVisible(true)
      },
      dismiss: () => {
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
          setVisible(false)
        })
      },
    }))

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
      }
    }, [visible])

    const handleCreateProfile = () => {
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
        setVisible(false)
        onCreateProfile?.()
        router.push('/(auth)/SignUp')
      })
    }

    const handleSignIn = () => {
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
        setVisible(false)
        onSignIn?.()
        router.push('/(auth)/SignIn')
      })
    }

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
        setVisible(false)
        onDismiss?.()
      })
    }

    if (!visible) return null

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="none"
        statusBarTranslucent
      >
        <Animated.View 
          style={{ 
            flex: 1, 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            justifyContent: 'center',
            alignItems: 'center',
            opacity: fadeAnim 
          }}
        >
          <Pressable 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={handleDismiss}
          />
          
          <Animated.View
            style={{
              width: width * 0.9,
              backgroundColor: '#ffffff',
              borderRadius: 28,
              overflow: 'hidden',
              transform: [{ translateY: slideAnim }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 20,
            }}
          >
            {/* Header Gradient */}
            <LinearGradient
              colors={['#0E519F', '#1a6bc7', '#2980d9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingTop: 30,
                paddingBottom: 40,
                paddingHorizontal: 24,
                alignItems: 'center',
              }}
            >
              {/* Close Button */}
              <Pressable
                onPress={handleDismiss}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
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

              {/* Icon */}
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <Text style={{ fontSize: 40 }}>✨</Text>
              </View>

              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#ffffff',
                textAlign: 'center',
                marginBottom: 8,
              }}>
                Create a Profile
              </Text>
            </LinearGradient>

            {/* Content */}
            <View style={{ 
              paddingHorizontal: 24, 
              paddingTop: 24,
              paddingBottom: 28,
              marginTop: -20,
              backgroundColor: '#ffffff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}>
              <Text style={{
                fontSize: 16,
                color: '#4b5563',
                textAlign: 'center',
                lineHeight: 24,
                marginBottom: 24,
              }}>
                Enhance your experience by creating a profile and getting access to more features
              </Text>

              {/* Features List */}
              <View style={{ marginBottom: 24 }}>
                {[
                  { icon: 'bell-outline', text: 'Personalized notifications' },
                  { icon: 'bookmark-outline', text: 'Save programs & events' },
                  { icon: 'playlist-play', text: 'Create custom playlists' },
                  { icon: 'account-group-outline', text: 'Join the community' },
                ].map((feature, index) => (
                  <View 
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8,
                    }}
                  >
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: 'rgba(14, 81, 159, 0.1)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}>
                      <Icon source={feature.icon} size={18} color="#0E519F" />
                    </View>
                    <Text style={{ fontSize: 14, color: '#374151', fontWeight: '500' }}>
                      {feature.text}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Buttons */}
              <Pressable
                onPress={handleCreateProfile}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#0a4080' : '#0E519F',
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginBottom: 12,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                })}
              >
                <Icon source="account-plus" size={20} color="#ffffff" />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff' }}>
                  Create Profile
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSignIn}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#f3f4f6' : '#ffffff',
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: '#e5e7eb',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                })}
              >
                <Icon source="login" size={20} color="#0E519F" />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E519F' }}>
                  Already have an account? Sign In
                </Text>
              </Pressable>

              {/* Maybe Later */}
              <Pressable
                onPress={handleDismiss}
                style={{
                  paddingVertical: 12,
                  alignItems: 'center',
                  marginTop: 8,
                }}
              >
                <Text style={{ fontSize: 14, color: '#9ca3af', fontWeight: '500' }}>
                  Maybe Later
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    )
  }
)

CreateProfilePopup.displayName = 'CreateProfilePopup'

