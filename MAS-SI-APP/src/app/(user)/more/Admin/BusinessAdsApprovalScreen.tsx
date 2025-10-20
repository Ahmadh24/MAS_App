import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import { Link, router, Stack } from 'expo-router'
import Svg, { Path } from 'react-native-svg'

const BusinessAdsApprovalScreen = () => {
  const [ ads, setAds ] = useState<any[]>([])
  const getAds = async () => {
    setAds([])
    const { data, error } = await supabase.from('business_ads_submissions').select('*').neq('status', 'APPROVED').neq('status', 'REJECT')
    if ( data ){
      setAds( data )
    }
  }

  useEffect(() => {
    getAds()
    const checkStatus = supabase.channel('Check for Business Status').on(
      'postgres_changes', 
      { event : "*",
        schema : 'public', 
        table : 'business_ads_submissions' 
      }, 
      async (payload) => await getAds()
    )
    .subscribe()

    return () => { supabase.removeChannel( checkStatus ) }

  }, [])

  return (
    <View className='flex-1 bg-white'>
        <Stack.Screen 
            options={{
              headerTransparent : true,
              header : () => (
                <View className="relative">
                  <View className="h-[110px] w-[100%] rounded-br-[65px] bg-[#5E636B] items-start justify-end pb-[5%] z-[1]">
                    <Pressable className="flex flex-row items-center justify-between w-[40%]" onPress={() => router.back()}>
                      <Svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                        <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="#1B85FF" stroke-width="2"/>
                      </Svg>
                      <Text className=" text-[25px] text-white">Business Ads</Text>
                    </Pressable>
                  </View>
                  <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
                  <View className="w-[70%] items-center"> 
                    <Text className=" text-[15px] text-black ">Approve or Reject a application</Text>
                  </View>
                  </View>
                </View>
              )
            }}
          />
      <Text className="font-bold text-2xl p-3 pt-[170px] my-4 ">Business Ads</Text>
      <View className='flex-1 grow pb-20'>
        <FlatList 
        style={{ flex : 1 }}
        data={ads}
        renderItem={({item}) =>(
          <View style={{marginHorizontal: 2}}>
          <Link  href={{pathname: '/(user)/more/Admin/ApproveBusinessScreen', params: { submission : item.submission_id } }}
                asChild >
            <TouchableOpacity>
              <View className='mt-1 self-center justify-center bg-white p-2 flex-row' style={{ borderRadius: 20, width: '95%'}}>
                
                <View className='justify-center w-[30%]'>
                  <Image source={{ uri : item.business_flyer_img }} style={{ borderRadius : 8, width : '100%', height : 95}}/>
                </View>
                <View className='w-[70%] pl-2'>
                  <Text className='text-lg text-black font-bold ' numberOfLines={1}>{item.business_name}</Text>
                  <Text className='my-2  text-sm text-black font-bold' numberOfLines={1}>{item.business_phone_number}</Text>
                </View>
              </View>
            </TouchableOpacity>
            </Link>
          </View>
        )}
        />
      </View>
      
    </View>
  )
}

export default BusinessAdsApprovalScreen

const styles = StyleSheet.create({})