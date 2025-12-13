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
import { decode } from "base64-arraybuffer";
import { format } from "date-fns";
import * as FileSystem from 'expo-file-system'
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "expo-router";
import SelectSpeakerBottomSheet from "@/src/components/AdminComponents/SelectSpeakerBottomSheet";
function setTimeToCurrentDate(timeString: string) {

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
  const [originalName, setOriginalName] = useState('');
  const [programName, setProgramName] = useState<string>("");
  const [programImage, setProgramImage] = useState<ImagePicker.ImagePickerAsset>();
  const [programDescription, setProgramDescription] = useState<string>("");
  const [programStartDate, setProgramStartDate] = useState<Date | null>(null);
  const [programEndDate, setProgramEndDate] = useState<Date | null>(null);
  const [programStartTime, setProgramStartTime] = useState<Date | null>(null);
  const [programDays, setProgramDays] = useState<string[]>([]);
  const [speakers, setSpeakers] = useState<any[]>([])
  const [keyboardOffset, setKeyboardOffset] = useState(0)
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
  const [speakerSelected, setSpeakerSelected] = useState<any[]>([])
  const [hasLectures, sethasLectures] = useState(false)
  const [imgURL, setImgURL] = useState('')
  const [speakerBottomSheetOpen, setSpeakerBottomSheetOpen] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)
  const descriptionRef = useRef<View>(null)
  const titleRef = useRef<View>(null)
  const paidRef = useRef<View>(null)
  const layoutHeight = Dimensions.get('screen').height
  const getSpeakers = async () => {
    const { data, error } = await supabase.from('speaker_data').select('speaker_id, speaker_name, speaker_img, speaker_creds')
    if (data) {
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
  const SpeakersData = (speakers: any) => {
    return (
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
          <Path d="M7.5 15L12.5 10L7.5 5" stroke="#6077F5" strokeWidth="2" />
        </Svg>
      </Pressable>
    )
  }

  const currentSettings = async () => {
    const { data, error } = await supabase.from('programs').select('*').eq('program_id', program_id).single()
    if (data) {
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

  const onUpdate = async () => {
    if (programName && (imgURL || programImage) && programDescription && programStartDate && programEndDate && programDays && programStartTime && speakerSelected) {
      if (programImage) {
        const base64 = await FileSystem.readAsStringAsync(programImage.uri, { encoding: 'base64' });
        if (programName == originalName) {
          const filePath = `${programName.trim().split(" ").join("")}.${programImage.type === 'image' ? 'png' : 'mp4'}`;
          const contentType = programImage.type === 'image' ? 'image/png' : 'video/mp4';
          const { data: image, error: image_upload_error } = await supabase.storage.from('fliers').update(filePath, decode(base64));
          const { error } = await supabase.from('programs').update({ program_name: programName, program_desc: programDescription, program_start_date: programStartDate, program_end_date: programEndDate, program_days: programDays, program_start_time: format(programStartTime, 'pp'), paid_link: programPaidLink, program_speaker: speakerSelected, program_is_paid: isPaid, is_kids: isForKids, is_education: isEducational, is_fourteen_plus: isFor14Plus, has_lectures: hasLectures }).eq('program_id', program_id)
          handleSubmit()
          router.back()
        }
        else {
          const filePath = `${programName.trim().split(" ").join("")}.${programImage.type === 'image' ? 'png' : 'mp4'}`;
          const contentType = programImage.type === 'image' ? 'image/png' : 'video/mp4';
          const { error: remove } = await supabase.storage.from('fliers').remove([`${originalName.trim().split(" ").join("")}.png`]);
          const { data: image, error: image_upload_error } = await supabase.storage.from('fliers').upload(filePath, decode(base64));
          if (image) {
            const { data: program_img_url } = await supabase.storage.from('fliers').getPublicUrl(image?.path)
            const time = format(programStartTime!, 'p').trim()
            const { error } = await supabase.from('programs').update({ program_name: programName, program_img: program_img_url.publicUrl, program_desc: programDescription, program_start_date: programStartDate, program_end_date: programEndDate, program_days: programDays, program_start_time: format(programStartTime, 'pp'), paid_link: programPaidLink, program_speaker: speakerSelected, program_is_paid: isPaid, is_kids: isForKids, is_education: isEducational, is_fourteen_plus: isFor14Plus, has_lectures: hasLectures }).eq('program_id', program_id)
            handleSubmit()
            router.back()
          }
        }
      } else {
        const { error } = await supabase.from('programs').update({ program_name: programName, program_desc: programDescription, program_start_date: programStartDate, program_end_date: programEndDate, program_days: programDays, program_start_time: format(programStartTime, 'pp'), paid_link: programPaidLink, program_speaker: speakerSelected, program_is_paid: isPaid, is_kids: isForKids, is_education: isEducational, is_fourteen_plus: isFor14Plus, has_lectures: hasLectures }).eq('program_id', program_id)
        if (error) {
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
    <View className='flex-1 bg-gray-50'>
      <Stack.Screen
        options={{
          title: "Edit Program Info",
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
          setKeyboardOffset(225 - e.nativeEvent.contentOffset.y)
        }}
      >
        {/* Program Details Card */}
        <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
          <Text className="text-base font-bold mb-3 text-gray-800">Program Details</Text>

          {/* Start Time */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">Start Time</Text>
          <Pressable
            className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4"
            onPress={() => setShowStartTimePicker(true)}
          >
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginRight: 8 }}>
              <Path d="M10 5V10L13 13" stroke="#6077F5" strokeWidth="2" strokeLinecap="round" />
              <Path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="#6077F5" strokeWidth="2" />
            </Svg>
            <Text className="text-gray-800">
              {programStartTime ? format(programStartTime, 'p') : 'Select Time'}
            </Text>
          </Pressable>
          {showStartTimePicker && (
            <DateTimePicker
              value={new Date(programStartTime!)}
              mode="time"
              display="default"
              onChange={(event, time) => {
                setShowStartTimePicker(false);
                if (time) setProgramStartTime(time);
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
                {programStartDate ? programStartDate.toLocaleDateString() : 'Select'}
              </Text>
            </Pressable>
            {showStartDatePicker && (
              <DateTimePicker
                value={programStartDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowStartDatePicker(false);
                  if (date) setProgramStartDate(date);
                }}
              />
            )}

            <Pressable
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3"
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text className="text-xs text-gray-500 mb-1">End Date</Text>
              <Text className="text-gray-800 font-medium">
                {programEndDate ? programEndDate.toLocaleDateString() : 'Select'}
              </Text>
            </Pressable>
            {showEndDatePicker && (
              <DateTimePicker
                value={programEndDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowEndDatePicker(false);
                  if (date) setProgramEndDate(date);
                }}
              />
            )}
          </View>

          {/* Program Days */}
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Select the day(s) this program is held:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {days.map((day, index) => (
              <Pressable
                key={index}
                onPress={() => toggleDaySelection(day)}
                className={`flex-row items-center px-3 py-2 rounded-lg border ${programDays.includes(day)
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-gray-50 border-gray-200'
                  }`}
              >
                <View className={`h-5 w-5 rounded border-2 items-center justify-center mr-2 ${programDays.includes(day) ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                  {programDays.includes(day) && (
                    <Icon source={'check'} size={12} color="white" />
                  )}
                </View>
                <Text className={programDays.includes(day) ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                  {day}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        {/* Program Information Card */}
        <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
          <Text className="text-base font-bold mb-3 text-gray-800">Program Information</Text>

          <View ref={titleRef}>
            <Text className="text-sm font-semibold text-gray-700 mb-2">Program Title</Text>
            <TextInput
              mode="outlined"
              theme={{ roundness: 12 }}
              style={{ width: "100%", height: 50, marginBottom: 16, backgroundColor: 'white' }}
              activeOutlineColor="#6077F5"
              outlineColor="#E2E8F0"
              value={programName}
              onChangeText={setProgramName}
              placeholder="Enter the program title..."
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
              value={programDescription}
              onChangeText={setProgramDescription}
              placeholder="Enter the description..."
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
            Who is the Speaker of the Program
          </Text>
          {speakers ? <SpeakersData speakers={speakers} /> : <Text className="text-gray-500">Fetching Speakers...</Text>}
        </View>

        {/* Upload Program Flyer Card */}
        <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
          <Text className="text-base font-bold mb-3 text-gray-800">Upload Program Flyer</Text>

          {imgURL || programImage ? (
            <Pressable onPress={pickImage} className="items-center">
              <Image
                source={{ uri: imgURL || programImage?.uri }}
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
                <Path d="M30 20L30 40" stroke="#6077F5" strokeWidth="2" strokeLinecap="round" />
                <Path d="M40 30L20 30" stroke="#6077F5" strokeWidth="2" strokeLinecap="round" />
              </Svg>
              <Text className='text-blue-600 font-medium mt-2'>Tap to upload flyer</Text>
            </Pressable>
          )}
        </View>

        {/* Additional Options Card */}
        <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
          <Text className="text-base font-bold mb-3 text-gray-800">Additional Options</Text>

          {/* Has Lectures */}
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Does the Program have recorded Youtube Videos?
          </Text>
          <View className="flex-row gap-3 mb-4">
            <Pressable
              className={`flex-1 flex-row items-center px-4 py-3 rounded-xl border ${!hasLectures ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
                }`}
              onPress={() => sethasLectures(false)}
            >
              <View className={`h-5 w-5 rounded-full border-2 items-center justify-center mr-2 ${!hasLectures ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                {!hasLectures && <Icon source={'check'} size={12} color="white" />}
              </View>
              <Text className={!hasLectures ? 'text-blue-700 font-medium' : 'text-gray-700'}>No</Text>
            </Pressable>

            <Pressable
              className={`flex-1 flex-row items-center px-4 py-3 rounded-xl border ${hasLectures ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
                }`}
              onPress={() => sethasLectures(true)}
            >
              <View className={`h-5 w-5 rounded-full border-2 items-center justify-center mr-2 ${hasLectures ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                {hasLectures && <Icon source={'check'} size={12} color="white" />}
              </View>
              <Text className={hasLectures ? 'text-blue-700 font-medium' : 'text-gray-700'}>Yes</Text>
            </Pressable>
          </View>

          {/* Program Type */}
          <Text className="text-sm font-semibold text-gray-700 mb-3">Program Type</Text>
          <View className="flex-row gap-3 mb-4">
            <Pressable
              className={`flex-1 flex-row items-center px-4 py-3 rounded-xl border ${isForKids ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
                }`}
              onPress={() => setIsForKids(!isForKids)}
            >
              <View className={`h-5 w-5 rounded border-2 items-center justify-center mr-2 ${isForKids ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                {isForKids && <Icon source={'check'} size={12} color="white" />}
              </View>
              <Text className={isForKids ? 'text-blue-700 font-medium' : 'text-gray-700'}>Kids</Text>
            </Pressable>

            <Pressable
              className={`flex-1 flex-row items-center px-4 py-3 rounded-xl border ${!isForKids ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
                }`}
              onPress={() => setIsForKids(!isForKids)}
            >
              <View className={`h-5 w-5 rounded border-2 items-center justify-center mr-2 ${!isForKids ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                {!isForKids && <Icon source={'check'} size={12} color="white" />}
              </View>
              <Text className={!isForKids ? 'text-blue-700 font-medium' : 'text-gray-700'}>Program</Text>
            </Pressable>
          </View>

          {/* Is Paid */}
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Is this {isForKids ? 'Kids Program' : 'Program'} Paid?
          </Text>
          <Pressable
            className={`flex-row items-center px-4 py-3 rounded-xl border ${isPaid ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
              }`}
            onPress={() => setIsPaid(!isPaid)}
            style={{ alignSelf: 'flex-start' }}
          >
            <View className={`h-5 w-5 rounded border-2 items-center justify-center mr-2 ${isPaid ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
              {isPaid && <Icon source={'check'} size={12} color="white" />}
            </View>
            <Text className={isPaid ? 'text-blue-700 font-medium' : 'text-gray-700'}>Paid</Text>
          </Pressable>

          {isPaid && (
            <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={keyboardOffset}>
              <View className="mt-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Enter Program Website Link
                </Text>
                <TextInput
                  mode="outlined"
                  theme={{ roundness: 12 }}
                  style={{ width: "100%", height: 50, backgroundColor: 'white' }}
                  activeOutlineColor="#6077F5"
                  outlineColor="#E2E8F0"
                  value={programPaidLink}
                  onChangeText={setprogramPaidLink}
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
          Submit Program
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