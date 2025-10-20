import { View, Text, Pressable, FlatList, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { EventsType, Program } from '@/src/types'
import { AccordionItem } from './_Accordion'
import { Link } from 'expo-router'
import { useSharedValue } from 'react-native-reanimated'
import { Icon } from 'react-native-paper'
import { FlyerSkeleton } from '@/src/components/FlyerSkeleton'
import FlyerImageComponent from '@/src/components/FlyerImageComponent'
import EventImageComponent from '@/src/components/EventImageComponent'

const Days = ( {Programs , Day, Kids, Pace, Events, TodaysDate, index } : {Programs : Program[], Day : string, Kids : Program[], Pace : EventsType[], Events : EventsType[], TodaysDate : number, index : number }) => {
  const Section = useSharedValue(false);
  const [ rotateChevron , setRotateChevron ] = useState(false)
  const onPress = () => {
    Section.value = !Section.value
    setRotateChevron(!rotateChevron)
  } 
  useEffect(() => {
    if ( index == TodaysDate  - 1) {
        Section.value = true
        setRotateChevron(true)
    }
  }, [])
  return (
    <View className='flex-col p-2 w-[100%] gap-1'>
        <Pressable onPress={onPress} className='w-[100%] justify-between flex-row'>
            <Text className='font-bold text-xl'>{Day}</Text>
            <View style={{ transform : [{ rotate : rotateChevron ?  '90deg' : '0deg' }] }}>
                <Icon size={30} source={'chevron-right'} color='gray'/>
            </View>
        </Pressable>
            <AccordionItem isExpanded={Section}  viewKey={Day} style={{ flexDirection:'column', gap: 20, width : '100%', alignItems : 'flex-start' }}>
            {
            Kids && Kids.length > 0 ? <>
                <Text className='text-black text-left self-start text-[15px] mb-4'>Kids Programs: </Text>
                <FlatList 
                    data={Kids}
                    renderItem={({item}) => <FlyerImageComponent item={item} />
                }
                    horizontal
                    showsHorizontalScrollIndicator={false}

                />
            </> : <></>
            }
            {
            Programs && Programs.length > 0 ? <>
                <Text className='text-black mt-4 mb-4 self-start text-[15px]'>Programs: </Text>
                <FlatList 
                    data={Programs.filter(program => program.is_kids == false)}
                    renderItem={({item}) => <FlyerImageComponent item={item} /> }
                    horizontal
                    showsHorizontalScrollIndicator={false}

                /> 
            </> : <></>
            }
            {
              Events && Events.length > 0 ? <>
               <Text className='text-black mt-4 mb-4 self-start text-[15px]'>Events: </Text>
                <FlatList 
                    data={Events}
                    renderItem={({item}) => <EventImageComponent item={item}/>}
                    horizontal
                    showsHorizontalScrollIndicator={false}

                /> 
            </> : <></>
            }
            {
            Pace && Pace.length > 0 ? <>
              <Text className='text-black mt-4 mb-4 self-start text-[15px]'>Pace:</Text>
                <FlatList 
                    data={Pace}
                    renderItem={({item}) => <EventImageComponent item={item}/>}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                />
            </> : <></>
            }
            </AccordionItem>
    </View>
  )
}

export default Days