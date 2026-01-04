import { View, Text, useWindowDimensions, Dimensions, StatusBar, Image, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { Stack, useLocalSearchParams } from 'expo-router'
import TarawihCards from './_tarawihCards'
import { usePrayerTimes } from '@/src/hooks/usePrayerTimes'
import { LinearGradient } from 'expo-linear-gradient'

const TarawihDetails = () => {
  const { tarawihName, tarawihTitle } = useLocalSearchParams()
  const { data: prayerTimesWeek } = usePrayerTimes();

  const [selectedNotification, setSelectedNotification] = useState<number[]>([])
  const layout = useWindowDimensions().width
  const layoutHeight = useWindowDimensions().height
  const NOTICARDHEIGHT = layoutHeight / 12
  const NOTICARDWIDTH = layout * 0.8
  const { width } = Dimensions.get("window");

  if (!prayerTimesWeek || prayerTimesWeek.length === 0) {
    return null;
  }

  const FirstTaraweehTime = setTimeToCurrentDate(convertTo24Hour(prayerTimesWeek[0].iqa_isha))
  const FirstTaraweehEndTime = new Date(FirstTaraweehTime).setHours(FirstTaraweehTime.getHours() + 1)
  let SecondTaraweehTime = setTimeToCurrentDate(convertTo24Hour(prayerTimesWeek[0].iqa_isha))
  const SecondTaraweehEndTime = new Date(FirstTaraweehTime).setHours(FirstTaraweehTime.getHours() + 2)
  SecondTaraweehTime.setHours(FirstTaraweehTime.getHours() + 1, FirstTaraweehTime.getMinutes() + 20)
  return (
    <LinearGradient
      colors={['#1d4681', '#3183bf']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 40, paddingTop: 20 }}>
        <Stack.Screen options={{ 
          headerTitle: 'Taraweeh Settings', 
          headerBackTitle: '', 
          headerBackTitleVisible: false, 
          headerStyle: { backgroundColor: "transparent" },
          headerTransparent: true,
          headerTintColor: 'white',
        }} />
        <StatusBar barStyle={'light-content'} />
        <View className='mt-4'>
          <Image
            source={require('@/assets/images/TarawihNotiCard.jpeg')}
            style={{ width: width / 2, height: 200, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }}
            resizeMode='stretch'
          />
        </View>
        <View style={{ width: '100%', paddingVertical: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 24, textAlign: 'center', color: 'white' }}>{tarawihTitle}</Text>
        </View>
        <View style={{ marginLeft: 8, width: '100%', paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: 'white' }}>Notification Options</Text>
        </View>
        <View style={{ width: '100%', alignItems: 'center', paddingTop: 12 }}>
          {
            [1, 2, 3].map((item, idx) => (
              <TarawihCards key={idx} jummah={tarawihName} height={NOTICARDHEIGHT} width={NOTICARDWIDTH} item={item} index={idx} setSelectedNotification={setSelectedNotification} selectedNotification={selectedNotification} tarawihName={tarawihName} tarawihTime={tarawihName == 'Tarawih One' ? FirstTaraweehTime : SecondTaraweehTime} />
            ))
          }
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

export default TarawihDetails

function setTimeToCurrentDate(timeString: string) {

  const currentDate = new Date(); // Get current date

  // Split the time string into hours, minutes, and seconds
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  // Create a new Date object with the current date
  const timestampWithTimeZone = new Date();

  // Set the time with setHours (adjust based on local timezone or UTC as needed)
  timestampWithTimeZone.setHours(hours, minutes, seconds, 0); // No milliseconds

  // Convert to ISO format with timezone (to ensure it's interpreted as a TIMESTAMPTZ)
  const timestampISO = timestampWithTimeZone // This gives a full timestamp with timezone in UTC

  return timestampISO
}

function convertTo24Hour(timeStr: string) {
  // Extract the period ("AM"/"PM") and the time part ("7:15")
  const period = timeStr.slice(-2).toUpperCase();
  const [hourStr, minuteStr] = timeStr.slice(0, -2).split(":");
  let hour = parseInt(hourStr, 10);

  // Adjust hour based on period
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  // Format hour and minute to two digits and add seconds ":00"
  const hh = hour.toString().padStart(2, '0');
  const mm = minuteStr.padStart(2, '0');
  return `${hh}:${mm}:00`;
}
function convertEpochToDate(epochTime: number) {
  return new Date(epochTime * 1000);
}