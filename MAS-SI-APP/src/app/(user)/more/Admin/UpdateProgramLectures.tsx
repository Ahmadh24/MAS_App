import React, { useEffect, useRef, useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, Pressable, Image } from "react-native";
import { TextInput, Button, IconButton, Modal, Icon } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { router, Stack, useLocalSearchParams } from "expo-router";
import moment from "moment";
import { supabase } from "@/src/lib/supabase";
import Svg, { Path } from "react-native-svg";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
const UpdateProgramLectures = () => {
  const { lecture, program_name, program_img, program_ } = useLocalSearchParams();
  const [lectureProgram, setLectureProgram] = useState<string | null>(null);
  const [lectureName, setLectureName] = useState<string>('');
  const [lectureSpeaker, setLectureSpeaker] = useState<string>("");
  const [lectureLink, setLectureLink] = useState<string>("");
  const [lectureAI, setLectureAI] = useState<string>("");
  const [lectureDate, setLectureDate] = useState<Date>();
  const [lectureTime, setLectureTime] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [ keyNotes, setKeyNotes ] = useState<string[]>([]);
  const [ keyNoteModal, setKeyNoteModal ] = useState<boolean>(false);
  const [ keyNoteInput, setKeyNoteInput ] = useState<string>("");
  const [ speakerSelected, setSpeakerSelected ] = useState<any[]>([])
  const [ speakers, setSpeakers ] = useState<any[]>([])
  const scrollViewRef = useRef<ScrollView>()
  const youtubeRef = useRef<View>()
  const titleRef = useRef<View>()
  const descriptionRef = useRef<View>()
  const keynoteRef = useRef()

      const [showStartDatePicker, setShowStartDatePicker] =
        useState<boolean>(false);
  const programs = ["Program A", "Program B", "Program C"];

  const tabBar = useBottomTabBarHeight()

  const handleSubmit = () => {
    Toast.show({
      type: "success",
      text1: "Lecture Uploaded Successfully",
      position: "top",
      topOffset: 50,
    });
  };
  const getLecture = async () => {
    const { data, error } = await supabase.from('program_lectures').select('*').eq('lecture_id', lecture).single()
    if( data ){
      setLectureDate(new Date( data.lecture_date) )
      setLectureName(data.lecture_name)
      setSpeakerSelected(data.lecture_speaker)
      setLectureLink(data.lecture_link)
      setLectureTime(data.lecture_time)
      setKeyNotes(data.lecture_key_notes ? data.lecture_key_notes : [])
      setLectureAI(data.lecture_ai)
    }
   }
   const handleSpeakerPress = (speaker_id : string) => {
    if( speakerSelected && speakerSelected.includes(speaker_id)  ){
      const removeSpeaker = speakerSelected.filter(id => id != speaker_id)
      setSpeakerSelected(removeSpeaker)
    }
    else if( speakerSelected == null || speakerSelected.length == 0  ){
      setSpeakerSelected([speaker_id])
    } else if( speakerSelected.length > 0 ){
      setSpeakerSelected([...speakerSelected, speaker_id])
    }
  }
    const getSpeakers = async () => {
      const { data, error } = await supabase.from('speaker_data').select('speaker_id, speaker_name')
      if( data ){
        setSpeakers(data)
      }
    }
  const SpeakersData = (speakers  : any ) => {
    return(
      <Menu>
        <MenuTrigger style={{ marginLeft  : 10 }}>
          { !speakerSelected || speakerSelected.length == 0 ? <Text className="text-blue-600">Update Speakers</Text> : <Text>{speakerSelected.length} Speaker(s) Chosen</Text>}
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
              speakers.speakers && speakers.speakers.length > 0 ? speakers.speakers.map(( speaker:any ) =>{
                return(
                  <MenuOption key={speaker.speaker_id} onSelect={() => handleSpeakerPress(speaker.speaker_id)}>
                    <Text className="text-black ">{speaker.speaker_name} { speakerSelected && speakerSelected.includes(speaker.speaker_id) ? <Icon source={'check'} color="green" size={15}/> : <></>}</Text>
                  </MenuOption>
                )
              }) : <></>
            }
          </ScrollView>
        </MenuOptions>
      </Menu>
    )
  }
  const onUploadLecture = async () => {
    if( lectureName &&  lectureDate && speakerSelected && speakerSelected.length > 0 && lectureLink ){
      const { error } = await supabase.from('program_lectures').update({ lecture_time : lectureTime, lecture_name : lectureName, lecture_link : lectureLink ,lecture_date  : lectureDate, lecture_speaker : speakerSelected, lecture_ai : lectureAI, lecture_key_notes : keyNotes}).eq('lecture_id', lecture)
      handleSubmit()
    }
  }
  useEffect(() => {
    getLecture()
    getSpeakers()
  }, [])
  return (
    <>
    <Stack.Screen
       options={{
        headerTransparent : true,
        header : () => (
          <View className="relative">
            <View className="h-[110px] w-[100%] rounded-br-[65px] bg-[#5E636B] items-start justify-end pb-[5%] z-[1]">
              <Pressable className="flex flex-row items-center justify-between w-[40%]" onPress={() => { router.dismiss(3) }}>
                <Svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                  <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="#1B85FF" stroke-width="2"/>
                </Svg>
                <Text className=" text-[25px] text-white">Programs</Text>
              </Pressable>
            </View>

            <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
              <View className="w-[65%] items-center"> 
                <Text className=" text-[15px] text-black ">Edit Existing Programs</Text>
              </View>
            </View>

            <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#E3E3E3] items-start justify-end pb-[5%] absolute top-[100] z-[-1]">
              <View className='w-[100%]'>
                <Pressable className="w-[50%] items-center justify-between flex flex-row px-2" onPress={() => router.back()}> 
                    <View className='w-[23%] '>
                      <Svg  width="16" height="9" viewBox="0 0 16 9" fill="none">
                        <Path d="M4.5 8.22607L1 4.61303M1 4.61303L4.5 0.999987M1 4.61303H15" stroke="#6077F5" stroke-linecap="round"/>
                      </Svg>
                    </View>
                    <View className='w-[80%] items-start'>
                      <Text className=" text-[15px] text-black " numberOfLines={1} adjustsFontSizeToFit>{program_name}</Text>
                    </View>                
                    </Pressable>
              </View>
            </View>
          </View>
          )
        }}
    />
    <View style={{ padding: 16, backgroundColor : 'white', flex : 1, paddingTop : 220, paddingBottom : tabBar + 30 }}>
      <ScrollView
        contentContainerStyle={{  }}
        ref={scrollViewRef}
        >
        
        <Image 
          src={program_img}
          className="self-center w-[200px] h-[200px] rounded-[15px]"
        />
        <Text className="self-center font-bold text-lg my-2">{program_name}</Text>

        <View ref={youtubeRef}>
          <Text className="text-base font-bold mb-1 ml-2">Add A New YouTube Link: </Text>
          <Text className="ml-2 text-[12px] my-1">Example: https://www.youtube.com/watch?v=<Text className="bg-[#FFD465] font-bold rounded-[2px]">qdbPaFQxSUI</Text></Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 45, marginBottom: 10 , backgroundColor : 'white'}}
            activeOutlineColor="#0D509D"
            value={lectureLink}
            onChangeText={setLectureLink}
            placeholder="Enter Link ID ONLY..."
            textColor="black"
            onFocus={() => {
              youtubeRef.current?.measure(
                (x, y, width, height, pageX, pageY) => {
                scrollViewRef.current?.scrollTo(
                  {
                    y: y,
                    animated : true
                  }
                )
              })
            }}
          />
        </View>

        <View ref={titleRef}>
          <Text className="text-base font-bold mb-1 ml-2">Update Lecture Title</Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 45, marginBottom: 10, backgroundColor : 'white' }}
            activeOutlineColor="#0D509D"
            value={lectureName}
            onChangeText={setLectureName}
            placeholder="Enter Lecture Title"
            textColor="black"
            onFocus={() => {
              titleRef.current?.measure(
                (x, y, width, height, pageX, pageY) => {
                scrollViewRef.current?.scrollTo(
                  {
                    y: y,
                    animated : true
                  }
                )
              })
            }}
          />
        </View>

        <Text className="text-base font-bold mb-1 ml-2">Update Lecture Speaker</Text>

       { speakers ? <SpeakersData speakers={speakers} /> : <Text>Fetching Speakers</Text>}

        <View ref={descriptionRef}>
          <Text className="text-base font-bold mb-1 ml-2">Update Lecture Summary</Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 100, marginBottom: 10, backgroundColor : 'white' }}
            activeOutlineColor="#0D509D"
            multiline
            value={lectureAI}
            onChangeText={setLectureAI}
            placeholder="Enter Summary..."
            textColor="black"
            onFocus={() => {
              descriptionRef.current?.measure(
                (x, y, width, height, pageX, pageY) => {
                scrollViewRef.current?.scrollTo(
                  {
                    y: y,
                    animated : true
                  }
                )
              })
            }}
          />
        </View>


      <Text className="text-base font-bold mb-1 ml-2">Lecture KeyNotes</Text>
          {
            keyNotes?.map((note, index) => {
              return(
                <View className="items-center flex-row flex-wrap" key={index}>
                  <IconButton icon={'window-minimize'} size={10} iconColor="red" onPress={() => {
                  const filtered = keyNotes.filter(notes => notes != note )
                  setKeyNotes(filtered)
                  }}/>
                  <Text key={index} className="items-center ml-4 p-1 justify-center">{note}</Text>
                </View>
              )
            })
          }
          <Button onPress={() => setKeyNoteModal(true)} >
            Add KeyNotes
          </Button>

        {/* Lecture Date */}
        <Text className="text-base font-bold ml-2">Lecture Date</Text>
        <Pressable className="flex flex-col bg-[#EDEDED] w-[40%] rounded-[10px] items-center py-3 px-3 my-2" onPress={() => setShowStartDatePicker(true)}>
            <Text className="text-black text-[11px]">
            { lectureDate ? lectureDate.toLocaleDateString() : '__'}
            </Text>
            {showStartDatePicker && (
              <DateTimePicker
                value={lectureDate ? lectureDate : new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowStartDatePicker(false);
                  if (date) setLectureDate(date);
                }}
              />
            )}
          </Pressable>

        {/* Buttons */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Button
            mode="contained"
            buttonColor="#57BA47"
            textColor="white"
            theme={{ roundness: 1 }}
            onPress={() => onUploadLecture()}
            style={{ width: "48%" }}
          >
            Update Lecture
          </Button>
        </View>
      </ScrollView>

      <Modal visible={keyNoteModal} onDismiss={() => setKeyNoteModal(false)} contentContainerStyle={{backgroundColor : 'white' , borderRadius : 8, width : '90%', height : '50%', alignSelf : 'center' }}>
            <View className="w-[100%] self-center p-5 flex-1">
              <TextInput
              mode="outlined"
              ref={keynoteRef}
              theme={{ roundness: 10 }}
              style={{ width: "100%", height: 200, marginBottom: 10, backgroundColor : 'white' }}
              activeOutlineColor="#0D509D"
              multiline
              value={keyNoteInput}
              onChangeText={setKeyNoteInput}
              placeholder="Enter Key Note"
              textColor="black"
              returnKeyType="done"
              onKeyPress={(e) => {
                if (e.nativeEvent.key == 'Enter' ){ e.preventDefault(); keynoteRef.current?.blur()  }
              }}
              />
            </View>
            <View className="flex-1 justify-end pb-8">
              <Button
                    mode="contained"
                    buttonColor="#57BA47"
                    textColor="white"
                    theme={{ roundness: 1 }}
                    onPress={ () => {
                      if( keyNotes.length < 1 && keyNoteInput ){
                        setKeyNotes([keyNoteInput.trim()])
                      }else if(keyNoteInput ){
                        setKeyNotes([...keyNotes, keyNoteInput.trim()])
                      }

                      setKeyNoteInput("")
                      setKeyNoteModal(false)

                    } }
                    style={{ width: "48%", alignSelf : 'center'}}
                >
                  Confirm
                </Button>
            </View>
          </Modal>
          
    </View>
  </>
);
}

export default UpdateProgramLectures
