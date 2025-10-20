import { Tabs, Redirect } from "expo-router";
import * as Animatable from 'react-native-animatable';
import { Pressable, TouchableOpacity } from "react-native";
import { useEffect, useRef, useState } from "react";
import TabArray from './tabArray';
import { TabArrayType } from '@/src/types';
import { Icon } from "react-native-paper";
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useAuth } from "@/src/providers/AuthProvider";
import LottieView from 'lottie-react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, runOnJS, FadeIn } from 'react-native-reanimated';
import Toast from 'react-native-toast-message'
import { View, Text, Image } from 'react-native'
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics'
import TutorialOverlay from "@/src/components/TutorialOverlay";

const toastConfig = {
  addProgramToNotificationsToast : ( {props} : any ) => (
    <Pressable className='rounded-xl overflow-hidden ' onPress={props.onPress}>
        <BlurView intensity={40} className='flex-row items-center justify-between px-4 rounded-xl p-1 max-w-[85%] max-h-[60]' 
        experimentalBlurMethod={'dimezisBlurView'}
        >
          <View>
              <Image source={props.props.program_img ? { uri : props.props.program_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width : 50, height : 50 , objectFit : 'fill', borderRadius : 10 }}/>
          </View>
          <View className='flex-col pl-2'>
            <View>
              <Text>1 Program Added To Notifications</Text>
            </View>
            <View className='flex-row'>
              <Text className='text-sm'>{props.props.program_name}</Text>
              <Icon source={'chevron-right'} size={20} />
            </View>
          </View>
        </BlurView>
      </Pressable>
  ),
  LectureAddedToPlaylist : ( {props} : any) => (
    <Pressable className='rounded-xl overflow-hidden' onPress={props.onPress}>
        <BlurView intensity={40} className='flex-row items-center justify-between px-3 p-1 max-w-[85%] max-h-[60]'
        experimentalBlurMethod={'dimezisBlurView'}
        >
          <View className=''>
              <Image source={props.props?.playlist_img  ? { uri : props.props.playlist_img } : require("@/assets/images/MASHomeLogo.png") } style={{ width : 50, height : 50 , objectFit : 'fill', borderRadius : 10 }}/>
          </View>
          <View className='flex-col pl-2'>
            <View>
              <Text numberOfLines={1} allowFontScaling adjustsFontSizeToFit >1 lecture added</Text>
            </View>
            <View className='flex-row'>
              <Text>{props.props?.playlist_name}</Text>
              <Icon source={'chevron-right'} size={20} />
            </View>
          </View>
        </BlurView>
      </Pressable>
  ),
  ProgramAddedToPrograms : ({props} : any) => (
    <Pressable className='rounded-xl overflow-hidden ' onPress={props.onPress}>
        <BlurView intensity={40} className='flex-row items-center justify-between px-4 rounded-xl p-1 max-w-[85%] max-h-[60]' 
        experimentalBlurMethod={'dimezisBlurView'}
        >
          <View>
              <Image source={ props.props.program_img  ? { uri : props.props.program_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width : 50, height : 50 , objectFit : 'fill', borderRadius : 10 }}/>
          </View>
          <View className='flex-col pl-2'>
            <View>
              <Text>1 Program Added to Library</Text>
            </View>
            <View className='flex-row'>
              <Text className='text-sm'>{props.props.program_name}</Text>
              <Icon source={'chevron-right'} size={20} />
            </View>
          </View>
        </BlurView>
      </Pressable>
  ),
  addEventToNotificationsToast : ( {props} : any ) => (
    <Pressable className='rounded-xl overflow-hidden ' onPress={props.onPress}>
        <BlurView intensity={40} className='flex-row items-center justify-between px-4 rounded-xl p-1 max-w-[85%] max-h-[60]' 
        experimentalBlurMethod={'dimezisBlurView'}
        >
          <View>
              <Image source={props.props.event_img ? { uri :  props.props.event_img } : require("@/assets/images/MASHomeLogo.png") } style={{ width : 50, height : 50 , objectFit : 'fill', borderRadius : 10 }}/>
          </View>
          <View className='flex-col pl-2'>
            <View>
              <Text>1 Program Added To Notifications</Text>
            </View>
            <View className='flex-row'>
              <Text className='text-sm'>{props.props.event_name}</Text>
              <Icon source={'chevron-right'} size={20} />
            </View>
          </View>
        </BlurView>
      </Pressable>
  ),
  ConfirmNotificationOption : ( { props } : any ) => (
    <Pressable className='rounded-xl overflow-hidden ' onPress={props.onPress}>
      <BlurView intensity={40} className='flex-row items-center justify-between px-4 rounded-xl p-2 max-w-[90%] max-h-[60]' 
      experimentalBlurMethod={'dimezisBlurView'}
      >

        <View className='flex-col pl-2'>
          <View>
            <Text className="text-white">{props.message} : {props.time}</Text>
          </View>
          <View className='flex-row'>
            <Text className='text-md font-bold text-white'>{props.prayer}</Text>
          </View>
        </View>
        <View className="pl-5"/>
        <View className="bg-white p-1 rounded-full">
              <Icon source={'check'} size={20} color="green"/>
        </View>
      </BlurView>
    </Pressable>
  )
}
type TabButtonProps = {
  props: BottomTabBarButtonProps,
  items: TabArrayType
}

