import { View, Image, ScrollView } from 'react-native';
import React, {forwardRef, useCallback, useEffect, useMemo, useRef, useState, } from 'react'
import BottomSheet, { BottomSheetModal, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { SheikDataType } from '../types';
import { JummahBottomSheetProp } from '../types';
import { Modal, Portal, Text, Button, PaperProvider, Icon, Divider } from 'react-native-paper';
import { supabase } from '../lib/supabase';

type Ref = BottomSheetModal;

export const JummahBottomSheet = forwardRef<Ref, JummahBottomSheetProp>(({speaker, topic, desc, jummah_time}, ref) => {
    const snapPoints = useMemo(() => ["50%", "75%"], []);
    const [ visible, setVisible ] = useState(false);
    const showModal = () => setVisible(true);
    const hideModal = () => setVisible(false);
  

    const GetSheikData =  () => {
      return( 
        <View className='flex-1'>
          { 
            speaker && (
             <View className='border-2 border-gray-400 border-solid rounded-[25px] p-2 my-1'>
              <View className=' flex-row '>
                  <Image source={speaker?.speaker_img ? {uri : speaker.speaker_img } : require("@/assets/images/MASHomeLogo.png") } style={{width: 110, height: 110, borderRadius: 50}} resizeMode='cover'/>
              <View className='flex-col px-5'>
                <Text className='text-xl font-bold text-black'>Name: </Text>
                <Text className='pt-2 font-semibold text-black'> {speaker?.speaker_name} </Text>
              </View>
            </View>
      
            <View className='flex-col py-3'>
              { speaker?.speaker_name == "MAS" ? <Text className='font-bold text-black'>Impact </Text> :  <Text className='font-bold text-black'>Credentials: </Text> } 
              { speaker?.speaker_creds.map( (cred, i) => {
                return <Text key={i} className='text-black'> <Icon source="cards-diamond-outline"  size={15} color='black'/> {cred} {'\n'}</Text>
              })}
            </View>
            </View>
            )
          }
        </View>
      )
    }
    {
      /*
      speakerData?.map((speakerData) => (
                <View className='border-2 border-gray-400 border-solid rounded-[25px] p-2 my-1'>
                  <Animated.View className=' flex-row'>
                      <Image source={{uri : speakerData?.speaker_img || defaultProgramImage}} style={{width: 110, height: 110, borderRadius: 50}} resizeMode='cover'/>
                  <View className='flex-col px-1'>
                    <Text className='text-xl font-bold'>Name: </Text>
                    <Text className='pt-2 font-semibold' numberOfLines={1}> {speakerData?.speaker_name} </Text>
                  </View>
                </Animated.View>
          
                <View className='flex-col py-3'>
                  { speakerData?.speaker_name == "MAS" ? <Text className='font-bold'>Impact </Text> :  <Text className='font-bold'>Credentials: </Text> } 
                  { speakerData?.speaker_creds.map( (cred, i) => {
                    return <Text key={i}> <Icon source="cards-diamond-outline"  size={15} color='black'/> {cred} {'\n'}</Text>
                  })}
                </View>
                </View>
                ))
      */

    }
  const renderBackDrop = useCallback( (props : any ) => <BottomSheetBackdrop appearsOnIndex={0} disappearsOnIndex={-1} {...props}/> , [])
  return (
    <BottomSheetModal
        ref={ref}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backgroundStyle={{backgroundColor: "#0D509D"}}
        handleIndicatorStyle={{backgroundColor: "white"}}
        backdropComponent={renderBackDrop}
    >
      <Text variant="headlineMedium" style={{marginLeft: 5, color : "white", fontWeight : "bold"}} className='px-6 p-2'>{jummah_time} Prayer</Text>
      <View className=' bg-white h-full mt-1 pt-2 p-2' style={{borderRadius: 40}}>
        <View className='flex-row w-[100%] justify-evenly px-5 items-center pt-2'>
          <Text className='text-2xl font-semibold text-black' numberOfLines={2}>{topic}</Text>
        </View>
        <Divider style={{width : "90%", alignSelf: "center"}}/>
        <View className='flex-row items-center justify-between px-1 p-1'>
          <Text className='font-bold text-black text-2xl ml-4'>Speaker:</Text> 
          <Button onPress={showModal} style={{cursor: "pointer"}} > <Text variant='titleMedium' style={{color : "blue", textDecorationLine: "underline"}}>{speaker?.speaker_name}</Text> </Button>
        </View>
        <View className='p-1'>
         <Text className='font-semi text-black text-2xl ml-4'>Description:</Text> 
         <ScrollView className='h-[58%] w-[90%] self-center rounded-lg bg-white border-gray-400 border-2' contentContainerStyle={{ paddingHorizontal : 4 }}>
          <Text className='text-lg text-black p-3'>{desc}</Text>
         </ScrollView>
        </View>

        <Portal>
        <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={{backgroundColor: 'white', padding: 20, minHeight : 400, maxHeight: "70%", width: "95%", borderRadius: 35, alignSelf: "center"}} >
          <ScrollView className='flex-1'
          showsVerticalScrollIndicator={true}
          
          >
            <GetSheikData />
          </ScrollView>
        </Modal>
      </Portal>
      </View>
    </BottomSheetModal>
  )
}
)