import React, { useEffect, useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Dimensions,
  Pressable,
  Text,
  StatusBar,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  withSequence,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { ChevronLeft, Check } from 'lucide-react-native';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import * as Haptics from 'expo-haptics';
import { Program, EventsType } from '@/src/types';
import { isBefore } from 'date-fns';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface LayoutInfo {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HeroTransitionProps {
  visible: boolean;
  onClose: () => void;
  imageUri: string | null;
  title: string;
  subtitle?: string;
  layoutInfo: LayoutInfo | null;
  children?: React.ReactNode;
  onNavigate?: () => void;
  program?: Program | null;
  event?: EventsType | null;
}

const FINAL_IMAGE_WIDTH = SCREEN_WIDTH * 0.85;
const FINAL_IMAGE_HEIGHT = 280;
const FINAL_IMAGE_X = (SCREEN_WIDTH - FINAL_IMAGE_WIDTH) / 2;
const FINAL_IMAGE_Y = 115;

// Notification option types
type NotificationOption = 'When Program Starts' | '30 Mins Before' | 'Day Before' | 'Mute';

const CardInfo = [
  { key: 'When Program Starts' as NotificationOption, header: 'Notify at Start:', subText: 'Get notified exactly when the program starts' },
  { key: '30 Mins Before' as NotificationOption, header: 'Notify 30 minutes before Start:', subText: 'Get reminded 30 min before the program starts' },
  { key: 'Day Before' as NotificationOption, header: 'Notify 1 day before Start:', subText: 'Get reminded 1 day before the program starts' },
  { key: 'Mute' as NotificationOption, header: 'Mute', subText: '' },
];

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function setTimeToCurrentDate(timeString: string) {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  const timestampWithTimeZone = new Date();
  timestampWithTimeZone.setHours(hours, minutes, seconds, 0);
  return timestampWithTimeZone;
}

const schedule_notification = async (
  user_id: string,
  push_notification_token: string,
  message: string,
  notification_type: string,
  program_event_name: string,
  notification_time: Date
) => {
  const { error } = await supabase.from('program_notification_schedule').insert({
    user_id,
    push_notification_token,
    message,
    notification_type,
    program_event_name,
    notification_time,
    title: program_event_name,
  });
  if (error) {
    console.log(error);
  }
};

export const HeroTransitionModal: React.FC<HeroTransitionProps> = ({
  visible,
  onClose,
  imageUri,
  title,
  subtitle,
  layoutInfo,
  children,
  onNavigate,
  program,
  event,
}) => {
  const { session } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<NotificationOption[]>([]);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [speakers, setSpeakers] = useState<string[]>([]);

  // Animated values for the image
  const imageX = useSharedValue(layoutInfo?.x ?? 0);
  const imageY = useSharedValue(layoutInfo?.y ?? 0);
  const imageWidth = useSharedValue(layoutInfo?.width ?? 170);
  const imageHeight = useSharedValue(layoutInfo?.height ?? 170);
  const borderRadius = useSharedValue(8);
  const opacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  // Load existing notification settings when modal opens
  useEffect(() => {
    if (visible && session?.user.id) {
      if (program?.program_id) {
        loadProgramNotificationSettings();
        loadProgramSpeakers();
      } else if (event?.event_id) {
        loadEventNotificationSettings();
        loadEventSpeakers();
      }
      loadPushToken();
    }
  }, [visible, program?.program_id, event?.event_id]);

  const loadProgramNotificationSettings = async () => {
    if (!program?.program_id || !session?.user.id) return;
    
    const { data, error } = await supabase
      .from('program_notifications_settings')
      .select('notification_settings')
      .eq('program_id', program.program_id)
      .eq('user_id', session.user.id)
      .single();

    if (data?.notification_settings) {
      setSelectedOptions(data.notification_settings);
    } else {
      setSelectedOptions([]);
    }
  };

  const loadEventNotificationSettings = async () => {
    if (!event?.event_id || !session?.user.id) return;
    
    const { data, error } = await supabase
      .from('event_notifications_settings')
      .select('notification_settings')
      .eq('event_id', event.event_id)
      .eq('user_id', session.user.id)
      .single();

    if (data?.notification_settings) {
      setSelectedOptions(data.notification_settings);
    } else {
      setSelectedOptions([]);
    }
  };

  const loadPushToken = async () => {
    if (!session?.user.id) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('push_notification_token')
      .eq('id', session.user.id)
      .single();

    if (data?.push_notification_token) {
      setPushToken(data.push_notification_token);
    }
  };

  const loadProgramSpeakers = async () => {
    if (!program?.program_id) return;
    
    const { data } = await supabase
      .from('program_speaker')
      .select('speaker_id')
      .eq('program_id', program.program_id);

    if (data && data.length > 0) {
      const speakerIds = data.map((s: any) => s.speaker_id);
      const { data: speakerData } = await supabase
        .from('speakers')
        .select('speaker_name')
        .in('speaker_id', speakerIds);

      if (speakerData) {
        setSpeakers(speakerData.map((s: any) => s.speaker_name));
      }
    }
  };

  const loadEventSpeakers = async () => {
    if (!event?.event_id) return;
    
    const { data } = await supabase
      .from('event_speaker')
      .select('speaker_id')
      .eq('event_id', event.event_id);

    if (data && data.length > 0) {
      const speakerIds = data.map((s: any) => s.speaker_id);
      const { data: speakerData } = await supabase
        .from('speakers')
        .select('speaker_name')
        .in('speaker_id', speakerIds);

      if (speakerData) {
        setSpeakers(speakerData.map((s: any) => s.speaker_name));
      }
    } else {
      setSpeakers([]);
    }
  };

  const handleOptionPress = async (optionKey: NotificationOption, index: number) => {
    if (!session?.user.id) return;
    if (!program?.program_id && !event?.event_id) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Handle Program notifications
    if (program?.program_id) {
      const { data: currentSettings } = await supabase
        .from('program_notifications_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('program_id', program.program_id)
        .single();

      if (!currentSettings) {
        await supabase.from('program_notifications_settings').insert({
          program_id: program.program_id,
          user_id: session.user.id,
          notification_settings: [optionKey],
        });
        setSelectedOptions([optionKey]);
      } else {
        const settings = currentSettings.notification_settings || [];
        
        if (settings.includes(optionKey)) {
          const filtered = settings.filter((e: string) => e !== optionKey);
          await supabase
            .from('program_notifications_settings')
            .update({ notification_settings: filtered })
            .eq('program_id', program.program_id)
            .eq('user_id', session.user.id);

          await supabase
            .from('program_notification_schedule')
            .delete()
            .eq('user_id', session.user.id)
            .eq('program_event_name', program.program_name)
            .eq('notification_type', optionKey);

          setSelectedOptions(filtered);
        } else {
          settings.push(optionKey);
          
          if (pushToken && program.program_start_time) {
            const currentDay = new Date();
            const day = currentDay.getDay();
            const programStartTime = setTimeToCurrentDate(program.program_start_time);
            const program_days = program.program_days || [];

            if (index === 2) {
              await Promise.all(
                program_days.map(async (days: string) => {
                  const indexOfDay = daysOfWeek.indexOf(days);
                  if ((indexOfDay - 1 + 7) % 7 === day) {
                    await schedule_notification(
                      session.user.id,
                      pushToken,
                      `${program.program_name} is Tomorrow, Don't Forget!`,
                      'Day Before',
                      program.program_name,
                      programStartTime
                    );
                  }
                })
              );
            } else {
              if (program_days.includes(daysOfWeek[day]) && isBefore(currentDay, programStartTime)) {
                if (index === 0) {
                  await schedule_notification(
                    session.user.id,
                    pushToken,
                    `${program.program_name} is Starting Now!`,
                    'When Program Starts',
                    program.program_name,
                    programStartTime
                  );
                } else if (index === 1) {
                  const start_time = setTimeToCurrentDate(program.program_start_time);
                  start_time.setMinutes(start_time.getMinutes() - 30);
                  await schedule_notification(
                    session.user.id,
                    pushToken,
                    `${program.program_name} is Starting in 30 Mins!`,
                    '30 Mins Before',
                    program.program_name,
                    start_time
                  );
                }
              }
            }
          }

          await supabase
            .from('program_notifications_settings')
            .update({ notification_settings: settings })
            .eq('program_id', program.program_id)
            .eq('user_id', session.user.id);

          setSelectedOptions([...settings]);
        }
      }
    }

    // Handle Event notifications
    if (event?.event_id) {
      const { data: currentSettings } = await supabase
        .from('event_notifications_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('event_id', event.event_id)
        .single();

      if (!currentSettings) {
        await supabase.from('event_notifications_settings').insert({
          event_id: event.event_id,
          user_id: session.user.id,
          notification_settings: [optionKey],
        });
        setSelectedOptions([optionKey]);
      } else {
        const settings = currentSettings.notification_settings || [];
        
        if (settings.includes(optionKey)) {
          const filtered = settings.filter((e: string) => e !== optionKey);
          await supabase
            .from('event_notifications_settings')
            .update({ notification_settings: filtered })
            .eq('event_id', event.event_id)
            .eq('user_id', session.user.id);

          await supabase
            .from('event_notification_schedule')
            .delete()
            .eq('user_id', session.user.id)
            .eq('program_event_name', event.event_name)
            .eq('notification_type', optionKey);

          setSelectedOptions(filtered);
        } else {
          settings.push(optionKey);
          
          if (pushToken && event.event_start_time) {
            const eventStartTime = new Date(event.event_start_time);
            const currentDay = new Date();

            if (index === 2) {
              // Day Before
              const dayBefore = new Date(eventStartTime);
              dayBefore.setDate(dayBefore.getDate() - 1);
              if (isBefore(currentDay, dayBefore)) {
                await schedule_notification(
                  session.user.id,
                  pushToken,
                  `${event.event_name} is Tomorrow, Don't Forget!`,
                  'Day Before',
                  event.event_name,
                  dayBefore
                );
              }
            } else if (isBefore(currentDay, eventStartTime)) {
              if (index === 0) {
                await schedule_notification(
                  session.user.id,
                  pushToken,
                  `${event.event_name} is Starting Now!`,
                  'When Event Starts',
                  event.event_name,
                  eventStartTime
                );
              } else if (index === 1) {
                const thirtyMinBefore = new Date(eventStartTime);
                thirtyMinBefore.setMinutes(thirtyMinBefore.getMinutes() - 30);
                await schedule_notification(
                  session.user.id,
                  pushToken,
                  `${event.event_name} is Starting in 30 Mins!`,
                  '30 Mins Before',
                  event.event_name,
                  thirtyMinBefore
                );
              }
            }
          }

          await supabase
            .from('event_notifications_settings')
            .update({ notification_settings: settings })
            .eq('event_id', event.event_id)
            .eq('user_id', session.user.id);

          setSelectedOptions([...settings]);
        }
      }
    }
  };

  useEffect(() => {
    if (visible && layoutInfo) {
      // Reset to starting position
      imageX.value = layoutInfo.x;
      imageY.value = layoutInfo.y;
      imageWidth.value = layoutInfo.width;
      imageHeight.value = layoutInfo.height;
      borderRadius.value = 8;
      opacity.value = 0;
      contentOpacity.value = 0;
      backdropOpacity.value = 0;
      setShowContent(false);
      setAnimationComplete(false);

      // Start animations
      const springConfig = {
        damping: 20,
        stiffness: 90,
        mass: 0.8,
      };

      // Fade in backdrop
      backdropOpacity.value = withTiming(1, { duration: 300 });

      // Animate image to final position
      imageX.value = withSpring(FINAL_IMAGE_X, springConfig);
      imageY.value = withSpring(FINAL_IMAGE_Y, springConfig);
      imageWidth.value = withSpring(FINAL_IMAGE_WIDTH, springConfig);
      imageHeight.value = withSpring(FINAL_IMAGE_HEIGHT, springConfig);
      borderRadius.value = withTiming(12, { duration: 400 });
      opacity.value = withTiming(1, { duration: 200 });

      // Show content after image animation
      setTimeout(() => {
        contentOpacity.value = withTiming(1, { duration: 300 });
        setShowContent(true);
        setAnimationComplete(true);
      }, 400);
    }
  }, [visible, layoutInfo]);

  const handleClose = () => {
    if (!layoutInfo) {
      onClose();
      return;
    }

    const springConfig = {
      damping: 20,
      stiffness: 100,
      mass: 0.6,
    };

    // Hide content first
    contentOpacity.value = withTiming(0, { duration: 150 });
    setShowContent(false);

    // Animate image back to original position
    setTimeout(() => {
      imageX.value = withSpring(layoutInfo.x, springConfig);
      imageY.value = withSpring(layoutInfo.y, springConfig);
      imageWidth.value = withSpring(layoutInfo.width, springConfig);
      imageHeight.value = withSpring(layoutInfo.height, springConfig);
      borderRadius.value = withTiming(8, { duration: 300 });
      backdropOpacity.value = withTiming(0, { duration: 300 });

      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 100 }, () => {
          runOnJS(onClose)();
        });
      }, 250);
    }, 100);
  };

  const animatedImageStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: imageX.value,
    top: imageY.value,
    width: imageWidth.value,
    height: imageHeight.value,
    borderRadius: borderRadius.value,
    opacity: opacity.value,
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.backdropOverlay} />
        </Animated.View>

        {/* Close button */}
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <View style={styles.closeButtonInner}>
            <ChevronLeft color="white" size={28} />
          </View>
        </Pressable>

        {/* Animated Image */}
        <Animated.Image
          source={
            imageUri
              ? { uri: imageUri }
              : require('@/assets/images/MASHomeLogo.png')
          }
          style={animatedImageStyle}
          resizeMode="cover"
        />

        {/* Content that fades in after image animation */}
        {showContent && (
          <Animated.View style={[styles.contentContainer, animatedContentStyle]}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Spacer for image */}
              <View style={{ height: FINAL_IMAGE_Y + FINAL_IMAGE_HEIGHT - 15 }} />

              {/* Title */}
              <Text style={styles.title}>{title}</Text>
              
              {/* Speaker names */}
              {speakers.length > 0 && (
                <Text style={styles.speakerText}>{speakers.join(' & ')}</Text>
              )}
              
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

              {/* Notification Options Section */}
              {(program || event) && (
                <View style={styles.notificationSection}>
                  <Text style={styles.sectionTitle}>Notification Options</Text>
                  
                  {CardInfo.map((option, index) => {
                    const isSelected = selectedOptions.includes(option.key);
                    return (
                      <Pressable
                        key={option.key}
                        style={[styles.optionRow, !option.subText && { marginBottom: 28 }]}
                        onPress={() => handleOptionPress(option.key, index)}
                      >
                        <View style={[
                          styles.radioOuter,
                          isSelected && styles.radioOuterSelected
                        ]}>
                          {isSelected && (
                            <View style={styles.radioInner} />
                          )}
                        </View>
                        <View style={styles.optionTextContainer}>
                          <Text style={styles.optionTitle}>{option.header}</Text>
                          {option.subText ? (
                            <Text style={styles.optionDescription}>{option.subText}</Text>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}

                  {/* Save Button */}
                  <Pressable style={styles.saveButton} onPress={handleClose}>
                    <Check color="#6EE7B7" size={20} strokeWidth={2.5} style={{ marginRight: 8 }} />
                    <Text style={styles.saveButtonText}>Save</Text>
                  </Pressable>
                </View>
              )}

              {/* Additional content */}
              {children}
            </ScrollView>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 100,
  },
  closeButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 4,
  },
  speakerText: {
    fontSize: 16,
    color: '#6EE7B7',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  notificationSection: {
    backgroundColor: '#1a3a5c',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 24,
    paddingBottom: 100,
    marginTop: 0,
    marginHorizontal: -20,
    minHeight: SCREEN_HEIGHT - FINAL_IMAGE_Y - FINAL_IMAGE_HEIGHT - 60,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6EE7B7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  radioOuterSelected: {
    backgroundColor: '#6EE7B7',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1a3a5c',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  navigateButton: {
    backgroundColor: 'rgba(110, 231, 183, 0.25)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(110, 231, 183, 0.5)',
  },
  navigateButtonText: {
    color: '#6EE7B7',
    fontSize: 17,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: 'rgba(110, 231, 183, 0.25)',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(110, 231, 183, 0.5)',
  },
  saveButtonText: {
    color: '#6EE7B7',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default HeroTransitionModal;
