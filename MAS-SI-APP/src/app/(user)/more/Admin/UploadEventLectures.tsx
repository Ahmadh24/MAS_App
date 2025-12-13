import React, { useEffect, useRef, useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, Pressable, Image } from "react-native";
import { TextInput, Button, IconButton, Modal, Icon } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { router, Stack, useLocalSearchParams } from "expo-router";
import moment from "moment";
import { supabase } from "@/src/lib/supabase";
import Svg, { Path } from "react-native-svg";
import { format } from "date-fns";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import SelectSpeakerBottomSheet from "@/src/components/AdminComponents/SelectSpeakerBottomSheet";
const UploadEventLectures = () => {
  const { event_id, event_name, event_img } = useLocalSearchParams();
  const [lectureEvent, setLectureEvent] = useState<string | null>(null);
  const [lectureName, setLectureName] = useState<string>("");
  const [lectureSpeaker, setLectureSpeaker] = useState<string>("");
  const [lectureLink, setLectureLink] = useState<string>("");
  const [lectureAI, setLectureAI] = useState<string>("");
  const [lectureDate, setLectureDate] = useState<Date | null>();
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [keyNotes, setKeyNotes] = useState<string[]>([]);
  const [keyNoteModal, setKeyNoteModal] = useState<boolean>(false);
  const [keyNoteInput, setKeyNoteInput] = useState<string>("");
  const [eventLectureDatePicker, setEventLectureDatePicker] = useState(false)
  const [speakers, setSpeakers] = useState<any[]>([])
  const [speakerSelected, setSpeakerSelected] = useState<any[]>([])
  const [speakerBottomSheetOpen, setSpeakerBottomSheetOpen] = useState(false)
  const events = ["Event A", "Event B", "Event C"];
  const scrollViewRef = useRef<ScrollView>(null)
  const youtubeRef = useRef<View>(null)
  const titleRef = useRef<View>(null)
  const descriptionRef = useRef<View>(null)
  const keynoteRef = useRef<any>(null)
  const handleSubmit = () => {

    Toast.show({
      type: "success",
      text1: "Lecture Uploaded Successfully",
      position: "top",
      topOffset: 50,
    });

    // Reset fields
    setLectureEvent(null);
    setLectureName("");
    setLectureSpeaker("");
    setLectureLink("");
    setLectureAI("");
    setLectureDate(null);
    setKeyNotes([])
    setKeyNoteInput("")
  };

  const getSpeakers = async () => {
    const { data, error } = await supabase.from('speaker_data').select('speaker_id, speaker_name, speaker_img, speaker_creds')
    if (data) {
      setSpeakers(data)
    }
  }
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
  const onUploadLecture = async () => {
    if (!lectureName || !speakerSelected || !lectureLink || !lectureDate) {
      Toast.show({
        type: "error",
        text1: "All fields are required!",
        position: "top",
        topOffset: 50,
      });
      return;
    } else {
      const { error } = await supabase.from('events_lectures').insert({ event_id: event_id, event_lecture_name: lectureName, event_lecture_speaker: speakerSelected, event_lecture_link: lectureLink, event_lecture_date: lectureDate, event_lecture_keynotes: keyNotes, event_lecture_desc: lectureAI })
      handleSubmit()
      router.back()
    }
  }
  useEffect(() => {
    getSpeakers()
  }, [])
  return (
    <>
      <Stack.Screen
        options={{
          title: "Add New Lecture",
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
      <View style={{ padding: 16, backgroundColor: '#F9FAFB', flex: 1, paddingBottom: 30 }}>
        <ScrollView
          contentContainerStyle={{}}
          showsVerticalScrollIndicator={false}
          ref={scrollViewRef}
        >

          <Image
            src={Array.isArray(event_img) ? event_img[0] : event_img}
            className="self-center w-[200px] h-[200px] rounded-[15px] my-4"
          />
          <Text className="self-center font-bold text-lg mb-4 text-gray-800">{event_name}</Text>

          <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm' ref={youtubeRef}>
            <Text className="text-base font-bold mb-2 text-gray-800">Add A New YouTube Link</Text>
            <Text className="text-xs text-gray-600 mb-3">Example: https://www.youtube.com/watch?v=<Text className="bg-[#FFD465] font-bold rounded-[2px]">qdbPaFQxSUI</Text></Text>
            <TextInput
              mode="outlined"
              theme={{ roundness: 12 }}
              style={{ width: "100%", height: 50, backgroundColor: 'white' }}
              activeOutlineColor="#6077F5"
              outlineColor="#E2E8F0"
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
                        animated: true
                      }
                    )
                  })
              }}
            />
          </View>

          <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm' ref={titleRef}>
            <Text className="text-base font-bold mb-3 text-gray-800">Lecture Title</Text>
            <TextInput
              mode="outlined"
              theme={{ roundness: 12 }}
              style={{ width: "100%", height: 50, backgroundColor: 'white' }}
              activeOutlineColor="#6077F5"
              outlineColor="#E2E8F0"
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
                        animated: true
                      }
                    )
                  })
              }}
            />
          </View>

          <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
            <Text className="text-base font-bold mb-3 text-gray-800">Lecture Speaker</Text>
            {speakers ? <SpeakersData speakers={speakers} /> : <Text className="text-gray-500">Fetching Speakers...</Text>}
          </View>

          <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm' ref={descriptionRef}>
            <Text className="text-base font-bold mb-3 text-gray-800">Lecture Summary</Text>
            <TextInput
              mode="outlined"
              theme={{ roundness: 12 }}
              style={{ width: "100%", height: 120, backgroundColor: 'white' }}
              activeOutlineColor="#6077F5"
              outlineColor="#E2E8F0"
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
                        animated: true
                      }
                    )
                  })
              }}
            />
          </View>

          <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
            <Text className="text-base font-bold mb-3 text-gray-800">Lecture KeyNotes</Text>
            {
              keyNotes && keyNotes.length > 0 ? keyNotes.map((note, index) => {
                return (
                  <View className="flex-row items-center mb-2 bg-gray-50 rounded-lg p-2" key={index}>
                    <Text className="flex-1 text-gray-700">• {note}</Text>
                    <Pressable
                      onPress={() => {
                        const filtered = keyNotes.filter(notes => notes != note)
                        setKeyNotes(filtered)
                      }}
                      className='ml-2 bg-red-100 w-6 h-6 rounded-full items-center justify-center'
                    >
                      <Text className='text-red-600 font-bold text-sm'>×</Text>
                    </Pressable>
                  </View>
                )
              }) : <Text className="text-gray-500 text-sm mb-2">No keynotes added yet</Text>
            }
            <Pressable
              onPress={() => setKeyNoteModal(true)}
              className='bg-gray-100 rounded-lg py-2 px-4 items-center mt-2'
            >
              <Text className='text-[#6077F5] font-medium'>+ Add KeyNote</Text>
            </Pressable>
          </View>

          <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
            <Text className="text-base font-bold mb-3 text-gray-800">Lecture Date</Text>
            <Pressable
              className="bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 items-center"
              onPress={() => setEventLectureDatePicker(true)}
            >
              <Text className="text-gray-700 font-medium">
                {lectureDate ? lectureDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'Select Date'}
              </Text>
              {eventLectureDatePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setEventLectureDatePicker(false)
                    if (date) setLectureDate(date);
                  }}
                />
              )}
            </Pressable>
          </View>

          <Button
            mode="contained"
            buttonColor="#6077F5"
            textColor="white"
            theme={{ roundness: 12 }}
            style={{ marginTop: 8, marginBottom: 24, height: 50, justifyContent: 'center' }}
            labelStyle={{ fontSize: 16, fontWeight: '600' }}
            onPress={() => onUploadLecture()}
          >
            Upload Lecture
          </Button>
        </ScrollView>

        <Modal visible={keyNoteModal} onDismiss={() => setKeyNoteModal(false)} contentContainerStyle={{ backgroundColor: 'white', borderRadius: 12, width: '90%', height: '50%', alignSelf: 'center' }}>
          <View className="w-[100%] self-center p-5 flex-1">
            <Text className="text-lg font-bold text-gray-800 mb-4">Add KeyNote</Text>
            <TextInput
              mode="outlined"
              ref={keynoteRef}
              theme={{ roundness: 12 }}
              style={{ width: "100%", height: 200, marginBottom: 10, backgroundColor: 'white' }}
              activeOutlineColor="#6077F5"
              outlineColor="#E2E8F0"
              multiline
              value={keyNoteInput}
              onChangeText={setKeyNoteInput}
              placeholder="Enter Key Note"
              textColor="black"
              returnKeyType="done"
              onKeyPress={(e) => {
                if (e.nativeEvent.key == 'Enter') { e.preventDefault(); keynoteRef.current?.blur() }
              }}
            />
          </View>
          <View className="flex-1 justify-end pb-8">
            <Button
              mode="contained"
              buttonColor="#6077F5"
              textColor="white"
              theme={{ roundness: 12 }}
              onPress={() => {
                if (keyNotes.length < 1 && keyNoteInput) {
                  setKeyNotes([keyNoteInput])
                } else if (keyNoteInput) {
                  setKeyNotes([...keyNotes, keyNoteInput])
                }

                setKeyNoteInput("")
                setKeyNoteModal(false)
              }}
              style={{ width: "60%", alignSelf: 'center', height: 50, justifyContent: 'center' }}
              labelStyle={{ fontSize: 16, fontWeight: '600' }}
            >
              Confirm
            </Button>
          </View>
        </Modal>
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

export default UploadEventLectures;
