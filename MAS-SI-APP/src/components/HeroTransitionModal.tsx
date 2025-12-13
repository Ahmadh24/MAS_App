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
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { X, ChevronLeft } from 'lucide-react-native';

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
}

const FINAL_IMAGE_WIDTH = SCREEN_WIDTH * 0.85;
const FINAL_IMAGE_HEIGHT = 300;
const FINAL_IMAGE_X = (SCREEN_WIDTH - FINAL_IMAGE_WIDTH) / 2;
const FINAL_IMAGE_Y = 100;

export const HeroTransitionModal: React.FC<HeroTransitionProps> = ({
  visible,
  onClose,
  imageUri,
  title,
  subtitle,
  layoutInfo,
  children,
  onNavigate,
}) => {
  const [showContent, setShowContent] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Animated values for the image
  const imageX = useSharedValue(layoutInfo?.x ?? 0);
  const imageY = useSharedValue(layoutInfo?.y ?? 0);
  const imageWidth = useSharedValue(layoutInfo?.width ?? 170);
  const imageHeight = useSharedValue(layoutInfo?.height ?? 170);
  const borderRadius = useSharedValue(8);
  const opacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

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
              <View style={{ height: FINAL_IMAGE_Y + FINAL_IMAGE_HEIGHT + 20 }} />

              {/* Title */}
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

              {/* Additional content */}
              {children}

              {/* Action button */}
              {onNavigate && (
                <Pressable style={styles.navigateButton} onPress={onNavigate}>
                  <Text style={styles.navigateButtonText}>View Details</Text>
                </Pressable>
              )}
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
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  navigateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
    alignSelf: 'center',
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default HeroTransitionModal;

