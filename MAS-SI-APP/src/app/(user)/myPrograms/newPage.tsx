import { View, Text, ScrollView, StatusBar } from 'react-native'
import React from 'react'
import { Stack, useRouter } from 'expo-router'
import { Icon } from 'react-native-paper'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'

const RecordedLectures = () => {
  const router = useRouter()
  const tabBarHeight = useBottomTabBarHeight()

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Recorded Lectures', 
          headerBackTitleVisible: false, 
          headerTintColor: '#007AFF', 
          headerTitleStyle: { color: 'black' }, 
          headerStyle: { backgroundColor: 'white' }
        }}
      />
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20, paddingHorizontal: 16, paddingTop: 16 }}
        className="bg-white flex-1"
      >
        <View className="items-center justify-center" style={{ minHeight: 400 }}>
          <Icon source="video" size={64} color="#007AFF" />
          <Text className="text-2xl font-bold mt-4 text-center">Recorded Lectures</Text>
          <Text className="text-gray-500 text-center mt-2">
            View and manage your recorded lectures here.
          </Text>
        </View>
      </ScrollView>
    </>
  )
}

export default RecordedLectures

