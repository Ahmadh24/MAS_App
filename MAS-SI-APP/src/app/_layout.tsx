import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import PrayerTimesProvider from '../providers/prayerTimesProvider';
import { useColorScheme } from '../../hooks/useColorScheme';
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { MenuProvider } from "react-native-popup-menu";
import AuthProvider from '../providers/AuthProvider';
import { StripeProvider } from '@stripe/stripe-react-native';
//import NotificationProvider from '../providers/NotificationProvider';
import { Text } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, { useSharedValue, withTiming, runOnJS, useAnimatedStyle } from 'react-native-reanimated';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showLogo, setShowLogo] = useState(true);
  const [isFirstLaunchChecked, setIsFirstLaunchChecked] = useState(false);
  const logoOpacity = useSharedValue(1);

  interface TextWithDefaultProps extends Text {
    defaultProps?: { allowFontScaling?: boolean };
  }

  ((Text as unknown) as TextWithDefaultProps).defaultProps =
    ((Text as unknown) as TextWithDefaultProps).defaultProps || {};
  ((Text as unknown) as TextWithDefaultProps).defaultProps!.allowFontScaling = false;

  const [loaded] = useFonts({
    SpaceMono: require("../../assets/fonts/SpaceMono-Regular.ttf"),
    Oleo: require("../../assets/fonts/OleoScript-Regular.ttf"),
    Poppins_400Regular: require("../../assets/fonts/Poppins-Regular.ttf"),
    Poppins_500Medium: require("../../assets/fonts/Poppins-Medium.ttf"),
    Poppins_600SemiBold: require("../../assets/fonts/Poppins-SemiBold.ttf"),
    Poppins_700Bold: require("../../assets/fonts/Poppins-Bold.ttf"),
    Poppins_800ExtraBold: require("../../assets/fonts/Poppins-ExtraBold.ttf"),
  });

  // ✅ Clear AsyncStorage on every launch (for testing)
  useEffect(() => {
    const clearAsyncStorage = async () => {
      try {
        await AsyncStorage.clear();
        console.log('✅ AsyncStorage cleared!');
      } catch (e) {
        console.error('❌ Failed to clear AsyncStorage', e);
      }
      setIsFirstLaunchChecked(true); // Set this after clearing AsyncStorage
    };

    clearAsyncStorage();
  }, []);

  // ✅ Logo fade animation
  const logoAnimation = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  const hideLogo = () => {
    logoOpacity.value = withTiming(0, { duration: 600 }, () => {
      runOnJS(setShowLogo)(false);
    });
  };

  useEffect(() => {
    async function hideSplash() {
      await SplashScreen.preventAutoHideAsync();
      if (loaded && isFirstLaunchChecked) {
        await SplashScreen.hideAsync();
        setTimeout(() => {
          hideLogo();
        }, 3500); // Duration to show the logo screen before fading
      }
    }
    hideSplash();
  }, [loaded, isFirstLaunchChecked]);

  if (!loaded || !isFirstLaunchChecked) {
    return null; // Wait until fonts and AsyncStorage are ready
  }

  return (
    <GestureHandlerRootView>
      <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}>
        <AuthProvider>
          <PrayerTimesProvider>
             {/* <NotificationProvider> */}
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <BottomSheetModalProvider>
                <MenuProvider>
                  <PaperProvider>
                    {/* ✅ Show animated logo once */}
                    {showLogo && (
                      <Animated.View style={[{ position: 'absolute', zIndex: 10, width: '100%', height: '100%' }, logoAnimation]}>
                        <LottieView
                          autoPlay
                          loop={false}
                          source={require("@/assets/lottie/MASLogoAnimation3.json")}
                          style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
                          speed={1.5}
                        />
                      </Animated.View>
                    )}

                    {/* ✅ Main App */}
                    <Stack key="main-app">
                      <Stack.Screen name="(user)" options={{ headerShown: false, animation: 'none' }} />
                      <Stack.Screen name="(auth)" options={{ headerShown: false, animation: 'none' }} />
                      <Stack.Screen name="+not-found" options={{ animation: 'none' }} />
                    </Stack>
                  </PaperProvider>
                </MenuProvider>
              </BottomSheetModalProvider>
            </ThemeProvider>
             {/* </NotificationProvider>  */}
          </PrayerTimesProvider>
        </AuthProvider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}

