import React, { useState, useImperativeHandle, forwardRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withSequence,
  withRepeat
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const NUM_CONFETTI = 80;
const rainbowColors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];

const ConfettiItem = ({ trigger, firstTimeFired } ) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const rotateY = useSharedValue(0)
  const opacity = useSharedValue(1);

  // Assign a random rainbow color once per confetti item.
  const color = useMemo(() => {
    const index = Math.floor(Math.random() * rainbowColors.length);
    return rainbowColors[index];
  }, []);

  useEffect(() => {
    if (trigger) {
      const variation = Math.PI / 5; // ~10° in radians
      const angle = -( Math.PI / 2 + (Math.random() - 0.5) * 2 * variation);
      const angleX = -(Math.random() * 2 * Math.PI);
      const distance = Math.random() * (screenHeight / 4);

      const angleXConfetti = (distance * Math.cos(angleX)) / 1.5
      translateX.value = withSequence(withTiming(((distance * Math.cos(angleX)) / 1.5 ), {duration : 300}));
      translateY.value = withSequence( withTiming(distance * Math.sin(angle), {duration : 300}), withTiming(-distance * Math.sin(angle), { duration : 2500 }));
      rotate.value = withRepeat(withTiming(Math.random() * 360, { duration: 600 }), 5, true);
      rotateY.value = withRepeat(withTiming(Math.random()* 360 , { duration : 600}) , 5, true)
      opacity.value = withSequence(withTiming(1), withTiming(0, { duration : 1500 }));
    } else{
        const angleX = -(Math.random() * 2 * Math.PI);
        const distance = Math.random() * (screenHeight / 4);
        const angleXConfetti = (distance * Math.cos(angleX)) / 1.5;

        translateX.value = 0;
        translateY.value = 0;
        rotate.value = 0;
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateY: `${rotateY.value}deg` },
      { rotateX : `${rotate.value}deg`}
    ],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.confettiItem, { backgroundColor: color }, animatedStyle]} />;
};

const Confetti = forwardRef((props, ref) => {
  const [trigger, setTrigger] = useState(false);
  const [ firstTimeFired, setFirstTimeFired ] = useState(false)
  useImperativeHandle(ref, () => ({
    fire: () => {
      setTrigger(true);
      setFirstTimeFired(true)
      // Reset trigger after animation completes 
      setTimeout(() => setTrigger(false), 3000);
    },
  }));

  return (
    <View style={styles.container}
    >
      {Array.from({ length: NUM_CONFETTI }).map((_, index) => (
        <ConfettiItem key={index} trigger={trigger} firstTimeFired={firstTimeFired}/>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: 0,
    width: screenWidth,
    height: screenHeight,
  },
  confettiItem: {
    position: 'absolute',
    width: 10,
    height: 10,
  },
});

export default Confetti;