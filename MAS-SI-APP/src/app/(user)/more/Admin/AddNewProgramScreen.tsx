import React, { useEffect, useRef, useState } from "react";
import { Text, View, Image, ScrollView, TouchableOpacity, Pressable, Alert, FlatList, KeyboardAvoidingView, useWindowDimensions, Dimensions } from "react-native";
import { router, Stack } from "expo-router";
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
import * as FileSystem from 'expo-file-system';
import { decode } from "base64-arraybuffer";
import { format } from "date-fns";
import Svg, { Circle, Path } from "react-native-svg";
import AddSpeakerModal from "@/src/components/AdminComponents/AddSpeakerModal";


const AddNewProgramScreen = () => {
  const [programName, setProgramName] = useState<string>("");
  const [programImage, setProgramImage] = useState<ImagePicker.ImagePickerAsset>();
  const [programDescription, setProgramDescription] = useState<string>("");
  const [programStartDate, setProgramStartDate] = useState<Date | null>(null);
  const [programEndDate, setProgramEndDate] = useState<Date | null>(null);
  const [programStartTime, setProgramStartTime] = useState<Date | null>(null);
  const [programDays, setProgramDays] = useState<string[]>([]);
  const [ speakers, setSpeakers ] = useState<any[]>([])
  const [showStartDatePicker, setShowStartDatePicker] =
    useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [showStartTimePicker, setShowStartTimePicker] =
    useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [isForKids, setIsForKids] = useState<boolean>(false);
  const [ speakerSelected, setSpeakerSelected ] = useState<any[]>([])
  const [ hasLectures, sethasLectures ] = useState(false)
  const [ addSpeaker, setOpenAddSpeaker ] = useState(false) 
  const [ programPaidLink, setProgramPaidLink ] = useState<string>('')
  const tabHeight = useBottomTabBarHeight() + 20
  const scrollViewRef = useRef<ScrollView>(null)
  const descriptionRef = useRef<View>(null)
  const titleRef = useRef<View>(null)
  const layoutHeight = Dimensions.get('screen').height
  const [ keyboardOffset , setKeyboardOffset ] = useState(0)
  const [ submitDisabled, setSubmitDisabled ] = useState(true)


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
  };

  const toggleDaySelection = (day: string) => {
    if (programDays.includes(day)) {
      setProgramDays(programDays.filter((d) => d !== day));
    } else {
      setProgramDays([...programDays, day]);
    }
  };

  const handleSubmit = () => {
    // Reset all the fields
    setProgramName("");
    setProgramImage(undefined);
    setProgramDescription("");
    setProgramStartDate(null);
    setProgramEndDate(null);
    setProgramStartTime(null);
    setProgramDays([]);
    setIsPaid(false);
    setIsForKids(false);
    setSpeakerSelected([])
    sethasLectures(false)
    setProgramPaidLink('')
    Toast.show({
      type: "success",
      text1: "Program Successfully Added",
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
        <MenuTrigger style={{ marginHorizontal: 10 }}>
          <View className="flex-row items-center justify-between w-full">
            <View className="flex-row items-center flex-1">
              <Text className="text-blue-600 underline mr-2">
                Select Speakers 
              </Text>
              <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <Path d="M7.5 15L12.5 10L7.5 5" stroke="#6077F5" strokeWidth="2"/>
              </Svg>
            </View> 
            {speakerSelected.length == 0 ? (
              <Pressable 
                className="flex-row items-center px-3 py-2 bg-blue-50 rounded-lg"
                onPress={() => setOpenAddSpeaker(true)}
              >
                <Text className="text-blue-600 font-medium mr-2">Add Speaker</Text>
                <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <Circle cx="10" cy="6" r="3" stroke="#6077F5" strokeLinecap="round"/>
                  <Path fillRule="evenodd" clipRule="evenodd" d="M12.5 12C11.5 11.7 10.4 11.6 9.3 11.7C8.1 11.8 7.0 12.2 6.1 12.8C5.2 13.4 4.5 14.2 4.1 15.1C4.0 15.3 4.1 15.5 4.3 15.6C4.5 15.7 4.7 15.6 4.8 15.4C5.1 14.7 5.7 14.1 6.5 13.7C7.3 13.3 8.2 13.1 9.1 13.1C9.5 13.1 9.9 13.1 10.3 13.2C10.6 12.9 10.9 12.8 11.2 12.8L12.5 12Z" fill="#6077F5"/>
                  <Path d="M15 10L15 16" stroke="#6077F5" strokeLinecap="round"/>
                  <Path d="M18 13L12 13" stroke="#6077F5" strokeLinecap="round"/>
                </Svg>
              </Pressable>
            ) : (
              <Text className="text-green-600 font-medium">{speakerSelected.length} Speaker(s) Chosen</Text>
            )}
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

  const onSubmit = async () => {
    if ( programName && programDescription && programDays.length > 0 && programEndDate  &&  programStartDate &&  speakerSelected.length>0 && programImage && programStartTime) {
      setSubmitDisabled(false)
      const base64 = await FileSystem.readAsStringAsync(programImage.uri, { encoding: 'base64' });
      const filePath = `${programName.trim().split(" ").join("")}.${programImage.type === 'image' ? 'png' : 'mp4'}`;
      const contentType = programImage.type === 'image' ? 'image/png' : 'video/mp4';
      const { data : image, error :image_upload_error } = await supabase.storage.from('fliers').upload(filePath, decode(base64));
      if( image ){
        const { data : program_img_url} = await supabase.storage.from('fliers').getPublicUrl(image?.path)
        const time =  format(programStartTime!, 'p').trim()
        const { error } = await supabase.from('programs').insert({ program_name : programName, program_img : program_img_url.publicUrl, program_desc : programDescription, program_speaker : speakerSelected, has_lectures : hasLectures, program_start_date : programStartDate, program_end_date : programEndDate, program_is_paid : isPaid, is_kids : isForKids, program_start_time :time, program_days : programDays, paid_link : programPaidLink })
        if( error ){
          console.log(error)
        }
        handleSubmit()
        setSubmitDisabled(true)
      }else{
        Alert.alert(image_upload_error.message)
        return
      }
    }else{
      Alert.alert('Please Fill All Info Before Proceeding')
    }
  }
  useEffect(() => {
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
    <>
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
                  <Text className=" text-[25px] text-white">Programs</Text>
                </Pressable>
              </View>
              <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
               <View className="w-[65%] items-center"> 
                <Text className=" text-[15px] text-black ">Create A New Program</Text>
              </View>
              </View>
            </View>
          )
        }}
      />
      <View className="flex-1 bg-gray-50">
        <ScrollView
          contentContainerStyle={{ paddingBottom: tabHeight + 20, paddingTop: 180 }}
          showsVerticalScrollIndicator={false}
          ref={scrollViewRef}
          onScroll={(e) => {
            setKeyboardOffset(175 - e.nativeEvent.contentOffset.y)
           }}
          className="px-6"
        >
          {/* Program Details Section */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3
          }}>
            <Text className="text-xl font-bold text-gray-900 mb-6">Program Details</Text>
            
            {/* Time and Date Row */}
            <View className="flex-row gap-4 mb-6">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Start Time</Text>
                <Pressable 
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center justify-between"
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text className="text-gray-900 font-medium">
                    {programStartTime ? format(programStartTime,'p') : 'Select Time'}
                  </Text>
                  <Icon source="clock-outline" size={20} color="#6077F5" />
                </Pressable>
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
              </View>
            </View>

            {/* Date Row */}
            <View className="flex-row gap-4 mb-6">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Start Date</Text>
                <Pressable 
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center justify-between"
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text className="text-gray-900 font-medium">
                    {programStartDate ? programStartDate.toLocaleDateString() : 'Select Date'}
                  </Text>
                  <Icon source="calendar-outline" size={20} color="#6077F5" />
                </Pressable>
                {showStartDatePicker && (
                  <DateTimePicker
                    value={programStartDate ? programStartDate : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowStartDatePicker(false);
                      if (date) setProgramStartDate(date);
                    }}
                  />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-700 mb-2">End Date</Text>
                <Pressable 
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center justify-between"
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text className="text-gray-900 font-medium">
                    {programEndDate ? programEndDate.toLocaleDateString() : 'Select Date'}
                  </Text>
                  <Icon source="calendar-outline" size={20} color="#6077F5" />
                </Pressable>
                {showEndDatePicker && (
                  <DateTimePicker
                    value={programEndDate ? programEndDate : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowEndDatePicker(false);
                      if (date) setProgramEndDate(date);
                    }}
                  />
                )}
              </View>
            </View>

            {/* Days Selection */}
            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-4">Program Days</Text>
              <View className="flex-row flex-wrap gap-3">
                {days.map((day, index) => (
                  <Pressable
                    key={index}
                    className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${
                      programDays.includes(day) 
                        ? 'bg-blue-50 border-blue-500' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                    onPress={() => toggleDaySelection(day)}
                  >
                    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                      programDays.includes(day) 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {programDays.includes(day) && (
                        <Icon source="check" size={12} color="white" />
                      )}
                    </View>
                    <Text className={`font-medium ${
                      programDays.includes(day) ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {day}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Program Information Section */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3
          }}>
            <Text className="text-xl font-bold text-gray-900 mb-6">Program Information</Text>
            
            {/* Title */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Program Title</Text>
              <TextInput
                mode="outlined"
                theme={{ roundness: 12 }}
                style={{ 
                  backgroundColor: 'white',
                  fontSize: 16
                }}
                activeOutlineColor="#6077F5"
                value={programName}
                onChangeText={setProgramName}
                placeholder="Enter program title..."
                textColor="black"
              />
            </View>

            {/* Description */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
              <TextInput
                mode="outlined"
                theme={{ roundness: 12 }}
                style={{ 
                  backgroundColor: 'white',
                  minHeight: 100,
                  fontSize: 16
                }}
                multiline
                activeOutlineColor="#6077F5"
                value={programDescription}
                onChangeText={setProgramDescription}
                placeholder="Enter program description..."
                textColor="black"
              />
            </View>

            {/* Speaker Selection */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-4">Speaker</Text>
              {speakers ? <SpeakersData speakers={speakers} /> : (
                <View className="bg-gray-50 rounded-xl p-4">
                  <Text className="text-gray-500 text-center">Loading speakers...</Text>
                </View>
              )}
            </View>

            {/* Image Upload */}
            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-4">Program Flyer</Text>
              {programImage ? (
                <Pressable onPress={pickImage} className="items-center">
                  <Image
                    source={{ uri: programImage.uri }}
                    style={{
                      width: 200,
                      height: 200,
                      borderRadius: 16,
                      marginBottom: 12
                    }}
                    resizeMode="cover"
                  />
                  <View className="bg-blue-50 px-4 py-2 rounded-lg">
                    <Text className="text-blue-600 font-medium">Tap to change image</Text>
                  </View>
                </Pressable>
              ) : (
                <Pressable
                  onPress={pickImage}
                  className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 items-center"
                >
                  <Icon source="camera-plus" size={40} color="#9CA3AF" />
                  <Text className="text-gray-500 font-medium mt-2">Tap to upload flyer</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Program Settings Section */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3
          }}>
            <Text className="text-xl font-bold text-gray-900 mb-6">Program Settings</Text>
            
            {/* YouTube Videos */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-4">Recorded YouTube Videos?</Text>
              <View className="flex-row gap-4">
                <Pressable
                  className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${
                    !hasLectures 
                      ? 'bg-green-50 border-green-500' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                  onPress={() => sethasLectures(false)}
                >
                  <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                    !hasLectures 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {!hasLectures && <Icon source="check" size={12} color="white" />}
                  </View>
                  <Text className={`font-medium ${
                    !hasLectures ? 'text-green-700' : 'text-gray-600'
                  }`}>No</Text>
                </Pressable>

                <Pressable
                  className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${
                    hasLectures 
                      ? 'bg-green-50 border-green-500' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                  onPress={() => sethasLectures(true)}
                >
                  <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                    hasLectures 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {hasLectures && <Icon source="check" size={12} color="white" />}
                  </View>
                  <Text className={`font-medium ${
                    hasLectures ? 'text-green-700' : 'text-gray-600'
                  }`}>Yes</Text>
                </Pressable>
              </View>
            </View>

            {/* Program Type */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-4">Program Type</Text>
              <View className="flex-row gap-3">
                <Pressable
                  className={`flex-row items-center px-3 py-3 rounded-xl border-2 flex-1 ${
                    isForKids 
                      ? 'bg-blue-50 border-blue-500' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                  onPress={() => setIsForKids(true)}
                >
                  <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                    isForKids 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {isForKids && <Icon source="check" size={12} color="white" />}
                  </View>
                  <Text className={`font-medium text-sm ${
                    isForKids ? 'text-blue-700' : 'text-gray-600'
                  }`}>Kids</Text>
                </Pressable>

                <Pressable
                  className={`flex-row items-center px-3 py-3 rounded-xl border-2 flex-1 ${
                    !isForKids 
                      ? 'bg-blue-50 border-blue-500' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                  onPress={() => setIsForKids(false)}
                >
                  <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                    !isForKids 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {!isForKids && <Icon source="check" size={12} color="white" />}
                  </View>
                  <Text className={`font-medium text-sm ${
                    !isForKids ? 'text-blue-700' : 'text-gray-600'
                  }`}>Regular</Text>
                </Pressable>
              </View>
            </View>

            {/* Paid Program */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-4">
                Is this {isForKids ? 'Kids Program' : 'Program'} Paid?
              </Text>
              <Pressable
                className={`flex-row items-center px-4 py-3 rounded-xl border-2 w-32 ${
                  isPaid 
                    ? 'bg-orange-50 border-orange-500' 
                    : 'bg-gray-50 border-gray-200'
                }`}
                onPress={() => setIsPaid(!isPaid)}
              >
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                  isPaid 
                    ? 'border-orange-500 bg-orange-500' 
                    : 'border-gray-300'
                }`}>
                  {isPaid && <Icon source="check" size={12} color="white" />}
                </View>
                <Text className={`font-medium ${
                  isPaid ? 'text-orange-700' : 'text-gray-600'
                }`}>Paid</Text>
              </Pressable>
              
              {isPaid && (
                <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={keyboardOffset}>
                  <View className="mt-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Payment Link</Text>
                    <TextInput
                      mode="outlined"
                      theme={{ roundness: 12 }}
                      style={{ backgroundColor: 'white' }}
                      activeOutlineColor="#6077F5"
                      value={programPaidLink}
                      onChangeText={setProgramPaidLink}
                      placeholder="Enter MAS Shop link..."
                      textColor="black"
                    />
                  </View>
                </KeyboardAvoidingView>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <View className="mb-6">
            <Button
              mode="contained"
              buttonColor="#6077F5"
              textColor="white"
              theme={{ roundness: 12 }}
              onPress={async() => await onSubmit()}
              disabled={!submitDisabled}
              style={{ 
                paddingVertical: 12,
                fontSize: 16,
                fontWeight: '600'
              }}
            >
              Create Program
            </Button>
          </View>

        </ScrollView>
        <AddSpeakerModal setIsOpen={setOpenAddSpeaker} isOpen={addSpeaker}/>
      </View>
    </>
  );
};

export default AddNewProgramScreen;


/*
 headerBackTitleVisible: false,
          headerStyle: { backgroundColor: "white" },
          headerTintColor : 'black',
          title: "Add New Program",
*/