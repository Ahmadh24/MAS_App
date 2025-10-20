import React, { useCallback, useEffect, useRef } from 'react';

import {
  Animated,
  DimensionValue,
  StyleProp,
  ViewStyle,
} from 'react-native';

type SkeletonProps = {
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
  bgColor?: string;  
  style?: StyleProp<ViewStyle>;
};

export const FlyerSkeleton = ({
  width,
  height,
  bgColor = '#eee', // This can be any color, depending on your theme
  borderRadius = 20, // You can adjust the default borderRadius too
  style,
}: SkeletonProps) => {
  const animation = useRef(new Animated.Value(0.5)).current;

  const startAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 1000, // You can adjust the time as you want
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0.5,
          duration: 1000, // You can adjust the time as you want
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [animation]);

  useEffect(() => {
    startAnimation();
  }, [startAnimation]);

  const animatedStyle = {
    opacity: animation,
    width,
    height,
    backgroundColor: bgColor,
    borderRadius
  };

  return <Animated.View  style={[style, animatedStyle]} />;
};