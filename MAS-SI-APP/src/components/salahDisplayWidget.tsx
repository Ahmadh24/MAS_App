import { View, Text, TouchableOpacity, Pressable, ImageBackground } from 'react-native'
import React, { useState, useEffect } from 'react'
import { gettingPrayerData } from '../types';
import { format } from 'date-fns';
import moment from 'moment';
import { Link } from 'expo-router';
import { Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
type salahDisplayWidgetProp = {
    prayer: gettingPrayerData,
    nextPrayer: gettingPrayerData
}
type timeProp = {
    time: string
}
type currentSalahProp = {
    salah: string,
    athan: string,
    iqamah: string
}
export default function SalahDisplayWidget({ prayer, nextPrayer }: salahDisplayWidgetProp) {
    const insets = useSafeAreaInsets();
    if (!prayer) {
        return
    }
    const salahArray = ["fajr", "dhuhr", "asr", "maghrib", "isha", "nextDayFajr"];
    const [liveTime, setLiveTime] = useState(new Date());
    const [salahIndex, setCurrentSalahIndex] = useState(0);
    const [currentSalah, setCurrentSalah] = useState<currentSalahProp>({
        salah: "Fajr",
        athan: prayer.athan_fajr,
        iqamah: prayer.iqa_fajr
    });
    const refreshLiveTime = () => {
        setLiveTime(new Date())
    }
    const onSetCurrentSalah = () => {
        if (salahArray[salahIndex] == "fajr") {
            const fajrSalah = {
                salah: "Fajr",
                athan: prayer.athan_fajr,
                iqamah: prayer.iqa_fajr
            }
            setCurrentSalah(fajrSalah)
        }
        else if (salahArray[salahIndex] == "dhuhr") {
            const dhuhrSalah = {
                salah: "Dhuhr",
                athan: prayer.athan_zuhr,
                iqamah: prayer.iqa_zuhr
            }
            setCurrentSalah(dhuhrSalah)

        }
        else if (salahArray[salahIndex] == "asr") {
            const asrSalah = {
                salah: "Asr",
                athan: prayer.athan_asr,
                iqamah: prayer.iqa_asr
            }
            setCurrentSalah(asrSalah)

        }
        else if (salahArray[salahIndex] == "maghrib") {
            const maghribSalah = {
                salah: "Maghrib",
                athan: prayer.athan_maghrib,
                iqamah: prayer.iqa_maghrib
            }
            setCurrentSalah(maghribSalah)

        }
        else if (salahArray[salahIndex] == "isha") {
            const ishaSalah = {
                salah: "Isha",
                athan: prayer.athan_isha,
                iqamah: prayer.iqa_isha
            }
            setCurrentSalah(ishaSalah)

        }
        else if (salahArray[salahIndex] == "nextDayFajr") {
            const nextDayFajrSalah = {
                salah: "Fajr",
                athan: nextPrayer.athan_fajr,
                iqamah: nextPrayer.iqa_fajr
            }
            setCurrentSalah(nextDayFajrSalah)

        }
    }

    const getTimeToNextPrayer = () => {
        const currentMoment = moment(currentTime, "HH:mm A")
        let iqamahMoment = moment(currentSalah.iqamah, "HH:mm A")

        // If showing next day's Fajr, only add a day if we're in the evening (after Isha)
        // Don't add a day if we're in early morning (before Fajr) - Fajr is later today
        if (salahIndex === 5) {
            const ishaMoment = moment(prayer.athan_isha, "HH:mm A")
            const fajrMoment = moment(prayer.athan_fajr, "HH:mm A")
            
            // Only add a day if current time is after Isha (evening hours)
            // If we're before Fajr (early morning), Fajr is later today, not tomorrow
            if (currentMoment.isAfter(ishaMoment)) {
                iqamahMoment.add(1, "day")
            }
        }

        // Calculate time until next iqamah
        const duration = moment.duration(iqamahMoment.diff(currentMoment))
        const hours = Math.floor(duration.asHours())
        const minutes = Math.abs(duration.minutes())

        // Handle negative duration (time has passed)
        if (duration.asMilliseconds() < 0) {
            // If iqamah has passed, show time until next prayer's athan
            let nextAthanMoment;

            if (salahIndex === 5) {
                // Already showing next day's Fajr, so next athan is Dhuhr of next day
                nextAthanMoment = moment(nextPrayer.athan_zuhr, "HH:mm A").add(1, "day")
            } else if (currentSalah.salah === 'Fajr') {
                nextAthanMoment = moment(prayer.athan_zuhr, "HH:mm A")
            } else if (currentSalah.salah === 'Dhuhr') {
                nextAthanMoment = moment(prayer.athan_asr, "HH:mm A")
            } else if (currentSalah.salah === 'Asr') {
                nextAthanMoment = moment(prayer.athan_maghrib, "HH:mm A")
            } else if (currentSalah.salah === 'Maghrib') {
                nextAthanMoment = moment(prayer.athan_isha, "HH:mm A")
            } else if (currentSalah.salah === 'Isha') {
                nextAthanMoment = moment(nextPrayer.athan_fajr, "HH:mm A").add(1, "day")
            } else {
                nextAthanMoment = moment(prayer.athan_zuhr, "HH:mm A")
            }

            const athanDuration = moment.duration(nextAthanMoment.diff(currentMoment))
            const athanHours = Math.floor(athanDuration.asHours())
            const athanMinutes = Math.abs(athanDuration.minutes())

            if (athanDuration.asMilliseconds() <= 0) {
                return 'Now'
            } else if (athanHours === 0) {
                return `${athanMinutes} mins`
            } else {
                return `${athanHours} hr ${athanMinutes} mins`
            }
        }

        // Time until iqamah
        if (hours === 0 && minutes === 0) {
            return 'Now'
        } else if (hours === 0) {
            return `${minutes} mins`
        } else {
            return `${hours} hr ${minutes} mins`
        }
    }

    const currentTime = liveTime.toLocaleTimeString("en-US", { hour12: true, hour: "numeric", minute: "numeric" });
    const timeToNextPrayer = getTimeToNextPrayer();
    const nextFajr = nextPrayer.iqa_fajr
    const nextFajrTime = moment(nextFajr, "HH::mm A");
    const nextFajrDay = nextFajrTime.add(1, "days");
    const midNight = moment("12:01AM", "HH:mm A");
    const nextDayMidnight = midNight.add(1, "days");
    const getTimeToMidNight = () => {
        const time1 = moment(currentTime, "HH:mm A");
        const time2 = nextDayMidnight;

        const duration = moment.duration(time2.diff(time1));
        return duration.asMilliseconds();
    }
    const compareTime = () => {
        const currentMoment = moment(currentTime, "HH:mm A");

        // Determine which prayer should be current based on current time
        const prayers = [
            { name: "fajr", time: prayer.athan_fajr, iqamah: prayer.iqa_fajr },
            { name: "dhuhr", time: prayer.athan_zuhr, iqamah: prayer.iqa_zuhr },
            { name: "asr", time: prayer.athan_asr, iqamah: prayer.iqa_asr },
            { name: "maghrib", time: prayer.athan_maghrib, iqamah: prayer.iqa_maghrib },
            { name: "isha", time: prayer.athan_isha, iqamah: prayer.iqa_isha },
        ];

        let newIndex = 0;

        // Check if we're after Isha (between Isha and next day's Fajr)
        const ishaMoment = moment(prayers[4].time, "HH:mm A");
        const nextFajrMoment = moment(nextPrayer.athan_fajr, "HH:mm A").add(1, "day");

        if (currentMoment.isAfter(ishaMoment) || currentMoment.isBefore(moment(prayers[0].time, "HH:mm A"))) {
            // After Isha or before Fajr (early morning), show next day's Fajr
            newIndex = 5; // nextDayFajr index
        } else {
            // Find the current prayer based on time
            for (let i = 0; i < prayers.length; i++) {
                const prayerMoment = moment(prayers[i].time, "HH:mm A");
                if (currentMoment.isBefore(prayerMoment)) {
                    newIndex = i;
                    break;
                }
            }
        }

        // Update if the index changed
        if (newIndex !== salahIndex) {
            setCurrentSalahIndex(newIndex);
            // onSetCurrentSalah will be called via useEffect dependency
        }
    }

    // Update current salah when salahIndex changes
    useEffect(() => {
        onSetCurrentSalah()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [salahIndex])

    // Compare time and update prayer whenever liveTime changes
    useEffect(() => {
        compareTime()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [liveTime, prayer, nextPrayer])

    // Set up interval to update time every second
    useEffect(() => {
        const timerId = setInterval(() => {
            refreshLiveTime()
        }, 1000)
        return function cleanup() {
            clearInterval(timerId)
        }
    }, [])
    return (
        <View>
            <Link href={"/prayersTable"} asChild>
                <Pressable>
                    <LinearGradient
                        colors={['#214E91', '#1a3d6f']} // Two background colors - adjust as needed
                        style={{ height: "100%", width: "100%", paddingTop: insets.top, paddingBottom: 80, justifyContent: "flex-end" }}
                    >
                        <ImageBackground
                            source={require("@/assets/images/LogoClear.png")}
                            style={{ height: "100%", width: "100%", position: "absolute", top: 0, left: 0 }}
                            resizeMode="contain"
                            imageStyle={{ opacity: .50, transform: [{ scale: 1.50 }], marginTop: 73 }}
                        />
                        {/* Top Section - Prayer Name and View All/Date */}
                        <View className='flex-row justify-between items-start px-5 mb-1'>
                            {/* Current Prayer and Time */}
                            <View className='flex-col items-start'>
                                <Text className='text-white font-bold text-4xl'>{currentTime}</Text>
                                {/* Next Iqamah Countdown */}
                                <View className='flex-row items-center mt-1'>
                                    <View style={{ marginRight: 4 }}>
                                        <Icon source="clock-outline" size={14} color="#FFFFFF" />
                                    </View>
                                    <Text className='text-white text-xs mr-2'>{currentSalah.salah} iqamah in</Text>
                                    <Text className='text-white font-bold text-base'>{timeToNextPrayer}</Text>
                                </View>
                            </View>

                            {/* Date and View All */}
                            <View className='flex-col items-end'>
                                <Text className='text-white font-bold text-base mb-1' numberOfLines={1}>{prayer.hijri_month} {prayer.hijri_date}</Text>
                                <Pressable
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        borderRadius: 16,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginTop: 4,
                                    }}
                                >
                                    <Text className='text-white text-xs font-medium'>View all prayer times</Text>
                                    <View style={{ marginLeft: 4 }}>
                                        <Icon source="chevron-right" size={14} color="#FFFFFF" />
                                    </View>
                                </Pressable>
                            </View>
                        </View>

                        {/* All Prayer Times Grid */}
                        <View className='flex-row justify-around px-3 mt-12'>
                            {/* Fajr */}
                            <View className='items-center' style={{
                                backgroundColor: currentSalah.salah === 'Fajr' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                borderRadius: 12,
                                transform: currentSalah.salah === 'Fajr' ? [{ scale: 1.05 }] : [{ scale: 1 }],
                                shadowColor: currentSalah.salah === 'Fajr' ? '#000' : 'transparent',
                                shadowOffset: currentSalah.salah === 'Fajr' ? { width: 0, height: 2 } : { width: 0, height: 0 },
                                shadowOpacity: currentSalah.salah === 'Fajr' ? 0.2 : 0,
                                shadowRadius: currentSalah.salah === 'Fajr' ? 4 : 0,
                                elevation: currentSalah.salah === 'Fajr' ? 3 : 0,
                            }}>
                                <Text className='text-white text-xs mb-1'>Fajr</Text>
                                <Icon source={'weather-night'} size={currentSalah.salah === 'Fajr' ? 26 : 24} color='#FFFFFF' />
                                <Text className='text-white font-semibold text-sm mt-1'>{prayer.athan_fajr}</Text>
                            </View>

                            {/* Dhuhr */}
                            <View className='items-center' style={{
                                backgroundColor: currentSalah.salah === 'Dhuhr' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                borderRadius: 12,
                                transform: currentSalah.salah === 'Dhuhr' ? [{ scale: 1.05 }] : [{ scale: 1 }],
                                shadowColor: currentSalah.salah === 'Dhuhr' ? '#000' : 'transparent',
                                shadowOffset: currentSalah.salah === 'Dhuhr' ? { width: 0, height: 2 } : { width: 0, height: 0 },
                                shadowOpacity: currentSalah.salah === 'Dhuhr' ? 0.2 : 0,
                                shadowRadius: currentSalah.salah === 'Dhuhr' ? 4 : 0,
                                elevation: currentSalah.salah === 'Dhuhr' ? 3 : 0,
                            }}>
                                <Text className='text-white text-xs mb-1'>Dhuhr</Text>
                                <Icon source={'weather-sunny'} size={currentSalah.salah === 'Dhuhr' ? 26 : 24} color='#FFFFFF' />
                                <Text className='text-white font-semibold text-sm mt-1'>{prayer.athan_zuhr}</Text>
                            </View>

                            {/* Asr */}
                            <View className='items-center' style={{
                                backgroundColor: currentSalah.salah === 'Asr' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                borderRadius: 12,
                                transform: currentSalah.salah === 'Asr' ? [{ scale: 1.05 }] : [{ scale: 1 }],
                                shadowColor: currentSalah.salah === 'Asr' ? '#000' : 'transparent',
                                shadowOffset: currentSalah.salah === 'Asr' ? { width: 0, height: 2 } : { width: 0, height: 0 },
                                shadowOpacity: currentSalah.salah === 'Asr' ? 0.2 : 0,
                                shadowRadius: currentSalah.salah === 'Asr' ? 4 : 0,
                                elevation: currentSalah.salah === 'Asr' ? 3 : 0,
                            }}>
                                <Text className='text-white text-xs mb-1'>Asr</Text>
                                <Icon source={'weather-partly-cloudy'} size={currentSalah.salah === 'Asr' ? 26 : 24} color='#FFFFFF' />
                                <Text className='text-white font-semibold text-sm mt-1'>{prayer.athan_asr}</Text>
                            </View>

                            {/* Maghrib */}
                            <View className='items-center' style={{
                                backgroundColor: currentSalah.salah === 'Maghrib' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                borderRadius: 12,
                                transform: currentSalah.salah === 'Maghrib' ? [{ scale: 1.05 }] : [{ scale: 1 }],
                                shadowColor: currentSalah.salah === 'Maghrib' ? '#000' : 'transparent',
                                shadowOffset: currentSalah.salah === 'Maghrib' ? { width: 0, height: 2 } : { width: 0, height: 0 },
                                shadowOpacity: currentSalah.salah === 'Maghrib' ? 0.2 : 0,
                                shadowRadius: currentSalah.salah === 'Maghrib' ? 4 : 0,
                                elevation: currentSalah.salah === 'Maghrib' ? 3 : 0,
                            }}>
                                <Text className='text-white text-xs mb-1'>Maghrib</Text>
                                <Icon source={'weather-sunset'} size={currentSalah.salah === 'Maghrib' ? 26 : 24} color='#FFFFFF' />
                                <Text className='text-white font-semibold text-sm mt-1'>{prayer.athan_maghrib}</Text>
                            </View>

                            {/* Isha */}
                            <View className='items-center' style={{
                                backgroundColor: currentSalah.salah === 'Isha' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                borderRadius: 12,
                                transform: currentSalah.salah === 'Isha' ? [{ scale: 1.05 }] : [{ scale: 1 }],
                                shadowColor: currentSalah.salah === 'Isha' ? '#000' : 'transparent',
                                shadowOffset: currentSalah.salah === 'Isha' ? { width: 0, height: 2 } : { width: 0, height: 0 },
                                shadowOpacity: currentSalah.salah === 'Isha' ? 0.2 : 0,
                                shadowRadius: currentSalah.salah === 'Isha' ? 4 : 0,
                                elevation: currentSalah.salah === 'Isha' ? 3 : 0,
                            }}>
                                <Text className='text-white text-xs mb-1'>Isha</Text>
                                <Icon source={'moon-waning-crescent'} size={currentSalah.salah === 'Isha' ? 26 : 24} color='#FFFFFF' />
                                <Text className='text-white font-semibold text-sm mt-1'>{prayer.athan_isha}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </Pressable>
            </Link>
        </View>
    )
}