import { Tabs, Redirect, useSegments } from "expo-router";
import * as Animatable from 'react-native-animatable';
import { Pressable, TouchableOpacity, Modal, StyleSheet, Platform } from "react-native";
import { useEffect, useRef, useState } from "react";
import TabArray from '@/src/lib/tabs';

import { useAuth } from "@/src/providers/AuthProvider";
import LottieView from 'lottie-react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, runOnJS, FadeIn } from 'react-native-reanimated';
import Toast from 'react-native-toast-message'
import { View, Text, Image } from 'react-native'
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics'
import AccountModal from '../../components/AccountModal';
import ClassicTabBar from '../../components/ClassicTabBar';
// import TutorialOverlay from "@/src/components/TutorialOverlay";
import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';
import { PersonalizedAccount } from '@/src/components/PersonalizedAccount';
import { CreateProfilePopup } from '@/src/components/CreateProfilePopup';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { supabase } from '@/src/lib/supabase';
import { OnboardingProvider, useOnboarding } from '@/src/providers/OnboardingProvider';

// const toastConfig = {
//   addProgramToNotificationsToast: ({ props }: any) => (
//     <Pressable className='rounded-xl overflow-hidden ' onPress={props.onPress}>
//       <BlurView intensity={40} className='flex-row items-center justify-between px-4 rounded-xl p-1 max-w-[85%] max-h-[60]'
//         experimentalBlurMethod={'dimezisBlurView'}
//       >
//         <View>
//           <Image source={props.props.program_img ? { uri: props.props.program_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 50, height: 50, objectFit: 'fill', borderRadius: 10 }} />
//         </View>
//         <View className='flex-col pl-2'>
//           <View>
//             <Text>1 Program Added To Notifications</Text>
//           </View>
//           <View className='flex-row'>
//             <Text className='text-sm'>{props.props.program_name}</Text>
//             <Icon source={'chevron-right'} size={20} />
//           </View>
//         </View>
//       </BlurView>
//     </Pressable>
//   ),
//   LectureAddedToPlaylist: ({ props }: any) => (
//     <Pressable className='rounded-xl overflow-hidden' onPress={props.onPress}>
//       <BlurView intensity={40} className='flex-row items-center justify-between px-3 p-1 max-w-[85%] max-h-[60]'
//         experimentalBlurMethod={'dimezisBlurView'}
//       >
//         <View className=''>
//           <Image source={props.props?.playlist_img ? { uri: props.props.playlist_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 50, height: 50, objectFit: 'fill', borderRadius: 10 }} />
//         </View>
//         <View className='flex-col pl-2'>
//           <View>
//             <Text numberOfLines={1} allowFontScaling adjustsFontSizeToFit >1 lecture added</Text>
//           </View>
//           <View className='flex-row'>
//             <Text>{props.props?.playlist_name}</Text>
//             <Icon source={'chevron-right'} size={20} />
//           </View>
//         </View>
//       </BlurView>
//     </Pressable>
//   ),
//   ProgramAddedToPrograms: ({ props }: any) => (
//     <Pressable className='rounded-xl overflow-hidden ' onPress={props.onPress}>
//       <BlurView intensity={40} className='flex-row items-center justify-between px-4 rounded-xl p-1 max-w-[85%] max-h-[60]'
//         experimentalBlurMethod={'dimezisBlurView'}
//       >
//         <View>
//           <Image source={props.props.program_img ? { uri: props.props.program_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 50, height: 50, objectFit: 'fill', borderRadius: 10 }} />
//         </View>
//         <View className='flex-col pl-2'>
//           <View>
//             <Text>1 Program Added to Library</Text>
//           </View>
//           <View className='flex-row'>
//             <Text className='text-sm'>{props.props.program_name}</Text>
//             <Icon source={'chevron-right'} size={20} />
//           </View>
//         </View>
//       </BlurView>
//     </Pressable>
//   ),
//   addEventToNotificationsToast: ({ props }: any) => (
//     <Pressable className='rounded-xl overflow-hidden ' onPress={props.onPress}>
//       <BlurView intensity={40} className='flex-row items-center justify-between px-4 rounded-xl p-1 max-w-[85%] max-h-[60]'
//         experimentalBlurMethod={'dimezisBlurView'}
//       >
//         <View>
//           <Image source={props.props.event_img ? { uri: props.props.event_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 50, height: 50, objectFit: 'fill', borderRadius: 10 }} />
//         </View>
//         <View className='flex-col pl-2'>
//           <View>
//             <Text>1 Program Added To Notifications</Text>
//           </View>
//           <View className='flex-row'>
//             <Text className='text-sm'>{props.props.event_name}</Text>
//             <Icon source={'chevron-right'} size={20} />
//           </View>
//         </View>
//       </BlurView>
//     </Pressable>
//   ),
//   ConfirmNotificationOption: ({ props }: any) => (
//     <Pressable className='rounded-xl overflow-hidden ' onPress={props.onPress}>
//       <BlurView intensity={40} className='flex-row items-center justify-between px-4 rounded-xl p-2 max-w-[90%] max-h-[60]'
//         experimentalBlurMethod={'dimezisBlurView'}
//       >

