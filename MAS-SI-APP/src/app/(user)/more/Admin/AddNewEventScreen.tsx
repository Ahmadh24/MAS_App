import React, { useEffect, useRef, useState } from "react";
import { Text, View, Image, ScrollView, TouchableOpacity, Pressable, Alert, KeyboardAvoidingView, useWindowDimensions, Dimensions } from "react-native";
import { router, Stack } from "expo-router";
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
import Svg, { Circle, Path } from "react-native-svg";
import AddSpeakerModal from "@/src/components/AdminComponents/AddSpeakerModal";
import SelectSpeakerBottomSheet from "@/src/components/AdminComponents/SelectSpeakerBottomSheet";

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

  const [isSocialService, setIsSocialService] = useState<boolean>(false);
  const [isFundraiser, setIsFundraiser] = useState<boolean>(false);
  const [isReverts, setIsReverts] = useState<boolean>(false);
  const [isOutreach, setIsOutreach] = useState<boolean>(false);
  const [isBreakfast, setIsBreakfast] = useState<boolean>(false);
  const [eventPaidLink, setEventPaidLink] = useState('');

  const [speakers, setSpeakers] = useState<any[]>([])
  const [speakerSelected, setSpeakerSelected] = useState<any[]>([])
  const [hasLectures, sethasLectures] = useState(false)
  const [openAddSpeaker, setOpenAddSpeaker] = useState(false)
  const [speakerBottomSheetOpen, setSpeakerBottomSheetOpen] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)
  const descriptionRef = useRef<View>(null)
  const titleRef = useRef<View>(null)
  const layoutHeight = Dimensions.get('screen').height
  const [keyboardOffset, setKeyboardOffset] = useState(0)
  const [submitDisabled, setSubmitDisabled] = useState(true)
  const getSpeakers = async () => {
    const { data, error } = await supabase.from('speaker_data').select('speaker_id, speaker_name, speaker_img, speaker_creds')
    if (data) {
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

  const handleSpeakerPress = (speaker_id: string) => {
    if (speakerSelected.includes(speaker_id)) {
      const removeSpeaker = speakerSelected.filter(id => id != speaker_id)
      setSpeakerSelected(removeSpeaker)
    }
    else if (speakerSelected.length == 0) {
      setSpeakerSelected([speaker_id])
    } else if (speakerSelected.length > 0) {
      setSpeakerSelected([...speakerSelected, speaker_id])
    }
  }
  const SpeakersData = (props: any) => {
    const speakers = props.speakers;
    console.log('SpeakersData received:', props, 'Speakers array:', speakers);
    return (
      <View className="space-y-3">
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
                {speakers.filter((s: any) => speakerSelected.includes(s.speaker_id)).map((s: any) => s.speaker_name).join(', ')}
              </Text>
            )}
          </View>
          <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Path d="M7.5 15L12.5 10L7.5 5" stroke="#6077F5" strokeWidth="2" />
          </Svg>
        </Pressable>

        {speakerSelected.length == 0 && (
          <Pressable
            className="flex-row items-center justify-center px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl"
            onPress={() => setOpenAddSpeaker(true)}
          >
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginRight: 8 }}>
              <Circle cx="10" cy="6" r="3" stroke="#6077F5" strokeLinecap="round" />
              <Path fillRule="evenodd" clipRule="evenodd" d="M12.5 12C11.5 11.7 10.4 11.6 9.3 11.7C8.1 11.8 7.0 12.2 6.1 12.8C5.2 13.4 4.5 14.2 4.1 15.1C4.0 15.3 4.1 15.5 4.3 15.6C4.5 15.7 4.7 15.6 4.8 15.4C5.1 14.7 5.7 14.1 6.5 13.7C7.3 13.3 8.2 13.1 9.1 13.1C9.5 13.1 9.9 13.1 10.3 13.2C10.6 12.9 10.9 12.8 11.2 12.8L12.5 12Z" fill="#6077F5" />
              <Path d="M15 10L15 16" stroke="#6077F5" strokeLinecap="round" />
              <Path d="M18 13L12 13" stroke="#6077F5" strokeLinecap="round" />
            </Svg>
            <Text className="text-blue-600 font-semibold">Add New Speaker</Text>
          </Pressable>
        )}
      </View>
    );
  };
  const onSumbit = async () => {
    if (eventName && eventDescription && eventDays.length > 0 && eventEndDate && eventStartDate && speakerSelected.length > 0 && eventImage && eventStartTime) {
      setSubmitDisabled(false)
      const base64 = await FileSystem.readAsStringAsync(eventImage.uri, { encoding: 'base64' });
      const filePath = `${eventName.trim().split(" ").join("_")}.${eventImage.type === 'image' ? 'png' : 'mp4'}`;
      const contentType = eventImage.type === 'image' ? 'image/png' : 'video/mp4';
      const { data: image, error: image_upload_error } = await supabase.storage.from('event_flyers').upload(filePath, decode(base64));
      if (image) {
        const { data: event_img_url } = await supabase.storage.from('event_flyers').getPublicUrl(image?.path)
        const time = format(eventStartTime!, 'p').trim()
        const { error } = await supabase.from('events').insert({
          event_name: eventName,
          event_img: event_img_url.publicUrl,
          event_desc: eventDescription,
          event_speaker: speakerSelected,
          has_lecture: hasLectures,
          event_start_date: eventStartDate,
          event_end_date: eventEndDate,
          is_paid: isPaid,
          event_price: Number(EventPrice),
          event_start_time: time,
          event_days: eventDays,
          is_outreach: isOutreach,
          is_social: isSocialService,
          is_reverts: isReverts,
          is_fundraiser: isFundraiser,
          is_breakfast: isBreakfast,
          paid_link: eventPaidLink,
          pace: isPace
        })
        if (error) {
          console.log(error)
        }
        handleSubmit()
        setSubmitDisabled(true)
      } else {
        Alert.alert(image_upload_error.message)
        return
      }
    } else {
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

    return () => { supabase.removeChannel(listenforspeakers) }
  }, [])
  return (
    <>
      <Stack.Screen
        options={{
          title: "Create New Event",
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
      <View className="flex-1 bg-gray-50">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
          ref={scrollViewRef}
          onScroll={(e) => {
            setKeyboardOffset(175 - e.nativeEvent.contentOffset.y)
          }}
          className="px-6"
        >
          {/* Event Details Section */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3
          }}>
            <Text className="text-xl font-bold text-gray-900 mb-6">Event Details</Text>

            {/* Time Selection */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Start Time</Text>
              <Pressable
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center justify-between"
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text className="text-gray-900 font-medium">
                  {eventStartTime ? format(eventStartTime, 'p') : 'Select Time'}
                </Text>
                <Icon source="clock-outline" size={20} color="#6077F5" />
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

            {/* Date Row */}
            <View className="flex-row gap-4 mb-6">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Start Date</Text>
                <Pressable
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center justify-between"
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text className="text-gray-900 font-medium">
                    {eventStartDate ? eventStartDate.toLocaleDateString() : 'Select Date'}
                  </Text>
                  <Icon source="calendar-outline" size={20} color="#6077F5" />
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
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-700 mb-2">End Date</Text>
                <Pressable
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center justify-between"
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text className="text-gray-900 font-medium">
                    {eventEndDate ? eventEndDate.toLocaleDateString() : 'Select Date'}
                  </Text>
                  <Icon source="calendar-outline" size={20} color="#6077F5" />
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
            </View>

            {/* Days Selection */}
            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-4">Event Days</Text>
              <View className="flex-row flex-wrap gap-3">
                {days.map((day, index) => (
                  <Pressable
                    key={index}
                    className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${eventDays.includes(day)
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-gray-50 border-gray-200'
                      }`}
                    onPress={() => toggleDaySelection(day)}
                  >
                    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${eventDays.includes(day)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                      }`}>
                      {eventDays.includes(day) && (
                        <Icon source="check" size={12} color="white" />
                      )}
                    </View>
                    <Text className={`font-medium ${eventDays.includes(day) ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                      {day}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Event Information Section */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3
          }}>
            <Text className="text-xl font-bold text-gray-900 mb-6">Event Information</Text>

            {/* Title */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Event Title</Text>
              <TextInput
                mode="outlined"
                theme={{ roundness: 12 }}
                style={{
                  backgroundColor: 'white',
                  fontSize: 16
                }}
                activeOutlineColor="#6077F5"
                value={eventName}
                onChangeText={setEventName}
                placeholder="Enter event title..."
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
                value={eventDescription}
                onChangeText={setEventDescription}
                placeholder="Enter event description..."
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
              <Text className="text-sm font-semibold text-gray-700 mb-4">Event Image</Text>
              {eventImage ? (
                <Pressable onPress={pickImage} className="items-center">
                  <Image
                    source={{ uri: eventImage.uri }}
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
                  <Text className="text-gray-500 font-medium mt-2">Tap to upload image</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Event Settings Section */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3
          }}>
            <Text className="text-xl font-bold text-gray-900 mb-6">Event Settings</Text>

            {/* YouTube Videos */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-4">Recorded YouTube Videos?</Text>
              <View className="flex-row gap-4">
                <Pressable
                  className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${!hasLectures
                    ? 'bg-green-50 border-green-500'
                    : 'bg-gray-50 border-gray-200'
                    }`}
                  onPress={() => sethasLectures(false)}
                >
                  <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${!hasLectures
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300'
                    }`}>
                    {!hasLectures && <Icon source="check" size={12} color="white" />}
                  </View>
                  <Text className={`font-medium ${!hasLectures ? 'text-green-700' : 'text-gray-600'
                    }`}>No</Text>
                </Pressable>

                <Pressable
                  className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${hasLectures
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-gray-200'
                    }`}
                  onPress={() => sethasLectures(true)}
                >
                  <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${hasLectures
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                    }`}>
                    {hasLectures && <Icon source="check" size={12} color="white" />}
                  </View>
                  <Text className={`font-medium ${hasLectures ? 'text-blue-700' : 'text-gray-600'
                    }`}>Yes</Text>
                </Pressable>
              </View>
            </View>

            {/* Event Type */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Event Type</Text>
              <Text className="text-xs text-gray-500 mb-4">(it will go under the checked box section)</Text>
              <View className="flex-row gap-4">
                <Pressable
                  className={`flex-1 flex-row items-center px-4 py-3 rounded-xl border-2 ${isPace
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-gray-200'
                    }`}
                  onPress={() => setIsPace(true)}
                >
                  <View className={`w-5 h-5 rounded border-2 items-center justify-center mr-3 ${isPace
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                    }`}>
                    {isPace && <Icon source="check" size={12} color="white" />}
                  </View>
                  <Text className={`font-medium ${isPace ? 'text-blue-700' : 'text-gray-600'
                    }`}>PACE</Text>
                </Pressable>

                <Pressable
                  className={`flex-1 flex-row items-center px-4 py-3 rounded-xl border-2 ${!isPace
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-gray-200'
                    }`}
                  onPress={() => setIsPace(false)}
                >
                  <View className={`w-5 h-5 rounded border-2 items-center justify-center mr-3 ${!isPace
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                    }`}>
                    {!isPace && <Icon source="check" size={12} color="white" />}
                  </View>
                  <Text className={`font-medium ${!isPace ? 'text-blue-700' : 'text-gray-600'
                    }`}>Event</Text>
                </Pressable>
              </View>
            </View>

            {/* Further Classification */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-4">Further Classification:</Text>
              <View className="flex-row flex-wrap gap-3">
                {!isPace ? (
                  <>
                    <Pressable
                      className={`flex-row items-center px-4 py-3 rounded-xl border-2 w-[48%] ${isFundraiser
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-200'
                        }`}
                      onPress={() => setIsFundraiser(!isFundraiser)}
                    >
                      <View className={`w-5 h-5 rounded border-2 items-center justify-center mr-2 ${isFundraiser
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                        }`}>
                        {isFundraiser && <Icon source="check" size={12} color="white" />}
                      </View>
                      <Text className={`font-medium text-sm ${isFundraiser ? 'text-blue-700' : 'text-gray-600'
                        }`}>Fundraiser</Text>
                    </Pressable>

                    <Pressable
                      className={`flex-row items-center px-4 py-3 rounded-xl border-2 w-[48%] ${isReverts
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-200'
                        }`}
                      onPress={() => setIsReverts(!isReverts)}
                    >
                      <View className={`w-5 h-5 rounded border-2 items-center justify-center mr-2 ${isReverts
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                        }`}>
                        {isReverts && <Icon source="check" size={12} color="white" />}
                      </View>
                      <Text className={`font-medium text-sm ${isReverts ? 'text-blue-700' : 'text-gray-600'
                        }`}>Reverts Event</Text>
                    </Pressable>

                    <Pressable
                      className={`flex-row items-center px-4 py-3 rounded-xl border-2 w-[48%] ${isBreakfast
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-200'
                        }`}
                      onPress={() => setIsBreakfast(!isBreakfast)}
                    >
                      <View className={`w-5 h-5 rounded border-2 items-center justify-center mr-2 ${isBreakfast
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                        }`}>
                        {isBreakfast && <Icon source="check" size={12} color="white" />}
                      </View>
                      <Text className={`font-medium text-sm ${isBreakfast ? 'text-blue-700' : 'text-gray-600'
                        }`}>Brothers Breakfast</Text>
                    </Pressable>

                    <Pressable
                      className={`flex-row items-center px-4 py-3 rounded-xl border-2 w-[48%] ${isOutreach
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-200'
                        }`}
                      onPress={() => setIsOutreach(!isOutreach)}
                    >
                      <View className={`w-5 h-5 rounded border-2 items-center justify-center mr-2 ${isOutreach
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                        }`}>
                        {isOutreach && <Icon source="check" size={12} color="white" />}
                      </View>
                      <Text className={`font-medium text-sm ${isOutreach ? 'text-blue-700' : 'text-gray-600'
                        }`}>Outreach Activities</Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${isSocialService
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-gray-50 border-gray-200'
                      }`}
                    onPress={() => setIsSocialService(!isSocialService)}
                  >
                    <View className={`w-5 h-5 rounded border-2 items-center justify-center mr-2 ${isSocialService
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                      }`}>
                      {isSocialService && <Icon source="check" size={12} color="white" />}
                    </View>
                    <Text className={`font-medium ${isSocialService ? 'text-blue-700' : 'text-gray-600'
                      }`}>Social Services</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Is Paid */}
            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-4">Is this Event Paid?</Text>
              <Pressable
                className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${isPaid
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-gray-50 border-gray-200'
                  }`}
                onPress={() => setIsPaid(!isPaid)}
              >
                <View className={`w-5 h-5 rounded border-2 items-center justify-center mr-3 ${isPaid
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
                  }`}>
                  {isPaid && <Icon source="check" size={12} color="white" />}
                </View>
                <Text className={`font-medium ${isPaid ? 'text-blue-700' : 'text-gray-600'
                  }`}>Paid</Text>
              </Pressable>

              {isPaid && (
                <View className="mt-6">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Event Website Link</Text>
                  <TextInput
                    mode="outlined"
                    theme={{ roundness: 12 }}
                    style={{
                      backgroundColor: 'white',
                      fontSize: 16
                    }}
                    activeOutlineColor="#6077F5"
                    value={eventPaidLink}
                    onChangeText={setEventPaidLink}
                    placeholder="Enter MAS Shop Link..."
                    textColor="black"
                  />
                </View>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <Button
            mode="contained"
            buttonColor="#6077F5"
            textColor="white"
            theme={{ roundness: 12 }}
            onPress={async () => await onSumbit()}
            disabled={!submitDisabled}
            style={{ marginBottom: 24, height: 50, justifyContent: 'center' }}
            labelStyle={{ fontSize: 16, fontWeight: '600' }}
          >
            Submit Event
          </Button>

          {/* Bottom Spacer */}
          <View style={{ height: 20 }} />
        </ScrollView>

        <AddSpeakerModal setIsOpen={setOpenAddSpeaker} isOpen={openAddSpeaker} />
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
    </>
  );
};

export default AddNewEventScreen;
