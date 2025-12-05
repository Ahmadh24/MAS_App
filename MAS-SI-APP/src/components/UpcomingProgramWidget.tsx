import { View, Text, Pressable, ImageBackground, ScrollView, Animated, Image, Dimensions, Linking, PanResponder } from 'react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Program, EventsType, Lectures, SheikDataType } from '../types';
import moment from 'moment';
import { Link, useRouter } from 'expo-router';
import { Icon, Modal, Portal, Button } from 'react-native-paper';
import { supabase } from '@/src/lib/supabase';
import { parse, isBefore, format } from 'date-fns';
import { useAuth } from '@/src/providers/AuthProvider';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { FlyerSkeleton } from './FlyerSkeleton';
import YoutubePlayer from "react-native-youtube-iframe";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';

// Toast configuration
const toastConfig = {
  addProgramToNotificationsToast: ({ props }: any) => (
    <Pressable className='rounded-xl overflow-hidden ' onPress={props.onPress}>
      <BlurView intensity={40} className='flex-row items-center justify-between px-4 rounded-xl p-1 max-h-[60]' 
        experimentalBlurMethod={'dimezisBlurView'}
        style={{ width: '100%', maxWidth: '100%' }}
      >
        <View>
          <Image source={props.props.program_img ? { uri: props.props.program_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 50, height: 50, objectFit: 'fill', borderRadius: 10 }}/>
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
  LectureAddedToPlaylist: ({ props }: any) => (
    <Pressable className='rounded-xl overflow-hidden' onPress={props.onPress}>
      <BlurView intensity={40} className='flex-row items-center justify-between px-3 p-1 max-w-[85%] max-h-[60]'
        experimentalBlurMethod={'dimezisBlurView'}
      >
        <View className=''>
          <Image source={props.props?.playlist_img ? { uri: props.props.playlist_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 50, height: 50, objectFit: 'fill', borderRadius: 10 }}/>
        </View>
        <View className='flex-col pl-2'>
          <View>
            <Text numberOfLines={1} allowFontScaling adjustsFontSizeToFit>1 lecture added</Text>
          </View>
          <View className='flex-row'>
            <Text>{props.props?.playlist_name}</Text>
            <Icon source={'chevron-right'} size={20} />
          </View>
        </View>
      </BlurView>
    </Pressable>
  ),
  ProgramAddedToPrograms: ({ props }: any) => (
    <Pressable className='rounded-xl overflow-hidden ' onPress={props.onPress}>
      <BlurView intensity={40} className='flex-row items-center justify-between px-4 rounded-xl p-1 max-w-[85%] max-h-[60]' 
        experimentalBlurMethod={'dimezisBlurView'}
      >
        <View>
          <Image source={props.props.program_img ? { uri: props.props.program_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 50, height: 50, objectFit: 'fill', borderRadius: 10 }}/>
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
  addEventToNotificationsToast: ({ props }: any) => (
    <Pressable className='rounded-xl overflow-hidden ' onPress={props.onPress}>
      <BlurView intensity={40} className='flex-row items-center justify-between px-4 rounded-xl p-1 max-h-[60]' 
        experimentalBlurMethod={'dimezisBlurView'}
        style={{ width: '100%', maxWidth: '100%' }}
      >
        <View>
          <Image source={props.props.event_img ? { uri: props.props.event_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 50, height: 50, objectFit: 'fill', borderRadius: 10 }}/>
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
  ConfirmNotificationOption: ({ props }: any) => (
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

// Helper function to extract video ID from YouTube URL
const getVideoIdFromUrl = (url: string) => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
};

type UpcomingProgramWidgetProp = {
  // No props needed - will fetch data internally
}

type UpcomingItem = {
  id: string;
  name: string;
  time: string;
  image: string | null;
  description: string | null;
  type: 'program' | 'event';
  link: string;
}

// Helper function to set time to current date
function setTimeToCurrentDate(timeString: string) {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  const timestampWithTimeZone = new Date();
  timestampWithTimeZone.setHours(hours, minutes, seconds || 0, 0);
  return timestampWithTimeZone;
}

// Helper function to schedule notifications
const schedule_notification = async (
  user_id: string,
  push_notification_token: string,
  message: string,
  notification_type: string,
  program_event_name: string,
  notification_time: Date
) => {
  const { error } = await supabase.from('program_notification_schedule').insert({
    user_id: user_id,
    push_notification_token: push_notification_token,
    message: message,
    notification_type: notification_type,
    program_event_name: program_event_name,
    notification_time: notification_time,
    title: program_event_name
  });
  if (error) {
    console.log(error);
  }
};

export default function UpcomingProgramWidget() {
  const router = useRouter();
  const { session } = useAuth();
  const [liveTime, setLiveTime] = useState(new Date());
  const [upcomingItem, setUpcomingItem] = useState<UpcomingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [itemInNotifications, setItemInNotifications] = useState(false);
  const [itemInPrograms, setItemInPrograms] = useState(false);
  const [programData, setProgramData] = useState<Program | null>(null);
  const [eventData, setEventData] = useState<EventsType | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const [modalLectures, setModalLectures] = useState<Lectures[] | null>(null);
  const [modalSpeakerData, setModalSpeakerData] = useState<SheikDataType[]>([]);
  const [modalSpeakerString, setModalSpeakerString] = useState('');
  const [modalImageReady, setModalImageReady] = useState(false);
  const [modalVisibleState, setModalVisibleState] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState<Lectures | null>(null);
  const [playing, setPlaying] = useState(false);
  const [watchedLectures, setWatchedLectures] = useState<Set<string>>(new Set());
  const [startedLectures, setStartedLectures] = useState<Set<string>>(new Set());
  const modalScrollRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);
  const scrollOffset = useRef(0);
  const isClosing = useRef(false);
  const [modalToast, setModalToast] = useState<{ type: string; props: any } | null>(null);
  const Tab = useBottomTabBarHeight();
  const { width, height } = Dimensions.get("window");

  // Get current day of the week
  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const currentDay = getCurrentDay();
  const currentTime = liveTime.toLocaleTimeString("en-US", {hour12: true, hour: "numeric", minute:"numeric"});

  // Helper function to convert time string to moment and format as 12-hour
  const parseTimeToMoment = (timeString: string) => {
    if (!timeString) return moment();
    
    try {
      // Try parsing as 12-hour format first (e.g., "2:30 PM" or "2:30:00 PM")
      const parsed12 = parse(timeString, 'h:mm a', new Date());
      if (!isNaN(parsed12.getTime())) {
        return moment(parsed12);
      }
    } catch (error) {
      // Continue to try other formats
    }
    
    try {
      // Try parsing as 24-hour format (e.g., "14:30" or "14:30:00")
      const parsed24 = parse(timeString, 'HH:mm', new Date());
      if (!isNaN(parsed24.getTime())) {
        return moment(parsed24);
      }
    } catch (error) {
      // Continue to try other formats
    }
    
    try {
      // Try parsing as 24-hour format with seconds (e.g., "14:30:00")
      const parsed24Sec = parse(timeString, 'HH:mm:ss', new Date());
      if (!isNaN(parsed24Sec.getTime())) {
        return moment(parsed24Sec);
      }
    } catch (error) {
      // Continue to try moment directly
    }
    
    // If all parsing fails, try moment directly with multiple formats
    const momentTime = moment(timeString, ['h:mm a', 'HH:mm', 'HH:mm:ss', 'h:mm:ss a'], true);
    if (momentTime.isValid()) {
      return momentTime;
    }
    
    // Last resort: return current time
    console.warn('Could not parse time:', timeString);
    return moment();
  };
  
  // Pan responder for slide-down gesture - only on drag handle
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        // Only respond if ScrollView is at the top
        return scrollOffset.current === 0 && !isScrolling.current;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to downward gestures when scroll is at top
        if (scrollOffset.current > 0 || isScrolling.current) return false;
        // Require significant downward movement to avoid conflicts
        return gestureState.dy > 15 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 2;
      },
      onPanResponderGrant: () => {
        panY.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow downward movement, with resistance at the top
        if (gestureState.dy > 0) {
          // Add slight resistance for smoother feel
          const resistance = gestureState.dy < 50 ? 0.5 : 1;
          panY.setValue(gestureState.dy * resistance);
        }
      },
      onPanResponderTerminate: () => {
        // Snap back
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }).start();
      },
      onPanResponderRelease: (evt, gestureState) => {
        const threshold = height * 0.25; // Close if dragged down more than 25% of screen height
        
        if (gestureState.dy > threshold || gestureState.vy > 0.5) {
          // Mark as closing to prevent re-renders
          isClosing.current = true;
          
          // Stop any ongoing animations
          slideAnim.stopAnimation();
          panY.stopAnimation();
          
          // Get current panY value from gesture
          const currentPanY = gestureState.dy;
          const remainingDistance = height - currentPanY;
          
          // Ensure panY is at current position before animating
          panY.setValue(currentPanY);
          
          // Animate panY from current position to height
          Animated.timing(panY, {
            toValue: height,
            duration: Math.max(150, Math.min(300, 300 * (remainingDistance / height))),
            useNativeDriver: true,
          }).start((finished) => {
            if (finished) {
              // Clean up after animation completes
              closeModal();
              panY.setValue(0);
              slideAnim.setValue(0);
              scrollOffset.current = 0;
              isScrolling.current = false;
              isClosing.current = false;
            }
          });
        } else {
          // Snap back to open position
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 9,
          }).start();
        }
      },
    })
  ).current;

  // Helper function to format time as 12-hour format
  const formatTime12Hour = (timeString: string): string => {
    if (!timeString) return 'TBD';
    
    try {
      const time = parseTimeToMoment(timeString);
      if (time.isValid()) {
        return time.format('h:mm A');
      }
    } catch (error) {
      console.error('Error formatting time:', error);
    }
    
    return timeString; // Return original if formatting fails
  };

  const fetchUpcomingPrograms = async () => {
    try {
      setLoading(true);
      const date = new Date();
      const isoString = date.toISOString();
      
      // Fetch all upcoming programs and events
      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .gte('program_end_date', isoString)
        .eq('is_kids', false);
      
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('event_end_date', isoString)
        .eq('pace', false);

      if (programsError || eventsError) {
        console.error('Error fetching programs/events:', programsError || eventsError);
        setUpcomingItem(null);
        setLoading(false);
        return;
      }

      // Filter for today's items - handle both array and string formats
      const todaysPrograms = programs?.filter(program => {
        if (!program.program_days) return false;
        // Handle array format
        if (Array.isArray(program.program_days)) {
          return program.program_days.some((day: string) => 
            day.toLowerCase().includes(currentDay.toLowerCase()) || 
            currentDay.toLowerCase().includes(day.toLowerCase())
          );
        }
        // Handle string format
        if (typeof program.program_days === 'string') {
          return program.program_days.toLowerCase().includes(currentDay.toLowerCase());
        }
        return false;
      }) || [];

      const todaysEvents = events?.filter(event => {
        if (!event.event_days) return false;
        // Handle array format
        if (Array.isArray(event.event_days)) {
          return event.event_days.some((day: string) => 
            day.toLowerCase().includes(currentDay.toLowerCase()) || 
            currentDay.toLowerCase().includes(day.toLowerCase())
          );
        }
        // Handle string format
        if (typeof event.event_days === 'string') {
          return event.event_days.toLowerCase().includes(currentDay.toLowerCase());
        }
        return false;
      }) || [];

      // Ensure programs and events are arrays
      const safePrograms = programs || [];
      const safeEvents = events || [];

      // If no programs today, look for next available program/event (any day)
      let allPrograms: UpcomingItem[] = [];
      let allEvents: UpcomingItem[] = [];

      if (todaysPrograms.length === 0 && todaysEvents.length === 0) {
        // Get all upcoming programs and events for the next 7 days
        allPrograms = safePrograms.map(p => ({
          id: p.program_id,
          name: p.program_name,
          time: p.program_start_time,
          image: p.program_img,
          description: p.program_desc,
          type: 'program' as const,
          link: `/menu/program/${p.program_id}` as any
        }));

        allEvents = safeEvents.map(e => ({
          id: e.event_id,
          name: e.event_name,
          time: e.event_start_time,
          image: e.event_img,
          description: e.event_desc,
          type: 'event' as const,
          link: `/menu/program/events/${e.event_id}` as any
        }));
      } else {
        // Use today's programs/events
        allPrograms = todaysPrograms.map(p => ({
          id: p.program_id,
          name: p.program_name,
          time: p.program_start_time,
          image: p.program_img,
          description: p.program_desc,
          type: 'program' as const,
          link: `/menu/program/${p.program_id}` as any
        }));

        allEvents = todaysEvents.map(e => ({
          id: e.event_id,
          name: e.event_name,
          time: e.event_start_time,
          image: e.event_img,
          description: e.event_desc,
          type: 'event' as const,
          link: `/menu/program/events/${e.event_id}` as any
        }));
      }

      // Combine and find the next upcoming item
      const allItems: UpcomingItem[] = [...allPrograms, ...allEvents];

      // Find the next upcoming item based on current time
      const now = moment();
      let nextItem: UpcomingItem | null = null;
      let smallestDuration = Infinity;

      allItems.forEach(item => {
        if (!item.time) return;
        
        try {
          const itemTime = parseTimeToMoment(item.time);
          if (!itemTime.isValid()) {
            console.error('Invalid time format for item:', item.name, item.time);
            return;
          }
          
          // Create a moment for today at the program time
          const today = moment().startOf('day');
          const programTimeToday = today.clone().hour(itemTime.hour()).minute(itemTime.minute()).second(0);
          
          // If program time has passed today, assume it's for tomorrow
          let targetTime = programTimeToday;
          if (programTimeToday.isBefore(now)) {
            targetTime = programTimeToday.clone().add(1, 'day');
          }
          
          const duration = targetTime.diff(now, 'minutes');
          
          // Consider items in the future or within the last 2 hours (still ongoing)
          if (duration >= -120 && duration < smallestDuration) {
            smallestDuration = duration;
            nextItem = item;
          }
        } catch (error) {
          console.error('Error parsing time for item:', item.name, item.time, error);
        }
      });

      // If still no item found, just show the first one
      if (!nextItem && allItems.length > 0) {
        nextItem = allItems[0];
      }

      setUpcomingItem(nextItem);
      
      // Store full program/event data for notifications
      if (nextItem) {
        if (nextItem.type === 'program') {
          const fullProgram = safePrograms.find(p => p.program_id === nextItem!.id);
          if (fullProgram) {
            setProgramData(fullProgram);
            setEventData(null);
          }
        } else {
          const fullEvent = safeEvents.find(e => e.event_id === nextItem!.id);
          if (fullEvent) {
            setEventData(fullEvent);
            setProgramData(null);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching upcoming programs:', error);
      setUpcomingItem(null);
    } finally {
      setLoading(false);
    }
  };

  // Check if item is already in notifications
  const checkNotificationStatus = async () => {
    if (!session?.user.id || !upcomingItem) return;
    
    try {
      if (upcomingItem.type === 'program') {
        const { data } = await supabase
          .from('added_notifications_programs')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('program_id', upcomingItem.id)
          .single();
        
        setItemInNotifications(!!data);
      } else {
        const { data } = await supabase
          .from('added_notifications_events')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('event_id', upcomingItem.id)
          .single();
        
        setItemInNotifications(!!data);
      }
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  // Check if item is already in programs
  const checkProgramStatus = async () => {
    if (!session?.user.id || !upcomingItem || upcomingItem.type !== 'program') return;
    
    try {
      const { data } = await supabase
        .from('added_programs')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('program_id', upcomingItem.id)
        .single();
      
      setItemInPrograms(!!data);
    } catch (error) {
      console.error('Error checking program status:', error);
    }
  };

  // Handle notification button press
  const handleNotificationPress = async () => {
    if (!session?.user.id || !upcomingItem) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (itemInNotifications) {
      // Remove from notifications
      if (upcomingItem.type === 'program') {
        const { error } = await supabase
          .from('added_notifications_programs')
          .delete()
          .eq('user_id', session.user.id)
          .eq('program_id', upcomingItem.id);
        
        if (programData) {
          const { error: settingsError } = await supabase
            .from('program_notifications_settings')
            .delete()
            .eq('user_id', session.user.id)
            .eq('program_id', upcomingItem.id);
          
          const { error: scheduleError } = await supabase
            .from('program_notification_schedule')
            .delete()
            .eq('user_id', session.user.id)
            .eq('program_event_name', programData.program_name);
        }
      } else {
        const { error } = await supabase
          .from('added_notifications_events')
          .delete()
          .eq('user_id', session.user.id)
          .eq('event_id', upcomingItem.id);
        
        if (eventData) {
          const { error: settingsError } = await supabase
            .from('event_notification_settings')
            .delete()
            .eq('user_id', session.user.id)
            .eq('event_id', upcomingItem.id);
          
          const { error: scheduleError } = await supabase
            .from('program_notification_schedule')
            .delete()
            .eq('user_id', session.user.id)
            .eq('program_event_name', eventData.event_name);
        }
      }
      
      setItemInNotifications(false);
    } else {
      // Add to notifications
      const TodaysDate = new Date();
      const DaysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      if (upcomingItem.type === 'program' && programData) {
        const { error } = await supabase
          .from('added_notifications_programs')
          .insert({
            user_id: session.user.id,
            program_id: upcomingItem.id,
            has_lectures: programData.has_lectures || false
          });
        
        if (!error) {
          const programDays = programData.program_days;
          const ProgramStartTime = setTimeToCurrentDate(programData.program_start_time || '');
          
          if (programDays && isBefore(TodaysDate, ProgramStartTime)) {
            await Promise.all(
              (Array.isArray(programDays) ? programDays : [programDays]).map(async (day: string) => {
                const { data: user_push_token } = await supabase
                  .from('profiles')
                  .select('push_notification_token')
                  .eq('id', session.user.id)
                  .single();
                
                if ((TodaysDate.getDay() === DaysOfWeek.indexOf(day)) && user_push_token?.push_notification_token) {
                  await schedule_notification(
                    session.user.id,
                    user_push_token.push_notification_token,
                    `${programData.program_name} is Starting Now!`,
                    'When Program Starts',
                    programData.program_name,
                    ProgramStartTime
                  );
                }
              })
            );
          }
          
          // Show toast in modal
          setModalToast({
            type: 'addProgramToNotificationsToast',
            props: { props: programData, onPress: () => {} }
          });
          // Also show root toast for when modal is closed
          // Toast.show({
          //   type: 'addProgramToNotificationsToast',
          //   props: { props: programData, onPress: goToProgram },
          //   position: 'top',
          //   topOffset: 50,
          // });
          // Auto-hide modal toast after 3 seconds
          setTimeout(() => setModalToast(null), 3000);
          // Auto-hide modal toast after 3 seconds
          setTimeout(() => setModalToast(null), 3000);
        }
      } else if (upcomingItem.type === 'event' && eventData) {
        const { error } = await supabase
          .from('added_notifications_events')
          .insert({
            user_id: session.user.id,
            event_id: upcomingItem.id
          });
        
        if (!error) {
          const eventDays = eventData.event_days;
          const EventStartTime = setTimeToCurrentDate(eventData.event_start_time || '');
          
          if (eventDays && isBefore(TodaysDate, EventStartTime)) {
            await Promise.all(
              (Array.isArray(eventDays) ? eventDays : [eventDays]).map(async (day: string) => {
                const { data: user_push_token } = await supabase
                  .from('profiles')
                  .select('push_notification_token')
                  .eq('id', session.user.id)
                  .single();
                
                if ((TodaysDate.getDay() === DaysOfWeek.indexOf(day)) && user_push_token?.push_notification_token) {
                  await schedule_notification(
                    session.user.id,
                    user_push_token.push_notification_token,
                    `${eventData.event_name} is Starting Now!`,
                    'When Program Starts',
                    eventData.event_name,
                    EventStartTime
                  );
                }
              })
            );
          }
          
          // Show toast in modal
          setModalToast({
            type: 'addEventToNotificationsToast',
            props: { props: eventData, onPress: () => {} }
          });
          // Also show root toast for when modal is closed
          // Toast.show({
          //   type: 'addEventToNotificationsToast',
          //   props: { props: eventData, onPress: goToEvent },
          //   position: 'top',
          //   topOffset: 50,
          // });
          // Auto-hide modal toast after 3 seconds
          setTimeout(() => setModalToast(null), 3000);
        }
      }
      
      setItemInNotifications(true);
    }
  };

  // Handle add to programs button press
  const handleAddToProgramsPress = async () => {
    if (!session?.user.id || !upcomingItem) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (itemInPrograms) {
      // Remove from programs
      if (upcomingItem.type === 'program') {
        const { error } = await supabase
          .from('added_programs')
          .delete()
          .eq('user_id', session.user.id)
          .eq('program_id', upcomingItem.id);
      }
      
      setItemInPrograms(false);
    } else {
      // Add to programs
      if (upcomingItem.type === 'program') {
        const { error } = await supabase
          .from('added_programs')
          .insert({
            user_id: session.user.id,
            program_id: upcomingItem.id
          });
        
        if (!error) {
          setItemInPrograms(true);
          
          // Show toast in modal
          setModalToast({
            type: 'ProgramAddedToPrograms',
            props: { props: programData, onPress: () => {} }
          });
          // Auto-hide modal toast after 3 seconds
          setTimeout(() => setModalToast(null), 3000);
        }
      }
    }
  };

  const getTimeToNextProgram = () => {
    if (!upcomingItem || !upcomingItem.time) {
      return 'No programs today';
    }

    try {
      // Get current time
      const now = moment();
      
      // Parse program time
      const programTime = parseTimeToMoment(upcomingItem.time);
      
      // Set both to today's date for accurate comparison
      const today = moment().startOf('day');
      const programTimeToday = today.clone().hour(programTime.hour()).minute(programTime.minute()).second(0);
      
      // If program time has passed today, assume it's for tomorrow
      let targetTime = programTimeToday;
      if (programTimeToday.isBefore(now)) {
        targetTime = programTimeToday.clone().add(1, 'day');
      }
      
      // Calculate duration
      const duration = moment.duration(targetTime.diff(now));
      const totalMinutes = Math.floor(duration.asMinutes());
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      // Handle if program has already started (within last 2 hours)
      if (totalMinutes < 0) {
        if (Math.abs(totalMinutes) < 120) {
          return 'Started';
        }
        return 'No upcoming programs';
      }

      if (totalMinutes === 0) {
        return 'Starting now';
      } else if (hours === 0) {
        return `${minutes} min`;
      } else {
        return `${hours}hr ${minutes} min`;
      }
    } catch (error) {
      console.error('Error calculating time to program:', error);
      return 'Time TBD';
    }
  };

  const refreshLiveTime = () => {
    setLiveTime(new Date());
  };

  // Fetch programs on mount and when day changes
  useEffect(() => {
    fetchUpcomingPrograms();
  }, []);

  // Check notification status when upcomingItem changes
  useEffect(() => {
    if (upcomingItem && session?.user.id) {
      checkNotificationStatus();
      checkProgramStatus();
    }
  }, [upcomingItem, session?.user.id]);

  // Fetch modal data when modal opens
  useEffect(() => {
    if (modalVisible && upcomingItem && (programData || eventData)) {
      fetchModalData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalVisible, upcomingItem, programData, eventData]);

  // Update time every second
  useEffect(() => {
    const timerId = setInterval(() => {
      refreshLiveTime();
    }, 1000);
    
    return () => {
      clearInterval(timerId);
    };
  }, []);

  // Re-check for next program when time updates
  useEffect(() => {
    if (!loading && upcomingItem) {
      try {
        const now = moment();
        const programTime = parseTimeToMoment(upcomingItem.time);
        
        if (!programTime.isValid()) {
          return;
        }
        
        // Create a moment for today at the program time
        const today = moment().startOf('day');
        const programTimeToday = today.clone().hour(programTime.hour()).minute(programTime.minute()).second(0);
        
        // If program time has passed today, assume it's for tomorrow
        let targetTime = programTimeToday;
        if (programTimeToday.isBefore(now)) {
          targetTime = programTimeToday.clone().add(1, 'day');
        }
        
        const duration = moment.duration(targetTime.diff(now));
        const totalMinutes = Math.floor(duration.asMinutes());
        
        // If current program has passed (more than 1 hour ago), refetch to find next one
        if (totalMinutes < -60) {
          fetchUpcomingPrograms();
        }
      } catch (error) {
        console.error('Error checking program time:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, loading, upcomingItem]);

  const timeToNextProgram = getTimeToNextProgram();

  const closeModal = useCallback((skipAnimation?: boolean) => {
    if (skipAnimation) {
      setModalVisible(false);
      setModalVisibleState(false);
      slideAnim.setValue(0);
      panY.setValue(0);
      setModalSpeakerData([]);
      setModalSpeakerString('');
      setModalImageReady(false);
      scrollOffset.current = 0;
      isScrolling.current = false;
      isClosing.current = false;
      return;
    }
    
    // Stop any ongoing animations
    slideAnim.stopAnimation();
    panY.stopAnimation();
    
    // Animate closing
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(panY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setModalVisibleState(false);
      setModalSpeakerData([]);
      setModalSpeakerString('');
      setModalImageReady(false);
      panY.setValue(0);
      scrollOffset.current = 0;
      isScrolling.current = false;
      isClosing.current = false;
    });
  }, []);

  const checkWatchedStatus = async (lecturesData: Lectures[]) => {
    try {
      const watchedKeys = lecturesData.map(lecture => `watched_lecture_${lecture.lecture_id}`);
      const startedKeys = lecturesData.map(lecture => `started_lecture_${lecture.lecture_id}`);
      const allKeys = [...watchedKeys, ...startedKeys];
      const allValues = await AsyncStorage.multiGet(allKeys);
      const watched = new Set<string>();
      const started = new Set<string>();
      allValues.forEach(([key, value]) => {
        if (value === 'true') {
          if (key.startsWith('watched_lecture_')) {
            const lectureId = key.replace('watched_lecture_', '');
            watched.add(lectureId);
          } else if (key.startsWith('started_lecture_')) {
            const lectureId = key.replace('started_lecture_', '');
            if (!watched.has(lectureId)) {
              started.add(lectureId);
            }
          }
        }
      });
      setWatchedLectures(watched);
      setStartedLectures(started);
    } catch (error) {
      console.log('Error checking watched status:', error);
    }
  };

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setPlaying(false);
      if (selectedLecture) {
        AsyncStorage.setItem(`watched_lecture_${selectedLecture.lecture_id}`, 'true');
        setWatchedLectures(prev => new Set([...prev, selectedLecture.lecture_id]));
      }
    }
  }, [selectedLecture]);

  const fetchModalData = useCallback(async () => {
    if (!upcomingItem) return;
    
    // Handle programs - Only fetch speaker data for modal (no lectures/videos)
    if (upcomingItem.type === 'program' && programData) {
      // Fetch speaker data
      if (programData.program_speaker && Array.isArray(programData.program_speaker) && programData.program_speaker.length > 0) {
        const speakers: SheikDataType[] = [];
        const speakerArray = programData.program_speaker;
        let speaker_string: string[] = speakerArray.map(() => '');
        
        await Promise.all(
          speakerArray.map(async (speaker_id: string, index: number) => {
            const { data: speakerInfo } = await supabase
              .from('speaker_data')
              .select('*')
              .eq('speaker_id', speaker_id)
              .single();
            
            if (speakerInfo) {
              if (index === speakerArray.length - 1) {
                speaker_string[index] = speakerInfo.speaker_name;
              } else {
                speaker_string[index] = speakerInfo.speaker_name + ' & ';
              }
              speakers.push(speakerInfo);
            }
          })
        );
        
        setModalSpeakerData(speakers);
        setModalSpeakerString(speaker_string.join(''));
      }
    } 
    // Handle events
    else if (upcomingItem.type === 'event') {
      // Events might have speakers too, but for now we'll leave it empty
      setModalSpeakerData([]);
      setModalSpeakerString('');
    }
  }, [upcomingItem, programData, eventData]);

  const openModal = useCallback(() => {
    setModalVisible(true);
    setModalVisibleState(false);
    setModalImageReady(false);
    panY.setValue(0); // Reset pan gesture
    scrollOffset.current = 0;
    isScrolling.current = false;
    isClosing.current = false;
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
    
    // Fetch modal data - will be handled by useEffect
  }, [slideAnim, panY]);
  
  const GetSheikData = () => {
    return (
      <View className='flex-1'>
        {modalSpeakerData?.map((speakerData, index) => (
          <BlurView
            key={index}
            intensity={80}
            tint="dark"
            style={{
              borderRadius: 50,
              padding: 16,
              marginVertical: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
              backgroundColor: 'rgba(107, 114, 128, 0.6)',
              overflow: 'hidden',
            }}
          >
            <View className='flex-row items-center mb-4'>
              <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                overflow: 'hidden',
                borderWidth: 3,
                borderColor: '#E5E7EB',
                marginRight: 16,
              }}>
                <Image 
                  source={speakerData?.speaker_img ? { uri: speakerData.speaker_img } : require("@/assets/images/MASHomeLogo.png")} 
                  style={{ width: '100%', height: '100%' }} 
                  resizeMode='cover'
                />
              </View>
              <View className='flex-1'>
                <Text className='text-xs text-gray-300 font-medium mb-1'>SPEAKER</Text>
                <Text className='text-xl font-bold text-white' numberOfLines={2}>
                  {speakerData?.speaker_name}
                </Text>
              </View>
            </View>
            <View className='border-t border-gray-400 pt-4'>
              {speakerData?.speaker_name === "MAS" ? (
                <Text className='text-sm font-bold text-white mb-3'>Impact</Text>
              ) : (
                <Text className='text-sm font-bold text-white mb-3'>Credentials</Text>
              )}
              <View className='flex-col'>
                {speakerData?.speaker_creds?.map((cred, i) => (
                  <View key={i} className='flex-row items-start mb-2'>
                    <View style={{ marginRight: 8, marginTop: 2 }}>
                      <Icon source="cards-diamond-outline" size={16} color='#60A5FA'/>
                    </View>
                    <Text className='text-sm text-gray-100 flex-1'>{cred}</Text>
                  </View>
                ))}
              </View>
            </View>
          </BlurView>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="bg-white mx-3 pb-6 px-4" style={{
        marginTop: -60,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        minHeight: 120,
      }}>
        <View className="pt-6">
          <Text className="text-gray-400 text-sm">Loading programs...</Text>
        </View>
      </View>
    );
  }

  if (!upcomingItem) {
    return (
      <View className="bg-white mx-3 pb-6 px-4" style={{
        marginTop: -60,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        minHeight: 120,
      }}>
        <View className="pt-6">
          <View className="flex-row items-center mb-3">
            <Icon source="calendar-today" size={20} color="#0D509D" />
            <Text className="text-[#0D509D] font-bold text-lg ml-2">Upcoming Program</Text>
          </View>
          <Text className="text-gray-500 text-center py-4">
            No programs scheduled for {currentDay}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      {/* Main Program Card */}
      <View className="bg-white pb-6 px-4" style={{
        marginHorizontal: 16,
        marginTop: -60,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        minHeight: 120,
        overflow: 'hidden',
      }}>
        <ImageBackground 
          source={require("@/assets/images/CresentMoon.png")}
          style={{ height: "100%", width: "100%", position: "absolute", top: 0, right: -45, alignItems: 'flex-end', justifyContent: 'center' }}
          resizeMode="contain"
          imageStyle={{ opacity: 0.35, transform: [{ scale: 1.7 }, { translateX: 35 }, { translateY: 5 }] }}
        />
        <Pressable 
          className="pt-6" 
          style={{ position: 'relative', zIndex: 1 }}
          onPress={() => {
            // Always open modal like "read full description"
            openModal();
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Icon source="calendar-today" size={20} color="#0D509D" />
              <Text className="text-[#0D509D] font-bold text-lg ml-2">Upcoming Program</Text>
            </View>
            <Icon source="chevron-right" size={20} color="#0D509D" />
          </View>

          {/* Program Name and Time */}
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-1">
              <Text className="text-gray-800 font-bold text-xl" numberOfLines={2}>
                {upcomingItem.name}
              </Text>
            </View>
            <View className="ml-4">
              <Text className="text-[#0D509D] font-bold text-2xl">
                {formatTime12Hour(upcomingItem.time)}
              </Text>
            </View>
          </View>

          {/* Countdown */}
          <View className="flex-row items-center mb-3">
            <View style={{ marginRight: 6 }}>
              <Icon source="clock-outline" size={16} color="#0D509D" />
            </View>
            <Text className="text-gray-600 text-sm mr-2">Starts in</Text>
            <Text className="text-[#0D509D] font-bold text-lg">{timeToNextProgram}</Text>
          </View>
        </Pressable>
      </View>

      {/* Separate Description & Notification Card */}
      {upcomingItem.description && (
        <View style={{
          marginHorizontal: 16,
          marginTop: -30,
          backgroundColor: '#D1D5DB',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
          padding: 1,
        }}>
          <View className="bg-white flex-row relative" style={{
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
            borderBottomLeftRadius: 15,
            borderBottomRightRadius: 15,
          }}>
            <Pressable 
              className="flex-1 bg-white p-2 items-center justify-center" 
              style={{
                minHeight: 55,
                borderTopLeftRadius: 15,
                borderBottomLeftRadius: 15,
              }}
              onPress={openModal}
            >
              <Text 
                className="text-[#0D509D] text-sm font-medium"
              >
                Read full description
              </Text>
            </Pressable>
            {/* Vertical divider line in the middle - rendered before notification card */}
            <View 
              style={{
                width: 1,
                backgroundColor: '#9CA3AF',
                marginTop: 12,
                marginBottom: 12,
              }}
            />
            {/* Notification Bell Card */}
            <Pressable 
              className="flex-1 bg-white p-2 items-center justify-center"
              style={{
                minHeight: 55,
                borderTopRightRadius: 15,
                borderBottomRightRadius: 15,
              }}
              onPress={handleNotificationPress}
            >
              <Icon 
                source={itemInNotifications ? "bell-check" : "bell"} 
                size={22} 
                color={itemInNotifications ? "#57BA47" : "#0D509D"} 
              />
              <Text 
                className="text-xs text-center mt-1" 
                numberOfLines={2}
                style={{ 
                  lineHeight: 14,
                  color: itemInNotifications ? '#000000' : '#0D509D'
                }}
              >
                {itemInNotifications ? 'Notifications on' : 'Get notified'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Full Description Modal - Program Detail Page Style */}
      {upcomingItem && (modalVisible || isClosing.current) && (
        <Portal>
          <Modal
            visible={modalVisible || isClosing.current}
            onDismiss={() => {}}
            dismissable={false}
            contentContainerStyle={{
              backgroundColor: 'transparent',
              margin: 0,
              padding: 0,
              height: '100%',
              width: '100%',
              borderWidth: 0,
            }}
            style={{ justifyContent: 'flex-end', margin: 0, padding: 0 }}
          >
            <Animated.View
              style={{
                opacity: slideAnim,
                flex: 1,
                backgroundColor: 'transparent',
              }}
            >
              <Pressable 
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
                onPress={closeModal}
              />
              <Animated.View
                style={{
                  height: height * 0.95,
                  backgroundColor: '#0A1628',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  borderBottomWidth: 0,
                  overflow: 'hidden',
                  transform: [{
                    translateY: Animated.add(
                      slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [height, 0],
                      }),
                      panY
                    )
                  }]
                }}
              >
                {/* Drag Handle - Separate view with pan responder */}
                <Animated.View
                  {...panResponder.panHandlers}
                  style={{
                    width: '100%',
                    paddingTop: 8,
                    paddingBottom: 12,
                    alignItems: 'center',
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  }} />
                </Animated.View>
                
                <ScrollView 
                  ref={modalScrollRef}
                  showsVerticalScrollIndicator={true}
                  scrollEnabled={true}
                  scrollEventThrottle={16}
                  onScrollBeginDrag={() => {
                    isScrolling.current = true;
                    // Reset pan if user starts scrolling
                    panY.setValue(0);
                  }}
                  onScrollEndDrag={() => {
                    // Small delay to ensure scroll has ended
                    setTimeout(() => {
                      isScrolling.current = false;
                    }, 100);
                  }}
                  onMomentumScrollBegin={() => {
                    isScrolling.current = true;
                  }}
                  onMomentumScrollEnd={() => {
                    setTimeout(() => {
                      isScrolling.current = false;
                    }, 100);
                  }}
                  onScroll={(event) => {
                    const offset = event.nativeEvent.contentOffset.y;
                    scrollOffset.current = offset;
                    // If user scrolls down, cancel any active pan gesture
                    if (offset > 5) {
                      panY.setValue(0);
                    }
                  }}
                  bounces={true}
                  contentContainerStyle={{
                    justifyContent: "flex-start",
                    alignItems: "stretch",
                    backgroundColor: '#0A1628',
                    paddingBottom: 100
                  }}
                  style={{ backgroundColor: '#0A1628' }}
                >
                  {/* Program Image */}
                  <View style={{
                    width: '100%',
                    height: height * 0.5,
                    borderRadius: 0,
                    overflow: 'hidden',
                    alignSelf: 'stretch',
                    backgroundColor: '#0A1628',
                  }}>
                    {!modalImageReady && (
                      <FlyerSkeleton 
                        width={width} 
                        height={height * 0.5} 
                        style={{ position: 'absolute', top: 0, zIndex: 2 }} 
                      />
                    )}
                    <Image
                      source={upcomingItem.image ? { uri: upcomingItem.image } : require("@/assets/images/MASHomeLogo.png")}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 0,
                      }}
                      resizeMode="cover"
                      onLoad={() => setModalImageReady(true)}
                    />
                    {/* Header Buttons - Close, Notification, Add to Programs */}
                    <View style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        zIndex: 100, 
                        paddingTop: 50, 
                        paddingHorizontal: 10, 
                        flexDirection: 'row', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                    }}>
                      <BlurView intensity={20} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
                        <Pressable onPress={closeModal} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                          <Icon source="chevron-left" size={20} color="white" />
                        </Pressable>
                      </BlurView>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        {((upcomingItem.type === 'program' && programData && isBefore(new Date().toISOString(), programData.program_end_date || '')) ||
                          (upcomingItem.type === 'event' && eventData && isBefore(new Date().toISOString(), eventData.event_end_date || ''))) ? (
                          <>
                            <BlurView intensity={20} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
                              <Pressable onPress={handleNotificationPress} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                                {itemInNotifications ? <Icon source={"bell-check"} color='white' size={20}/> : <Icon source={"bell-outline"} color='white' size={20}/>}
                              </Pressable>
                            </BlurView>
                            <BlurView intensity={20} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
                              <Pressable onPress={handleAddToProgramsPress} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                                {itemInPrograms ? <Icon source={'minus-circle-outline'} color='white' size={20}/> : <Icon source={"plus-circle-outline"} color='white' size={20}/>}
                              </Pressable>
                            </BlurView>
                          </>
                        ) : null}
                      </View>
                    </View>
                    

                    {/* Sign Up Button - Bottom Right of Flyer */}
                    {((upcomingItem.type === 'program' && programData && programData.program_is_paid) || 
                      (upcomingItem.type === 'event' && eventData && eventData.is_paid)) && (
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 16,
                          right: 16,
                          zIndex: 100,
                          elevation: 10,
                        }}
                      >
                        <BlurView intensity={20} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
                          <Pressable
                            onPress={() => {
                              const paidLink = (upcomingItem.type === 'program' && programData?.paid_link) || 
                                              (upcomingItem.type === 'event' && eventData?.paid_link);
                              if (paidLink) {
                                Linking.canOpenURL(paidLink).then(() => {
                                  Linking.openURL(paidLink);
                                });
                              }
                            }}
                            style={{ paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                          >
                            <Icon source={"cart-variant"} color='white' size={16}/>
                            <Text className='text-white font-semibold' style={{ fontSize: 12 }}>Sign Up Now</Text>
                          </Pressable>
                        </BlurView>
                      </View>
                    )}
                  </View>
                  
                  {/* Content Section - Dark Background */}
                  <View style={{ width: '100%', paddingBottom: 0, backgroundColor: '#0A1628', paddingHorizontal: 16 }}>
                    <Text style={{ textAlign: 'center', marginTop: 16, fontSize: 24, color: 'white', fontWeight: 'bold' }}>
                      {upcomingItem.type === 'program' && programData ? programData.program_name : upcomingItem.name}
                    </Text>
                    
                    {modalSpeakerString && (
                      <Pressable onPress={() => setModalVisibleState(true)}>
                        <Text style={{ textAlign: 'center', marginTop: 8, color: '#60A5FA', width: '60%', alignSelf: 'center', fontWeight: '600' }} numberOfLines={1}>
                          {modalSpeakerString}
                        </Text>
                      </Pressable>
                    )}

                    {/* Description Content */}
                    <View style={{ marginTop: 20, marginBottom: 20 }}>
                      <Text style={{ 
                        color: 'white', 
                        fontSize: 18, 
                        fontWeight: 'bold',
                        marginBottom: 12,
                        textAlign: 'left'
                      }}>
                        Description
                      </Text>
                      {upcomingItem.description ? (
                        <Text style={{ 
                          color: '#D1D5DB', 
                          fontSize: 16, 
                          lineHeight: 24,
                          textAlign: 'left'
                        }}>
                          {upcomingItem.description}
                        </Text>
                      ) : (
                        <Text style={{ 
                          color: '#9CA3AF', 
                          fontSize: 16, 
                          lineHeight: 24,
                          textAlign: 'left',
                          fontStyle: 'italic'
                        }}>
                          No description available
                        </Text>
                      )}
                    </View>
                  </View>
                </ScrollView>
              </Animated.View>
            </Animated.View>
            
            {/* Speaker Modal */}
            <Portal>
              <Modal
                visible={modalVisibleState}
                onDismiss={() => setModalVisibleState(false)}
                contentContainerStyle={{
                  backgroundColor: 'transparent',
                  padding: 20,
                  minHeight: 400,
                  maxHeight: "70%",
                  width: "95%",
                  borderRadius: 35,
                  alignSelf: "center"
                }}
              >
                <View className='flex-1'>
                  <GetSheikData />
                </View>
              </Modal>
            </Portal>
          </Modal>
          
          {/* Custom Toast Notification - Renders inside modal Portal to appear on top */}
          {modalToast && (
            <View
              style={{
                position: 'absolute',
                top: 50,
                left: 0,
                right: 0,
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                zIndex: 999999,
                elevation: 9999,
                pointerEvents: 'box-none',
                paddingHorizontal: 16,
              }}
            >
              <View style={{ width: '100%', maxWidth: '100%' }}>
                <Pressable 
                  onPress={() => {
                    if (modalToast.props.onPress) {
                      modalToast.props.onPress();
                    }
                    setModalToast(null);
                  }}
                  className='rounded-xl overflow-hidden'
                  style={{ width: '100%', maxWidth: '100%' }}
                >
                  <View style={{ maxWidth: '100%', overflow: 'hidden' }}>
                    {toastConfig[modalToast.type as keyof typeof toastConfig]?.({ props: modalToast.props })}
                  </View>
                </Pressable>
              </View>
            </View>
          )}
        </Portal>
      )}
    </>
  );
}


