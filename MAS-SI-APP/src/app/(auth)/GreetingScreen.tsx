import { View, Text, StatusBar, Image, Dimensions, Pressable, StyleSheet } from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
  interpolate,
  FadeIn,
  FadeInUp,
  runOnJS,
} from 'react-native-reanimated'
import { Link, Stack } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/src/lib/supabase'
// Video import - uncomment after rebuilding development build
// import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av'

// Video background configuration
// Set to true AFTER creating a new development build with: eas build --profile development --platform ios
const ENABLE_VIDEO_BACKGROUND = false

const { height, width } = Dimensions.get('window')

// Floating orb/particle component
const FloatingOrb = ({ 
  delay, 
  size, 
  startX, 
  startY, 
  color,
  duration = 4000,
}: { 
  delay: number
  size: number
  startX: number
  startY: number
  color: string
  duration?: number
}) => {
  const translateY = useSharedValue(0)
  const translateX = useSharedValue(0)
  const scale = useSharedValue(0.8)
  const opacity = useSharedValue(0)

  useEffect(() => {
    // Floating animation
    translateY.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-20, { duration: duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ))
    translateX.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(10, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
        withTiming(-10, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ))
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1.1, { duration: duration * 0.8 }),
        withTiming(0.9, { duration: duration * 0.8 })
      ),
      -1,
      true
    ))
    opacity.value = withDelay(delay, withTiming(1, { duration: 1000 }))
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={[{
      position: 'absolute',
      left: startX,
      top: startY,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
    }, animatedStyle]} />
  )
}

// Glow effect component
const GlowEffect = () => {
  const pulseScale = useSharedValue(1)
  const pulseOpacity = useSharedValue(0.3)

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    )
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    )
  }, [])

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }))

  return (
    <Animated.View style={[{
      position: 'absolute',
      width: 400,
      height: 400,
      borderRadius: 200,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    }, glowStyle]} />
  )
}

