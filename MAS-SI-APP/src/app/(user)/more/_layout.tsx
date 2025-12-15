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
            // cardStyle: { backgroundColor: 'transparent' },
            // cardOverlayEnabled: true,
          }} 
        />
    </Stack>
  )
}

export default MoreLayout