//         <View className='flex-col pl-2'>
//           <View>
//             <Text className="text-white">{props.message} : {props.time}</Text>
//           </View>
//           <View className='flex-row'>
//             <Text className='text-md font-bold text-white'>{props.prayer}</Text>
//           </View>
//         </View>
//         <View className="pl-5" />
//         <View className="bg-white p-1 rounded-full">
//           <Icon source={'check'} size={20} color="green" />
//         </View>
//       </BlurView>
//     </Pressable>
//   )
// }
// type TabButtonProps = {
//   props: BottomTabBarButtonProps,
//   items: TabArrayType
// }


// const TabButton = ({ props, items }: TabButtonProps) => {
//   const { onPress, accessibilityState, ...restProps } = props;
//   const focused = accessibilityState?.selected;
//   const textRef = useRef<any>(null);

//   useEffect(() => {
//     if (focused) {
//       textRef.current?.transitionTo({ scale: 1.2 });
//       Haptics.notificationAsync(
//         Haptics.NotificationFeedbackType.Success
//       )
//     } else {
//       textRef.current?.transitionTo({ scale: 0.8 });
//     }
//   }, [focused]);

//   return (
//     <TouchableOpacity
//       {...restProps}
//       onPress={onPress}
//       accessibilityState={accessibilityState}
//       style={{ alignItems: "center", flex: 1, marginTop: 7, height: '200%' }}
//     // style={{ alignItems: "center", flex: 1, marginTop: 8, height: '100%', paddingVertical: 6 }}
//     >
//       <Animatable.View
//         className='justify-center items-center'
//         style={{ width: 30, height: 20, justifyContent: "center", alignItems: "center" }}
//         animation="zoomIn"
//         duration={1000}
//       >
//         <Icon source={items?.icon} size={28} color={focused ? "#57BA47" : "#0D509D"} />
//       </Animatable.View>
//       <Animatable.Text
//         ref={textRef}
//         style={{ fontSize: 10, color: focused ? "#57BA47" : '#0D509D', textAlign: "center", fontWeight: focused ? "bold" : 'regular', opacity: focused ? 1 : 0.5 }}
//         numberOfLines={1}
//       >
//         {items?.title ? items?.title : ""}
//       </Animatable.Text>
//     </TouchableOpacity>
//   );
// }

