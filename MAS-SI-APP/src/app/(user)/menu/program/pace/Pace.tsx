import { View, Text, FlatList, Image, TouchableOpacity, ScrollView, Pressable, RefreshControl } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Divider, Icon } from 'react-native-paper'
import RenderEvents from '@/src/components/EventsComponets/RenderEvents'
import PaceFlyers from '@/src/components/PaceComponents/PaceFlyers'
import { supabase } from '@/src/lib/supabase'
import { EventsType } from '@/src/types'
import { Link } from 'expo-router'
import { AccordionItem } from '../upcomingEvents/_Accordion'
import { useSharedValue } from 'react-native-reanimated'

const Pace = () => {
  const [pace, setPace] = useState<EventsType[]>([])
  const [prevPace, setPrevPace] = useState<EventsType[]>()
  const socialServicesAccordion = useSharedValue(false)
  const [socialServicesChev, setSocialServicesChev] = useState(false)
  const [refreshing, setRefreshing] = React.useState(false);
  const [socialPace, setSocialPace] = useState<EventsType[]>()
  const prevPaceAccodordion = useSharedValue(false)
  const [pastChevronValue, setPastChevronValue] = useState(false)

  const getPace = async () => {
    setRefreshing(true)
    const date = new Date()
    const isoString = date.toISOString()
    const { data: CurrentPace, error } = await supabase.from('events').select('*').eq('pace', true).gte('event_end_date', isoString)
    const { data: PrevPace, error: prevError } = await supabase.from('events').select('*').eq('pace', true).eq('has_lecture', true).lte('event_end_date', isoString)
    const { data: SocialPace, error: SocialPaceError } = await supabase.from('events').select('*').eq('pace', true).eq('is_social', true).gte('event_end_date', isoString)

    if (CurrentPace) {
      setPace(CurrentPace)
    }
    if (PrevPace) {
      setPrevPace(PrevPace)
    }
    if (SocialPace) {
      setSocialPace(SocialPace)
    }
    if (error) {
      console.log(error)
    }
    setRefreshing(false)
  }
  useEffect(() => {
    getPace()
    const listenForEvents = supabase
      .channel('listen for Event changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: "events",
        },
        async (payload) => await getPace()
      )
      .subscribe()

    return () => { supabase.removeChannel(listenForEvents) }
  }, [])
  return (
    <View className='bg-[#0D509D] flex-1 '>
      <ScrollView style={{ borderTopLeftRadius: 40, borderTopRightRadius: 40, height: '100%', backgroundColor: 'white' }} contentContainerStyle={{
        paddingTop: 2, backgroundColor: 'white', paddingBottom: 30
      }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => await getPace()} />}
      >
        <View className='mt-5 w-[100%]'>
          <Text className='font-bold text-black text-lg ml-3 mb-8'>Current Pace Events</Text>
          <View className='flex-row flex flex-wrap gap-y-5 my-2'>
            {
              pace?.map((item) => (
                <View style={{ width: "50%" }}>
                  <Link href={`/menu/program/events/${item.event_id}`}
                    asChild >
                    <TouchableOpacity className='items-center'>
                      <View style={{ flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <View style={{ justifyContent: "center", alignItems: "center", backgroundColor: "white", borderRadius: 15 }}>
                          <Image
                            source={{ uri: item.event_img || require('@/assets/images/MASHomeLogo.png') }}
                            style={{ width: 150, height: 150, objectFit: "cover", borderRadius: 15 }}
                          />
                        </View>
                        <View>
                          <View className='mt-2 items-center justify-center bg-white w-[80%] self-center'>
                            <Text style={{ textAlign: "center" }} className='text-md text-center' numberOfLines={1} >{item.event_name}</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Link>
                </View>
              ))
            }
          </View>
          <Divider className='h-[0.5] w-[70%] self-center' />

          <Pressable className='w-[100%] justify-between flex flex-row pr-3 mt-2 mb-8' onPress={() => { socialServicesAccordion.value = !socialServicesAccordion.value; setSocialServicesChev(!socialServicesChev) }}>
            <Text className={`font-bold text-black text-lg ml-3`}>Social Services</Text>
            <View style={{ transform: [{ rotate: socialServicesChev ? '90deg' : '0deg' }] }} className=' '>
              <Icon source={'chevron-right'} size={30} color='gray' />
            </View>
          </Pressable>

          <AccordionItem isExpanded={socialServicesAccordion} style={{}} viewKey={'Social Service'}>
            <View className='flex-row flex flex-wrap gap-y-5 my-2 mb-5'>
              {
                socialPace?.map((item) => (
                  <View style={{ width: "50%" }}>
                    <Link href={`/menu/program/events/${item.event_id}`}
                      asChild >
                      <TouchableOpacity className='items-center'>
                        <View style={{ flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <View style={{ justifyContent: "center", alignItems: "center", backgroundColor: "white", borderRadius: 15 }}>
                            <Image
                              source={{ uri: item.event_img || require('@/assets/images/MASHomeLogo.png') }}
                              style={{ width: 150, height: 150, objectFit: "cover", borderRadius: 15 }}
                            />
                          </View>
                          <View>
                            <View className='mt-2 items-center justify-center bg-white w-[80%] self-center'>
                              <Text style={{ textAlign: "center" }} className='text-md text-center' numberOfLines={1} >{item.event_name}</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Link>
                  </View>
                ))
              }
            </View>
          </AccordionItem>
          <Divider className='h-[0.5] w-[70%] self-center bg-black' />


          <Pressable className='w-[100%] justify-between flex flex-row pr-3 mt-2 ' onPress={() => { prevPaceAccodordion.value = !prevPaceAccodordion.value; setPastChevronValue(!pastChevronValue) }}>
            <Text className={`font-bold text-black text-lg ml-3  ${!pastChevronValue ? 'mb-[61]' : 'mb-0'}`}>Past Recorded Pace Events</Text>
            <View style={{ transform: [{ rotate: pastChevronValue ? '90deg' : '0deg' }] }} className=''>
              <Icon source={'chevron-right'} size={30} color='gray' />
            </View>
          </Pressable>

          <AccordionItem isExpanded={prevPaceAccodordion} style={{}} viewKey={'Past'}>
            <View className='flex-row flex flex-wrap gap-y-5 mt-7'>
              {
                prevPace?.map((item) => (
                  <View style={{ width: "50%" }}>
                    <Link href={`/menu/program/events/${item.event_id}`}
                      asChild >
                      <TouchableOpacity className='items-center'>
                        <View style={{ flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <View style={{ justifyContent: "center", alignItems: "center", backgroundColor: "white", borderRadius: 15 }}>
                            <Image
                              source={{ uri: item.event_img || require('@/assets/images/MASHomeLogo.png') }}
                              style={{ width: 150, height: 150, objectFit: "cover", borderRadius: 15 }}
                            />
                          </View>
                          <View>
                            <View className='mt-2 items-center justify-center bg-white w-[80%] self-center'>
                              <Text style={{ textAlign: "center" }} className='text-md text-center' numberOfLines={1} >{item.event_name}</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Link>
                  </View>
                ))
              }
            </View>
          </AccordionItem>
        </View>
      </ScrollView>
    </View>

  )
}

export default Pace