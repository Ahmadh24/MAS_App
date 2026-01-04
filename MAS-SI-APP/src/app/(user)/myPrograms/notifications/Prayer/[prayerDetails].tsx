import { Dimensions, Image, ImageSourcePropType, ScrollView, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import React, { useState } from 'react'
import { Stack, useLocalSearchParams } from 'expo-router'
import NotificationCard from './PrayerNotificationCard';
import { format } from 'date-fns';
import { Button } from 'react-native-paper';
import { supabase } from '@/src/lib/supabase';
import { err } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';


type PrayerDetailsParams = {
  prayerName?: string;
  prayerImage?: ImageSourcePropType
};
const getCurrDate = new Date();
getCurrDate.setDate(getCurrDate.getDate())
const getWeekDate = new Date();
const currDate = format(getCurrDate, "yyyy-MM-dd");
getWeekDate.setDate(getCurrDate.getDate() + 6)
const weekDate = format(getWeekDate, "yyyy-MM-dd");
const MASJID_TIMES_API = `https://masjidal.com/api/v1/time/range?masjid_id=3OA8V3Kp&from_date=${currDate}&to_date=${weekDate}`;
const forEachValue = async (value: string, value2: string) => {
  if (value == 'fajr' || value == 'asr' || value == 'zuhr' || value == 'isha' || value == 'maghrib') {
    console.log(value)
    const timeString = value2
    const date = new Date();

    // Extract hours and minutes from the time string
    const [time, period] = timeString.split(/(AM|PM)/);
    let [hours, minutes] = time.split(":").map(Number);

    // Convert to 24-hour format based on AM/PM
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    // Set the hours and minutes on the Date object
    date.setHours(hours, minutes, 0, 0);

    // Convert to ISO string (or another format)
    const timestampz = date.toISOString();

    console.log(timestampz); // Outputs the ISO timestamp with timezone
  }
}
const prayerDetails = () => {

  const { prayerName, prayerImage } = useLocalSearchParams<PrayerDetailsParams>();
  const { width } = Dimensions.get("window");
  const [scrollY, setScrollY] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<number[]>([])
  const layout = useWindowDimensions().width
  const layoutHeight = useWindowDimensions().height
  const NOTICARDHEIGHT = layoutHeight / 12
  const NOTICARDWIDTH = layout * 0.8
  const notificationArray = [
    "Alert at Athan time",
    "Alert 30 mins before next prayer",
    "Alert at Iqamah time",
    "Mute"
  ]
  return (
    <LinearGradient
      colors={['#1d4681', '#3183bf']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: "center", paddingBottom: 40, paddingTop: 20 }}>
        <StatusBar barStyle={"light-content"} />
        <Stack.Screen options={{ 
          title: prayerName, 
          headerBackTitleVisible: false, 
          headerTintColor: 'white', 
          headerStyle: { backgroundColor: "transparent" },
          headerTransparent: true,
        }} />
        <View className='mt-4'>
          <Image
            source={prayerImage}
            style={{ width: width / 2, height: 200, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }}
            resizeMode='stretch'
          />
        </View>
        <View style={{ width: '100%', paddingVertical: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 24, textAlign: 'center', color: 'white' }}>{prayerName}</Text>
        </View>
        <View style={{ marginLeft: 8, width: '100%', paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: 'white' }}>Notification Options</Text>
        </View>

        <View style={{ width: '100%', alignItems: 'center', paddingTop: 12 }}>
          {
            notificationArray.map((item, index) => {
              return (
                <View className='flex-col' key={index}>
                  <View className='flex-row items-center justify-center'>
                    <NotificationCard height={NOTICARDHEIGHT} width={NOTICARDWIDTH} item={item} index={index} scrollY={scrollY} setSelectedNotification={setSelectedNotification} selectedNotification={selectedNotification} prayerName={prayerName!} />
                  </View>
                  <View style={{ height: 10 }} />
                </View>
              )
            })
          }
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

export default prayerDetails
