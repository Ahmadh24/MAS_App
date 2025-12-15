import { Tabs, Redirect, Slot } from "expo-router";
import * as Animatable from 'react-native-animatable';
import { Pressable, TouchableOpacity, Modal, StyleSheet } from "react-native";
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

const UserLayout = () => {
  const { session, loading: authLoading } = useAuth();
  // const [loading, setLoading] = useState(true);
  // // const [showTutorial, setShowTutorial] = useState(false);
  // const [accountModalVisible, setAccountModalVisible] = useState(false);
  // const opacity = useSharedValue(1);
  // interface TextWithDefaultProps extends Text {
  //   defaultProps?: { allowFontScaling?: boolean };
  // }

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


  // Show nothing while checking authentication
  if (authLoading) {
    return null;
  }

  // Redirect to auth screen if not signed in
  if (!session) {
    return <Redirect href={'/(auth)/GreetingScreen'} />;
  }

  return (
    // <>
    //   {loading && (
    //     <Animated.View style={[{ zIndex: 1, position: 'absolute', width: '100%', height: '100%' }, playMASAnimation]}>
    //       <LottieView
    //         autoPlay
    //         loop={false}
    //         style={{
    //           width: '100%',
    //           height: '100%',
    //           backgroundColor: 'white',
    //         }}
    //         source={require('@/assets/lottie/MASLogoAnimation3.json')}
    //         onAnimationFinish={() => {
    //           fadeOutAnimation();
    //         }}
    //         speed={1.5}
    //       />
    //     </Animated.View>
    //   )}

    <NativeTabs>
      {/* {TabArray.map((tab, i) => (
        <NativeTabs.Trigger key={i} name={`${tab.name}`} >
          <Label>{tab.title}</Label>
          <Icon sf={tab.icon as any} drawable="custom_android_drawable" />
        </NativeTabs.Trigger>
      ))} */}
      <NativeTabs.Trigger name="menu"
      >
        <Label>Home</Label>
        <Icon sf="house.fill" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="myPrograms"
      >
        <Label>My Library</Label>
        <Icon sf="book" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="prayersTable"
      >
        <Label>Prayer Times</Label>
        <Icon sf="clock" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more"
      >
        <Label>More</Label>
        <Icon sf="ellipsis.bubble.fill" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
    </NativeTabs>

  )
};

export default UserLayout;
