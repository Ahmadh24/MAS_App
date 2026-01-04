import React from 'react';
import { View, ViewProps } from 'react-native';

// Type for LiquidGlassView props
type LiquidGlassViewProps = ViewProps & {
  interactive?: boolean;
  effect?: 'clear' | 'regular' | 'strong';
  children?: React.ReactNode;
};

// Safe import wrapper for @callstack/liquid-glass
let LiquidGlassViewComponent: React.ComponentType<LiquidGlassViewProps> | null = null;
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
const FallbackView: React.FC<LiquidGlassViewProps> = ({ children, style, ...props }) => (
  <View style={style} {...props}>
    {children}
  </View>
);

// Export safe versions - ensure fallback is used
export const LiquidGlassView: React.FC<LiquidGlassViewProps> = (LiquidGlassViewComponent || FallbackView) as React.FC<LiquidGlassViewProps>;
export const isLiquidGlassSupported = isLiquidGlassSupportedValue;

