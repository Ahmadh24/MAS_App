import { View, Text, ScrollView, useWindowDimensions, Image, Pressable, StatusBar, Linking, Alert, KeyboardAvoidingView, Share, Platform, ImageBackground, StyleSheet  } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useRef, useState } from 'react'
import LottieView from 'lottie-react-native'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { Button, Icon, Portal, Modal,TextInput, Divider } from 'react-native-paper'
import { Link, useRouter } from 'expo-router'
import { Profile } from '@/src/types'
import { useAuth } from '@/src/providers/AuthProvider'
import { supabase } from '@/src/lib/supabase'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import SignInAnonModal from '@/src/components/SignInAnonModal'
import Toast from 'react-native-toast-message'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { BlurView } from 'expo-blur'
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
//import { AdminClient } from '@/src/lib/supabase'
const Index = () => {
  const router = useRouter()
  const [ profile, setProfile ] = useState<Profile>()
  const { session } = useAuth()
  const width = useWindowDimensions().width
  const height = useWindowDimensions().height
  const [ visible, setVisible ] = useState(false)
  const [ anonStatus, setAnonStatus ] = useState(true)
  const tabBarHeight = useBottomTabBarHeight() + 10
  const spin = useSharedValue(0)
  const [ profileFirstName , setProfileFirstName ] = useState('')
  const [ profileLastName , setProfileLastName ] = useState('')
  const [ profileEmail, setProfileEmail ] = useState('')
  const [loading, setLoading] = useState(true)
  const [editProfileVisible, setEditProfileVisible] = React.useState(false);
  const [ feedbackOpen, setFeedBackOpen ] = useState(false);
  const [ feedbackMessage, setFeedBackMessage ] = useState('')
  const [ businessAdsExpanded, setBusinessAdsExpanded ] = useState(false);
  const FeedBackRight = useSharedValue(0)
  const FeedBackInputWidth = useSharedValue(0)
  const feedbackRef = useRef<any>(null)
  const appflowRef = useRef<View>(null)
  const scrollViewRef = useRef<ScrollView>(null)
  const [ sendAble, setSendAble ] = useState(true)
  const FeedBackInput = useAnimatedStyle(() => {
    return{
      width : feedbackOpen ? withTiming(width * .75, { duration : 1500 }) : withTiming(0, { duration : 1500 } ),
      opacity : feedbackOpen ? withTiming(1, { duration : 1500 }) : withTiming(0, { duration : 1500 } )
    }
  })
  const FeedBackButton = useAnimatedStyle(() => {
    return {
      right : feedbackOpen ? withTiming(width * .05, { duration : 1500 }) : withTiming(0, { duration : 1500 } ),
      width : feedbackOpen ? withTiming(width * .75 / 5, { duration : 500 }) : withTiming(150, { duration : 1500})
    }
  })
  const FeedBackArrowOpacity = useAnimatedStyle(() => {
    return{
      opacity : feedbackOpen ? withTiming(0, { duration : 500 }) : withTiming(1, { duration : 3000 } )
    }
  })
  const flip = useAnimatedStyle(() => {
    return{
      transform: [
        { perspective: 1000 },
        { rotateY: withTiming(`${spin.value * 180}deg`, { duration: 600 }) },
      ],
    }
  })
  const businessAdsChevronRotation = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: withTiming(businessAdsExpanded ? '90deg' : '0deg', { duration: 300 }) }
      ]
    }
  })
  const businessAdsDropdown = useAnimatedStyle(() => {
    return {
      maxHeight: withTiming(businessAdsExpanded ? 200 : 0, { duration: 300 }),
      opacity: withTiming(businessAdsExpanded ? 1 : 0, { duration: 300 }),
      overflow: 'hidden'
    }
  })
  const getProfile = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', session?.user.id).single()
    if( data ){
      setProfile(data)
    }
  }
  const checkIfAnon = async () => {
    if( session?.user.is_anonymous ){
      setAnonStatus(true)
    }
    else{
      setAnonStatus(false)
    }
  }
  const SignInModalCheck = () => {
    if( anonStatus ){
      setVisible(true)
      return true
    }else{
      return false
    }
  }

  useEffect(() => {
    getProfile()
  }, [session])
  useEffect(() => {
    checkIfAnon()
  }, [session])
  useEffect(() => {
    // Check for Feedback open and no message => Close after 7000 else stay open
    let timerId;
    if( feedbackOpen && feedbackMessage.length <= 0 ){
      timerId = setTimeout(() => 
      {
        setFeedBackOpen(false);

      }
    ,8000) 
    }
    else if ( feedbackMessage ) {
      clearTimeout(timerId);
      setFeedBackOpen(true);
    }
  }, [ feedbackOpen, feedbackMessage ])
  const hideModal = () => setEditProfileVisible(false);
  const onConfirmButton = async () => {
    Toast.show({
      type: 'success',
      text1: "Profile is Sucessfully Edited",
      position: 'top',
      topOffset : 50,
      visibilityTime: 2000,
    });
    const { error } = await supabase.from('profiles').update({ first_name : profileFirstName, last_name : profileLastName, profile_email : profileEmail }).eq('id', session?.user.id)
    setEditProfileVisible(false);
    setProfileFirstName('');
    setProfileLastName('');
    setProfileEmail('');
    await getProfile();
  }
  const MASHOPLINK = () => Linking.canOpenURL("https://massic.shop/").then(() => {
    Linking.openURL("https://massic.shop/");
  });
  const MASDONATIONLINK = () => Linking.canOpenURL("https://massic.org/give/").then(() => {
    Linking.openURL("https://massic.org/give/");
  });
  const LogoutButton  = () => {
    return(
      <Pressable 
        onPress={() => {
          Alert.alert(
            'Logout', 
            'Are you sure you want to logout?', 
            [
              {
                text : 'Cancel',
                style : 'cancel',
                onPress : () => {}
              },
              {
                text : 'Logout',
                style : 'destructive',
                onPress : async () => {
                     await supabase.from('profiles').update({ push_notification_token : null }).eq('id', session?.user.id)
                     if( session?.user.is_anonymous ){ 
                      const { data, error } = await supabase.functions.invoke('delete-user', {
                         body : { user_id : session.user.id }
                        })
                     }
                      await supabase.auth.signOut()
                    }
                  }
                ]
                )
        }}
        style={({ pressed }) => ({
          backgroundColor: pressed ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          flexDirection: 'row',
          alignItems: 'center',
        })}
      >
        <Svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6 }}>
          <Path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <Path d="M10.6667 11.3333L14 8M14 8L10.6667 4.66667M14 8H6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
        <Text className='text-white font-semibold text-xs'>Logout</Text>
      </Pressable>
    )
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      {/* Background with gradient pattern - sibling to BlurView */}
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={['#000000', '#000000', '#000000', '#000000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          {/* Add some visual elements for blur to work on */}
          <View style={{ flex: 1, padding: 20, justifyContent: 'space-around' }}>
            {[...Array(8)].map((_, i) => (
              <View
                key={i}
                style={{
                  height: 80,
                  backgroundColor: i % 2 === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  borderRadius: 20,
                }}
              />
            ))}
          </View>
        </LinearGradient>
      </View>
      
      {/* BlurView overlays the background */}
      <BlurView
        intensity={80}
        tint="dark"
        {...(Platform.OS === 'android' && { experimentalBlurMethod: 'dimezisBlurView' })}
        style={{ flex: 1 }}
      >
        <ScrollView 
    ref={scrollViewRef}
    keyboardDismissMode='on-drag'
    automaticallyAdjustKeyboardInsets
          style={{ flex: 1, backgroundColor: 'transparent' }}
          contentContainerStyle={{ paddingBottom: tabBarHeight }}
        >
          <StatusBar barStyle={'light-content'}/>
      
      {/* Header Section - Transparent overlay */}
      <View
        style={{
          paddingTop: 60,
          paddingBottom: 50,
          paddingHorizontal: 20,
          position: 'relative',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* MAS Logo - Top Left */}
        <View style={{ position: 'absolute', left: 20, top: 60, zIndex: 10 }}>
          <View style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'white',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Image 
            source={require('@/assets/images/MASHomeLogo.png')}
                style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 16,
                }}
              />
            </View>
            </View>
        </View>

        {/* Sign In / Logout Button - Top Right */}
        <View style={{
          position: 'absolute',
          right: 20,
          top: 60,
          zIndex: 10,
        }}>
          {anonStatus ? (
            <Pressable 
              onPress={() => setVisible(true)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                flexDirection: 'row',
                alignItems: 'center',
              })}
            >
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                <Path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <Path d="M10 17L15 12L10 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <Path d="M15 12H3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
              <Text className='text-white font-semibold text-xs'>Sign In</Text>
            </Pressable>
          ) : (
            <LogoutButton />
          )}
        </View>

        <View className='items-center' style={{ marginTop: anonStatus ? 90 : 70 }}>
          {/* Profile Photo - Smaller */}
          <View style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: 'white',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <Svg width="32" height="32" viewBox="0 0 20 20" fill="none">
              <Path d="M10 10C12.0711 10 13.75 8.32107 13.75 6.25C13.75 4.17893 12.0711 2.5 10 2.5C7.92893 2.5 6.25 4.17893 6.25 6.25C6.25 8.32107 7.92893 10 10 10Z" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <Path d="M17.0834 17.5C17.0834 14.2784 13.8654 11.6667 10.0001 11.6667C6.13477 11.6667 2.91675 14.2784 2.91675 17.5" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
      </View>

          {/* User Name or Guest Account - Smaller */}
          <Text className='text-white text-xl font-semibold mb-1' style={{
            textAlign: 'center',
          }}>
            {anonStatus ? 'Guest Account' : `${profile?.first_name || ''}${profile?.last_name ? ' ' + profile.last_name : ''}`.trim()}
          </Text>

          {/* Email - Only show for logged in users - Smaller */}
          {!anonStatus && (
            <Text className='text-white/80 text-sm mb-4'>
              {profile?.profile_email}
            </Text>
          )}

          {/* Invite Friends Button - Long Pill Style */}
          {!anonStatus && (
            <Pressable 
              onPress={async () => {
                try {
                  await Share.share({
                    message: '🕌 Join me at MAS Staten Island! Download the app to stay connected with our community, prayer times, events, and more!\n\nhttps://massic.org',
                    title: 'Join MAS Staten Island'
                  });
                } catch (error) {
                  console.error(error);
                }
              }}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#F3F4F6' : '#FFFFFF',
                borderRadius: 999,
                paddingHorizontal: 20,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 12,
                width: '100%',
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              })}
            >
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 10 }}>
                <Path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <Path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <Path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <Path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
              <Text className='text-white font-semibold text-base'>Invite Friends</Text>
            </Pressable>
          )}
              </View>
              </View>
      {/* Main Content */}
      <View className='px-4 py-5' style={{ backgroundColor: 'transparent', paddingBottom: tabBarHeight + 20 }}>
        
        
        {/* MY ACTIVITY */}
        <Text className='text-xs font-semibold text-white uppercase tracking-wider px-1 mb-2' style={{ textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>My Activity</Text>
        <View style={{
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
        }}>
          <View className='rounded-2xl' style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
            backgroundColor: 'transparent',
          }}>
            <Pressable 
              onPress={() => {}}
              className='flex-row items-center px-4 py-3'
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
              })}
            >
              <Text className='text-sm text-white flex-1'>Saved Programs/Events</Text>
              <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
              </Svg>
            </Pressable>
            
            <View className='border-t border-gray-100/50'>
              <Pressable 
                onPress={() => {}}
                className='flex-row items-center px-4 py-3'
                style={({ pressed }) => ({
                  backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
                })}
              >
                <Text className='text-sm text-white flex-1'>Playlist</Text>
                <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                </Svg>
              </Pressable>
              </View>                  
              </View>                  
              </View>

        {/* DONATION */}
        <Text className='text-xs font-semibold text-white uppercase tracking-wider px-1 mb-2' style={{ textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>Donation</Text>
        <View style={{
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
        }}>
          <View className='rounded-2xl' style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
            backgroundColor: 'transparent',
          }}>
            <Pressable 
              onPress={() => {}}
              className='flex-row items-center px-4 py-3'
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
              })}
            >
              <Text className='text-sm text-white flex-1'>Phase 1</Text>
              <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
              </Svg>
            </Pressable>
            
            <View className='border-t border-gray-100/50'>
              <Pressable 
                onPress={() => {}}
                className='flex-row items-center px-4 py-3'
                style={({ pressed }) => ({
                  backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
                })}
              >
                <Text className='text-sm text-white flex-1'>Phase 2</Text>
                <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                  </Svg>
              </Pressable>
               </View>

            <View className='border-t border-gray-100/50'>
              <Pressable 
                onPress={() => {}}
                className='flex-row items-center px-4 py-3'
                style={({ pressed }) => ({
                  backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
                })}
              >
                <Text className='text-sm text-white flex-1'>View Full Project</Text>
                <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                  </Svg>
              </Pressable>
            </View>
                </View>
        </View>

        {/* NOTIFICATIONS */}
        <Text className='text-xs font-semibold text-white uppercase tracking-wider px-1 mb-2' style={{ textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>Notifications</Text>
        <View style={{
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
        }}>
          <View className='rounded-2xl' style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
            backgroundColor: 'transparent',
          }}>
            <Pressable 
              onPress={() => {}}
              className='flex-row items-center px-4 py-3'
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
              })}
            >
              <Text className='text-sm text-white flex-1'>Prayer</Text>
              <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
              </Svg>
            </Pressable>
            
            <View className='border-t border-gray-100/50'>
              <Pressable 
                onPress={() => {}}
                className='flex-row items-center px-4 py-3'
                style={({ pressed }) => ({
                  backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
                })}
              >
                <Text className='text-sm text-white flex-1'>Program</Text>
                <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                </Svg>
              </Pressable>
            </View>

            <View className='border-t border-gray-100/50'>
              <Pressable 
                onPress={() => {}}
                className='flex-row items-center px-4 py-3'
                style={({ pressed }) => ({
                  backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
                })}
              >
                <Text className='text-sm text-white flex-1'>Event</Text>
                <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                </Svg>
              </Pressable>
            </View>

            <View className='border-t border-gray-100/50'>
              <Pressable 
                onPress={() => {}}
                className='flex-row items-center px-4 py-3'
                style={({ pressed }) => ({
                  backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
                })}
              >
                <Text className='text-sm text-white flex-1'>Settings (Preferences)</Text>
                <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                </Svg>
              </Pressable>
            </View>
          </View>
        </View>

        {/* MAS SHOP */}
        <Text className='text-xs font-semibold text-white uppercase tracking-wider px-1 mb-2' style={{ textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>MAS Shop</Text>
        <View style={{
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
        }}>
          <View className='rounded-2xl' style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
            backgroundColor: 'transparent',
          }}>
            <Pressable 
              onPress={() => {}}
              className='flex-row items-center px-4 py-3'
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
              })}
            >
              <Text className='text-sm text-white flex-1'>Merch</Text>
              <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
              </Svg>
            </Pressable>

            <View className='border-t border-gray-100/50'>
              <Pressable 
                onPress={() => {}}
                className='flex-row items-center px-4 py-3'
                style={({ pressed }) => ({
                  backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
                })}
              >
                <Text className='text-sm text-white flex-1'>Programs/Events</Text>
                <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                </Svg>
              </Pressable>
        </View>

            <View className='border-t border-gray-100/50'>
              <Pressable 
                onPress={() => {}}
                className='flex-row items-center px-4 py-3'
                style={({ pressed }) => ({
                  backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
                })}
              >
                <Text className='text-sm text-white flex-1'>Classes</Text>
                <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                </Svg>
              </Pressable>
            </View>
          </View>
        </View>

        {/* BUSINESS ADS */}
        <Text className='text-xs font-semibold text-white uppercase tracking-wider px-1 mb-2' style={{ textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>Business Ads</Text>
        <View style={{
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
        }}>
          <View className='rounded-2xl' style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
            backgroundColor: 'transparent',
          }}>
            <Pressable 
              onPress={() => {}}
              className='flex-row items-center px-4 py-3'
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
              })}
            >
              <Text className='text-sm text-white flex-1'>Start an Application</Text>
              <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
              </Svg>
            </Pressable>
            
            <View className='border-t border-gray-100/50'>
              <Pressable 
                onPress={() => {}}
                className='flex-row items-center px-4 py-3'
                style={({ pressed }) => ({
                  backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
                })}
              >
                <Text className='text-sm text-white flex-1'>Check the Status</Text>
                <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                  </Svg>
              </Pressable>
                </View>
              </View>
        </View>

        {/* EDIT PROFILE */}
        <Text className='text-xs font-semibold text-white uppercase tracking-wider px-1 mb-2' style={{ textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>Edit Profile</Text>
        <View style={{
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
        }}>
          <View className='rounded-2xl' style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
            backgroundColor: 'transparent',
          }}>
            <Pressable 
              onPress={() => {}}
              className='flex-row items-center px-4 py-3'
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
              })}
            >
              <Text className='text-sm text-white flex-1'>Profile Page</Text>
              <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
              </Svg>
          </Pressable>

            <View className='border-t border-gray-100/50'>
              <Pressable 
                onPress={() => {}}
                className='flex-row items-center px-4 py-3'
                style={({ pressed }) => ({
                  backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
                })}
              >
                <Text className='text-sm text-white flex-1'>Username and Password</Text>
                <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                </Svg>
              </Pressable>
                  </View>

            <View className='border-t border-gray-100/50'>
              <Pressable 
                onPress={() => {}}
                className='flex-row items-center px-4 py-3'
                style={({ pressed }) => ({
                  backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
                })}
              >
                <Text className='text-sm text-white flex-1'>Change Password</Text>
                <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                      </Svg>
              </Pressable>
                    </View>
                    </View>
                  </View>

        {/* LEAVE A COMMENT */}
        <Text className='text-xs font-semibold text-white uppercase tracking-wider px-1 mb-2' style={{ textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>Leave a Comment</Text>
        <View style={{
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
        }}>
          <View className='rounded-2xl' style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
            backgroundColor: 'transparent',
          }}>
            <Pressable 
              onPress={() => {}}
              className='flex-row items-center px-4 py-3'
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
              })}
            >
              <Text className='text-sm text-white flex-1'>Feature Request</Text>
              <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                    </Svg>
            </Pressable>

            <View className='border-t border-gray-100/50'>
              <Pressable 
                onPress={() => {}}
                className='flex-row items-center px-4 py-3'
                style={({ pressed }) => ({
                  backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
                })}
              >
                <Text className='text-sm text-white flex-1'>Report a Bug</Text>
                <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                </Svg>
              </Pressable>
        </View>

            <View className='border-t border-gray-100/50'>
              <Pressable 
                onPress={() => {}}
                className='flex-row items-center px-4 py-3'
                style={({ pressed }) => ({
                  backgroundColor: pressed ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
                })}
              >
                <Text className='text-sm text-white flex-1'>Other Comments</Text>
                <Svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                </Svg>
              </Pressable>
                </View>
                        </View>
        </View>



        {/* Admin Panel Button - Professional Style */}
        {profile?.role == 'ADMIN' && (
          <View style={{
            borderRadius: 20,
            overflow: 'hidden',
            marginBottom: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
          }}>
            <View className='rounded-2xl' style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
              backgroundColor: 'transparent',
            }}>
              <Link href={"/more/Admin/AdminScreen"} asChild>
                <Pressable 
                  className='flex-row items-center px-4 py-3.5'
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? '#F9FAFB' : 'transparent',
                  })}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: '#EFF6FF',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#3B82F6"/>
                        </Svg>
                  </View>
                  <View className='flex-1'>
                    <Text className='text-sm font-semibold text-white'>Admin Panel</Text>
                    <Text className='text-xs text-white'>Manage app content</Text>
                  </View>
                  <Svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <Path d="M7.5 15L12.5 10L7.5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                  </Svg>
                </Pressable>
              </Link>
              </View>
      </View>
        )}

      <View className='w-[100%] flex flex-row justify-end items-center mt-2 mb-2'>
        <Animated.View className='h-[40px] items-center justify-center rounded-[15px] self-end relative' style={[FeedBackButton, { backgroundColor : feedbackOpen ? '#12BD30' : 'white'}]}>
          <Pressable 
          disabled={!sendAble}
          onPress={async () => {
            if( feedbackOpen && feedbackMessage.trim() ){
              setSendAble(false)
              const { error } =  await supabase.functions.invoke('donation-confirmation-email',{body : { message : feedbackMessage, userinfo : profile }})
              if (error) return
              Toast.show({
                type: 'success',
                text1: "Thank you for your feedback!",
                position: 'top',
                topOffset : 50,
                visibilityTime: 2000,
              });
              setFeedBackMessage('')
              setFeedBackOpen(false)
              setSendAble(true)
            }
            else{
            if (feedbackOpen) Alert.alert('Input FeedBack To Send') 
            setFeedBackOpen(!feedbackOpen)
            }
          }} 
          className='items-center justify-between flex flex-row w-[100%] h-[100%] py-2 px-2 rounded-[15px]'>
            <Text className='font-bold' style={{ color: feedbackOpen ? 'white' : 'white' }}>{feedbackOpen ? 'Send' : 'Feature Request'}</Text>
            {
            feedbackOpen ? <></> : 
            <Animated.View style={FeedBackArrowOpacity} >
              <Svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                  <Path d="M11.5 1L15 5.5M15 5.5L11.5 10M15 5.5H1" stroke="#6077F5" stroke-linecap="round"/>
              </Svg>
            </Animated.View>
            }
            </Pressable>
        </Animated.View>

          <Animated.View style={FeedBackInput} className='relative self-end mr-3'>
              <TextInput
                mode='outlined'
                ref={feedbackRef}
                style={{ width: "100%", height: 45, backgroundColor : 'white' }}
                value={feedbackMessage}
                onChangeText={setFeedBackMessage}
                placeholder="Enter Feedback Message..."
                className=''
                textColor="white"
                activeOutlineColor="#0D509D"
                enterKeyHint='done'
                contentStyle={{ }}
                
              />
          </Animated.View>

       
      </View>
      
        {/* Premium Footer */}
        <View 
          className='mt-8 mb-4 mx-2 items-center justify-center p-6 bg-white rounded-3xl' 
          style={{ 
            borderRadius: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
            elevation: 2,
          }}
          ref={appflowRef}
        >
          <View className='flex-row items-center mb-3'>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#6077F5',
              marginRight: 8,
            }} />
            <Text className='text-white text-lg font-bold'>Created By</Text>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#6077F5',
              marginLeft: 8,
            }} />
        </View>
          <Text className='text-white text-xl font-extrabold mb-2'>AppFlow Creations</Text>
          <Pressable 
            onPress={() => Linking.openURL('mailto:appflowcreations@gmail.com')}
            className='flex-row items-center bg-blue-50 px-4 py-2 rounded-full'
          >
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6 }}>
              <Path d="M2.66667 2.66666H13.3333C14.0667 2.66666 14.6667 3.26666 14.6667 4V12C14.6667 12.7333 14.0667 13.3333 13.3333 13.3333H2.66667C1.93333 13.3333 1.33333 12.7333 1.33333 12V4C1.33333 3.26666 1.93333 2.66666 2.66667 2.66666Z" stroke="#6077F5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <Path d="M14.6667 4L8 8.66667L1.33333 4" stroke="#6077F5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
            <Text className='text-white font-semibold text-sm'>appflowcreations@gmail.com</Text>
          </Pressable>
      </View>
      </View>
      <SignInAnonModal visible={visible} setVisible={() => setVisible(false)}/>
      <View style={[{paddingBottom : tabBarHeight}]}></View>
      <Portal>
      <Modal  visible={editProfileVisible} onDismiss={hideModal} contentContainerStyle={{
          height : '60%',
          width : '95%',
          borderRadius : 10,
          backgroundColor : 'white',
          alignSelf : 'center',
          alignItems : 'center'
               }}>
                <View className='flex-col'>
                  <View>
                    <Text className='text-center font-bold text-3xl text-white'>Edit Profile </Text>
                  </View>
                  <View>
                    <Text className='mt-2 mb-1 ml-3 text-white'>Enter Your First Name</Text>
                    <TextInput
                    mode='outlined'
                    theme={{ roundness : 50 }}
                    style={{ width: 300, backgroundColor: "#e8e8e8", height: 45 }}
                    activeOutlineColor='#0D509D'
                    value={profileFirstName}
                    onChangeText={setProfileFirstName}
                    placeholder="First Name"
                    textColor='white'
                    />
                    <Text className='mt-2 mb-1 ml-3 text-white'>Enter Your Last Name</Text>
                  <TextInput
                    mode='outlined'
                    theme={{ roundness : 50 }}
                    style={{ width: 300, backgroundColor: "#e8e8e8", height: 45, }}
                    activeOutlineColor='#0D509D'
                    value={profileLastName}
                    onChangeText={setProfileLastName}
                    placeholder="Last Name"
                    textColor='white'
                    />
                  <Text className='mt-2 mb-1 ml-3 text-white'>Enter Your Email</Text>
                  <TextInput
                    mode='outlined'
                    theme={{ roundness : 50 }}
                    style={{ width: 300, backgroundColor: "#e8e8e8", height: 45 }}
                    activeOutlineColor='#0D509D'
                    value={profileEmail}
                    onChangeText={setProfileEmail}
                    placeholder="Email"
                    textColor='white'
                    />
                  </View>
                  <View className='self-center'>
                    <Button  mode='contained' buttonColor='#57BA47' textColor='white' className='w-[300] h-15 mt-8' onPress={onConfirmButton}>Submit</Button>
                  </View>
                  </View>
      </Modal>
      </Portal>
    </ScrollView>
      </BlurView>
    </View>
  )
}

export default Index