const TabButton = ({ props, items }: TabButtonProps) => {
  const { onPress, accessibilityState } = props;
  const focused = accessibilityState?.selected;
  const textRef = useRef<any>(null);

  useEffect(() => {
    if (focused) {
      textRef.current?.transitionTo({ scale: 1.2 });
      Haptics.notificationAsync (
        Haptics.NotificationFeedbackType.Success
      )
    } else {
      textRef.current?.transitionTo({ scale: 0.8 });
    }
  }, [focused]);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ alignItems: "center", flex: 1, marginTop: 7, height : '200%' }}
    >
      <Animatable.View
        className='justify-center items-center'
        style={{ width: 30, height: 20, justifyContent: "center", alignItems: "center" }}
        animation="zoomIn"
        duration={1000}
      >
        <Icon source={items?.icon} size={20} color={focused ? "#57BA47" : "#0D509D"} />
      </Animatable.View>
      <Animatable.Text
        ref={textRef}
        style={{ fontSize: 10, color: focused ? "#57BA47" : '#0D509D', textAlign: "center", fontWeight: focused ? "bold"  : 'regular', opacity : focused ? 1 : 0.5 }}
        numberOfLines={1}
      >
        {items?.title ? items?.title : ""}
      </Animatable.Text>
    </TouchableOpacity>
  );
}

const UserLayout = () => {
  const { session, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const opacity = useSharedValue(1);
  interface TextWithDefaultProps extends Text {
    defaultProps?: { allowFontScaling?: boolean };
  }

  ((Text as unknown) as TextWithDefaultProps).defaultProps =
  ((Text as unknown) as TextWithDefaultProps).defaultProps || {};
  ((Text as unknown) as TextWithDefaultProps).defaultProps!.allowFontScaling = false;
  const playMASAnimation = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const handleAnimationEnd = () => {
    setLoading(false);
    setShowTutorial(true); // Show tutorial after logo animation
  };

  const fadeOutAnimation = () => {
    opacity.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.quad) }, () => {
      runOnJS(handleAnimationEnd)();
    });
  }

  const handleTutorialFinish = () => {
    setShowTutorial(false);
  };

  if (!session) {
    return <Redirect href={'/GreetingScreen'} />;
  }

  if (authLoading) {
    return null;
  }

  return (
    <>
      {loading && (
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
      )}
      
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: "white",
            height: 50,
            position: "absolute",
            bottom: 16,
            right: 16,
            left: 16,
            borderRadius: 16,
            marginBottom: 5,
            shadowColor: "black",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 8,
            justifyContent: "center",
            alignItems: "center",
            
          },
          tabBarItemStyle: { height: 30, },
        }}
      >
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="tabArray" options={{ href: null }} />

        {TabArray.map((tab, i) => (
          <Tabs.Screen
            key={i}
            name={tab.name}
            options={{
              title: tab.title,
              headerShown: false,
              tabBarButton: (props) => <TabButton items={TabArray[i]} props={{ ...props }} />,
              tabBarAllowFontScaling : false,
              headerTitleAllowFontScaling : false
            }}
            
          />
        ))}
      </Tabs>
      <Toast config={toastConfig}/>
      {showTutorial && <TutorialOverlay visible={showTutorial} onClose={handleTutorialFinish} />}
    </>
  );
};

export default UserLayout;