const GreetingScreen = () => {
  // Video state - starts as ended if video is disabled
  const [videoEnded, setVideoEnded] = useState(!ENABLE_VIDEO_BACKGROUND)
  
  // Background transition animation (0 = video visible, 1 = gradient visible)
  // Start at 1 if video is disabled (show gradient immediately)
  const backgroundOpacity = useSharedValue(ENABLE_VIDEO_BACKGROUND ? 0 : 1)
  
  // Logo animation values
  const logoScale = useSharedValue(0.3)
  const logoOpacity = useSharedValue(0)
  const logoFloat = useSharedValue(0)
  
  // Buttons animation
  const buttonsTranslate = useSharedValue(100)
  const buttonsOpacity = useSharedValue(0)

  // Handle video end - transition to blue gradient
  const handleVideoEnd = useCallback(() => {
    setVideoEnded(true)
    // Smooth fade to blue gradient over 1.5 seconds
    backgroundOpacity.value = withTiming(1, { 
      duration: 1500, 
      easing: Easing.inOut(Easing.ease) 
    })
  }, [])

  // Handle video playback status
  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (status.isLoaded && status.didJustFinish) {
      handleVideoEnd()
    }
  }, [handleVideoEnd])

  // Animated style for the gradient overlay
  const gradientOverlayStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }))

  useEffect(() => {
    // Logo entrance animation
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 1000 }))
    logoScale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 80 }))
    
    // Logo floating animation (continuous)
    logoFloat.value = withDelay(1300, withRepeat(
      withSequence(
        withTiming(-15, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ))
    
    // Buttons entrance
    buttonsOpacity.value = withDelay(800, withTiming(1, { duration: 600 }))
    buttonsTranslate.value = withDelay(800, withSpring(0, { damping: 15, stiffness: 80 }))
  }, [])

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value },
      { translateY: logoFloat.value },
    ],
  }))

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslate.value }],
  }))

  return (
    <View style={{ flex: 1, backgroundColor: '#0E519F' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* Video Background - plays first, then fades to gradient */}
      {/* Uncomment after rebuilding development build with expo-av */}
      {/* ENABLE_VIDEO_BACKGROUND && !videoEnded && (
        <Video
          source={require('@/assets/videos/greeting-background.mp4')}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping={false}
          isMuted={true}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        />
      ) */}

      {/* Background gradient - fades in after video ends */}
      <Animated.View style={[StyleSheet.absoluteFill, gradientOverlayStyle]}>
        <LinearGradient
          colors={['#0E519F', '#0A3F7D', '#07305F']}
          style={{ 
            width: '100%',
            height: '100%',
          }}
        />
      </Animated.View>

      {/* Floating orbs/particles - commented out
      <FloatingOrb delay={0} size={50} startX={width * 0.05} startY={height * 0.08} color="rgba(255, 255, 255, 0.25)" duration={5000} />
      <FloatingOrb delay={300} size={35} startX={width * 0.25} startY={height * 0.05} color="rgba(111, 166, 108, 0.4)" duration={4200} />
      <FloatingOrb delay={150} size={28} startX={width * 0.42} startY={height * 0.03} color="rgba(255, 255, 255, 0.2)" duration={4600} />
      <FloatingOrb delay={600} size={40} startX={width * 0.65} startY={height * 0.06} color="rgba(255, 255, 255, 0.25)" duration={4800} />
      <FloatingOrb delay={900} size={45} startX={width * 0.88} startY={height * 0.1} color="rgba(111, 166, 108, 0.4)" duration={5200} />
      <FloatingOrb delay={450} size={22} startX={width * 0.15} startY={height * 0.12} color="rgba(111, 166, 108, 0.35)" duration={4400} />
      <FloatingOrb delay={750} size={30} startX={width * 0.78} startY={height * 0.04} color="rgba(111, 166, 108, 0.3)" duration={5100} />
      <FloatingOrb delay={200} size={30} startX={width * 0.02} startY={height * 0.22} color="rgba(255, 255, 255, 0.2)" duration={4500} />
      <FloatingOrb delay={500} size={38} startX={width * 0.92} startY={height * 0.18} color="rgba(111, 166, 108, 0.35)" duration={5100} />
      <FloatingOrb delay={350} size={24} startX={width * 0.06} startY={height * 0.16} color="rgba(111, 166, 108, 0.4)" duration={4800} />
      <FloatingOrb delay={650} size={32} startX={width * 0.96} startY={height * 0.25} color="rgba(255, 255, 255, 0.2)" duration={4900} />
      <FloatingOrb delay={400} size={28} startX={width * 0.01} startY={height * 0.38} color="rgba(111, 166, 108, 0.4)" duration={4300} />
      <FloatingOrb delay={700} size={32} startX={width * 0.95} startY={height * 0.42} color="rgba(255, 255, 255, 0.25)" duration={4700} />
      <FloatingOrb delay={1100} size={25} startX={width * 0.03} startY={height * 0.55} color="rgba(255, 255, 255, 0.25)" duration={5300} />
      <FloatingOrb delay={1400} size={35} startX={width * 0.9} startY={height * 0.52} color="rgba(111, 166, 108, 0.35)" duration={4900} />
      <FloatingOrb delay={550} size={20} startX={width * 0.04} startY={height * 0.32} color="rgba(255, 255, 255, 0.2)" duration={5000} />
      <FloatingOrb delay={850} size={26} startX={width * 0.94} startY={height * 0.35} color="rgba(111, 166, 108, 0.4)" duration={4600} />
      <FloatingOrb delay={1250} size={22} startX={width * 0.02} startY={height * 0.48} color="rgba(111, 166, 108, 0.35)" duration={5200} />
      <FloatingOrb delay={1550} size={28} startX={width * 0.97} startY={height * 0.58} color="rgba(255, 255, 255, 0.25)" duration={4400} />
      <FloatingOrb delay={800} size={42} startX={width * 0.02} startY={height * 0.68} color="rgba(111, 166, 108, 0.4)" duration={5500} />
      <FloatingOrb delay={1000} size={38} startX={width * 0.93} startY={height * 0.65} color="rgba(255, 255, 255, 0.25)" duration={4600} />
      <FloatingOrb delay={950} size={24} startX={width * 0.05} startY={height * 0.62} color="rgba(255, 255, 255, 0.2)" duration={4800} />
      <FloatingOrb delay={1150} size={30} startX={width * 0.96} startY={height * 0.72} color="rgba(111, 166, 108, 0.3)" duration={5100} />
      <FloatingOrb delay={1200} size={30} startX={width * 0.08} startY={height * 0.78} color="rgba(255, 255, 255, 0.25)" duration={4400} />
      <FloatingOrb delay={1500} size={45} startX={width * 0.3} startY={height * 0.82} color="rgba(111, 166, 108, 0.35)" duration={5000} />
      <FloatingOrb delay={1800} size={35} startX={width * 0.55} startY={height * 0.8} color="rgba(255, 255, 255, 0.2)" duration={4800} />
      <FloatingOrb delay={2100} size={40} startX={width * 0.78} startY={height * 0.78} color="rgba(111, 166, 108, 0.4)" duration={5200} />
      <FloatingOrb delay={2400} size={32} startX={width * 0.88} startY={height * 0.75} color="rgba(255, 255, 255, 0.25)" duration={4500} />
      <FloatingOrb delay={1350} size={26} startX={width * 0.18} startY={height * 0.85} color="rgba(111, 166, 108, 0.4)" duration={4700} />
      <FloatingOrb delay={1650} size={22} startX={width * 0.42} startY={height * 0.88} color="rgba(255, 255, 255, 0.2)" duration={5300} />
      <FloatingOrb delay={1950} size={38} startX={width * 0.65} startY={height * 0.85} color="rgba(111, 166, 108, 0.35)" duration={4900} />
      <FloatingOrb delay={2250} size={28} startX={width * 0.95} startY={height * 0.82} color="rgba(255, 255, 255, 0.2)" duration={5100} />
      <FloatingOrb delay={2550} size={34} startX={width * 0.02} startY={height * 0.88} color="rgba(111, 166, 108, 0.4)" duration={4600} />
      <FloatingOrb delay={100} size={18} startX={width * 0.35} startY={height * 0.1} color="rgba(255, 255, 255, 0.15)" duration={5400} />
      <FloatingOrb delay={1050} size={20} startX={width * 0.08} startY={height * 0.45} color="rgba(111, 166, 108, 0.3)" duration={4350} />
      <FloatingOrb delay={1750} size={24} startX={width * 0.88} startY={height * 0.48} color="rgba(255, 255, 255, 0.2)" duration={5050} />
      <FloatingOrb delay={2000} size={18} startX={width * 0.12} startY={height * 0.72} color="rgba(111, 166, 108, 0.35)" duration={4550} />
      <FloatingOrb delay={2300} size={22} startX={width * 0.82} startY={height * 0.88} color="rgba(255, 255, 255, 0.2)" duration={5250} />
      */}

      {/* Center logo section */}
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
      }}>
        
        {/* Glowing Tree Logo */}
        <Animated.View style={[{
          alignItems: 'center',
          justifyContent: 'center',
        }, logoStyle]}>
          <Image
            source={require('@/assets/images/glowingTree.png')}
            style={{
              width: 320,
              height: 320,
              resizeMode: 'contain',
            }}
          />
          
          {/* MAS text below logo */}
          <Text style={{
            fontFamily: 'Poppins_700Bold',
            fontSize: 32,
            color: '#ffffff',
            letterSpacing: 8,
            marginTop: -10,
          }}>
            MAS
          </Text>
          <Text style={{
            fontFamily: 'Poppins_400Regular',
            fontSize: 13,
            color: 'rgba(255, 255, 255, 0.6)',
            letterSpacing: 4,
            marginTop: 2,
          }}>
            STATEN ISLAND
          </Text>
        </Animated.View>
      </View>

      {/* Bottom buttons section */}
      <Animated.View style={[{
        paddingHorizontal: 24,
        paddingBottom: 50,
        gap: 12,
      }, buttonsStyle]}>
        {/* Create Account Button - Solid White */}
        <Link href='/SignUp' asChild>
          <Pressable style={{
            backgroundColor: '#ffffff',
            paddingVertical: 18,
            borderRadius: 50,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{
              fontFamily: 'Poppins_600SemiBold',
              fontSize: 17,
              color: '#0E519F',
            }}>
              Create Account
            </Text>
          </Pressable>
        </Link>

        {/* Sign In Button - Outlined */}
        <Link href='/SignIn' asChild>
          <Pressable style={{
            backgroundColor: 'transparent',
            paddingVertical: 18,
            borderRadius: 50,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: 'rgba(255, 255, 255, 0.4)',
          }}>
            <Text style={{
              fontFamily: 'Poppins_600SemiBold',
              fontSize: 17,
              color: '#ffffff',
            }}>
              Sign In
            </Text>
          </Pressable>
        </Link>

        {/* Skip Button */}
        <Pressable 
          onPress={async () => {
            const { error } = await supabase.auth.signInAnonymously()
            if (error) console.log(error)
          }}
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
          }}
        >
          <Text style={{
            fontFamily: 'Poppins_500Medium',
            fontSize: 15,
            color: 'rgba(255, 255, 255, 0.6)',
            textDecorationLine: 'underline',
          }}>
            Skip
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  )
}

export default GreetingScreen
