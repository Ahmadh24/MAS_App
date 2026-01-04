import { View, Text, StatusBar, useWindowDimensions, Image, Dimensions, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { Stack, useLocalSearchParams } from 'expo-router'
import JummahCards from './_JummahCards'
import { LinearGradient } from 'expo-linear-gradient'

const JummahDetails = () => {
  const { jummahName, index } = useLocalSearchParams() 
  const [ selectedNotification, setSelectedNotification ] = useState<number[]>([])
  const layout = useWindowDimensions().width
  const layoutHeight = useWindowDimensions().height
  const NOTICARDHEIGHT  = layoutHeight / 12
  const NOTICARDWIDTH  = layout * 0.8
  const { width } = Dimensions.get("window");
  const SupabaseJummahName = index == '1' ? 'first' : index == '2' ? 'second' : index == '3' ? 'third': index == '4' ? 'fourth' : ''
  return (
    <LinearGradient
      colors={['#1d4681', '#3183bf']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 40, paddingTop: 20 }}>
        <Stack.Screen options={{ 
          headerTitle: 'Jummah Settings', 
          headerBackTitle: '', 
          headerBackTitleVisible: false, 
          headerStyle: { backgroundColor: "transparent" },
          headerTransparent: true,
          headerTintColor: 'white',
        }}/>
        <StatusBar barStyle={'light-content'}/>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>Prayer {index == '1' ? 'One' : index == '2' ? 'Two' : index == '3' ? 'Three': index == '4' ? 'Four' : ''}</Text>
        <View className='mt-4'>
          <Image
            source={Number(index) == 1 || Number(index) == 2 ? require('@/assets/images/Jummah12.png') : require('@/assets/images/Jummah34.png')}
            style={{ width: width / 2, height: 200, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }}
            resizeMode='stretch'
          />
        </View>
        <View style={{ width: '100%', paddingVertical: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 24, textAlign: 'center', color: 'white' }}>{jummahName}</Text>
        </View>
        <View style={{ marginLeft: 8, width: '100%', paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: 'white' }}>Notification Options</Text>
        </View>
        <View style={{ width: '100%', alignItems: 'center', paddingTop: 12 }}>
          {
            [1,2,3].map((item, idx) => (
              <JummahCards key={idx} jummah={jummahName} height={NOTICARDHEIGHT} width={NOTICARDWIDTH} item={item} index={idx} setSelectedNotification={setSelectedNotification} selectedNotification={selectedNotification} SupabaseJummahName={SupabaseJummahName}/>
            ))
          }
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

export default JummahDetails