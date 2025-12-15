import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { gettingPrayerData } from '@/src/types';
import { ThePrayerData } from '@/src/components/getPrayerData';
import { useState, useEffect, useMemo } from 'react';
import moment from 'moment';
import { format } from 'date-fns';

/**
 * Shared hook for current time - single timer used across all prayer time hooks
 * This prevents multiple timers running simultaneously (performance optimization)
 */
const useCurrentTime = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timerId);
    }, []);

    return currentTime;
};

/**
 * Utility function to format time string for moment parsing
 */
const formatTimeForMoment = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
        hour12: true,
        hour: 'numeric',
        minute: 'numeric',
    });
};

/**
 * Utility function to get prayer times array
 */
const getPrayerTimesArray = (prayer: gettingPrayerData) => {
    return [
        { name: 'Fajr', time: prayer.athan_fajr, iqamah: prayer.iqa_fajr },
        { name: 'Dhuhr', time: prayer.athan_zuhr, iqamah: prayer.iqa_zuhr },
        { name: 'Asr', time: prayer.athan_asr, iqamah: prayer.iqa_asr },
        { name: 'Maghrib', time: prayer.athan_maghrib, iqamah: prayer.iqa_maghrib },
        { name: 'Isha', time: prayer.athan_isha, iqamah: prayer.iqa_isha },
    ];
};

/**
 * Main hook to fetch prayer times from Supabase
 */
