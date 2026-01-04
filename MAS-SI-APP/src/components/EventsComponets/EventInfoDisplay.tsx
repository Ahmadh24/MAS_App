import { View, Text, Dimensions, Image, ScrollView, Pressable, Linking, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, router } from "expo-router"
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Animated,{ interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset } from 'react-native-reanimated';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { Divider, Portal, Modal, IconButton, Icon, Button } from 'react-native-paper';
import { Lectures, SheikDataType, Program } from '@/src/types';
import { EventsType } from '@/src/types';
import { EventLectureType } from '@/src/types';
import RenderEventsLectures from './RenderEventLectures';
import RenderEventLectures from "./RenderEventLectures"
type EventInfoDisplayProp = {
    event_img : string 
    event_speaker : string 
    event_name : string 
    event_desc : string 
    event : EventsType
}
const EventInfoDisplay = ({ event_img, event_speaker, event_name, event_desc, event} : EventInfoDisplayProp) => {
    const [ visible, setVisible ] = useState(false);
    const showModal = () => setVisible(true);
    const hideModal = () => setVisible(false);
    const [ speakerData, setSpeakerData ] = useState<SheikDataType[]>([]);
    const [ speakerString, setSpeakerString ] = useState('')
    const Tab = useBottomTabBarHeight()
  
    const { width, height } = Dimensions.get("window")
    const scrollRef = useAnimatedRef<Animated.ScrollView>()
    const scrollOffset = useScrollViewOffset(scrollRef)
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
        const getSpeakers = async () => {
          if (!event_speaker || !Array.isArray(event_speaker)) {
            setSpeakerData([])
            setSpeakerString('')
            return
          }
          const speakers : any[] = []
          let speaker_string : string[] = event_speaker.map(() => {return ''})
          await Promise.all(
            event_speaker.map( async ( speaker_id : string, index : number) => {
              const {data : speakerInfo, error : speakerInfoError } = await supabase.from('speaker_data').select('*').eq('speaker_id', speaker_id).single()
              if ( speakerInfo ){
                if (index == event_speaker.length - 1 ){
                  speaker_string[index]=speakerInfo.speaker_name
                }
                else {
                  speaker_string[index]= speakerInfo.speaker_name + ' & '
                }
                speakers.push(speakerInfo)
              }
            })
          )
          setSpeakerData(speakers)
          setSpeakerString(speaker_string.join(''))
        }

        const GetSheikData =  () => {
          return( 
            <View className='flex-1'>
            
            { 
              speakerData?.map((speakerData) => (
                <View className='border-2 border-gray-400 border-solid rounded-[25px] p-2 my-1'>
                  <Animated.View className=' flex-row'>
                      <Image source={ speakerData.speaker_img ? {uri : speakerData?.speaker_img } : require("@/assets/images/MASHomeLogo.png")} style={{width: 110, height: 110, borderRadius: 50}} resizeMode='cover'/>
                  <View className='flex-col px-1'>
                    <Text className='text-xl font-bold'>Name: </Text>
                    <Text className='pt-2 font-semibold' numberOfLines={1}> {speakerData?.speaker_name} </Text>
                  </View>
                </Animated.View>
          
                <View className='flex-col py-3'>
                  { speakerData?.speaker_name == "MAS" ? <Text className='font-bold'>Impact </Text> :  <Text className='font-bold'>Credentials: </Text> } 
                  { speakerData?.speaker_creds?.map( (cred, i) => {
                    return <Text key={i}> <Icon source="cards-diamond-outline"  size={15} color='black'/> {cred} {'\n'}</Text>
                  })}
                </View>
                </View>
                ))
            }
          </View>
          )
        } 

        useEffect(() => {
          getSpeakers()
        }, [event_speaker])

  return (
    <View className='flex-1 bg-white' style={{flexGrow: 1}}>
    <Stack.Screen options={ { title : "Detail", headerTransparent: true } }/>

     <Animated.ScrollView ref={scrollRef}  scrollEventThrottle={16} contentContainerStyle={{justifyContent: "center", alignItems: "center", marginTop: "14%" }} >
         
         <Animated.Image 
           source={ event_img ?  { uri: event_img } : require("@/assets/images/MASHomeLogo.png") }
           style={ [{width: width / 1.2, height: 300, borderRadius: 8 }, imageAnimatedStyle] }
           resizeMode='stretch'
           className='mt-[70]'
         />

         <View className='bg-white' style={{paddingBottom : Tab * 3, width: width}}>
           <Text className='text-center mt-2 text-xl text-black font-bold'>{event_name}</Text>
           <Text className='text-center mt-2  text-[#0D509D]' onPress={showModal}>{speakerString}</Text>
             <View className=''> 
              <View>
                <Text className='text-left text-2xl font-bold text-black ml-4 mt-1' >Description: </Text>
              </View>

              <View className='items-center justify-center'>
                <View className='w-[95%] bg-white px-3 flex-wrap py-2' style={[{ borderRadius : 15, height : height / 3.7 ,shadowColor : "gray", shadowOffset : { width : 0, height :0}, shadowOpacity : 2, shadowRadius : 1, elevation : 5},
                   Platform.OS == 'android' ?  
                   {
                    borderWidth: 1,
                    borderColor : '#D3D3D3',
                  } : {}
                ]}>
                  <ScrollView><Text>{event_desc}</Text></ScrollView>
                </View>
                <View className='items-center justify-center'>
                  {
                    event?.is_paid ? 
                    (
                      <Pressable onPress={() => {
                      Linking.canOpenURL(event.paid_link).then(() => {
                      Linking.openURL(event.paid_link);
                      });
                      }}>
                      <Button icon={() => <Icon source={"cart-variant"} size={20} color='white'/>} mode='elevated' style={{ backgroundColor : "#57BA47", marginTop : 10, width: "90%"}}><Text className='text-white'>Sign Up Now</Text></Button>
                      </Pressable>
                    ) : <></>
                  }
                </View>
              </View>
            </View>
         </View>

         <Portal>
            <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={{backgroundColor: 'white', padding: 20, minHeight: 400, maxHeight: "70%", width: "95%", borderRadius: 35, alignSelf: "center"}} >
                <ScrollView className='flex-1'
                showsVerticalScrollIndicator={true}
                >
                <GetSheikData />
              </ScrollView>
            </Modal>
         </Portal>
     </Animated.ScrollView>
     </View>
  )
}

export default EventInfoDisplay