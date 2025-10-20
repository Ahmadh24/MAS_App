import { View, Text, ScrollView, Image, Dimensions, Animated, FlatList } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import { Extrapolation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
function formatPhoneNumber( phoneNumberString : number ) {
  var cleaned = ('' + phoneNumberString).replace(/\D/g, '');
  var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return null;
}
const ApprovedAds = ( {setRenderedFalse, setRenderedTrue} : { setRenderedFalse : ( ) => void, setRenderedTrue : ( ) => void } ) => {
  const [ ads, setAds ] = useState<any[]>([])
  const [ index, setIndex ] = useState(0)
  const [ active, setActive ] = useState(0)
  const flatListRef = useRef<FlatList>(null)
  const listItemWidth = Dimensions.get('screen').width
  const getAds = async () => {
    setAds([])
    const { data , error } = await supabase.from('approved_business_ads').select('*')
    if( error ){
        console.log(error)
        setRenderedFalse()
    }
    else if ( data && data.length < 1 ){
      setRenderedFalse()
    }
    else if( data ){
        const adsFlyer : any[] = []
        await Promise.all(
            data.map(async ( ad ) =>{
                const { data, error } = await supabase.from('business_ads_submissions').select('business_flyer_img, business_name, business_address, business_phone_number, business_email').eq('submission_id', ad.submission_id).single()
                if( data ){
                    adsFlyer.push(data)
                }
            })
        )
        setAds(adsFlyer)
       setRenderedTrue()
    }
  }
  const getItemLayout = (data : any,index : any) => ({
    length : listItemWidth * .93,
    offset :( listItemWidth * .93 ) * index,
    index : index
  })

const handleScroll = (event : any) =>{
  const scrollPositon = event.nativeEvent.contentOffset.x;
  const index = Math.ceil(scrollPositon / listItemWidth * .93);
  setActive(index)
}
  useEffect( () => {
    getAds()
    const listenforads = supabase
    .channel('listen for Event changes')
    .on(
      'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: "approved_business_ads",
    },
    async (payload) => await getAds()
    )
    .subscribe()

    return () => { supabase.removeChannel( listenforads )}
  }, [])
      
  useEffect(() => {
  if( ads && ads?.length > 0){
  let interval =  setInterval(() =>{
    if (active < Number(ads.length) - 1) {
      flatListRef.current?.scrollToIndex({
        index : active + 1,
        animated : true,
      })
      setActive(active + 1);
  } else {
    flatListRef.current?.scrollToIndex({
      index : 0,
      animated : true
    })
  }
  }, 5000);
  
  return () => clearInterval(interval);
}
});

  // const TestAds = [
  //   {
  //     business_flyer_img : 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fGZseWVyJTIwYWR8ZW58MHx8fHwxNjg3NTQ5NzA1&ixlib=rb-4.0.3&q=80&w=400',
  //     business_name : 'Business Name',
  //     business_address : 'Business Address',
  //   },
  //   {
  //     business_flyer_img : 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fGZseWVyJTIwYWR8ZW58MHx8fHwxNjg3NTQ5NzA1&ixlib=rb-4.0.3&q=80&w=400',
  //     business_name : 'Business Name',
  //     business_address : 'Business Address',
  //   },
  //   {
  //     business_flyer_img : 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fGZseWVyJTIwYWR8ZW58MHx8fHwxNjg3NTQ5NzA1&ixlib=rb-4.0.3&q=80&w=400',
  //     business_name : 'Business Name',
  //     business_address : 'Business Address',
  //   },
  //   {
  //     business_flyer_img : 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fGZseWVyJTIwYWR8ZW58MHx8fHwxNjg3NTQ5NzA1&ixlib=rb-4.0.3&q=80&w=400',
  //     business_name : 'Business Name',
  //     business_address : 'Business Address',
  //   },
  //   {
  //     business_flyer_img : 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fGZseWVyJTIwYWR8ZW58MHx8fHwxNjg3NTQ5NzA1&ixlib=rb-4.0.3&q=80&w=400',
  //     business_name : 'Business Name',
  //     business_address : 'Business Address',
  //   },
  //   {
  //     business_flyer_img : 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fGZseWVyJTIwYWR8ZW58MHx8fHwxNjg3NTQ5NzA1&ixlib=rb-4.0.3&q=80&w=400',
  //     business_name : 'Business Name',
  //     business_address : 'Business Address',
  //   },
  //   {
  //     business_flyer_img : 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fGZseWVyJTIwYWR8ZW58MHx8fHwxNjg3NTQ5NzA1&ixlib=rb-4.0.3&q=80&w=400',
  //     business_name : 'Business Name',
  //     business_address : 'Business Address',
  //   }
  // ]

  if ( ads.length < 1 ){
    return
  } 
  return (
      <View className='h-[300] bg-gray-300 p-1 self-center mt-3 relative' style={{ borderRadius : 20,  width : listItemWidth * .95 }}>
        <BlurView className=' bg-white' style={{ borderRadius : 19,overflow : 'hidden', width : listItemWidth * .93 }} intensity={80}>
        <Animated.FlatList 
            className='h-[100%] w-full'
            ref={flatListRef}
            horizontal
            onScroll={(event) =>{
              handleScroll(event);
            }}
            snapToInterval={listItemWidth * .93}
            scrollEventThrottle={16}
            decelerationRate={0.6}
            disableIntervalMomentum={true}
            disableScrollViewPanResponder={true}
            snapToAlignment={"start"}
            showsHorizontalScrollIndicator={false}
            getItemLayout={getItemLayout}
            data={ads}           
            renderItem={({item}) => (
              <View className='h-[100%] flex flex-col bg-gray-500' style={{  borderRadius : 19, overflow : 'hidden', width : listItemWidth * .93}}>
                  <Image source={{ uri : item.business_flyer_img}} style={{  width : '100%', height : 250, objectFit : 'fill' }}/>
                  <View className='px-2 mt-1'>
                    <Text className='text-white text-[12px]' numberOfLines={1} adjustsFontSizeToFit><Text className='font-bold'>{item.business_name}</Text> {item.business_address}</Text>
                    <Text className='text-white text-[12px]' numberOfLines={1} adjustsFontSizeToFit>Contacts: {item.business_email} {formatPhoneNumber(item.business_phone_number)}</Text>
                  </View>
              </View>
            )}
        />
        </BlurView>

      </View>
  )
}

export default ApprovedAds