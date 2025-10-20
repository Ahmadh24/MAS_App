import React, { useEffect, useRef, useState } from "react";
import { Text, View, Image, ScrollView, TouchableOpacity, Pressable, Alert, KeyboardAvoidingView, useWindowDimensions, Dimensions } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
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
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
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
  const tabHeight = useBottomTabBarHeight() + 20

  const scrollViewRef = useRef<ScrollView>(null)
  const descriptionRef = useRef<View>(null)
  const titleRef = useRef<View>(null)
  const paidRef = useRef<View>(null)
  
  const [ keyboardOffset, setKeyboardOffset ] = useState(0)
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
    <>
    <Stack.Screen
        options={{
          headerTransparent : true,
          header : () => (
            <View className="relative">
              <View className="h-[110px] w-[100%] rounded-br-[65px] bg-[#5E636B] items-start justify-end pb-[5%] z-[1]">
                <Pressable className="flex flex-row items-center justify-between w-[31%]" onPress={() => router.dismiss(3) }>
                  <Svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                    <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="#1B85FF" stroke-width="2"/>
                  </Svg>
                  <Text className=" text-[25px] text-white">Events</Text>
                </Pressable>
              </View>

              <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
                <View className="w-[60%] items-center"> 
                  <Text className=" text-[15px] text-black ">Edit Existing Events</Text>
                </View>
              </View>

              <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#E3E3E3] items-start justify-end pb-[5%] absolute top-[100] z-[-1]">
                <View className='w-[100%]'>
                  <Pressable className="w-[100%] items-center flex flex-row px-2" onPress={() => router.back()}> 
                      <View className='w-[11%]'>
                        <Svg  width="16" height="9" viewBox="0 0 16 9" fill="none">
                          <Path d="M4.5 8.22607L1 4.61303M1 4.61303L4.5 0.999987M1 4.61303H15" stroke="#6077F5" stroke-linecap="round"/>
                        </Svg>
                      </View>
                      <View className='w-[80%] items-start '><Text className=" text-[15px] text-black " numberOfLines={1} >{event_name}</Text></View>
                  </Pressable>
                </View>
              </View>
            </View>
          )
        }}
    />
    <View style={{ padding: 10, backgroundColor : 'white', paddingTop: 220 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabHeight + 10 }}
        showsVerticalScrollIndicator={false}
        ref={scrollViewRef}
        onScroll={(e) => {
          setKeyboardOffset(e.nativeEvent.contentOffset.y / 2.2)
         }}
        >
         <Text className="text-base font-bold mb-1 mt-2 ml-2">Event Details</Text>
        <Text className="font-bold text-[13px] text-black my-3 ml-2">Time: </Text>
        <Pressable className="flex flex-col bg-[#EDEDED] w-[40%] rounded-[10px] items-center py-3 px-3" onPress={() => setShowStartTimePicker(true)}>
        <Text className=" text-black text-[11px]">
           Start Time: { eventStartTime ? eventStartTime.toLocaleTimeString() : '__'}
          </Text>
          {showStartTimePicker && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            display="default"
            onChange={(event, time) => {
              setShowStartTimePicker(false);
              if (time) setEventStartTime(time);
            }}
          />
        )}
        </Pressable>
        <Text className="font-bold text-[13px] text-black my-3 ml-2">Date:</Text>
        <View className="flex flex-row gap-x-2">
        <Pressable className="flex flex-col bg-[#EDEDED] w-[40%] rounded-[10px] items-center py-3 px-3" onPress={() => setShowStartDatePicker(true)}>
        <Text className="text-black text-[11px]">
          Start Date: { eventStartDate ? eventStartDate.toLocaleDateString() : '__'}
        </Text>
        {showStartDatePicker && (
          <DateTimePicker
            value={eventStartDate ? eventStartDate : new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowStartDatePicker(false);
              if (date) setEventStartDate(date);
            }}
          />
        )}
        </Pressable>

        <Pressable className="flex flex-col bg-[#EDEDED] w-[40%] rounded-[10px] items-center py-3 px-3" onPress={() => setShowEndDatePicker(true)}>
        <Text className="text-black text-[11px]">
           End Date: { eventEndDate ? eventEndDate.toLocaleDateString() : '__'}
          </Text>
          {showEndDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowEndDatePicker(false);
                if (date) setEventEndDate(date);
              }}
            />
          )}
        </Pressable>
        </View>

        <Text className="text-base font-bold mb-4 mt-4 ml-2">
        Select the day(s) this event is held:          
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
               {eventDays.includes(day) ? <Icon  source={'check'} size={15} color="green"/> : <></>}
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
            style={{ width: "100%", height: 45, marginBottom: 10, backgroundColor : 'white' }}
            activeOutlineColor="#0D509D"
            value={eventName}
            onChangeText={setEventName}
            placeholder="Event Name"
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
            style={{ width: "100%", height: 100, marginBottom: 10, backgroundColor : 'white' }}
            multiline
            activeOutlineColor="#0D509D"
            value={eventDescription}
            onChangeText={setEventDescription}
            placeholder="Event Description"
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
         
       <Text className="text-base font-bold mb-1 mt-2 ml-2">
          Upload Event Image
        </Text>

       
        {
        imgURL ? 
        (
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
          </Pressable>
        ) :
        eventImage ? (
          <Pressable onPress={pickImage}>
          <Image
            source={{ uri: eventImage.uri }}
            style={{
              width: 170,
                height:  170,
                marginVertical: "1%",
                alignSelf : "center",
                borderRadius: 15
            }}
            resizeMode="cover"
          /> 
          </Pressable>
        ): (
          <Button
          mode="contained"
          buttonColor="#57BA47"
          textColor="white"
          theme={{ roundness: 1 }}
          onPress={pickImage}
          className="w-[100%]"
          >
            Upload
          </Button>
          )
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

      <Text className="text-black font-bold ml-4 mt-4">Event Type: (<Text className="text-black text-[10px] font-[300]"> It will go under the checked box section </Text>)</Text>
             <View className="flex flex-row flex-wrap gap-3 my-4 w-[100%]  self-center ml-[0.5] items-center">
                       <Pressable
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: "4%",
                          }}
                          onPress={() => setIsPace(true)}
                          className="w-[40%] justify-between px-6 "
                        >
                          <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                            {isPace ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                          </View>
                          <Text className="text-base font-bold">PACE</Text>
                        </Pressable>
              
                        <Pressable
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: "4%",
                          }}
                          onPress={() => setIsPace(false)}
                          className="w-[40%] justify-between px-6 "
                        >
                          <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                            {!isPace ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                          </View>
                          <Text className="text-base font-bold">Event</Text>
                        </Pressable>
                     </View>
            <View className="w-[100%] " >
                     <Text className="text-black font-bold ml-4 mt-4">Further Classification: </Text>
                     <View className="flex flex-row flex-wrap gap-5 my-4 w-[100%]  self-center ml-[0.5] items-center">
                    { !isPace ? 
                      <>
                        <  Pressable
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: "4%",
                            }}
                            onPress={() => setIsSocialService(!isSocialService)}
                            className="w-[35%] justify-between px-2 "
                          >
                            <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                              {isSocialService ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                            </View>
                            <Text className="text-[12px] font-[400] text-black">Social Services</Text>
                          </Pressable>
          
                          <Pressable
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: "4%",
                            }}
                            onPress={() => setIsFundraiser(!isFundraiser)}
                            className="w-[35%] justify-between px-2 "
                          >
                            <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                              {isFundraiser ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                            </View>
                            <Text className="text-[12px] font-[400] text-black">Fundraiser</Text>
                          </Pressable>
          
                          <Pressable
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: "4%",
                            }}
                            onPress={() => setIsReverts(!isReverts)}
                            className="w-[35%] justify-between px-2 "
                          >
                            <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                              {isReverts ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                            </View>
                            <Text className="text-[12px] font-[400] text-black">Reverts Event</Text>
                          </Pressable>
          
                          <Pressable
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: "4%",
                            }}
                            onPress={() => setIsBreakfast(!isBreakfast)}
                            className="w-[45%] justify-between px-2 "
                          >
                            <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                              {isBreakfast ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                            </View>
                            <Text className="text-[12px] font-[400] text-black" >Brothers Breakfast</Text>
                          </Pressable>
          
                          <Pressable
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: "4%",
                            }}
                            onPress={() => setIsOutreach(!isOutreach)}
                            className="w-[80%] justify-center  px-2 "
                          >
                            <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center mx-5">
                              {isOutreach ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                            </View>
                            <Text className="text-[12px] font-[400] text-black">Outreach Activities</Text>
                          </Pressable>
                        </>
                        :
                          <Pressable
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: "4%",
                          }}
                          onPress={() => setIsSocialService(!isSocialService)}
                          className="w-[35%] justify-between px-2 "
                        >
                          <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                            {isSocialService ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                          </View>
                          <Text className="text-[12px] font-[400] text-black">Social Services</Text>
                        </Pressable>
                        }
        
                      </View>
                      <Text className="text-black font-bold ml-5 mt-2">Is this { isPace ? 'Pace Event' : 'Event'} Paid?</Text>
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
                              Enter Event Website Link
                            </Text>
                            <TextInput
                              mode="outlined"
                              theme={{ roundness: 10 }}
                              style={{ width: "100%", height: 45, marginBottom: 10, backgroundColor : 'white' }}
                              activeOutlineColor="#0D509D"
                              value={eventPaidLink}
                              onChangeText={setEventPaidLink}
                              placeholder="Enter MAS Shop Link..."
                              textColor="black"
                              
                            />
                          </KeyboardAvoidingView>
                        )}
                 </View>


        <Button
          mode="contained"
          buttonColor="#57BA47"
          textColor="white"
          theme={{ roundness: 1 }}
          onPress={async () => await onUpdate()}
        >
          Submit Event
        </Button>
      </ScrollView>
    </View>
  </>
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