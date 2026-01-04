import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const MoreLayout = () => {
  return (
    <Stack>
        <Stack.Screen 
          name='index' 
          options={{ 
            headerShown: false,
            presentation: 'transparentModal',
            animation: 'fade',
          }} 
        />
        <Stack.Screen 
          name='PreferencesOnboarding' 
          options={{ 
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }} 
        />
    </Stack>
  )
}

export default MoreLayout