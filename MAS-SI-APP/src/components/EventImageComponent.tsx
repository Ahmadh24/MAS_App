import { View, Text, Pressable, Image, ScrollView, Animated, Dimensions, Linking, PanResponder } from 'react-native'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'expo-router'
import { FlyerSkeleton } from './FlyerSkeleton'
import { EventsType, SheikDataType } from '../types'
import { Icon, Modal, Portal } from 'react-native-paper'
import { supabase } from '@/src/lib/supabase'
import { useAuth } from '@/src/providers/AuthProvider'
import { isBefore } from 'date-fns'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'

const EventImageComponent = ({item} : {item : EventsType}) => {
    const { session } = useAuth()
    const [ imageReady, setImageReady ] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [event, setEvent] = useState<EventsType | null>(null)
    const [speakerData, setSpeakerData] = useState<SheikDataType[]>([])
    const [speakerString, setSpeakerString] = useState('')
    const [speakerModalVisible, setSpeakerModalVisible] = useState(false)
    const [modalImageReady, setModalImageReady] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [eventInNotifications, setEventInNotifications] = useState(false)
    const [eventInPrograms, setEventInPrograms] = useState(false)
    const slideAnim = useRef(new Animated.Value(0)).current
    const panY = useRef(new Animated.Value(0)).current
    const panYValue = useRef(0)
    const modalScrollRef = useRef<ScrollView>(null)
    const isScrolling = useRef(false)
    const scrollOffset = useRef(0)
    const previousScrollOffset = useRef(0)
    const isClosing = useRef(false)
    const router = useRouter()
    const { width, height } = Dimensions.get("window")
    
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
                panYValue.current = 0;
            },
            onPanResponderMove: (evt, gestureState) => {
                // Only allow downward movement, with resistance at the top
                if (gestureState.dy > 0) {
                    // Add slight resistance for smoother feel
                    const resistance = gestureState.dy < 50 ? 0.5 : 1;
                    const newValue = gestureState.dy * resistance;
                    panY.setValue(newValue);
                    panYValue.current = newValue;
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
                    panYValue.current = currentPanY;
                    
                    // Animate panY from current position to height
                    Animated.timing(panY, {
                        toValue: height,
                        duration: Math.max(150, Math.min(300, 300 * (remainingDistance / height))),
                        useNativeDriver: true,
                    }).start((finished) => {
                        if (finished) {
                            // Clean up after animation completes
                            setModalVisible(false);
                            setSpeakerData([]);
                            setSpeakerString('');
                            panY.setValue(0);
                            panYValue.current = 0;
                            slideAnim.setValue(0);
                            scrollOffset.current = 0;
                            previousScrollOffset.current = 0;
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
                    }).start(() => {
                        panYValue.current = 0;
                    });
                }
            },
        })
    ).current

    const closeModal = useCallback(() => {
        // Don't close if already closing via drag
        if (isClosing.current) return;
        
        // Stop all ongoing animations
        slideAnim.stopAnimation();
        panY.stopAnimation();
        
        panY.setValue(0);
        panYValue.current = 0;
        scrollOffset.current = 0; // Reset scroll position
        previousScrollOffset.current = 0; // Reset previous scroll position
        isScrolling.current = false; // Reset scrolling state
        
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 40,
                friction: 8,
            }),
            Animated.spring(panY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 40,
                friction: 8,
            })
        ]).start(() => {
            setModalVisible(false);
            setSpeakerData([]);
            setSpeakerString('');
            setModalImageReady(false);
            panYValue.current = 0;
            previousScrollOffset.current = 0;
        });
    }, [slideAnim, panY]);

    const fetchEventData = async () => {
        if (!item.event_id) return;
        
        const { data: eventData, error } = await supabase
            .from('events')
            .select('*')
            .eq('event_id', item.event_id)
            .single();
        
        if (eventData && !error) {
            setEvent(eventData);
            // Check if event is in notifications/programs
            if (session?.user?.id) {
                const { data: notificationData } = await supabase
                    .from('program_notification_schedule')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .eq('program_event_name', eventData.event_name)
                    .single();
                setEventInNotifications(!!notificationData);

                const { data: programData } = await supabase
                    .from('user_programs')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .eq('program_event_id', eventData.event_id)
                    .single();
                setEventInPrograms(!!programData);
            }
        }
    };

    const fetchSpeakerData = async () => {
        const speakerArray = Array.isArray(item.event_speaker) ? item.event_speaker : (item.event_speaker ? [item.event_speaker] : []);
        if (speakerArray && speakerArray.length > 0) {
            const speakers: SheikDataType[] = [];
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
            
            setSpeakerData(speakers);
            setSpeakerString(speaker_string.join(''));
        }
    };

    const openModal = useCallback(() => {
        // Reset closing state
        isClosing.current = false;
        
        setModalVisible(true);
        setModalImageReady(false);
        setHasError(false);
        panY.setValue(0); // Reset pan gesture
        panYValue.current = 0;
        scrollOffset.current = 0; // Reset scroll position
        previousScrollOffset.current = 0; // Reset previous scroll position
        isScrolling.current = false; // Reset scrolling state
        
        // Stop any ongoing animations
        slideAnim.stopAnimation();
        panY.stopAnimation();
        
        Animated.spring(slideAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
        }).start();
        
        fetchEventData();
        fetchSpeakerData();
    }, [slideAnim, item.event_id]);

    useEffect(() => {
        if (modalVisible) {
            fetchEventData();
            fetchSpeakerData();
        }
    }, [modalVisible, item.event_id]);

    const handleNotificationPress = async () => {
        if (!session?.user?.id || !event) return;
        
        if (eventInNotifications) {
            // Remove from notifications
            const { error } = await supabase
                .from('program_notification_schedule')
                .delete()
                .eq('user_id', session.user.id)
                .eq('program_event_name', event.event_name);
            
            if (!error) {
                setEventInNotifications(false);
            }
        } else {
            // Add to notifications
            const { error } = await supabase
                .from('program_notification_schedule')
                .insert({
                    user_id: session.user.id,
                    program_event_name: event.event_name,
                    notification_type: 'event',
                    title: event.event_name
                });
            
            if (!error) {
                setEventInNotifications(true);
            }
        }
    };

    const handleAddToProgramsPress = async () => {
        if (!session?.user?.id || !event) return;
        
        if (eventInPrograms) {
            // Remove from programs
            const { error } = await supabase
                .from('user_programs')
                .delete()
                .eq('user_id', session.user.id)
                .eq('program_event_id', event.event_id);
            
            if (!error) {
                setEventInPrograms(false);
            }
        } else {
            // Add to programs
            const { error } = await supabase
                .from('user_programs')
                .insert({
                    user_id: session.user.id,
                    program_event_id: event.event_id,
                    program_event_name: event.event_name,
                    program_event_type: 'event'
                });
            
            if (!error) {
                setEventInPrograms(true);
            }
        }
    };

    const GetSheikData = () => {
        return (
            <View className='flex-1'>
                {speakerData?.map((speakerData, index) => (
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

    const handlePress = useCallback(() => {
        // If event has lectures, navigate to full event page
        if (item.has_lecture) {
            router.push(`/menu/program/events/${item.event_id}` as any);
        } else {
            // Otherwise open the slide-up modal
            openModal();
        }
    }, [item.has_lecture, item.event_id, router, openModal]);

    return (
        <>
            <View className='flex-col relative'>
                <Pressable onPress={handlePress}>
                    { !imageReady && 
                        <FlyerSkeleton width={150} height={150} style={{position : 'absolute', top : 0, zIndex : 2}}/>
                    }
                    <Image source={{ uri : item.event_img || undefined }} style={{ width : 150, height : 150, borderRadius : 8, margin : 5 }}  
                        onLoad={() => setImageReady(true)}
                        onError={() => setImageReady(false)}
                    />
                    <Text className='text-black font-medium pl-2 text-[10px] w-[150px] text-center' numberOfLines={1}>{item.event_name}</Text>
                </Pressable>

                {/* Description Card - Show for all events with descriptions */}
                {item.event_desc && (
                    <View style={{
                        marginHorizontal: 5,
                        marginTop: 4,
                    }}>
                        <Pressable onPress={handlePress}>
                            <Text 
                                className="text-[#0D509D] text-[10px] text-center"
                            >
                                Read full description
                            </Text>
                        </Pressable>
                    </View>
                )}
            </View>

            {/* Event Detail Modal - Slide Up - Only show if no lectures */}
            {(modalVisible || isClosing.current) && !item.has_lecture && (
                <Portal>
                    <Modal
                        visible={modalVisible}
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
                                    borderTopLeftRadius: 20,
                                    borderTopRightRadius: 20,
                                    borderBottomLeftRadius: 0,
                                    borderBottomRightRadius: 0,
                                    borderBottomWidth: 0,
                                    overflow: 'hidden',
                                    transform: [
                                        {
                                            translateY: Animated.add(
                                                slideAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [height, 0],
                                                }),
                                                panY
                                            )
                                        }
                                    ]
                                }}
                            >
                                <LinearGradient
                                    colors={['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                    }}
                                />
                                
                                {/* Drag Handle - Separate view with pan responder */}
                                <Animated.View
                                    {...panResponder.panHandlers}
                                    style={{
                                        width: '100%',
                                        paddingTop: 2,
                                        paddingBottom: 2,
                                        alignItems: 'center',
                                    }}
                                >
                                    <View style={{
                                        width: 40,
                                        height: 4,
                                        borderRadius: 2,
                                        backgroundColor: '#000000',
                                    }} />
                                </Animated.View>
                                
                                <ScrollView 
                                    ref={modalScrollRef}
                                    scrollEnabled={true}
                                    scrollEventThrottle={16}
                                    onScrollBeginDrag={(event) => {
                                        isScrolling.current = true;
                                        const offset = event.nativeEvent.contentOffset.y;
                                        previousScrollOffset.current = offset;
                                        // Reset pan if user starts scrolling down
                                        if (offset > 0) {
                                            panY.setValue(0);
                                            panYValue.current = 0;
                                        }
                                    }}
                                    onScrollEndDrag={(event) => {
                                        const offset = event.nativeEvent.contentOffset.y;
                                        
                                        // If at the top and we have a panY value, check if we should close
                                        if (offset <= 0 && panYValue.current > 20) {
                                            const threshold = height * 0.2; // Close if dragged down more than 20% of screen height
                                            
                                            if (panYValue.current > threshold) {
                                                // Close the sheet
                                                isClosing.current = true;
                                                slideAnim.stopAnimation();
                                                panY.stopAnimation();
                                                
                                                const currentPanY = panYValue.current;
                                                const remainingDistance = height - currentPanY;
                                                
                                                Animated.timing(panY, {
                                                    toValue: height,
                                                    duration: Math.max(150, Math.min(300, 300 * (remainingDistance / height))),
                                                    useNativeDriver: true,
                                                }).start((finished) => {
                                                    if (finished) {
                                                        setModalVisible(false);
                                                        setSpeakerData([]);
                                                        setSpeakerString('');
                                                        panY.setValue(0);
                                                        panYValue.current = 0;
                                                        slideAnim.setValue(0);
                                                        scrollOffset.current = 0;
                                                        previousScrollOffset.current = 0;
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
                                                }).start(() => {
                                                    panYValue.current = 0;
                                                });
                                            }
                                        } else if (panYValue.current > 0 && offset > 0) {
                                            // If user scrolled away from top, reset pan
                                            panY.setValue(0);
                                            panYValue.current = 0;
                                        }
                                        
                                        // Small delay to ensure scroll has ended
                                        setTimeout(() => {
                                            isScrolling.current = false;
                                        }, 100);
                                    }}
                                    onMomentumScrollBegin={() => {
                                        isScrolling.current = true;
                                    }}
                                    onMomentumScrollEnd={(event) => {
                                        const offset = event.nativeEvent.contentOffset.y;
                                        
                                        // If at the top and we have a panY value, check if we should close
                                        if (offset <= 0 && panYValue.current > 20) {
                                            const threshold = height * 0.2;
                                            
                                            if (panYValue.current > threshold) {
                                                // Close the sheet
                                                isClosing.current = true;
                                                slideAnim.stopAnimation();
                                                panY.stopAnimation();
                                                
                                                const currentPanY = panYValue.current;
                                                const remainingDistance = height - currentPanY;
                                                
                                                Animated.timing(panY, {
                                                    toValue: height,
                                                    duration: Math.max(150, Math.min(300, 300 * (remainingDistance / height))),
                                                    useNativeDriver: true,
                                                }).start((finished) => {
                                                    if (finished) {
                                                        setModalVisible(false);
                                                        setSpeakerData([]);
                                                        setSpeakerString('');
                                                        panY.setValue(0);
                                                        panYValue.current = 0;
                                                        slideAnim.setValue(0);
                                                        scrollOffset.current = 0;
                                                        previousScrollOffset.current = 0;
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
                                                }).start(() => {
                                                    panYValue.current = 0;
                                                });
                                            }
                                        } else if (panYValue.current > 0 && offset > 0) {
                                            // If user scrolled away from top, reset pan
                                            panY.setValue(0);
                                            panYValue.current = 0;
                                        }
                                        
                                        setTimeout(() => {
                                            isScrolling.current = false;
                                        }, 100);
                                    }}
                                    onScroll={(event) => {
                                        const offset = event.nativeEvent.contentOffset.y;
                                        const previousOffset = previousScrollOffset.current;
                                        
                                        // Only process if we're actually at or past the top
                                        if (offset <= 0) {
                                            // If scrolling further up (offset becoming more negative)
                                            if (offset < previousOffset) {
                                                // User is trying to scroll up at the top - trigger close gesture
                                                const scrollUpAmount = Math.abs(offset);
                                                // Add resistance for smoother feel - less resistance at the start
                                                const resistance = scrollUpAmount < 100 ? 0.6 : (scrollUpAmount < 200 ? 0.8 : 1);
                                                const newValue = Math.min(scrollUpAmount * resistance, height * 0.5); // Cap at 50% of screen
                                                panY.setValue(newValue);
                                                panYValue.current = newValue;
                                            } else if (offset > previousOffset && panYValue.current > 0) {
                                                // Scrolling back towards top, reduce pan value proportionally
                                                const reduction = previousOffset - offset;
                                                const newValue = Math.max(0, panYValue.current - Math.abs(reduction));
                                                panY.setValue(newValue);
                                                panYValue.current = newValue;
                                            }
                                        } else {
                                            // User has scrolled down from top, reset pan
                                            if (panYValue.current > 0) {
                                                panY.setValue(0);
                                                panYValue.current = 0;
                                            }
                                        }
                                        
                                        scrollOffset.current = offset;
                                        previousScrollOffset.current = offset;
                                    }}
                                    showsVerticalScrollIndicator={true}
                                    bounces={true}
                                    contentContainerStyle={{
                                        justifyContent: "flex-start",
                                        alignItems: "stretch",
                                        paddingBottom: 40
                                    }}
                                    style={{ flex: 1 }}
                                >
                                    {/* Custom Header with Notification and Add to Programs Buttons */}
                                    <View style={{ 
                                        position: 'absolute', 
                                        top: 0, 
                                        left: 0, 
                                        right: 0, 
                                        zIndex: 100, 
                                        paddingTop: 30, 
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
                                            {event && isBefore(new Date().toISOString(), event.event_end_date || '') ? (
                                                <>
                                                    <BlurView intensity={20} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
                                                        <Pressable onPress={handleNotificationPress} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                                                            {eventInNotifications ? <Icon source={"bell-check"} color='white' size={20}/> : <Icon source={"bell-outline"} color='white' size={20}/>}
                                                        </Pressable>
                                                    </BlurView>
                                                    <BlurView intensity={20} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
                                                        <Pressable onPress={handleAddToProgramsPress} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                                                            {eventInPrograms ? <Icon source={'minus-circle-outline'} color='white' size={20}/> : <Icon source={"plus-circle-outline"} color='white' size={20}/>}
                                                        </Pressable>
                                                    </BlurView>
                                                </>
                                            ) : (
                                                <BlurView intensity={20} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
                                                    <Pressable onPress={handleAddToProgramsPress} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                                                        {eventInPrograms ? <Icon source={'minus-circle'} color='white' size={20}/> : <Icon source={"plus-circle-outline"} color='white' size={20}/>}
                                                    </Pressable>
                                                </BlurView>
                                            )}
                                        </View>
                                    </View>
                                    
                                    {/* Event Image */}
                                    <View style={{
                                        width: '100%',
                                        height: height * 0.5,
                                        borderRadius: 0,
                                        overflow: 'hidden',
                                        alignSelf: 'stretch',
                                        backgroundColor: '#FFFFFF',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}>
                                        {!modalImageReady && (
                                            <FlyerSkeleton 
                                                width={width} 
                                                height={height * 0.5} 
                                                style={{ position: 'absolute', top: 0, zIndex: 2 }} 
                                            />
                                        )}
                                        <View style={{
                                            width: '100%',
                                            height: '100%',
                                            maxWidth: width,
                                            maxHeight: height * 0.5,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}>
                                            <Image
                                                source={hasError || !item.event_img 
                                                    ? require("@/assets/images/MASHomeLogo.png")
                                                    : { uri: item.event_img }}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    maxWidth: '100%',
                                                    maxHeight: '100%',
                                                    borderRadius: 0,
                                                }}
                                                resizeMode="contain"
                                                onLoad={() => setModalImageReady(true)}
                                                onError={() => {
                                                    setHasError(true);
                                                    setModalImageReady(true);
                                                }}
                                            />
                                        </View>
                                        
                                        {/* Sign Up Button - Bottom Right of Flyer */}
                                        {event && (event.is_paid || item.is_paid) && (
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
                                                            const paidLink = event?.paid_link || item.paid_link;
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
                                    <View className='w-[100%]' style={{ paddingBottom: 0 }}>
                                        <Text className='text-center mt-4 text-2xl text-black font-bold'>
                                            {event?.event_name || item.event_name}
                                        </Text>
                                        
                                        {speakerString && (
                                            <Pressable onPress={() => setSpeakerModalVisible(true)} style={{ alignSelf: 'center', marginTop: 8 }}>
                                                <BlurView intensity={60} tint="dark" style={{ 
                                                    borderRadius: 8, 
                                                    overflow: 'hidden', 
                                                    paddingHorizontal: 8, 
                                                    paddingVertical: 4, 
                                                    backgroundColor: '#2A2A2A',
                                                    shadowColor: "#000",
                                                    shadowOffset: { width: 0, height: 4 },
                                                    shadowOpacity: 0.4,
                                                    shadowRadius: 8,
                                                    elevation: 8,
                                                }}>
                                                    <Text className='text-center text-[#60A5FA] font-semibold text-sm' numberOfLines={1}>
                                                        {speakerString}
                                                    </Text>
                                                </BlurView>
                                            </Pressable>
                                        )}

                                        {/* Description Content */}
                                        <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 16, width: '100%' }}>
                                            <Text className='text-2xl font-bold text-black mb-2' style={{ paddingHorizontal: 4 }}>
                                                Description
                                            </Text>
                                            {(event || item) && (event?.event_desc || item.event_desc) ? (
                                                <View className='px-4 py-3 rounded-xl' style={{
                                                    backgroundColor: '#2A2A2A',
                                                    shadowColor: "#000",
                                                    shadowOffset: { width: 0, height: 4 },
                                                    shadowOpacity: 0.4,
                                                    shadowRadius: 8,
                                                    elevation: 8,
                                                }}>
                                                    <Text className='text-base text-gray-300 leading-6'>
                                                        {event?.event_desc || item.event_desc}
                                                    </Text>
                                                </View>
                                            ) : (
                                                <View className='px-4 py-3 rounded-xl' style={{
                                                    backgroundColor: '#2A2A2A',
                                                    shadowColor: "#000",
                                                    shadowOffset: { width: 0, height: 4 },
                                                    shadowOpacity: 0.4,
                                                    shadowRadius: 8,
                                                    elevation: 8,
                                                }}>
                                                    <Text className='text-base text-gray-400 leading-6 text-center'>
                                                        No description available
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </ScrollView>
                            </Animated.View>
                        </Animated.View>
                        
                        {/* Speaker Modal */}
                        <Portal>
                            <Modal
                                visible={speakerModalVisible}
                                onDismiss={() => setSpeakerModalVisible(false)}
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
                </Portal>
            )}
        </>
    )
}

export default EventImageComponent
