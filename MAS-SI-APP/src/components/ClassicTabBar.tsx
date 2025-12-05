import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import TabArray from '@/src/app/(user)/tabArray';

const TAB_COUNT = TabArray.length;

// Spring animation config - subtle and smooth
const SPRING_CONFIG = {
    damping: 20,
    stiffness: 200,
};

// Colors - clean and classic
const ACTIVE_COLOR = '#007AFF'; // iOS blue
const INACTIVE_COLOR = '#8E8E93'; // iOS gray
const BACKGROUND_COLOR = '#FFFFFF';
const BORDER_COLOR = '#E5E5E5';

const ClassicTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const insets = useSafeAreaInsets();
    const containerWidth = useSharedValue(0);

    // Animated values for active indicator position
    const indicatorPosition = useSharedValue(0);

    // Animated values for icon scales
    const iconScale0 = useSharedValue(1);
    const iconScale1 = useSharedValue(1);
    const iconScale2 = useSharedValue(1);
    const iconScale3 = useSharedValue(1);
    const iconScales = [iconScale0, iconScale1, iconScale2, iconScale3];

    // Update animations when route changes
    useEffect(() => {
        // Filter to only visible routes (those in TabArray)
        const visibleRoutes = state.routes.filter(route =>
            TabArray.some(tab => tab.name === route.name)
        );
        const visibleIndex = visibleRoutes.findIndex(route =>
            state.routes[state.index]?.name === route.name
        );

        // Calculate active indicator position
        if (containerWidth.value > 0 && visibleIndex >= 0) {
            const tabWidth = containerWidth.value / visibleRoutes.length;
            const targetPosition = visibleIndex * tabWidth + tabWidth / 2;
            indicatorPosition.value = withSpring(targetPosition, SPRING_CONFIG);
        }

        // Update icon scales - only for visible tabs
        visibleRoutes.forEach((route, index) => {
            const actualIndex = state.routes.findIndex(r => r.key === route.key);
            const isActive = state.index === actualIndex;
            if (iconScales[index]) {
                iconScales[index].value = withSpring(isActive ? 1.05 : 1, SPRING_CONFIG);
            }
        });
    }, [state.index]);

    // Animated style for active indicator dot
    const indicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: indicatorPosition.value - 4 }], // 4 is half of dot width (8/2)
        };
    });

    // Animated styles for icon scales
    const iconStyle0 = useAnimatedStyle(() => ({ transform: [{ scale: iconScale0.value }] }));
    const iconStyle1 = useAnimatedStyle(() => ({ transform: [{ scale: iconScale1.value }] }));
    const iconStyle2 = useAnimatedStyle(() => ({ transform: [{ scale: iconScale2.value }] }));
    const iconStyle3 = useAnimatedStyle(() => ({ transform: [{ scale: iconScale3.value }] }));
    const iconStyles = [iconStyle0, iconStyle1, iconStyle2, iconStyle3];

    const handlePress = (route: any, visibleIndex: number, onPress: () => void) => {
        // Light haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Subtle press animation
        if (iconScales[visibleIndex]) {
            iconScales[visibleIndex].value = 0.95;
            iconScales[visibleIndex].value = withSpring(1.05, SPRING_CONFIG);
        }

        // Call the original onPress handler from the descriptor
        onPress();
    };

    return (
        <View
            style={[
                styles.container,
                {
                    paddingBottom: insets.bottom,
                },
            ]}
        >
            {/* Top Border */}
            <View style={styles.borderTop} />

            {/* Active Indicator Dot */}
            <Animated.View
                style={[styles.indicator, indicatorStyle]}
                pointerEvents="none"
            />

            {/* Tabs Container */}
            <View
                style={styles.tabsContainer}
                onLayout={(event) => {
                    const width = event.nativeEvent.layout.width;
                    containerWidth.value = width;

                    // Filter to only visible routes (those in TabArray)
                    const visibleRoutes = state.routes.filter(route =>
                        TabArray.some(tab => tab.name === route.name)
                    );

                    // Find the visible index of the current route
                    const currentRoute = state.routes[state.index];
                    const visibleIndex = currentRoute
                        ? visibleRoutes.findIndex(route => route.name === currentRoute.name)
                        : -1;

                    if (visibleIndex >= 0 && visibleRoutes.length > 0) {
                        const tabWidth = width / visibleRoutes.length;
                        indicatorPosition.value = visibleIndex * tabWidth + tabWidth / 2;
                    }
                }}
            >
                {state.routes
                    .filter(route => {
                        // Only show routes that exist in TabArray
                        return TabArray.some(tab => tab.name === route.name);
                    })
                    .map((route, visibleIndex) => {
                        const { options } = descriptors[route.key];
                        const actualIndex = state.routes.findIndex(r => r.key === route.key);
                        const isFocused = state.index === actualIndex;
                        const tabItem = TabArray.find(tab => tab.name === route.name);

                        // Skip if tab item not found (shouldn't happen, but safety check)
                        if (!tabItem) {
                            return null;
                        }

                        const iconStyle = iconStyles[visibleIndex] || iconStyles[0];
                        const iconColor = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;
                        const textColor = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

                        // Create onPress handler - use React Navigation's built-in handler
                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        return (
                            <Pressable
                                key={route.key}
                                onPress={() => {
                                    handlePress(route, visibleIndex, onPress);
                                }}
                                style={styles.tab}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                accessibilityLabel={options.tabBarAccessibilityLabel}
                                testID={options.tabBarTestID}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Animated.View style={[styles.iconContainer, iconStyle]}>
                                    <Icon
                                        source={tabItem?.icon || 'circle'}
                                        size={24}
                                        color={iconColor}
                                    />
                                </Animated.View>

                                <Text
                                    style={[
                                        styles.label,
                                        { color: textColor },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {String(tabItem?.title || options.title || route.name || '')}
                                </Text>
                            </Pressable>
                        );
                    })
                    .filter(Boolean)}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: BACKGROUND_COLOR,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    borderTop: {
        height: 0.5,
        backgroundColor: BORDER_COLOR,
        width: '100%',
    },
    indicator: {
        position: 'absolute',
        top: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: ACTIVE_COLOR,
    },
    tabsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 8,
        minHeight: 60,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    label: {
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
    },
});

export default ClassicTabBar;


