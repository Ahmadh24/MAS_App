import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, Pressable, ScrollView, useWindowDimensions, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Link, router, Stack } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { differenceInDays, format, toDate } from 'date-fns'
import Svg, { Path, Circle } from 'react-native-svg'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Program, SheikDataType } from '@/src/types'

const DeleteSpeakers = () => {
    const TodaysDate = new Date()
    const [speakers, setSpeakers] = useState<any[]>([])
    const width = useWindowDimensions().width

    const getSpeakers = async () => {
        const { data, error } = await supabase.from('speaker_data').select('*')
        if (data) {
            setSpeakers(data)
        }
    }

    useEffect(() => {
        getSpeakers()
        const listenforspeakers = supabase
            .channel('listen for speakers change')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: "speaker_data",
                },
                async (payload) => await getSpeakers()
            )
            .subscribe()

        return () => { supabase.removeChannel(listenforspeakers) }
    }, [])

    return (
        <View className='flex-1 grow bg-white' style={{ paddingBottom: 30 }}>
            <Stack.Screen
                options={{
                    title: "Delete A Speaker Or Sheik",
                    headerStyle: { backgroundColor: "#F9FAFB" },
                    headerTitleStyle: {
                        fontSize: 22,
                        fontWeight: '600',
                        color: '#1F2937'
                    },
                    headerTintColor: '#4A5568',
                    headerShadowVisible: false,
                }}
            />
            <View className='flex-1 grow'>
                <Text className='ml-4 font-bold text-lg my-6'>Select a Speaker</Text>
                <FlatList
                    style={{ flex: 1 }}
                    data={speakers}
                    renderItem={({ item }) => (
                        <DeleteSlider item={item} TodaysDate={TodaysDate} width={width} />
                    )}
                />
            </View>

        </View>
    )
}


const DeleteSlider = ({ item, TodaysDate, width }: { item: SheikDataType, TodaysDate: Date, width: number }) => {
    const SliderWidth = useSharedValue(0)
    const DeleteOpacity = useSharedValue(0)
    const [visible, setVisible] = React.useState(false);

    const showDialog = () => setVisible(true);

    const hideDialog = () => setVisible(false);

    const Slider = useAnimatedStyle(() => {
        return {
            width: width - SliderWidth.value
        }
    })
    const DeleteSliderWidth = useAnimatedStyle(() => {
        return {
            width: SliderWidth.value,
            opacity: DeleteOpacity.value
        }
    })
    const onPress = () => {
        if (SliderWidth.value == 60) {
            SliderWidth.value = withTiming(0, { duration: 500 })
            DeleteOpacity.value = withTiming(0, { duration: 500 })
        } else {
            SliderWidth.value = withTiming(60, { duration: 500 })
            DeleteOpacity.value = withTiming(1, { duration: 500 })
        }
    }
    return (
        <View className='w-[100%] items-center flex flex-row'>
            <Animated.View style={[{ marginHorizontal: 2 }, Slider]}>
                <TouchableOpacity className='w-[100%]' onPress={onPress}>
                    <View className='mt-1 self-center justify-center bg-white p-2 flex-row' style={{ borderRadius: 20, width: '95%' }}>
                        <View className='justify-center w-[30%]'>
                            <Image source={{ uri: item.speaker_img }} style={{ borderRadius: 8, width: '100%', height: 95 }} />
                        </View>
                        <View className='w-[70%] pl-2 bg-[#F6F6F6] rounded-r-[15px] h-[100px]'>
                            <Text className='text-[14px] font-[400] text-black pt-1' numberOfLines={1} >{item.speaker_name}</Text>
                            <Text className='text-sm text-[#A2A2A2] font-[400] pt-1' numberOfLines={3}>{item.speaker_creds && item.speaker_creds.length > 0 ? item.speaker_creds.join(',') : 'No Credentials Added...'}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
            <Animated.View style={[DeleteSliderWidth]} className='h-[95px] bg-white items-center justify-center' >
                <Pressable className='w-[100%] flex flex-col items-center justify-center gap-1' onPress={() => {
                    Alert.alert('Are you sure you want to delete this program?', `Press Delete to remove ${item.speaker_name}`, [
                        {
                            text: 'Cancel',
                            onPress: () => { },
                        },
                        {
                            text: 'Delete',
                            onPress: async () => {
                                await supabase.from('speaker_data').delete().eq('speaker_id', item.speaker_id)
                                const { error: remove } = await supabase.storage.from('sheikh_img').remove([`${item.speaker_name.trim().split(" ").join("_")}.png`]);

                            },
                            style: 'destructive',
                        },

                    ]
                    );
                }} >
                    <Svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                        <Circle cx="17" cy="17" r="12.15" stroke="#7E869E" stroke-opacity="0.25" stroke-width="1.2" />
                        <Path d="M22.6673 11.3335L11.334 22.6668" stroke="#FF0000" stroke-width="1.2" stroke-linecap="square" stroke-linejoin="round" />
                        <Path d="M11.3327 11.3335L22.666 22.6668" stroke="#FF0000" stroke-width="1.2" stroke-linecap="square" stroke-linejoin="round" />
                    </Svg>
                    <Text className='text-red-500 text-sm' numberOfLines={1}>Delete</Text>
                </Pressable>
            </Animated.View>
        </View>
    )
}

export default DeleteSpeakers