const UserLayoutContent = () => {
  const { session, loading: authLoading } = useAuth();
  const { isOnboardingIncomplete, setOnboardingIncomplete, onboardingSheetRef } = useOnboarding();
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const segments = useSegments();
  const opacity = useSharedValue(1);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const guestPopupRef = useRef<{ present: () => void; dismiss: () => void }>(null);
  
  // Show account button only on home page (menu tab)
  // segments will be ['(user)', 'menu'] when on home page
  const isHomePage = segments.length >= 2 && segments[1] === 'menu' && segments[2] !== 'program';
  interface TextWithDefaultProps extends Text {
    defaultProps?: { allowFontScaling?: boolean };
  }

  // ((Text as unknown) as TextWithDefaultProps).defaultProps =
  //   ((Text as unknown) as TextWithDefaultProps).defaultProps || {};
  // ((Text as unknown) as TextWithDefaultProps).defaultProps!.allowFontScaling = false;
  // const playMASAnimation = useAnimatedStyle(() => {
  //   return {
  //     opacity: opacity.value,
  //   };
  // });

  // const handleAnimationEnd = () => {
  //   setLoading(false);
  //   // setShowTutorial(true); // Show tutorial after logo animation
  // };

  // const fadeOutAnimation = () => {
  //   opacity.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.quad) }, () => {
  //     runOnJS(handleAnimationEnd)();
  //   });
  // }

  // const handleTutorialFinish = () => {
  //   setShowTutorial(false);
  // };


  // Check onboarding status for non-anonymous users
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!session?.user || authLoading) return;
      
      // Skip for anonymous users - they get the CreateProfilePopup instead
      if (session.user.is_anonymous) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single();

        // Show PersonalizedAccount if:
        // 1. Profile doesn't exist (error) - shouldn't happen for logged in users
        // 2. Profile exists but onboarding_completed is false or null
        const shouldShowOnboarding = error || !profile || !profile.onboarding_completed;
        
        if (shouldShowOnboarding) {
          setShowOnboarding(true);
          setOnboardingIncomplete(true);
          setTimeout(() => {
            onboardingSheetRef.current?.present();
          }, 800);
        }
      } catch (error) {
        // On error, show onboarding to be safe
        setShowOnboarding(true);
        setOnboardingIncomplete(true);
        setTimeout(() => {
          onboardingSheetRef.current?.present();
        }, 800);
      }
    };

    checkOnboarding();
  }, [session?.user?.id, authLoading]);

  // Show create profile popup for guest/anonymous users
  useEffect(() => {
    const showGuestPrompt = async () => {
      if (!session?.user || authLoading) return;
      
      // Only show for anonymous users
      if (session.user.is_anonymous) {
        // Delay to let the app load first
        setTimeout(() => {
          setShowGuestPopup(true);
          guestPopupRef.current?.present();
        }, 1500);
      }
    };

    showGuestPrompt();
  }, [session?.user?.id, authLoading]);

  const handleGuestPopupDismiss = () => {
    setShowGuestPopup(false);
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    setOnboardingIncomplete(false);
    console.log('Profile personalization completed successfully');
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    setOnboardingIncomplete(true);
  };

  const handleReopenOnboarding = () => {
    setShowOnboarding(true);
    setTimeout(() => {
      onboardingSheetRef.current?.present();
    }, 100);
  };

  // Show nothing while checking authentication
  if (authLoading) {
    return null;
  }

  // Redirect to auth screen if not signed in
  if (!session) {
    return <Redirect href={'/(auth)/GreetingScreen'} />;
  }

  return (
    <BottomSheetModalProvider>
      {/* {loading && (
        <Animated.View style={[{ zIndex: 1, position: 'absolute', width: '100%', height: '100%' }, playMASAnimation]}>
          <LottieView
            autoPlay
            loop={false}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'white',
            }}
            source={require('@/assets/lottie/MASLogoAnimation3.json')}
            onAnimationFinish={() => {
              fadeOutAnimation();
            }}
            speed={1.5}
          />
        </Animated.View>
      )} */}

      <NativeTabs>
        {/* {TabArray.map((tab, i) => (
          <NativeTabs.Trigger key={i} name={`${tab.name}`} >
            <Label>{tab.title}</Label>
            <Icon sf={tab.icon as any} drawable="custom_android_drawable" />
          </NativeTabs.Trigger>
        ))} */}
        <NativeTabs.Trigger name="menu">
          <Label>Home</Label>
          <Icon sf="house.fill" drawable="custom_android_drawable" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="myPrograms">
          <Label>My Library</Label>
          <Icon sf="book" drawable="custom_android_drawable" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="prayersTable">
          <Label>Prayer Times</Label>
          <Icon sf="clock" drawable="custom_android_drawable" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="more">
          <Label>More</Label>
          <Icon sf="ellipsis.bubble.fill" drawable="custom_android_drawable" />
        </NativeTabs.Trigger>
      </NativeTabs>

      {(showOnboarding || isOnboardingIncomplete) && (
        <PersonalizedAccount
          ref={onboardingSheetRef}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Create Profile popup for guest users */}
      {showGuestPopup && (
        <CreateProfilePopup
          ref={guestPopupRef}
          onDismiss={handleGuestPopupDismiss}
        />
      )}

      {/* Badge indicator for incomplete onboarding */}
      {isOnboardingIncomplete && (
        <View
          style={{
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 28 : 18,
            right: 28,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: '#EF4444',
            borderWidth: 2,
            borderColor: '#ffffff',
            zIndex: 999,
          }}
        />
      )}
    </BottomSheetModalProvider>
  )
};

const UserLayout = () => {
  return (
    <OnboardingProvider>
      <UserLayoutContent />
    </OnboardingProvider>
  );
};

export default UserLayout;
