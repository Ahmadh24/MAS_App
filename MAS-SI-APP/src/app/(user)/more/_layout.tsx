import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const MoreLayout = () => {
  return (
    <Stack>
        <Stack.Screen name='index' options={{ headerShown : false }} />
        <Stack.Screen name='MasShop' />
    </Stack>
  )
}

export default MoreLayout