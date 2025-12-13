import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, Pressable, ScrollView, useWindowDimensions, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Link, router, Stack } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { differenceInDays, format, toDate } from 'date-fns'
import Svg, { Path, Circle } from 'react-native-svg'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Program } from '@/src/types'

const DeleteProgramScreen = () => {
    const [programs, setPrograms] = useState<any[]>([])
    const TodaysDate = new Date()
    const getPrograms = async () => {
        const { data: UserPrograms, error } = await supabase.from('programs').select('*')

        if (UserPrograms) {
            {/* const filteredUserPrograms = UserPrograms?.filter((obj1, i, arr) => 
        arr.findIndex(obj2 => (obj2.program_id === obj1.program_id)) === i)
    const AllPrograms : any[] = []
    await Promise.all(filteredUserPrograms?.map( async (id) => {
        const { data : program, error } = await supabase.from('programs').select('*').eq('program_id', id.program_id).single()
        if( program ){
            AllPrograms.push(program)
        }
        })
    ) */}
            setPrograms(UserPrograms)
        }

    }
    const width = useWindowDimensions().width
    useEffect(() => {
        getPrograms()
        const listenforprograms = supabase
            .channel('listen for programs change')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: "programs",
                },
                async (payload) => await getPrograms()
            )
            .subscribe()

        return () => { supabase.removeChannel(listenforprograms) }
    }, [])

    return (
        <View className='flex-1 grow bg-white' style={{ paddingBottom: 30 }}>
            <Stack.Screen
                options={{
                    title: "Delete A Program",
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
                <Text className='ml-4 font-bold text-lg my-6'>Select a Program</Text>
                <FlatList
                    style={{ flex: 1 }}
                    data={programs}
                    renderItem={({ item }) => (
                        <DeleteSlider item={item} TodaysDate={TodaysDate} width={width} />
                    )}
                />
            </View>

        </View>
    )
}


const DeleteSlider = ({ item, TodaysDate, width }: { item: Program, TodaysDate: Date, width: number }) => {
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
                            <Image source={{ uri: item.program_img }} style={{ borderRadius: 8, width: '100%', height: 95 }} />
                        </View>
                        <View className='w-[70%] pl-2 bg-[#F6F6F6] h-[95] rounded-tr-[20px] rounded-br-[20px]'>
                            <Text className='text-lg text-black font-bold '>{item.program_name}</Text>
                            <Text className='  text-sm text-[#A2A2A2]' numberOfLines={1}>Start Date: {format(item.program_start_date, 'P')}</Text>
                            <Text className='  text-sm text-[#A2A2A2]' numberOfLines={1}>Scheduled End Date: {format(item.program_end_date, 'P')} </Text>
                            {differenceInDays(item.program_end_date, TodaysDate) > 0 ? <Text className='text-gray-700'><Text className='text-green-500' >{differenceInDays(item.program_end_date, TodaysDate)} Days Left</Text> until Program ends</Text> : <Text className='text-red-500'>Program Has Ended</Text>}
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
            <Animated.View style={[DeleteSliderWidth]} className='h-[95px] bg-white items-center justify-center' >
                <Pressable className='w-[100%] flex flex-col items-center justify-center gap-1' onPress={() => {
                    Alert.alert('Are you sure you want to delete this program?', `Press Delete to remove ${item.program_name}`, [
                        {
                            text: 'Cancel',
                            onPress: () => { },
                        },
                        {
                            text: 'Delete',
                            onPress: async () => {
                                await supabase.from('programs').delete().eq('program_id', item.program_id);
                                const { error: remove } = await supabase.storage.from('fliers').remove([`${item.program_name.trim().split(" ").join("")}.png`]);
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
export default DeleteProgramScreen