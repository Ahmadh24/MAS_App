import { View, Text, ScrollView, Dimensions, SafeAreaView, StatusBar } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { useAuth } from '@/src/providers/AuthProvider'
import { BusinessSubmissionsProp } from '@/src/types'
import BusinessSubmissionsCard from '@/src/components/BusinessAdsComponets/BusinessSubmissionsCard'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'

const BusinessSubmissions = () => {
  const { session } = useAuth()
  const { user_id } = useLocalSearchParams() 
  const { height , width } = Dimensions.get('window')
  const [ submissions, setSubmissions ] = useState<BusinessSubmissionsProp[]>()
  const getSubmissions = async () => {
    const { data , error } =  await supabase.from('business_ads_submissions').select('*').eq('user_id', session?.user.id )
    if( data ){
      setSubmissions(data)
    }
  }
  const tabBarHeight = useBottomTabBarHeight() + 30
  useEffect(() => {
    getSubmissions()
  }, [])
  return (
    <View style={{ backgroundColor : 'gray', width, height }} >
      <Stack.Screen options={{ headerTransparent : true, headerTitle : '', headerBackTitleVisible : false, }}/>
      <StatusBar barStyle={'light-content'}/>
      <SafeAreaView style={{ width : width, height : height / 5 }}>
        <Text className='text-3xl text-center font-bold'>Status</Text>
      </SafeAreaView>
      <ScrollView style={{ backgroundColor : '#DADADA', borderTopRightRadius : 40, borderTopLeftRadius : 40, width : width }} contentContainerStyle={{  paddingTop : 15, width : width * .9, alignItems : 'center', alignSelf : 'center', flexGrow : 1, paddingBottom : tabBarHeight }} >
        { submissions?.map((item, index) => {
          return(
            <BusinessSubmissionsCard submission={item} index={index} key={index}/>
          )
        })}
      </ScrollView>
    </View>
  )
}

export default BusinessSubmissions