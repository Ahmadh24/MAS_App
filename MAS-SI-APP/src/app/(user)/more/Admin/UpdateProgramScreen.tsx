import React, { useEffect, useRef, useState } from "react";
import { Text, View, Image, ScrollView, TouchableOpacity, Pressable, Alert, KeyboardAvoidingView, useWindowDimensions, Dimensions } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { TextInput, Checkbox, Button, Icon } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import Toast from "react-native-toast-message";
import { supabase } from "@/src/lib/supabase";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import { useBottomTabBarHeight  } from "@react-navigation/bottom-tabs";
import { decode } from "base64-arraybuffer";
import { format } from "date-fns";
import * as FileSystem from 'expo-file-system'
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "expo-router";
function setTimeToCurrentDate(timeString : string ) {

  // Split the time string into hours, minutes, and seconds
  const [hours, minutes, seconds] = timeString.split(':').map(Number);

  // Create a new Date object with the current date
  const timestampWithTimeZone = new Date();

  // Set the time with setHours (adjust based on local timezone or UTC as needed)
  timestampWithTimeZone.setHours(hours, minutes, seconds, 0); // No milliseconds

  // Convert to ISO format with timezone (to ensure it's interpreted as a TIMESTAMPTZ)
  const timestampISO = timestampWithTimeZone // This gives a full timestamp with timezone in UTC

  return timestampISO
}
const UpdateProgramScreen = () => {
  const { program_id, program_name } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const [ originalName, setOriginalName ] = useState('');
  const [programName, setProgramName] = useState<string>("");
  const [programImage, setProgramImage] = useState<ImagePicker.ImagePickerAsset>();
  const [programDescription, setProgramDescription] = useState<string>("");
  const [programStartDate, setProgramStartDate] = useState<Date | null>(null);
  const [programEndDate, setProgramEndDate] = useState<Date | null>(null);
  const [programStartTime, setProgramStartTime] = useState<Date | null>(null);
  const [programDays, setProgramDays] = useState<string[]>([]);
  const [ speakers, setSpeakers ] = useState<any[]>([])
  const [ keyboardOffset , setKeyboardOffset ] = useState(0)
  const [showStartDatePicker, setShowStartDatePicker] =
    useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [showStartTimePicker, setShowStartTimePicker] =
    useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [programPaidLink, setprogramPaidLink] = useState<string>("");
  const [isForKids, setIsForKids] = useState<boolean>(false);
  const [isFor14Plus, setIsFor14Plus] = useState<boolean>(false);
  const [isEducational, setIsEducational] = useState<boolean>(false);
  const [ speakerSelected, setSpeakerSelected ] = useState<any[]>([])
  const [ hasLectures, sethasLectures ] = useState(false)
  const [ imgURL, setImgURL ] = useState('')
  const tabHeight = useBottomTabBarHeight() + 20
  const scrollViewRef = useRef<ScrollView>(null)
  const descriptionRef = useRef<View>(null)
  const titleRef = useRef<View>(null)
  const paidRef = useRef<View>(null)
  const layoutHeight = Dimensions.get('screen').height
  const getSpeakers = async () => {
    const { data, error } = await supabase.from('speaker_data').select('speaker_id, speaker_name')
    if( data ){
      setSpeakers(data)
    }
  }
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets) {
      const img = result.assets[0]

      setProgramImage(img);
    }
    setImgURL('')
  };

  const toggleDaySelection = (day: string) => {
    if (programDays.includes(day)) {
      setProgramDays(programDays.filter((d) => d !== day));
    } else {
      setProgramDays([...programDays, day]);
    }
  };

  const formatDate = (date: Date | null) => {
    return date ? moment(date).format("MM/DD/YYYY") : "";
  };

  const formatTime = (time: Date | null) => {
    return time ? moment(time).format("hh:mm A") : "";
  };

  const handleSubmit = () => {
    Toast.show({
      type: "success",
      text1: "Program Successfully Updated",
      position: "top",
      topOffset: 50,
      visibilityTime: 2000,
    });
  };

  const handleSpeakerPress = (speaker_id : string) => {
    if( speakerSelected.includes(speaker_id)){
      const removeSpeaker = speakerSelected.filter(id => id != speaker_id)
      setSpeakerSelected(removeSpeaker)
    }
    else if( speakerSelected.length == 0 ){
      setSpeakerSelected([speaker_id])
    } else if( speakerSelected.length > 0 ){
      setSpeakerSelected([...speakerSelected, speaker_id])
    }
  }
  const SpeakersData = (speakers  : any ) => {
    return(
      <Menu>
        <MenuTrigger style={{ marginLeft  : 10 }}>
          { speakerSelected.length == 0 ? <Text className="text-blue-600">Update Speakers</Text> : <Text>{speakerSelected.length} Speaker(s) Chosen</Text>}
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
                    <Text className="text-black ">{speaker.speaker_name} { speakerSelected.includes(speaker.speaker_id) ? <Icon source={'check'} color="green" size={15}/> : <></>}</Text>
                  </MenuOption>
                )
              }) : <></>
            }
          </ScrollView>
        </MenuOptions>
      </Menu>
    )
  }

  const currentSettings = async () => {
    const { data , error } = await supabase.from('programs').select('*').eq('program_id', program_id).single()
    if( data ){
      setOriginalName(data.program_name)
      setProgramName(data.program_name);
      setImgURL(data.program_img);
      setProgramDescription(data.program_desc);
      setProgramStartDate(new Date(data.program_start_date));
      setProgramEndDate(new Date(data.program_end_date));
      setProgramStartTime(setTimeToCurrentDate(data.program_start_time));
      setProgramDays(data.program_days);
      setIsPaid(data.program_is_paid);
      setprogramPaidLink(data.paid_link);
      setIsForKids(data.is_kids);
      setIsFor14Plus(data.is_fourteen_plus);
      setIsEducational(data.is_education);
      setSpeakerSelected(data.program_speaker)
      sethasLectures(data.has_lectures)
    }
  }

  const onUpdate =  async () => {
    if ( programName && (imgURL || programImage) && programDescription && programStartDate && programEndDate && programDays  && programStartTime && speakerSelected){
      if( programImage ){
        const base64 = await FileSystem.readAsStringAsync(programImage.uri, { encoding: 'base64' });
        if( programName == originalName ){
          const filePath = `${programName.trim().split(" ").join("")}.${programImage.type === 'image' ? 'png' : 'mp4'}`;
          const contentType = programImage.type === 'image' ? 'image/png' : 'video/mp4';
          const { data : image, error :image_upload_error } = await supabase.storage.from('fliers').update(filePath, decode(base64));
          const { error } = await supabase.from('programs').update({ program_name : programName, program_desc : programDescription, program_start_date : programStartDate, program_end_date : programEndDate, program_days : programDays, program_start_time : format(programStartTime,'pp'), paid_link : programPaidLink, program_speaker : speakerSelected, program_is_paid : isPaid, is_kids : isForKids, is_education : isEducational, is_fourteen_plus : isFor14Plus, has_lectures : hasLectures}).eq('program_id', program_id)
          handleSubmit()
          router.back()
        }
        else{
          const filePath = `${programName.trim().split(" ").join("")}.${programImage.type === 'image' ? 'png' : 'mp4'}`;
          const contentType = programImage.type === 'image' ? 'image/png' : 'video/mp4';
          const { error : remove} = await supabase.storage.from('fliers').remove([`${originalName.trim().split(" ").join("")}.png`]);
          const { data : image, error :image_upload_error } = await supabase.storage.from('fliers').upload(filePath, decode(base64));
          if( image ){
            const { data : program_img_url} = await supabase.storage.from('fliers').getPublicUrl(image?.path)
            const time =  format(programStartTime!, 'p').trim()
            const { error } = await supabase.from('programs').update({ program_name : programName, program_img : program_img_url.publicUrl, program_desc : programDescription, program_start_date : programStartDate, program_end_date : programEndDate, program_days : programDays, program_start_time : format(programStartTime,'pp'), paid_link : programPaidLink, program_speaker : speakerSelected, program_is_paid : isPaid, is_kids : isForKids, is_education : isEducational, is_fourteen_plus : isFor14Plus, has_lectures : hasLectures}).eq('program_id', program_id)
            handleSubmit()
            router.back()
          }
      }
    }else{
      const { error } = await supabase.from('programs').update({ program_name : programName, program_desc : programDescription, program_start_date : programStartDate, program_end_date : programEndDate, program_days : programDays, program_start_time : format(programStartTime,'pp'), paid_link : programPaidLink, program_speaker : speakerSelected, program_is_paid : isPaid, is_kids : isForKids, is_education : isEducational, is_fourteen_plus : isFor14Plus, has_lectures : hasLectures }).eq('program_id', program_id)
      if( error ){
        console.log(error)
      }
      handleSubmit()
      router.back()
    }
  }
  else { 
    Alert.alert('Fill out all required fields')
  }
}
  useEffect(() => {
    currentSettings()
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
              <Pressable className="w-[50%] items-center justify-between flex flex-row px-2" onPress={() => router.back()}> 
                  <View className='w-[23%]'>
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
          )
        }}
      />
      <View style={{ paddingHorizontal : 10, backgroundColor : 'white', paddingTop : 220}}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: tabHeight + 10 }}
          showsVerticalScrollIndicator={false}
          ref={scrollViewRef}
          onScroll={(e) => {
            setKeyboardOffset(225 - e.nativeEvent.contentOffset.y)
           }}
        >
          <Text className="text-base font-bold mb-1 mt-2 ml-2">Program Details</Text>
          <Text className="font-bold text-[13px] text-black my-3 ml-2">Time: </Text>
          <Pressable className="flex flex-col bg-[#EDEDED] w-[40%] rounded-[10px] items-center py-3 px-3" onPress={() => setShowStartTimePicker(true)}>
          <Text className=" text-black text-[11px]">
             Start Time: { programStartTime ? format(programStartTime,'p') : '__'}
            </Text>
            {showStartTimePicker && (
            <DateTimePicker
              value={new Date(programStartTime!)}
              mode="time"
              display="default"
              onChange={(event, time) => {
                if (time) setProgramStartTime(time);
              }}
            />
          )}
          </Pressable>
          <Text className="font-bold text-[13px] text-black my-3 ml-2">Date:</Text>
          <View className="flex flex-row gap-x-2">
          <Pressable className="flex flex-col bg-[#EDEDED] w-[40%] rounded-[10px] items-center py-3 px-3" onPress={() => setShowStartDatePicker(true)}>
            <Text className="text-black text-[11px]">
             Start Date: { programStartDate ? programStartDate.toLocaleDateString() : '__'}
            </Text>
            {showStartDatePicker && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowStartDatePicker(false);
                  if (date) setProgramStartDate(date);
                }}
              />
            )}
          </Pressable>

          <Pressable className="flex flex-col bg-[#EDEDED] w-[40%] rounded-[10px] items-center py-3 px-3" onPress={() => setShowEndDatePicker(true)}>
          <Text className="text-black text-[11px]">
             End Date: { programEndDate ? programEndDate.toLocaleDateString() : '__'}
            </Text>
            {showEndDatePicker && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowEndDatePicker(false);
                  if (date) setProgramEndDate(date);
                }}
              />
            )}
          </Pressable>
          </View>
          
          <Text className="text-base font-bold mb-4 mt-4 ml-2">
          Select the day(s) this program is held:          
          </Text>
         <View className="flex flex-row  gap-5 flex-wrap">
            {days.map((day, index) => (
               <Pressable
               key={index}
               style={{ flexDirection: "row", alignItems: "center" }}
               onPress={() => toggleDaySelection(day)}
               className="w-[25%]"
             >
               <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center">
                 {programDays.includes(day) ? <Icon  source={'check'} size={15} color="green"/> : <></>}
               </View>
               <Text className="ml-5">{day}</Text>
             </Pressable>
            ))}
         </View>


          <View ref={titleRef}>
            <Text className="text-base font-bold mb-1 ml-2 mt-4">
              Title
            </Text>
            <TextInput
              mode="outlined"
              theme={{ roundness: 10 }}
              style={{ width: "100%", height: 45, marginBottom: 10, backgroundColor  : 'white' }}
              activeOutlineColor="#0D509D"
              value={programName}
              onChangeText={setProgramName}
              placeholder="Enter The Program... "
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

          <View ref={descriptionRef}>
            <Text className="text-base font-bold mb-1 mt-2 ml-2">
              Description
            </Text>
            <TextInput
              mode="outlined"
              theme={{ roundness: 10 }}
              style={{ width: "100%", height: 100, marginBottom: 10, backgroundColor  : 'white' }}
              multiline
              activeOutlineColor="#0D509D"
              value={programDescription}
              onChangeText={setProgramDescription}
              placeholder="Enter The Description... "
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
          <Text className="text-base font-bold mb-1 mt-2 ml-2 my-4">
          Who is the Speaker of the Program 
          </Text>
         { speakers ? <SpeakersData speakers={speakers} /> : <Text>Fetching Speakers</Text>}

          <Text className="text-base font-bold mb-1 mt-2 ml-2 my-4">
            Upload Program Flyer
          </Text>
        
          {imgURL ? (
              <Pressable onPress={pickImage}>
              <Image
                source={{ uri: imgURL }}
                style={{
                  width: 170,
                  height:  170,
                  marginVertical: "1%",
                  alignSelf : "center",
                  borderRadius: 15
                }}
                resizeMode="cover"
              />
              </Pressable>) : programImage ? (
            <Pressable onPress={pickImage}>
            <Image
              source={{ uri: programImage.uri }}
              style={{
                width: 170,
                height:  170,
                marginVertical: "1%",
                alignSelf : "center",
                borderRadius: 15
              }}
              resizeMode="cover"
            />
            </Pressable>) : (
            <Button
            mode="contained"
            buttonColor="#57BA47"
            textColor="white"
            theme={{ roundness: 1 }}
            onPress={pickImage}
            >
              Upload
            </Button>)
        }


        <Text className="text-black font-bold ml-4 mt-4">Does the Program have recorded Youtube Videos? </Text>
        <View className="flex flex-row justify-evenly">
        <Pressable
               style={{ flexDirection: "row", alignItems: "center" }}
               className="w-[25%]"
               onPress={() => sethasLectures(false)}
             >
               <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center rounded-full">
                 {!hasLectures ? <Icon  source={'check'} size={15} color="green"/> : <></>}
               </View>
               <Text className="ml-5">No</Text>
             </Pressable>

             <Pressable
               style={{ flexDirection: "row", alignItems: "center" }}
               className="w-[25%]"
               onPress={() => sethasLectures(true)}

             >
               <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center rounded-full my-4">
                 {hasLectures? <Icon  source={'check'} size={15} color="green"/> : <></>}
               </View>
               <Text className="ml-5">Yes</Text>
             </Pressable>
        </View>


        <Text className="text-black font-bold ml-4 mt-4">Program Type: (If unchecked will default to false)</Text>


         <View className="flex flex-row flex-wrap gap-3 my-4">
          
                 <Pressable
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: "4%",
                          }}
                          onPress={() => setIsForKids(!isForKids)}
                          className="w-[40%] justify-between px-6 "
                        >
                          <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                             {isForKids ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                          </View>
                          <Text className="text-base font-bold">Kids</Text>
                        </Pressable>
            
                        <Pressable
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: "4%",
                          }}
                          onPress={() => setIsForKids(!isForKids)}
                          className="w-[40%] justify-between px-6"
                        >
                          <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                             {!isForKids ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                          </View>
                          <Text className="text-base font-bold ml-5">Program</Text>
            
                          
                        </Pressable>
                    </View>

            
                      <Text className="text-black font-bold ml-5 mt-1">Is this { isForKids ? 'Kids Program' : 'Program'} Paid?</Text>
                      <Pressable
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginVertical: "4%",
                          }}
                          onPress={() => setIsPaid(!isPaid)}
                          className="w-[35%] justify-between px-6 ml-5"
                        >
                          <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                              {isPaid ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                          </View>
                          <Text className="text-base font-bold">Paid</Text>
                        </Pressable>
                          {isPaid && (
                   <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={keyboardOffset}>
                                <Text className="text-base font-bold pb-1 ml-2 bg-white">
                                  Enter Program Website Link
                                </Text>
                                <TextInput
                                  mode="outlined"
                                  theme={{ roundness: 10 }}
                                  style={{ width: "100%", height: 45, marginBottom: 10, backgroundColor : 'white' }}
                                  activeOutlineColor="#0D509D"
                                  value={programPaidLink}
                                  onChangeText={setprogramPaidLink}
                                  placeholder="Enter MAS Shop Link..."
                                  textColor="black"
                                />
                              </KeyboardAvoidingView>
                              )}


          <Button
            mode="contained"
            buttonColor="#57BA47"
            textColor="white"
            theme={{ roundness: 1 }}
            onPress={async() =>  await onUpdate()}
          >
            Submit Program
          </Button>

        </ScrollView>
      </View>
    </>
  );
};

export default UpdateProgramScreen;





/* 
{imgURL ? (
              <Pressable onPress={pickImage}>
              <Image
                source={{ uri: imgURL }}
                style={{
                  width: "50%",
                  height:  110,
                  marginVertical: "1%",
                  alignSelf : "center",
                  borderRadius: 15
                }}
                resizeMode="cover"
              />
              </Pressable>) : programImage ? (
            <Pressable onPress={pickImage}>
            <Image
              source={{ uri: programImage.uri }}
              style={{
                width: "50%",
                height:  110,
                marginVertical: "1%",
                alignSelf : "center",
                borderRadius: 15
              }}
              resizeMode="cover"
            />
            </Pressable>) : (
            <Button
            mode="contained"
            buttonColor="#57BA47"
            textColor="white"
            theme={{ roundness: 1 }}
            onPress={pickImage}
            >
              Upload
            </Button>)
        }

*/