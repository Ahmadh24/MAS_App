import { View, Text, ScrollView, useWindowDimensions, Pressable, Image, SafeAreaView } from 'react-native'
import React, { useEffect, useState } from 'react'
import  {LinearGradient } from "expo-linear-gradient"
import { Link, Stack } from 'expo-router'
import { Icon, Searchbar } from 'react-native-paper'
import ShopCategories from './ShopCategories'
import { useAuth } from '@/src/providers/AuthProvider'
import { supabase } from '@/src/lib/supabase'
import CartButton from '@/src/components/ShopComponets/CartButton'
import Animated from 'react-native-reanimated'
const MasShop = () => { 
  const [ cartAmount, setCartAmount ] = useState(0)
  const { session } = useAuth()
  const width = useWindowDimensions().width
  const height = useWindowDimensions().height
 
  console.log(cartAmount)
  return (
    <View style={{ backgroundColor : "white", height : height, width : width }} >
        <Stack.Screen options={{ headerTransparent : true, title : "", headerBackTitleVisible : false }}/>
        <SafeAreaView className='px-3'>
            <View className='flex-row w-[100%] items-end justify-end pl-2 pr-2'>
                <View>
                    <CartButton />
               </View>
            </View>
        </SafeAreaView>
          {/*  <LinearGradient colors={["#d3d3d3", "#949494"]} start={{ x : 0.1, y: 0.2 }} style={{ flexDirection : "row", width : "90%", alignSelf : "center", marginTop : 10, height : 100, borderRadius : 10 }} locations={[0.9, 1]}>
                <View className='px-3 py-3 flex-col'>
                    <Text className='text-white font-bold'>Promos for fast purchase</Text>
                    <Text>Special Offer</Text>
                    <Text className='text-white font-bold'>15% off</Text>
                </View>
                <View className='h-[100] w-[40%] items-center justify-center'>
                    <Image 
                        source={{ uri : defaultProgramImage }}
                        style={{ height : "90%", width : "100%", objectFit : 'fill', borderRadius : 10 }}
                    />
                </View>
            </LinearGradient> */}
            <View className='mt-3 px-3'>
                <Text className='text-2xl font-bold'>Discover Programs</Text>
            </View>
            <View className='flex-1 '>
                <ShopCategories />
            </View>
           
    </View>
  )
}

export default MasShop