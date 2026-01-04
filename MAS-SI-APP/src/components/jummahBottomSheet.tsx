import { View, Image, ScrollView, StyleSheet, Modal, Pressable, Dimensions, PanResponder } from 'react-native';
import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { JummahBottomSheetProp } from '../types';
import { Text, Icon, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInDown, 
  SlideOutDown, 
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  primary: '#214E91',
  accent: '#57BA47',
  gold: '#62E090',
  white: '#FFFFFF',
  lightBlue: '#E8F4FD',
  gray: '#6B7280',
};

export interface JummahBottomSheetRef {
  snapToIndex: (index: number) => void;
  close: () => void;
}

export const JummahBottomSheet = forwardRef<JummahBottomSheetRef, JummahBottomSheetProp>(
  ({ speaker, topic, desc, jummah_time }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(0);

    const closeSheet = () => {
      setIsVisible(false);
    };

    useImperativeHandle(ref, () => ({
      snapToIndex: (index: number) => {
        if (index >= 0) {
          translateY.value = 0;
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      close: () => {
        setIsVisible(false);
      },
    }));

    const panGesture = Gesture.Pan()
      .onUpdate((event) => {
        if (event.translationY > 0) {
          translateY.value = event.translationY;
        }
      })
      .onEnd((event) => {
        if (event.translationY > 100 || event.velocityY > 500) {
          translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, () => {
            runOnJS(closeSheet)();
          });
        } else {
          translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
        }
      });

    const animatedSheetStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    return (
      <>
        <Modal
          visible={isVisible}
          transparent
          animationType="none"
          onRequestClose={() => setIsVisible(false)}
        >
          {/* Backdrop */}
          <Pressable 
            style={styles.backdrop} 
            onPress={() => setIsVisible(false)}
          >
            <Animated.View 
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              style={StyleSheet.absoluteFill}
            />
          </Pressable>

          {/* Sheet Content */}
          <GestureDetector gesture={panGesture}>
            <Animated.View
              entering={SlideInDown.duration(300).easing(Easing.out(Easing.cubic))}
              exiting={SlideOutDown.duration(250).easing(Easing.in(Easing.cubic))}
              style={[styles.sheetContainer, { paddingBottom: insets.bottom }, animatedSheetStyle]}
            >
              {/* Header with gradient */}
              <LinearGradient
                colors={['#1e3a5f', '#2d5a87']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
              >
                {/* Handle inside gradient */}
                <View style={styles.handleContainer}>
                  <View style={styles.handle} />
                </View>
              
              <View style={styles.headerContent}>
                <View style={styles.timeContainer}>
                  <Icon source="clock-outline" size={20} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.timeText}>{jummah_time}</Text>
                </View>
                <Text style={styles.headerTitle}>{topic || 'Jummah Prayer'}</Text>
              </View>
            </LinearGradient>

            {/* Content */}
            <ScrollView 
              style={styles.contentContainer} 
              contentContainerStyle={styles.contentContainerStyle}
              showsVerticalScrollIndicator={false}
            >
              {/* Speaker Section */}
              <View style={styles.speakerSection}>
                {/* Profile Picture */}
                <Image
                  source={speaker?.speaker_img ? { uri: speaker.speaker_img } : require("@/assets/images/MASHomeLogo.png")}
                  style={styles.speakerImage}
                  resizeMode='cover'
                />
                
                {/* Speaker Info */}
                <View style={styles.speakerInfo}>
                  <Text style={styles.speakerLabel}>Speaker</Text>
                  <View style={styles.speakerNamePill}>
                    <Icon source="account" size={20} color={COLORS.primary} />
                    <Text style={styles.speakerName}>
                      {speaker?.speaker_name || 'To be announced'}
                    </Text>
                  </View>
                </View>
              </View>

              <Divider style={styles.divider} />

              {/* Description Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon source="text-box-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>About This Week</Text>
                </View>
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionText}>{desc}</Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Icon source="mosque" size={16} color={COLORS.gray} />
                <Text style={styles.footerText}>MAS Staten Island</Text>
              </View>
            </ScrollView>
            </Animated.View>
          </GestureDetector>
        </Modal>
      </>
    );
  }
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.75,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerContent: {
    gap: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentContainerStyle: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  speakerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  speakerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  speakerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  speakerLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  speakerNamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  speakerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: '#E5E7EB',
  },
  descriptionContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },
  descriptionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.gray,
  },
});
