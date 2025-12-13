import { View, Text, Dimensions, Pressable, ScrollView } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import Animated, { interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset } from 'react-native-reanimated';
// import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { supabase } from '@/src/lib/supabase';
import { Program, ProgramFormType } from '@/src/types';
import { Button, Icon, TextInput } from 'react-native-paper';
import { useAuth } from '@/src/providers/AuthProvider';
import { initializePaymentSheet } from '@/src/lib/stripe'
import { openPaymentSheet } from '@/src/lib/stripe';
import AddToCartProgramSheet from '@/src/components/ShopComponets/AddToCartSheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import TextInputForm from '@/src/components/ShopComponets/TextInputForm';
import RadioButtonForm from '@/src/components/ShopComponets/RadioButtonForm';
import CartButton from '@/src/components/ShopComponets/CartButton';
const ProgramInfo = () => {
    const { program_id } = useLocalSearchParams()
    const { session } = useAuth()
    const [ program, setProgram ] = useState<Program>()
    const [ programForm, setProgramForm ] = useState<ProgramFormType[]>()
    const [ visible, setVisible ] = useState(false);
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const handlePresentModalPress = () => bottomSheetRef.current?.present();
    const showModal = () => setVisible(true);
    const hideModal = () => setVisible(false);
    const [ isReady, setIsReady ] = useState<number[]>([])
    const { width } = Dimensions.get("window")
    const scrollRef = useAnimatedRef<Animated.ScrollView>()
    const [ buttonOn, setButtonOn ] = useState(false)
    const scrollOffset = useScrollViewOffset(scrollRef)
    // const height = Dimensions.get('screen').height - Tab
    const imageAnimatedStyle = useAnimatedStyle(() => {
      return{
        transform: [
          {
            translateY : interpolate(
            scrollOffset.value,
            [-250, 0, 250 ],
            [-250/2, 0, 250 * 0.75]
            )
          },
          {
            scale: interpolate(scrollOffset.value, [-250, 0, 250], [2, 1, 1])
          }
        ]
      }
    })

    const getInfo = async () => {
        const { data , error } = await supabase.from("programs").select("*").eq("program_id", program_id).single()
        const { data : programForms, error : programFormError} = await supabase.from('program_forms').select('*').eq('program_id', program_id)
        if( data ) {
            setProgram(data)
        }
        if( programForms && programForms.length > 0 ){
          setProgramForm( programForms )
        }
        else if( programForms?.length == 0 ){
          setButtonOn(true)
        }
    }

    const handleBuyNow = async () => {
      await initializePaymentSheet(Math.floor(program?.program_price! * 100))
      await openPaymentSheet()
    
    }

    const addToCart = async () => {
      const { error } = await supabase.from('user_cart').insert({ user_id : session?.user.id, program_id: program?.program_id, produt_quantity : 1 })
    }
    useEffect(() => {
        getInfo()
    }, [])
    useEffect(() => {
      if( isReady.length == programForm?.length){
        setButtonOn(true)
      }else{
        setButtonOn(false)
      }
    }, [isReady])
  return (
    <View className='flex-1 bg-white pt-[15%]' style={{flexGrow: 1}}>
    <Stack.Screen options={ { title : "Details", headerTransparent: true,  headerRight: () => <View className='mt-1'><CartButton /></View>, headerTitleStyle: { color : 'black'} }}/>
     <Animated.ScrollView ref={scrollRef}  scrollEventThrottle={16} contentContainerStyle={{justifyContent: "center", alignItems: "center", marginTop: "15%" }} showsVerticalScrollIndicator={false} >
         <Animated.Image 
           source={ program?.program_img ? { uri: program.program_img } : require("@/assets/images/MASHomeLogo.png") }
           style={ [{width: width / 2, height: 200, borderRadius: 8 }, imageAnimatedStyle] }
           resizeMode='stretch'
         />
        
        <View className='flex-row justify-between w-[100%] px-5 bg-white'>
            <Text className='text-black font-bold text-xl w-[50%]' allowFontScaling adjustsFontSizeToFit numberOfLines={1}>{program?.program_name}</Text>
            <Text className='text-[#57BA47] font-bold text-lg w-[50%] text-center' allowFontScaling adjustsFontSizeToFit numberOfLines={1}>${program?.program_price}<Text className='text-black text-md'> / Month</Text> </Text>
        </View>
        
        <View className='flex-1 w-[100%]'>
          <View className='bg-white'>
            <Text className='text-left text-2xl font-bold text-black ml-4'>Description: </Text>
          </View>
          <View className='items-center justify-center'>
            <View className='w-[95%] bg-white px-3 flex-wrap h-[300] py-2' style={{ borderRadius : 15, shadowColor : "gray", shadowOffset : { width : 0, height :0}, shadowOpacity : 2, shadowRadius : 1}}>
              <ScrollView><Text>{program?.program_desc}</Text></ScrollView>
            </View>
          </View>
          {programForm &&programForm?.length > 0 ? ( 
          <>
          <View className='pt-1'/>
          <View className='bg-white pt-1'>
              <Text className='text-left text-2xl font-bold text-black ml-4'>Form: </Text>
            </View>
            <ScrollView className='mt-5 w-[100%]  bg-white flex-col gap-y-2' contentContainerStyle={{ alignItems : 'center' }} bounces={false}>
                  { programForm ? programForm.map((item, index) => {
                    if( item.question_type == 'text_input' ) {
                      return <View className='w-[95%]' key={index}><TextInputForm item={item} setIsReady={setIsReady} isReady={isReady} index={index}/></View>
                    }
                    else if( item.question_type == 'radio_button'){
                      return <View className='w-[95%]' key={index}><RadioButtonForm item={item} isReady={isReady} setIsReady={setIsReady} index={index}/></View>
                    }
                  }) : <></>}
                  <View className='px-3 w-[100%] pt-3'>
                      <Button mode='contained' style={{ backgroundColor : "#57BA47", }} icon={ () => <Icon source={"cart-outline"} size={20} color={ buttonOn ? 'white' : 'gray'} />} onPress={handlePresentModalPress} disabled={!buttonOn} textColor='white'>Add to Cart</Button>
                  </View>
            </ScrollView>
          </>
          ) : (
           <View className='px-3 w-[100%] pt-3'>
            <Button mode='contained' style={{ backgroundColor : "#57BA47", }} icon={ () => <Icon source={"cart-outline"} size={20} color={ buttonOn ? 'white' : 'gray'} />} onPress={handlePresentModalPress} disabled={!buttonOn} textColor='white'>Add to Cart</Button>
          </View>
          )
          }
        </View>
     </Animated.ScrollView>
     <AddToCartProgramSheet ref={bottomSheetRef} program_id={program?.program_id!} program_img={program?.program_img!} program_price={program?.program_price!}  program_name={program?.program_name!} program_speaker={program?.program_speaker!} />
     </View>
  )
}

export default ProgramInfo