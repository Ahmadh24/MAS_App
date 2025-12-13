import { View, Text, ScrollView, Pressable } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Stack, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { ActivityIndicator, Button, Divider, Icon, TextInput } from 'react-native-paper'
import CartProgramItems, { CartEventItems } from '@/src/components/ShopComponets/CartItems'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { initializePaymentSheet, openPaymentSheet } from '@/src/lib/stripe'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import CheckoutSheet from '@/src/components/ShopComponets/CheckoutSheet'
type CartProp = {
  user_id: string
  program_id: string | null
  event_id: string | null
  product_quantity: number
}
const Cart = () => {
  const { user_id } = useLocalSearchParams()
  const [cartContent, setCartContent] = useState<CartProp[]>()
  const [loading, setLoading] = useState(true)
  const [promo, setPromo] = useState('')
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const handlePresentModalPress = () => bottomSheetRef.current?.present()
  // const tabBarHeight = useBottomTabBarHeight() + 30
  const [opened, setOpened] = useState(false)
  const onItemPress = () => {
    setOpened(!opened)
  }

  const animatedStyle = useAnimatedStyle(() => {
    const animatedHeight = opened ? withTiming(100) : withTiming(0);
    return {
      height: animatedHeight
    }
  })
  const getCart = async () => {
    const { data, error } = await supabase.from("user_cart").select("*").eq("user_id", user_id)
    if (data) {
      setCartContent(data)
    }
  }
  const callForDonationAmount = async (amount: number) => {
    await initializePaymentSheet(Math.floor(amount * 100))
    await openPaymentSheet()
  }
  useEffect(() => {
    getCart()

    const cart = supabase.channel('Cart Adds')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_cart',
          filter: `user_id=eq.${user_id}`,
        },
        (payload) => getCart()
      )
      .subscribe();
    setLoading(false)
    return () => { supabase.removeChannel(cart) }
  }, [])
  if (loading) {
    return (
      <ScrollView contentContainerStyle={{ height: "100%", width: "100%", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </ScrollView>
    )
  }
  return (
    <View className='flex-1 bg-white'>
      <Stack.Screen options={{ title: "My Cart", headerStyle: { backgroundColor: 'white', }, headerTintColor: '#007AFF', headerTitleStyle: { color: 'black' } }} />
      <ScrollView className='bg-white flex-1'>
        {
          cartContent && cartContent.length > 0 ? cartContent.map((item, index) => {
            if (item.program_id) {
              return <CartProgramItems program_id={item.program_id} product_quantity={item.product_quantity} key={index} />
            }
            else if (item.event_id) {
              return <CartEventItems event_id={item.event_id} product_quantity={item.product_quantity} key={index} />
            }
          }) : <View className='flex-1 items-center justify-center'><Text className='text-2xl font-bold'>Your Cart Is Empty! </Text></View>
        }
      </ScrollView>
      <View className='self-center mb-3'>
        <TextInput
          mode='outlined'
          theme={{ roundness: 50 }}
          style={{ width: 300, backgroundColor: "#e8e8e8", height: 45 }}
          activeOutlineColor='#0D509D'
          value={promo}
          onChangeText={setPromo}
          placeholder="Promo Code"
          textColor='black'
          right={<TextInput.Affix text='Apply' textStyle={{ color: "#0D509D" }} />}
        />
      </View>
      <View className='w-[70%] self-center'>
        <Pressable style={{ backgroundColor: '#57BA47', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: 20, height: 40 }} onPress={handlePresentModalPress} >
          <Text className='text-white font-bold text-xl'>Checkout</Text>
        </Pressable>
      </View>
      <CheckoutSheet ref={bottomSheetRef} promo={promo} />
    </View>
  )
}

export default Cart