export const usePrayerTimes = () => {
    return useQuery({
        queryKey: ['prayerTimes'],
        queryFn: async () => {
            const { data: prayerTimes, error } = await supabase
                .from('prayers')
                .select('*')
                .eq('id', 1)
                .single();

            if (error) {
                console.error('Error fetching prayers:', error);
                throw error;
            }

            if (!prayerTimes) {
                throw new Error('No prayer times data found');
            }

            // Transform the data using the existing helper
            const weekInfo: gettingPrayerData[] = ThePrayerData({ prayerTimes });
            return weekInfo;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });
};

/**
 * Hook to get today's prayer data
 */
export const useTodayPrayer = () => {
    const { data: prayerTimesWeek } = usePrayerTimes();

    return useMemo(() => {
        if (!prayerTimesWeek || prayerTimesWeek.length === 0) {
            return null;
        }

        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');

        return prayerTimesWeek.find(prayer => prayer.date === todayStr) || prayerTimesWeek[0];
    }, [prayerTimesWeek]);
};

/**
 * Hook to get tomorrow's prayer data
 */
export const useTomorrowPrayer = () => {
    const { data: prayerTimesWeek } = usePrayerTimes();

    return useMemo(() => {
        if (!prayerTimesWeek || prayerTimesWeek.length === 0) {
            return null;
        }

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

        return prayerTimesWeek.find(prayer => prayer.date === tomorrowStr) || prayerTimesWeek[1] || prayerTimesWeek[0];
    }, [prayerTimesWeek]);
};

/**
 * Hook to calculate the current prayer based on current time
 */
export const useCurrentPrayer = () => {
    const prayer = useTodayPrayer();
    const nextPrayer = useTomorrowPrayer();
    const currentTime = useCurrentTime(); // Use shared timer

    return useMemo(() => {
        if (!prayer || !nextPrayer) {
            return '';
        }

        const currentTimeStr = formatTimeForMoment(currentTime);
        const currentMoment = moment(currentTimeStr, 'HH:mm A');
        const prayers = getPrayerTimesArray(prayer);

        // Check if we're after Isha (between Isha and next day's Fajr)
        const ishaMoment = moment(prayers[4].time, 'HH:mm A');
        const fajrMoment = moment(prayers[0].time, 'HH:mm A');

        if (currentMoment.isAfter(ishaMoment) || currentMoment.isBefore(fajrMoment)) {
            // After Isha or before Fajr (early morning), current prayer is Isha (showing next day's Fajr)
            return 'Isha';
        }

        // Find the current prayer based on time
        for (let i = 0; i < prayers.length; i++) {
            const prayerMoment = moment(prayers[i].time, 'HH:mm A');
            if (currentMoment.isBefore(prayerMoment)) {
                // Return the previous prayer, or Isha if it's the first one (before Fajr means after Isha)
                if (i === 0) {
                    return 'Isha';
                }
                return prayers[i - 1].name;
            }
        }

        // If we've passed all prayers today, return Isha
        return 'Isha';
    }, [prayer, nextPrayer, currentTime]);
};

/**
 * Hook to calculate the upcoming prayer
 */
export const useUpcomingPrayer = () => {
    const prayer = useTodayPrayer();
    const nextPrayer = useTomorrowPrayer();
    const currentTime = useCurrentTime(); // Use shared timer

    return useMemo(() => {
        if (!prayer || !nextPrayer) {
            return '';
        }

        const currentTimeStr = formatTimeForMoment(currentTime);
        const currentMoment = moment(currentTimeStr, 'HH:mm A');
        const prayers = getPrayerTimesArray(prayer);

        // Check if we're after Isha (between Isha and next day's Fajr)
        const ishaMoment = moment(prayers[4].time, 'HH:mm A');
        const fajrMoment = moment(prayers[0].time, 'HH:mm A');

        if (currentMoment.isAfter(ishaMoment) || currentMoment.isBefore(fajrMoment)) {
            // After Isha or before Fajr, next prayer is next day's Fajr
            return 'Fajr';
        }

        // Find the next upcoming prayer
        for (let i = 0; i < prayers.length; i++) {
            const prayerMoment = moment(prayers[i].time, 'HH:mm A');
            if (currentMoment.isBefore(prayerMoment)) {
                return prayers[i].name;
            }
        }

        // If we've passed all prayers today, next is tomorrow's Fajr
        return 'Fajr';
    }, [prayer, nextPrayer, currentTime]);
};

/**
 * Utility function to format time duration
 */
const formatTimeDuration = (hours: number, minutes: number): string => {
    if (hours === 0 && minutes === 0) {
        return 'Now';
    } else if (hours === 0) {
        return `${minutes} mins`;
    } else {
        return `${hours} hr ${minutes} mins`;
    }
};

/**
 * Hook to calculate time to next prayer
 */
export const useTimeToNextPrayer = () => {
    const prayer = useTodayPrayer();
    const nextPrayer = useTomorrowPrayer();
    const currentTime = useCurrentTime(); // Use shared timer

    return useMemo(() => {
        if (!prayer || !nextPrayer) {
            return '';
        }

        const currentTimeStr = formatTimeForMoment(currentTime);
        const currentMoment = moment(currentTimeStr, 'HH:mm A');
        const prayers = getPrayerTimesArray(prayer);

        // Determine which prayer index we're at
        let salahIndex = 0;
        const ishaMoment = moment(prayers[4].time, 'HH:mm A');
        const fajrMoment = moment(prayers[0].time, 'HH:mm A');

        if (currentMoment.isAfter(ishaMoment) || currentMoment.isBefore(fajrMoment)) {
            salahIndex = 5; // nextDayFajr
        } else {
            for (let i = 0; i < prayers.length; i++) {
                const prayerMoment = moment(prayers[i].time, 'HH:mm A');
                if (currentMoment.isBefore(prayerMoment)) {
                    salahIndex = i;
                    break;
                }
            }
        }

        // Get the current salah based on index
        let currentSalah: { salah: string; iqamah: string; athan: string } | null = null;

        if (salahIndex === 5) {
            currentSalah = {
                salah: 'Fajr',
                iqamah: nextPrayer.iqa_fajr,
                athan: nextPrayer.athan_fajr,
            };
        } else {
            const prayerData = prayers[salahIndex];
            currentSalah = {
                salah: prayerData.name,
                iqamah: prayerData.iqamah,
                athan: prayerData.time,
            };
        }

        if (!currentSalah) {
            return '';
        }

        let iqamahMoment = moment(currentSalah.iqamah, 'HH:mm A');

        // If showing next day's Fajr, add a day to the iqamah time
        if (salahIndex === 5) {
            iqamahMoment.add(1, 'day');
        }

        // Calculate time until next iqamah
        const duration = moment.duration(iqamahMoment.diff(currentMoment));
        const hours = Math.floor(duration.asHours());
        const minutes = Math.abs(duration.minutes());

        // Handle negative duration (time has passed)
        if (duration.asMilliseconds() < 0) {
            // If iqamah has passed, show time until next prayer's athan
            let nextAthanMoment: moment.Moment;

            if (salahIndex === 5) {
                // Already showing next day's Fajr, so next athan is Dhuhr of next day
                nextAthanMoment = moment(nextPrayer.athan_zuhr, 'HH:mm A').add(1, 'day');
            } else if (currentSalah.salah === 'Fajr') {
                nextAthanMoment = moment(prayer.athan_zuhr, 'HH:mm A');
            } else if (currentSalah.salah === 'Dhuhr') {
                nextAthanMoment = moment(prayer.athan_asr, 'HH:mm A');
            } else if (currentSalah.salah === 'Asr') {
                nextAthanMoment = moment(prayer.athan_maghrib, 'HH:mm A');
            } else if (currentSalah.salah === 'Maghrib') {
                nextAthanMoment = moment(prayer.athan_isha, 'HH:mm A');
            } else if (currentSalah.salah === 'Isha') {
                nextAthanMoment = moment(nextPrayer.athan_fajr, 'HH:mm A').add(1, 'day');
            } else {
                nextAthanMoment = moment(prayer.athan_zuhr, 'HH:mm A');
            }

            const athanDuration = moment.duration(nextAthanMoment.diff(currentMoment));
            const athanHours = Math.floor(athanDuration.asHours());
            const athanMinutes = Math.abs(athanDuration.minutes());

            if (athanDuration.asMilliseconds() <= 0) {
                return 'Now';
            }
            return formatTimeDuration(athanHours, athanMinutes);
        }

        // Time until iqamah
        return formatTimeDuration(hours, minutes);
    }, [prayer, nextPrayer, currentTime]);
};


