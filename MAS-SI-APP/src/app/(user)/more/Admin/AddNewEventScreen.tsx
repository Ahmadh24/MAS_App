import React, { useEffect, useRef, useState } from "react";
import { Text, View, Image, ScrollView, TouchableOpacity, Pressable, Alert, KeyboardAvoidingView, useWindowDimensions, Dimensions } from "react-native";
import { router, Stack } from "expo-router";
import { TextInput, Checkbox, Chip, Button, Icon } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import Toast from "react-native-toast-message";
import { useBottomTabBarHeight  } from "@react-navigation/bottom-tabs";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import * as FileSystem from 'expo-file-system';
import { decode } from "base64-arraybuffer";
import { format } from "date-fns";
import { supabase } from "@/src/lib/supabase";
import Svg, { Circle, Path } from "react-native-svg";
import AddSpeakerModal from "@/src/components/AdminComponents/AddSpeakerModal";

const AddNewEventScreen = () => {
  const [eventName, setEventName] = useState<string>("");
  const [eventImage, setEventImage] = useState<ImagePicker.ImagePickerAsset>();
  const [eventDescription, setEventDescription] = useState<string>("");
  const [eventSpeaker, setEventSpeaker] = useState<string>("");
  const [eventSpeakersList, setEventSpeakersList] = useState<string[]>([]);
  const [eventStartDate, setEventStartDate] = useState<Date | null>(null);
  const [eventEndDate, setEventEndDate] = useState<Date | null>(null);
  const [eventStartTime, setEventStartTime] = useState<Date | null>(null);
  const [eventEndTime, setEventEndTime] = useState<Date | null>(null);
  const [eventDays, setEventDays] = useState<string[]>([]);
  const [showStartDatePicker, setShowStartDatePicker] =
    useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [showStartTimePicker, setShowStartTimePicker] =
    useState<boolean>(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [EventPrice, setEventPrice] = useState<string>("0");
  const [isForKids, setIsForKids] = useState<boolean>(false);
  const [isFor14Plus, setIsFor14Plus] = useState<boolean>(false);
  const [isEducational, setIsEducational] = useState<boolean>(false);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [isPace, setIsPace] = useState<boolean>(false);

  const [ isSocialService, setIsSocialService] = useState<boolean>(false);
  const [ isFundraiser, setIsFundraiser] = useState<boolean>(false);
  const [ isReverts, setIsReverts] = useState<boolean>(false);
  const [ isOutreach, setIsOutreach ] = useState<boolean>(false);
  const [ isBreakfast, setIsBreakfast ] = useState<boolean>(false);
  const [ eventPaidLink, setEventPaidLink ] = useState('');

  const [ speakers, setSpeakers ] = useState<any[]>([])
  const [ speakerSelected, setSpeakerSelected ] = useState<any[]>([])
  const [ hasLectures, sethasLectures ]  = useState(false)
  const [ openAddSpeaker, setOpenAddSpeaker ] = useState(false) 
  const tabHeight = useBottomTabBarHeight() + 20
  const scrollViewRef = useRef<ScrollView>(null)
  const descriptionRef = useRef<View>(null)
  const titleRef = useRef<View>(null)
  const layoutHeight = Dimensions.get('screen').height
  const [ keyboardOffset, setKeyboardOffset ] = useState(0)
  const [ submitDisabled, setSubmitDisabled ] = useState(true)
  const getSpeakers = async () => {
    const { data, error } = await supabase.from('speaker_data').select('speaker_id, speaker_name')
    if( data ){
      console.log('Speakers loaded:', data)
      setSpeakers(data)
    } else {
      console.log('Error loading speakers:', error)
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
      setEventImage(result.assets[0]);
    }
  };

  const toggleDaySelection = (day: string) => {
    if (eventDays.includes(day)) {
      setEventDays(eventDays.filter((d) => d !== day));
    } else {
      setEventDays([...eventDays, day]);
    }
  };

  const formatDate = (date: Date | null) => {
    return date ? moment(date).format("MM/DD/YYYY") : "";
  };

  const formatTime = (time: Date | null) => {
    return time ? moment(time).format("hh:mm A") : "";
  };

  const addSpeaker = () => {
    if (eventSpeaker.trim() !== "") {
      setEventSpeakersList([...eventSpeakersList, eventSpeaker.trim()]);
      setEventSpeaker("");
    }
  };

  const removeSpeaker = (speaker: string) => {
    setEventSpeakersList(eventSpeakersList.filter((s) => s !== speaker));
  };

  const handleSubmit = () => {
    setEventName("");
    setEventImage(undefined);
    setEventDescription("");
    setEventSpeaker("");
    setEventSpeakersList([]);
    setEventStartDate(null);
    setEventEndDate(null);
    setEventStartTime(null);
    setEventEndTime(null);
    setEventDays([]);
    setIsPaid(false);
    setEventPrice("");
    setIsForKids(false);
    setIsFor14Plus(false);
    setIsEducational(false);
    setIsPace(false);

    setIsBreakfast(false);
    setIsOutreach(false);
    setIsReverts(false);
    setIsSocialService(false);
    setIsFundraiser(false);
    setEventPaidLink('');

    setSpeakerSelected([])
    sethasLectures(false)

    Toast.show({
      type: "success",
      text1: "Event Successfully Added",
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
  const SpeakersData = (props: any) => {
    const speakers = props.speakers;
    console.log('SpeakersData received:', props, 'Speakers array:', speakers);
    return (
      <View className="mb-4">
        <View className="flex flex-row items-center justify-between mb-3">
          <Text className="text-base font-bold text-black">Select Speakers</Text>
          <Pressable 
            onPress={() => setOpenAddSpeaker(true)}
            className="bg-blue-500 px-3 py-2 rounded-lg"
          >
            <Text className="text-white text-sm font-medium">Add Speaker</Text>
          </Pressable>
        </View>
        
        {/* Selected Speakers Display */}
        {speakerSelected.length > 0 && (
          <View className="mb-3">
            <Text className="text-sm text-gray-600 mb-2">{speakerSelected.length} Speaker(s) Selected:</Text>
            <View className="flex-row flex-wrap gap-2">
              {speakerSelected.map((speakerId) => {
                const speaker = speakers.find((s: any) => s.speaker_id === speakerId);
                return speaker ? (
                  <View key={speakerId} className="bg-blue-100 px-3 py-2 rounded-lg flex-row items-center">
                    <Text className="text-blue-800 text-sm mr-2">{speaker.speaker_name}</Text>
                    <Pressable onPress={() => handleSpeakerPress(speakerId)}>
                      <Text className="text-red-500 text-lg font-bold">×</Text>
                    </Pressable>
                  </View>
                ) : null;
              })}
            </View>
          </View>
        )}

        {/* Speaker Selection Dropdown */}
        <Menu>
          <MenuTrigger>
            <View className="border border-gray-300 rounded-lg p-3 bg-white">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-700">
                  {speakerSelected.length === 0 ? 'Tap to select speakers' : 'Tap to modify selection'}
                </Text>
                <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <Path d="M7.5 15L12.5 10L7.5 5" stroke="#6077F5" strokeWidth="2"/>
                </Svg>
              </View>
            </View>
          </MenuTrigger>
          <MenuOptions 
            optionsContainerStyle={{  
              borderRadius: 10, 
              paddingHorizontal: 4, 
              paddingVertical: 4,
              maxHeight: 180,
              backgroundColor: 'white',
              width: 300,
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
              style={{ maxHeight: 180 }}
            >
              {speakers && speakers.length > 0 ? 
                speakers.map((speaker: any) => (
                  <MenuOption 
                    key={speaker.speaker_id} 
                    onSelect={() => handleSpeakerPress(speaker.speaker_id)}
                    style={{
                      backgroundColor: 'white',
                      borderBottomWidth: 0.5,
                      borderBottomColor: '#f0f0f0'
                    }}
                  >
                    <View className="flex-row items-center justify-between py-3 px-3">
                      <Text className="text-black text-base font-medium" style={{ opacity: 1 }}>
                        {speaker.speaker_name}
                      </Text>
                      {speakerSelected.includes(speaker.speaker_id) && (
                        <Icon source={'check'} color="green" size={20}/>
                      )}
                    </View>
                  </MenuOption>
                )) 
                : 
                <View className="p-3">
                  <Text className="text-gray-500 text-center">No speakers available</Text>
                </View>
              }
            </ScrollView>
          </MenuOptions>
        </Menu>
      </View>
    );
  };
  const onSumbit = async () => {
    if ( eventName && eventDescription && eventDays.length > 0 && eventEndDate  &&  eventStartDate &&  speakerSelected.length>0 && eventImage && eventStartTime ) {
      setSubmitDisabled(false)
      const base64 = await FileSystem.readAsStringAsync(eventImage.uri, { encoding: 'base64' });
      const filePath = `${eventName.trim().split(" ").join("_")}.${eventImage.type === 'image' ? 'png' : 'mp4'}`;
      const contentType = eventImage.type === 'image' ? 'image/png' : 'video/mp4';
      const { data : image, error :image_upload_error } = await supabase.storage.from('event_flyers').upload(filePath, decode(base64));
      if( image ){
        const { data : event_img_url} = await supabase.storage.from('event_flyers').getPublicUrl(image?.path)
        const time =  format(eventStartTime!, 'p').trim()
        const { error } = await supabase.from('events').insert({ 
          event_name : eventName, 
          event_img : event_img_url.publicUrl, 
          event_desc : eventDescription, 
          event_speaker : speakerSelected, 
          has_lecture : hasLectures, 
          event_start_date : eventStartDate, 
          event_end_date : eventEndDate, 
          is_paid : isPaid, 
          event_price : Number(EventPrice),
          event_start_time :time, 
          event_days : eventDays,
          is_outreach : isOutreach,
          is_social : isSocialService,
          is_reverts : isReverts,
          is_fundraiser : isFundraiser,
          is_breakfast : isBreakfast,
          paid_link : eventPaidLink,
          pace : isPace
        })
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
  useEffect(() =>{
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
                    <Text className=" text-[25px] text-white">Events</Text>
                  </Pressable>
                </View>
                <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
                 <View className="w-[65%] items-center"> 
                  <Text className=" text-[15px] text-black ">Create A New Event</Text>
                </View>
                </View>
              </View>
            )
          }}
      />
      <View style={{ flex: 1 }}>
        <View style={{ padding: 10, backgroundColor: 'white', paddingTop: 170 }}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: tabHeight + 50 }}
            showsVerticalScrollIndicator={true}
            automaticallyAdjustKeyboardInsets
            ref={scrollViewRef}
            onScroll={(e) => {
              setKeyboardOffset(e.nativeEvent.contentOffset.y / 3.3)
             }}
            style={{ flex: 1 }}
          >
            {/* Event Details Section */}
            <View className="mb-5">
              <Text className="text-lg font-bold mb-3 ml-2 text-[#0D509D]">Event Details</Text>
              
              {/* Time Selection */}
              <View className="mb-3">
                <Text className="font-semibold text-[14px] text-black mb-2 ml-2">Start Time:</Text>
                <Pressable className="bg-[#EDEDED] w-[50%] rounded-lg p-3 ml-2" onPress={() => setShowStartTimePicker(true)}>
                  <Text className="text-black text-sm text-center">
                    {eventStartTime ? format(eventStartTime, 'p') : 'Select Start Time'}
                  </Text>
                </Pressable>
                {showStartTimePicker && (
                  <DateTimePicker
                    value={eventStartTime || new Date()}
                    mode="time"
                    display="default"
                    onChange={(event, time) => {
                      setShowStartTimePicker(false);
                      if (time) setEventStartTime(time);
                    }}
                  />
                )}
              </View>

              {/* Date Selection */}
              <View className="mb-3">
                <Text className="font-semibold text-[14px] text-black mb-2 ml-2">Event Dates:</Text>
                <View className="flex flex-row gap-x-3 ml-2">
                  <Pressable className="bg-[#EDEDED] w-[45%] rounded-lg p-3" onPress={() => setShowStartDatePicker(true)}>
                    <Text className="text-black text-sm text-center">
                      {eventStartDate ? eventStartDate.toLocaleDateString() : 'Start Date'}
                    </Text>
                  </Pressable>
                  <Pressable className="bg-[#EDEDED] w-[45%] rounded-lg p-3" onPress={() => setShowEndDatePicker(true)}>
                    <Text className="text-black text-sm text-center">
                      {eventEndDate ? eventEndDate.toLocaleDateString() : 'End Date'}
                    </Text>
                  </Pressable>
                </View>
                {showStartDatePicker && (
                  <DateTimePicker
                    value={eventStartDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowStartDatePicker(false);
                      if (date) setEventStartDate(date);
                    }}
                  />
                )}
                {showEndDatePicker && (
                  <DateTimePicker
                    value={eventEndDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowEndDatePicker(false);
                      if (date) setEventEndDate(date);
                    }}
                  />
                )}
              </View>

              {/* Days Selection */}
              <View className="mb-3">
                <Text className="text-sm font-semibold mb-3 ml-2 text-black">
                  Select event days:
                </Text>
                <View className="flex flex-row gap-3 flex-wrap ml-2">
                  {days.map((day, index) => (
                     <Pressable
                       key={index}
                       style={{ flexDirection: "row", alignItems: "center" }}
                       onPress={() => toggleDaySelection(day)}
                       className="w-[28%]"
                     >
                       <View className="border border-[#6077F5] h-[18px] w-[18px] items-center justify-center rounded">
                         {eventDays.includes(day) ? <Icon source={'check'} size={12} color="green"/> : <></>}
                       </View>
                       <Text className="ml-2 text-sm">{day}</Text>
                     </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Basic Information Section */}
            <View className="mb-5">
              <Text className="text-lg font-bold mb-3 ml-2 text-[#0D509D]">Basic Information</Text>
              
              {/* Title */}
              <View ref={titleRef} className="mb-3">
                <Text className="text-sm font-semibold mb-2 ml-2 text-black">Event Title</Text>
                <TextInput
                  mode="outlined"
                  theme={{ roundness: 8 }}
                  style={{ height: 45, backgroundColor: 'white' }}
                  activeOutlineColor="#0D509D"
                  value={eventName}
                  onChangeText={setEventName}
                  placeholder="Enter event name"
                  textColor="black"
                  onFocus={() => {
                    titleRef.current?.measure(
                      (x, y, width, height, pageX, pageY) => {
                        scrollViewRef.current?.scrollTo({
                          y: y,
                          animated: true
                        })
                      }
                    )
                  }}
                />
              </View>

              {/* Description */}
              <View ref={descriptionRef} className="mb-3">
                <Text className="text-sm font-semibold mb-2 ml-2 text-black">Event Description</Text>
                <TextInput
                  mode="outlined"
                  theme={{ roundness: 8 }}
                  style={{ height: 80, backgroundColor: 'white' }}
                  multiline
                  activeOutlineColor="#0D509D"
                  value={eventDescription}
                  onChangeText={setEventDescription}
                  placeholder="Describe your event"
                  textColor="black"
                  onFocus={() => {
                    descriptionRef.current?.measure(
                      (x, y, width, height, pageX, pageY) => {
                        scrollViewRef.current?.scrollTo({
                          y: y,
                          animated: true
                        })
                      }
                    )
                  }}
                />
              </View>
            </View>

            {/* Speaker Selection Section */}
            <View className="mb-6">
              <Text className="text-xl font-bold mb-4 ml-2 text-[#0D509D]">Speaker Information</Text>
              {speakers && speakers.length > 0 ? (
                <SpeakersData speakers={speakers} />
              ) : speakers === undefined ? (
                <Text className="text-gray-500 ml-2">Loading speakers...</Text>
              ) : (
                <Text className="text-gray-500 ml-2">No speakers available. Please add speakers first.</Text>
              )}
            </View>

            {/* Media Section */}
            <View className="mb-5">
              <Text className="text-lg font-bold mb-3 ml-2 text-[#0D509D]">Media & Content</Text>
              
              {/* Event Image */}
              <View className="mb-3">
                <Text className="text-sm font-semibold mb-2 ml-2 text-black">Event Image</Text>
                {eventImage ? (
                  <Pressable onPress={pickImage}>
                    <Image
                      source={{ uri: eventImage.uri }}
                      style={{
                        width: 150,
                        height: 150,
                        alignSelf: "center",
                        borderRadius: 12
                      }}
                      resizeMode="cover"
                    /> 
                  </Pressable>
                ) : (
                  <Button
                    mode="contained"
                    buttonColor="#57BA47"
                    textColor="white"
                    theme={{ roundness: 8 }}
                    onPress={pickImage}
                    className="w-full"
                  >
                    Upload Image
                  </Button>
                )}
              </View>

              {/* YouTube Videos Question */}
              <View className="mb-3">
                <Text className="text-sm font-semibold ml-2 mb-2 text-black">Does this event have recorded YouTube videos?</Text>
                <View className="flex flex-row gap-6 ml-2">
                  <Pressable
                    style={{ flexDirection: "row", alignItems: "center" }}
                    onPress={() => sethasLectures(false)}
                  >
                    <View className="border border-[#6077F5] h-[18px] w-[18px] items-center justify-center rounded-full">
                      {!hasLectures ? <Icon source={'check'} size={12} color="green"/> : <></>}
                    </View>
                    <Text className="ml-2 text-sm">No</Text>
                  </Pressable>
        
                  <Pressable
                    style={{ flexDirection: "row", alignItems: "center" }}
                    onPress={() => sethasLectures(true)}
                  >
                    <View className="border border-[#6077F5] h-[18px] w-[18px] items-center justify-center rounded-full">
                      {hasLectures ? <Icon source={'check'} size={12} color="green"/> : <></>}
                    </View>
                    <Text className="ml-2 text-sm">Yes</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Event Classification Section */}
            <View className="mb-5">
              <Text className="text-lg font-bold mb-3 ml-2 text-[#0D509D]">Event Classification</Text>
              
              {/* Event Type */}
              <View className="mb-3">
                <Text className="text-sm font-semibold ml-2 mb-2 text-black">Event Type:</Text>
                <Text className="text-xs text-gray-500 ml-2 mb-2">(Events will be categorized under the selected type)</Text>
                <View className="flex flex-row gap-4 ml-2">
                  <Pressable
                    style={{ flexDirection: "row", alignItems: "center" }}
                    onPress={() => setIsPace(true)}
                    className="flex-1"
                  >
                    <View className="border border-[#6077F5] h-[18px] w-[18px] items-center justify-center rounded">
                      {isPace ? <Icon source={'check'} size={12} color="green"/> : <></>}
                    </View>
                    <Text className="ml-2 text-sm font-medium">PACE</Text>
                  </Pressable>
          
                  <Pressable
                    style={{ flexDirection: "row", alignItems: "center" }}
                    onPress={() => setIsPace(false)}
                    className="flex-1"
                  >
                    <View className="border border-[#6077F5] h-[18px] w-[18px] items-center justify-center rounded">
                      {!isPace ? <Icon source={'check'} size={12} color="green"/> : <></>}
                    </View>
                    <Text className="ml-2 text-sm font-medium">Event</Text>
                  </Pressable>
                </View>
              </View>

              {/* Further Classification */}
              <View className="mb-3">
                <Text className="text-sm font-semibold ml-2 mb-2 text-black">Further Classification:</Text>
                <View className="flex flex-row flex-wrap gap-3 ml-2">
                  {!isPace ? (
                    <>
                      <Pressable
                        style={{ flexDirection: "row", alignItems: "center" }}
                        onPress={() => setIsFundraiser(!isFundraiser)}
                        className="w-[45%]"
                      >
                        <View className="border border-[#6077F5] h-[18px] w-[18px] items-center justify-center rounded">
                          {isFundraiser ? <Icon source={'check'} size={12} color="green"/> : <></>}
                        </View>
                        <Text className="ml-2 text-sm">Fundraiser</Text>
                      </Pressable>
          
                      <Pressable
                        style={{ flexDirection: "row", alignItems: "center" }}
                        onPress={() => setIsReverts(!isReverts)}
                        className="w-[45%]"
                      >
                        <View className="border border-[#6077F5] h-[18px] w-[18px] items-center justify-center rounded">
                          {isReverts ? <Icon source={'check'} size={12} color="green"/> : <></>}
                        </View>
                        <Text className="ml-2 text-sm">Reverts Event</Text>
                      </Pressable>
          
                      <Pressable
                        style={{ flexDirection: "row", alignItems: "center" }}
                        onPress={() => setIsBreakfast(!isBreakfast)}
                        className="w-[45%]"
                      >
                        <View className="border border-[#6077F5] h-[18px] w-[18px] items-center justify-center rounded">
                          {isBreakfast ? <Icon source={'check'} size={12} color="green"/> : <></>}
                        </View>
                        <Text className="ml-2 text-sm">Brothers Breakfast</Text>
                      </Pressable>
          
                      <Pressable
                        style={{ flexDirection: "row", alignItems: "center" }}
                        onPress={() => setIsOutreach(!isOutreach)}
                        className="w-[45%]"
                      >
                        <View className="border border-[#6077F5] h-[18px] w-[18px] items-center justify-center rounded">
                          {isOutreach ? <Icon source={'check'} size={12} color="green"/> : <></>}
                        </View>
                        <Text className="ml-2 text-sm">Outreach Activities</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      style={{ flexDirection: "row", alignItems: "center" }}
                      onPress={() => setIsSocialService(!isSocialService)}
                      className="w-[45%]"
                    >
                      <View className="border border-[#6077F5] h-[18px] w-[18px] items-center justify-center rounded">
                        {isSocialService ? <Icon source={'check'} size={12} color="green"/> : <></>}
                      </View>
                      <Text className="ml-2 text-sm">Social Services</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>

            {/* Payment Section */}
            <View className="mb-5">
              <Text className="text-lg font-bold mb-3 ml-2 text-[#0D509D]">Payment & Registration</Text>
              
              <Text className="text-sm font-semibold ml-2 mb-2 text-black">Is this {isPace ? 'PACE Event' : 'Event'} paid?</Text>
              <Pressable
                style={{ flexDirection: "row", alignItems: "center" }}
                onPress={() => setIsPaid(!isPaid)}
                className="w-[35%] ml-2"
              >
                <View className="border border-[#6077F5] h-[18px] w-[18px] items-center justify-center rounded">
                  {isPaid ? <Icon source={'check'} size={12} color="green"/> : <></>}
                </View>
                <Text className="ml-2 text-sm font-medium">Paid</Text>
              </Pressable>
              
              {isPaid && (
                <View className="mt-3">
                  <Text className="text-sm font-semibold mb-2 ml-2 text-black">Event Website Link</Text>
                  <TextInput
                    mode="outlined"
                    theme={{ roundness: 8 }}
                    style={{ height: 45, backgroundColor: 'white' }}
                    activeOutlineColor="#0D509D"
                    value={eventPaidLink}
                    onChangeText={setEventPaidLink}
                    placeholder="Enter MAS Shop Link..."
                    textColor="black"
                  />
                </View>
              )}
            </View>
            
            {/* Submit Button */}
            <View className="mb-8">
              <Button
                mode="contained"
                buttonColor="#57BA47"
                textColor="white"
                theme={{ roundness: 8 }}
                onPress={async () => await onSumbit()}
                disabled={!submitDisabled}
                style={{ height: 50 }}
              >
                Submit Event
              </Button>
            </View>
            
            {/* Bottom Spacer */}
            <View style={{ height: 20 }} />
          </ScrollView>
          
          <AddSpeakerModal setIsOpen={setOpenAddSpeaker} isOpen={openAddSpeaker}/>
        </View>
      </View>
    </>
  );
};

export default AddNewEventScreen;
