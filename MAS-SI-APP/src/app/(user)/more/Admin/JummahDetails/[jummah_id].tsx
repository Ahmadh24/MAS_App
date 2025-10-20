import { View, Text, Alert, Pressable, ScrollView } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { Button, Icon, TextInput } from 'react-native-paper'
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
  } from 'react-native-popup-menu';
import Toast from 'react-native-toast-message'
import Svg, { Circle, Path } from 'react-native-svg'
import AddSpeakerModal from '@/src/components/AdminComponents/AddSpeakerModal'
export default function JummahId() {
  const { jummah_id } = useLocalSearchParams()
  const [ topic, setTopic ] = useState('')
  const [ chosenSpeaker, setSpeaker ] = useState()
  const [ desc, setDesc ] = useState('')
  const [ speakers, setSpeakers] = useState<any[]>([])
  const [ openAddSpeaker, setOpenAddSpeaker ] = useState(false)
  const descriptionRef = useRef()
  const getSpeakers = async () => {
    const { data, error } = await supabase.from('speaker_data').select('speaker_id, speaker_name')
    if( data ){
      setSpeakers(data)
    }
  }
  const getJummahId = async () => {
    const { data, error } = await supabase.from('jummah').select('*').eq('id', jummah_id).single()
    if ( data ){
        setTopic(data.topic)
        setSpeaker(data.speaker)
        setDesc(data.desc)
    }
  }

  const SpeakersData = (speakers  : any ) => {
    return(
      <Menu>
        <MenuTrigger style={{ marginHorizontal  : 10 }}>

         <View className="flex flex-row w-[100%} justify-between">
            <View className="items-center justify-between flex flex-row w-[35%]">
             {
              chosenSpeaker ?  
              <Text className='text-green-600'>
                Speaker Chosen 
              </Text> :
              <Text className="text-blue-600 underline">
              </Text>
             }
              <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <Path d="M7.5 15L12.5 10L7.5 5" stroke="#6077F5" stroke-width="2"/>
              </Svg>
            </View> 
            { chosenSpeaker ? 
            <Pressable className="items-center justify-between flex flex-row w-[35%]" onPress={() => setOpenAddSpeaker(true)}>
              <Text>Add a speaker</Text>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="8" r="4" stroke="#222222" stroke-linecap="round"/>
                <Path fill-rule="evenodd" clip-rule="evenodd" d="M15.2749 16C13.8962 15.5613 12.3886 15.4073 10.9057 15.5538C9.26518 15.7157 7.71374 16.2397 6.4495 17.0712C5.18515 17.9028 4.25277 19.0137 3.80077 20.2789C3.70786 20.5389 3.84336 20.825 4.1034 20.9179C4.36345 21.0108 4.64957 20.8754 4.74247 20.6153C5.10951 19.588 5.88417 18.64 6.99902 17.9067C8.11398 17.1734 9.50702 16.6967 11.0039 16.5489C11.5538 16.4946 12.1066 16.4858 12.6526 16.521C13.008 16.1974 13.4805 16 13.999 16L15.2749 16Z" fill="#222222"/>
                <Path d="M18 14L18 22" stroke="#222222" stroke-linecap="round"/>
                <Path d="M22 18L14 18" stroke="#222222" stroke-linecap="round"/>
              </Svg>
            </Pressable>
            : <Text>{chosenSpeaker} Speaker(s) Chosen</Text>}
          </View>

        </MenuTrigger>
        <MenuOptions 
          optionsContainerStyle={{  
            borderRadius: 10, 
            paddingHorizontal: 4, 
            paddingVertical: 4,
            maxHeight: 250,
            backgroundColor: 'white',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5
          }}
        >
          <ScrollView 
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            style={{ maxHeight: 250 }}
          >
            {
              speakers.speakers && speakers.speakers.length > 0 ? speakers.speakers.map(( speaker ) =>{
                return(
                  <MenuOption key={speaker.speaker_id} onSelect={() => setSpeaker(speaker.speaker_id)}>
                    <Text className="text-black ">{speaker.speaker_name} {chosenSpeaker == speaker.speaker_id ? <Icon source={'check'} color="green" size={15}/> : <></>}</Text>
                  </MenuOption>
                )
              }) : <></>
            }
          </ScrollView>
        </MenuOptions>
      </Menu>
    )
  }

  const onSubmit = () =>{

    
    Toast.show({
        type: "success",
        text1: "Jummah Successfully Updated",
        position: "top",
        topOffset: 50,
        visibilityTime: 2000,
      });
  }

  const onUpdate = async () => {
    if( topic && desc && chosenSpeaker ){
    const { data, error } = await supabase.from('jummah').update({ topic : topic, desc : desc, speaker : chosenSpeaker }).eq('id', jummah_id).select()
    onSubmit()
    router.back()
    }
    else{
        Alert.alert('Fill out all forms')
    }
  }


  useEffect(() => {
    getJummahId()
    getSpeakers()
    const listenforspeakers = supabase
    .channel('listen for speakers change')
    .on(
      'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: "speaker_data",
    },
    async (payload) => await getSpeakers()
    )
    .subscribe()

    return () => { supabase.removeChannel( listenforspeakers )}
  }, [])

  return (
    <View className='p-[16] bg-white flex-1'>
       <Stack.Screen
        options={{
          headerTransparent : true,
          header : () => (
            <View className="relative">
              <View className="h-[110px] w-[100%] rounded-br-[65px] bg-[#5E636B] items-start justify-end pb-[5%] z-[1]">
                <Pressable className="flex flex-row items-center justify-between w-[40%]" onPress={() => router.back()}>
                  <Svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                    <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="#1B85FF" stroke-width="2"/>
                  </Svg>
                  <Text className=" text-[25px] text-white">Jummah</Text>
                </Pressable>
              </View>
              <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
               <View className="w-[56%] items-start"> 
                <Text className=" text-[15px] text-black ml-[30%]">{jummah_id == '1' ? 'First' : jummah_id == '2' ? 'Second' : jummah_id == '3' ? 'Third' : 'Student' } Jummah</Text>
              </View>
              </View>
            </View>
          )
        }}
      />
          <View className='mb-3'>
            <Text className="text-base font-bold mb-1 mt-2 ml-2 my-4 pt-[170px]">
            Select Who Will be the Khateeb
            </Text>
           { speakers ? <SpeakersData speakers={speakers} /> : <Text>Fetching Speakers</Text>}
          </View>

          <View>
            <Text className="text-base font-bold mb-1 ml-2 ">
              Jummah Title
            </Text>
            <TextInput
              mode="outlined"
              theme={{ roundness: 10 }}
              style={{ width: "100%", height: 45, marginBottom: 10, backgroundColor  : 'white' }}
              activeOutlineColor="#0D509D"
              value={topic}
              onChangeText={setTopic}
              placeholder="Topic Name"
              textColor="black"
            />
          </View>

         <View>
            <Text className="text-base font-bold mb-1 mt-2 ml-2">
              Jummah Description
            </Text>
            <TextInput
              mode="outlined"
              theme={{ roundness: 10 }}
              ref={descriptionRef}
              style={{ width: "100%", height: 100, marginBottom: 10, backgroundColor  : 'white' }}
              multiline
              activeOutlineColor="#0D509D"
              value={desc}
              onChangeText={setDesc}
              placeholder="Description"
              textColor="black"
              returnKeyType="done"
              onKeyPress={(e) => {
                if (e.nativeEvent.key == 'Enter' ){ e.preventDefault(); descriptionRef.current?.blur()  }
              }}
            />
         </View>

         <Button
            mode="contained"
            buttonColor="#57BA47"
            textColor="white"
            theme={{ roundness: 1 }}
            style={{ marginTop : '30%'}}
            onPress={ async () => await onUpdate()}
         >
            Update
         </Button>
         <AddSpeakerModal isOpen={openAddSpeaker} setIsOpen={setOpenAddSpeaker}/>
    </View>
  )
}