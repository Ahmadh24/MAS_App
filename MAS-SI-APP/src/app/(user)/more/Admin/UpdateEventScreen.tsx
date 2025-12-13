import React, { useEffect, useRef, useState } from "react";
import { Text, View, Image, ScrollView, TouchableOpacity, Pressable, Alert, KeyboardAvoidingView, useWindowDimensions, Dimensions } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { TextInput, Checkbox, Chip, Button, Icon } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import Toast from "react-native-toast-message";
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
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import SelectSpeakerBottomSheet from "@/src/components/AdminComponents/SelectSpeakerBottomSheet";
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
const UpdateEventScreen = () => {
  const { event_id, event_name } = useLocalSearchParams()
  const router = useRouter()
  const [ originalName, setOriginalName ] = useState('')
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
  const [ imgURL, setImgURL ] = useState('')
  const [ speakerBottomSheetOpen, setSpeakerBottomSheetOpen ] = useState(false)

  const scrollViewRef = useRef<ScrollView>(null)
  const descriptionRef = useRef<View>(null)
  const titleRef = useRef<View>(null)
  const paidRef = useRef<View>(null)
  
  const [ keyboardOffset, setKeyboardOffset ] = useState(0)
  const layoutHeight = Dimensions.get('screen').height
  const getSpeakers = async () => {
    const { data, error } = await supabase.from('speaker_data').select('speaker_id, speaker_name, speaker_img, speaker_creds')
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
      setEventImage(result.assets[0]);
    }
    setImgURL('')
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
    Toast.show({
      type: "success",
      text1: "Event Successfully Updated",
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
      <Pressable
        onPress={() => setSpeakerBottomSheetOpen(true)}
        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 flex-row items-center justify-between"
      >
        <View className="flex-1">
          <Text className={`text-base ${speakerSelected.length > 0 ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            {speakerSelected.length == 0 ? 'Select Speakers' : `${speakerSelected.length} Speaker(s) Selected`}
          </Text>
          {speakerSelected.length > 0 && (
            <Text className="text-sm text-gray-500 mt-1">
              {speakers.speakers.filter((s: any) => speakerSelected.includes(s.speaker_id)).map((s: any) => s.speaker_name).join(', ')}
            </Text>
          )}
        </View>
        <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <Path d="M7.5 15L12.5 10L7.5 5" stroke="#6077F5" strokeWidth="2"/>
        </Svg>
      </Pressable>
    )
  }
  const currentSettings = async () => {
    const { data , error } = await supabase.from('events').select('*').eq('event_id', event_id).single()
    if( data ){
      setOriginalName(data.event_name)
      setEventName(data.event_name);
      setImgURL(data.event_img);
     setEventDescription(data.event_desc);
     setEventStartDate(new Date(data.event_start_date));
     setEventEndDate(new Date(data.event_end_date));
     setEventStartTime(setTimeToCurrentDate(data.event_start_time));
     setEventDays(data.event_days);
      setIsPaid(data.is_paid);
     setEventPrice(data.event_price);
      setIsForKids(data.is_kids);
      setIsFor14Plus(data.is_fourteen_plus);
      setIsEducational(data.is_education);
      setSpeakerSelected(data.event_speaker)
      sethasLectures(data.has_lecture);
      setIsPace(data.pace)
      setIsOutreach(data.is_outreach);
      setIsReverts(data.is_reverts);
      setIsBreakfast(data.is_breakfast);
      setIsFundraiser(data.is_fundraiser);
      setIsSocialService(data.is_social);
      setEventPaidLink(data.paid_link);
    }
  }
  const onUpdate = async  () => {
    if ( eventName && eventDescription && eventDays.length > 0 && eventEndDate  &&  eventStartDate &&  speakerSelected.length>0 && (eventImage || imgURL) && eventStartTime) {
      if ( eventImage ){
        const base64 = await FileSystem.readAsStringAsync(eventImage.uri, { encoding: 'base64' });
        if ( eventName == originalName ){
          const filePath = `${eventName.trim().split(" ").join("_")}.${eventImage.type === 'image' ? 'png' : 'mp4'}`;
          const { data : image, error :image_upload_error } = await supabase.storage.from('event_flyers').update(filePath, decode(base64));
          const time =  format(eventStartTime!, 'p').trim()
          const { error } = await supabase.from('events').update({
          event_name : eventName, 
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

          }).eq('event_id', event_id)
          handleSubmit()
          router.back()
        }else {
          const filePath = `${eventName.trim().split(" ").join("_")}.${eventImage.type === 'image' ? 'png' : 'mp4'}`;
          const { error } = await supabase.storage.from('event_flyers').remove([`${originalName.trim().split(" ").join("_")}.png`]);
          const contentType = eventImage.type === 'image' ? 'image/png' : 'video/mp4';
          const { data : image, error :image_upload_error } = await supabase.storage.from('event_flyers').upload(filePath, decode(base64));
          if( image ){
            const { data : event_img_url} = await supabase.storage.from('event_flyers').getPublicUrl(image?.path)
            const time =  format(eventStartTime!, 'p').trim()
            const { error } = await supabase.from('events').update({ 
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

             }).eq('event_id', event_id)
            if( error ){
              console.log(error)
            }
            handleSubmit()
            router.back()
          }
        }
      }else{
        const time =  format(eventStartTime!, 'p').trim()
        const { error } = await supabase.from('events').update({ 
          event_name : eventName, 
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
         }).eq('event_id', event_id)
        handleSubmit()
        router.back()
      }
    }else{
      Alert.alert('Fill in all required fields')
    }
  }
  useEffect(() =>{
    currentSettings()
    getSpeakers()
  }, [])
  return (
    <View className='flex-1 bg-gray-50'>
    <Stack.Screen
        options={{
          title: "Edit Event Info",
          headerStyle: { backgroundColor: "#F9FAFB" },
          headerTitleStyle: { 
            fontSize: 22,
            fontWeight: '600',
            color: '#1F2937'
          },
          headerTintColor: '#4A5568',
          headerShadowVisible: false,
        }}
    />
    <ScrollView
      className="flex-1 px-4"
      contentContainerStyle={{ paddingBottom: 10 }}
      showsVerticalScrollIndicator={false}
      ref={scrollViewRef}
      onScroll={(e) => {
        setKeyboardOffset(e.nativeEvent.contentOffset.y / 2.2)
       }}
      >
      {/* Event Details Card */}
      <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
        <Text className="text-base font-bold mb-3 text-gray-800">Event Details</Text>
        {/* Start Time */}
        <Text className="text-sm font-semibold text-gray-700 mb-2">Start Time</Text>
        <Pressable 
          className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4" 
          onPress={() => setShowStartTimePicker(true)}
        >
          <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginRight: 8 }}>
            <Path d="M10 5V10L13 13" stroke="#6077F5" strokeWidth="2" strokeLinecap="round"/>
            <Path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="#6077F5" strokeWidth="2"/>
          </Svg>
          <Text className="text-gray-800">
            {eventStartTime ? eventStartTime.toLocaleTimeString() : 'Select Time'}
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

        {/* Date Range */}
        <Text className="text-sm font-semibold text-gray-700 mb-2">Date</Text>
        <View className="flex-row gap-3 mb-4">
          <Pressable 
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3" 
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text className="text-xs text-gray-500 mb-1">Start Date</Text>
            <Text className="text-gray-800 font-medium">
              {eventStartDate ? eventStartDate.toLocaleDateString() : 'Select'}
            </Text>
          </Pressable>
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

          <Pressable 
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3" 
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text className="text-xs text-gray-500 mb-1">End Date</Text>
            <Text className="text-gray-800 font-medium">
              {eventEndDate ? eventEndDate.toLocaleDateString() : 'Select'}
            </Text>
          </Pressable>
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

        {/* Event Days */}
        <Text className="text-sm font-semibold text-gray-700 mb-3">
          Select the day(s) this event is held:          
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {days.map((day, index) => (
            <Pressable
              key={index}
              onPress={() => toggleDaySelection(day)}
              className={`flex-row items-center px-3 py-2 rounded-lg border ${
                eventDays.includes(day) 
                  ? 'bg-blue-50 border-blue-300' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <View className={`h-5 w-5 rounded border-2 items-center justify-center mr-2 ${
                eventDays.includes(day) ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {eventDays.includes(day) && (
                  <Icon source={'check'} size={12} color="white"/>
                )}
              </View>
              <Text className={eventDays.includes(day) ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                {day}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Event Information Card */}
      <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
        <Text className="text-base font-bold mb-3 text-gray-800">Event Information</Text>
        
        <View ref={titleRef}>
          <Text className="text-sm font-semibold text-gray-700 mb-2">Event Title</Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 12 }}
            style={{ width: "100%", height: 50, marginBottom: 16, backgroundColor: 'white' }}
            activeOutlineColor="#6077F5"
            outlineColor="#E2E8F0"
            value={eventName}
            onChangeText={setEventName}
            placeholder="Enter event title..."
            textColor="black"
            onFocus={() => {
              titleRef.current?.measure(
                (x, y, width, height, pageX, pageY) => {
                  scrollViewRef.current?.scrollTo({
                    y: y,
                    animated: true
                  })
                })
            }}
          />
        </View>

        <View ref={descriptionRef}>
          <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 12 }}
            style={{ width: "100%", height: 120, backgroundColor: 'white' }}
            multiline
            activeOutlineColor="#6077F5"
            outlineColor="#E2E8F0"
            value={eventDescription}
            onChangeText={setEventDescription}
            placeholder="Enter description..."
            textColor="black"
            onFocus={() => {
              descriptionRef.current?.measure(
                (x, y, width, height, pageX, pageY) => {
                  scrollViewRef.current?.scrollTo({
                    y: y,
                    animated: true
                  })
                })
            }}
          />
        </View>
      </View>

      {/* Speaker Selection Card */}
      <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
        <Text className="text-base font-bold mb-3 text-gray-800">
          Who is the Speaker of the Event
        </Text>
        {speakers ? <SpeakersData speakers={speakers} /> : <Text className="text-gray-500">Fetching Speakers...</Text>}
      </View>
      {/* Upload Event Image Card */}
      <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
        <Text className="text-base font-bold mb-3 text-gray-800">Upload Event Image</Text>
        
        {imgURL || eventImage ? (
          <Pressable onPress={pickImage} className="items-center">
            <Image
              source={{ uri: imgURL || eventImage?.uri }}
              style={{
                width: 180,
                height: 180,
                borderRadius: 12
              }}
              resizeMode="cover"
            />
            <View className="bg-blue-50 px-3 py-1 rounded-lg mt-3">
              <Text className="text-blue-600 text-sm font-medium">Tap to change</Text>
            </View>
          </Pressable>
        ) : (
          <Pressable 
            className="border-2 border-dotted border-blue-300 bg-blue-50 rounded-xl py-8 items-center"
            onPress={pickImage}
          >
            <Svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <Path d="M30 20L30 40" stroke="#6077F5" strokeWidth="2" strokeLinecap="round"/>
              <Path d="M40 30L20 30" stroke="#6077F5" strokeWidth="2" strokeLinecap="round"/>
            </Svg>
            <Text className='text-blue-600 font-medium mt-2'>Tap to upload image</Text>
          </Pressable>
        )}
      </View>

      {/* Event Options Card */}
      <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
        <Text className="text-base font-bold mb-3 text-gray-800">Event Options</Text>
        
        {/* Has Lectures */}
        <Text className="text-sm font-semibold text-gray-700 mb-3">
          Does the Event have recorded Youtube Videos?
        </Text>
        <View className="flex-row gap-3 mb-4">
          <Pressable
            className={`flex-1 flex-row items-center px-4 py-3 rounded-xl border ${
              !hasLectures ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
            }`}
            onPress={() => sethasLectures(false)}
          >
            <View className={`h-5 w-5 rounded-full border-2 items-center justify-center mr-2 ${
              !hasLectures ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
            }`}>
              {!hasLectures && <Icon source={'check'} size={12} color="white"/>}
            </View>
            <Text className={!hasLectures ? 'text-blue-700 font-medium' : 'text-gray-700'}>No</Text>
          </Pressable>

          <Pressable
            className={`flex-1 flex-row items-center px-4 py-3 rounded-xl border ${
              hasLectures ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
            }`}
            onPress={() => sethasLectures(true)}
          >
            <View className={`h-5 w-5 rounded-full border-2 items-center justify-center mr-2 ${
              hasLectures ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
            }`}>
              {hasLectures && <Icon source={'check'} size={12} color="white"/>}
            </View>
            <Text className={hasLectures ? 'text-blue-700 font-medium' : 'text-gray-700'}>Yes</Text>
          </Pressable>
        </View>

        {/* Event Type */}
        <Text className="text-sm font-semibold text-gray-700 mb-2">Event Type</Text>
        <Text className="text-xs text-gray-500 mb-3">It will go under the checked box section</Text>
        <View className="flex-row gap-3 mb-4">
          <Pressable
            className={`flex-1 flex-row items-center px-4 py-3 rounded-xl border ${
              isPace ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
            }`}
            onPress={() => setIsPace(true)}
          >
            <View className={`h-5 w-5 rounded border-2 items-center justify-center mr-2 ${
              isPace ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
            }`}>
              {isPace && <Icon source={'check'} size={12} color="white"/>}
            </View>
            <Text className={isPace ? 'text-blue-700 font-medium' : 'text-gray-700'}>PACE</Text>
          </Pressable>

          <Pressable
            className={`flex-1 flex-row items-center px-4 py-3 rounded-xl border ${
              !isPace ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
            }`}
            onPress={() => setIsPace(false)}
          >
            <View className={`h-5 w-5 rounded border-2 items-center justify-center mr-2 ${
              !isPace ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
            }`}>
              {!isPace && <Icon source={'check'} size={12} color="white"/>}
            </View>
            <Text className={!isPace ? 'text-blue-700 font-medium' : 'text-gray-700'}>Event</Text>
          </Pressable>
        </View>
        {/* Further Classification */}
        <Text className="text-sm font-semibold text-gray-700 mb-3">Further Classification</Text>
        {!isPace ? (
          <View className="flex-row flex-wrap gap-2">
            <Pressable
              className={`flex-row items-center px-3 py-2 rounded-lg border ${
                isSocialService ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
              }`}
              onPress={() => setIsSocialService(!isSocialService)}
            >
              <View className={`h-5 w-5 rounded border-2 items-center justify-center mr-2 ${
                isSocialService ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {isSocialService && <Icon source={'check'} size={12} color="white"/>}
              </View>
              <Text className={isSocialService ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                Social Services
              </Text>
            </Pressable>

            <Pressable
              className={`flex-row items-center px-3 py-2 rounded-lg border ${
                isFundraiser ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
              }`}
              onPress={() => setIsFundraiser(!isFundraiser)}
            >
              <View className={`h-5 w-5 rounded border-2 items-center justify-center mr-2 ${
                isFundraiser ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {isFundraiser && <Icon source={'check'} size={12} color="white"/>}
              </View>
              <Text className={isFundraiser ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                Fundraiser
              </Text>
            </Pressable>

            <Pressable
              className={`flex-row items-center px-3 py-2 rounded-lg border ${
                isReverts ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
              }`}
              onPress={() => setIsReverts(!isReverts)}
            >
              <View className={`h-5 w-5 rounded border-2 items-center justify-center mr-2 ${
                isReverts ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {isReverts && <Icon source={'check'} size={12} color="white"/>}
              </View>
              <Text className={isReverts ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                Reverts Event
              </Text>
            </Pressable>

            <Pressable
              className={`flex-row items-center px-3 py-2 rounded-lg border ${
                isBreakfast ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
              }`}
              onPress={() => setIsBreakfast(!isBreakfast)}
            >
              <View className={`h-5 w-5 rounded border-2 items-center justify-center mr-2 ${
                isBreakfast ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {isBreakfast && <Icon source={'check'} size={12} color="white"/>}
              </View>
              <Text className={isBreakfast ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                Brothers Breakfast
              </Text>
            </Pressable>

            <Pressable
              className={`flex-row items-center px-3 py-2 rounded-lg border ${
                isOutreach ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
              }`}
              onPress={() => setIsOutreach(!isOutreach)}
            >
              <View className={`h-5 w-5 rounded border-2 items-center justify-center mr-2 ${
                isOutreach ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {isOutreach && <Icon source={'check'} size={12} color="white"/>}
              </View>
              <Text className={isOutreach ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                Outreach Activities
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            className={`flex-row items-center px-3 py-2 rounded-lg border ${
              isSocialService ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
            }`}
            style={{ alignSelf: 'flex-start' }}
            onPress={() => setIsSocialService(!isSocialService)}
          >
            <View className={`h-5 w-5 rounded border-2 items-center justify-center mr-2 ${
              isSocialService ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
            }`}>
              {isSocialService && <Icon source={'check'} size={12} color="white"/>}
            </View>
            <Text className={isSocialService ? 'text-blue-700 font-medium' : 'text-gray-700'}>
              Social Services
            </Text>
          </Pressable>
        )}
        {/* Is Paid */}
        <Text className="text-sm font-semibold text-gray-700 mb-3 mt-4">
          Is this {isPace ? 'Pace Event' : 'Event'} Paid?
        </Text>
        <Pressable
          className={`flex-row items-center px-4 py-3 rounded-xl border ${
            isPaid ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
          }`}
          onPress={() => setIsPaid(!isPaid)}
          style={{ alignSelf: 'flex-start' }}
        >
          <View className={`h-5 w-5 rounded border-2 items-center justify-center mr-2 ${
            isPaid ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
          }`}>
            {isPaid && <Icon source={'check'} size={12} color="white"/>}
          </View>
          <Text className={isPaid ? 'text-blue-700 font-medium' : 'text-gray-700'}>Paid</Text>
        </Pressable>

        {isPaid && (
          <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={keyboardOffset}>
            <View className="mt-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Enter Event Website Link
              </Text>
              <TextInput
                mode="outlined"
                theme={{ roundness: 12 }}
                style={{ width: "100%", height: 50, backgroundColor: 'white' }}
                activeOutlineColor="#6077F5"
                outlineColor="#E2E8F0"
                value={eventPaidLink}
                onChangeText={setEventPaidLink}
                placeholder="Enter MAS Shop Link..."
                textColor="black"
              />
            </View>
          </KeyboardAvoidingView>
        )}
      </View>

      {/* Submit Button */}
      <Button
        mode="contained"
        buttonColor="#6077F5"
        textColor="white"
        theme={{ roundness: 12 }}
        style={{ marginBottom: 24, height: 50, justifyContent: 'center' }}
        labelStyle={{ fontSize: 16, fontWeight: '600' }}
        onPress={async () => await onUpdate()}
      >
        Submit Event
      </Button>
    </ScrollView>
    <SelectSpeakerBottomSheet
      isOpen={speakerBottomSheetOpen}
      setIsOpen={setSpeakerBottomSheetOpen}
      speakers={speakers}
      selectedSpeakers={speakerSelected}
      onSelectSpeaker={handleSpeakerPress}
      multiSelect={true}
      title="Select Speakers"
    />
  </View>
  );
};

export default UpdateEventScreen;



/* 
          {
          imgURL ? (
            (
              <Pressable onPress={pickImage}>
              <Image
                source={{ uri: imgURL }}
                style={{
                  width: "50%",
                  height: 110,
                  marginVertical: "1%",
                  alignSelf : "center",
                  borderRadius: 15
                }}
                resizeMode="contain"
              /> 
              </Pressable>
            )
          ) : 
          eventImage ? (
            <Pressable onPress={pickImage}>
            <Image
              source={{ uri: eventImage.uri }}
              style={{
                width: "50%",
                height: 110,
                marginVertical: "1%",
                alignSelf : "center",
                borderRadius: 15
              }}
              resizeMode="contain"
            /> 
            </Pressable>
          ): (
              <TouchableOpacity
              onPress={pickImage}
              style={{
                backgroundColor: "#57BA47",
                width: "30%",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 2,
                marginLeft: "2%",
                paddingVertical: "1%",
              }}
            >
              <Text className="text-base font-bold text-white">Update</Text>
            </TouchableOpacity>
            )
          }
*/