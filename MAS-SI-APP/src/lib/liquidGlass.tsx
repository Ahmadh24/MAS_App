import React from 'react';
import { View, ViewProps } from 'react-native';

// Safe import wrapper for @callstack/liquid-glass
let LiquidGlassViewComponent: React.ComponentType<any> | null = null;
let isLiquidGlassSupportedValue = false;

try {
  const liquidGlass = require('@callstack/liquid-glass');
  LiquidGlassViewComponent = liquidGlass.LiquidGlassView;
  // Handle both function and boolean cases
  if (typeof liquidGlass.isLiquidGlassSupported === 'function') {
    isLiquidGlassSupportedValue = liquidGlass.isLiquidGlassSupported() ?? false;
  } else {
    isLiquidGlassSupportedValue = liquidGlass.isLiquidGlassSupported ?? false;
  }
} catch (error) {
  // Module not available, use fallback
  console.warn('@callstack/liquid-glass not available, using fallback');
}

// Fallback component that just renders children
const FallbackView: React.FC<ViewProps> = ({ children, style, ...props }) => (
  <View style={style} {...props}>
    {children}
  </View>
);

// Export safe versions
export const LiquidGlassView = LiquidGlassViewComponent || FallbackView;
export const isLiquidGlassSupported = isLiquidGlassSupportedValue;

