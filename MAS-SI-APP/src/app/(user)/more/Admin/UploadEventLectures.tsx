import React, { useState } from "react";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { TextInput, Button, Menu } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { Stack, useLocalSearchParams } from "expo-router";
import moment from "moment";
import { supabase } from "@/src/lib/supabase";

const UploadEventLectures = () => {
  const { event_id } = useLocalSearchParams();
  const [lectureEvent, setLectureEvent] = useState<string | null>(null);
  const [lectureName, setLectureName] = useState<string>("");
  const [lectureSpeaker, setLectureSpeaker] = useState<string>("");
  const [lectureLink, setLectureLink] = useState<string>("");
  const [lectureAI, setLectureAI] = useState<string>("");
  const [lectureDate, setLectureDate] = useState<Date | null>(null);
  const [lectureTime, setLectureTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);

  const events = ["Event A", "Event B", "Event C"];

  const handleSubmit = () => {
    if (!lectureEvent || !lectureName || !lectureSpeaker || !lectureLink || !lectureDate || !lectureTime) {
      Toast.show({
        type: "error",
        text1: "All fields are required!",
        position: "top",
        topOffset: 50,
      });
      return;
    }

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
    setLectureTime(null);
  };

  const onUploadLecture = async () => {
    if (!lectureName || !lectureSpeaker || !lectureLink || !lectureDate || !lectureTime) {
      Toast.show({
        type: "error",
        text1: "All fields are required!",
        position: "top",
        topOffset: 50,
      });
      return;
    }else{
      const { error } = await supabase.from('events_lectures').insert({ lecture_program : event_id, lecture_name : lectureName, lecture_speaker : lectureSpeaker, lecture_link : lectureLink, lectureDate : lectureDate,lecture_time : lectureTime})
      handleSubmit()
    }
  }
  
  return (
    <>
      <Stack.Screen
        options={{
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: "white" },
          headerTintColor : 'black',
          title: "Upload Lecture",
        }}
      />
      <View style={{ padding: 16, backgroundColor : 'white', flex : 1 }}>
        <ScrollView
          contentContainerStyle={{ }}
          showsVerticalScrollIndicator={false}
        >

          <Text className="text-base font-bold mb-1 ml-2">Lecture Title</Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 45, marginBottom: 10, backgroundColor : 'white' }}
            activeOutlineColor="#0D509D"
            value={lectureName}
            onChangeText={setLectureName}
            placeholder="Enter Lecture Title"
            textColor="black"
          />

          <Text className="text-base font-bold mb-1 ml-2">Lecture Speaker</Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 45, marginBottom: 10,  backgroundColor : 'white' }}
            activeOutlineColor="#0D509D"
            value={lectureSpeaker}
            onChangeText={setLectureSpeaker}
            placeholder="Enter Speaker Name"
            textColor="black"
          />

          <Text className="text-base font-bold mb-1 ml-2">Lecture Link</Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 45, marginBottom: 10,  backgroundColor : 'white' }}
            activeOutlineColor="#0D509D"
            value={lectureLink}
            onChangeText={setLectureLink}
            placeholder="Enter YouTube Video ID"
            textColor="black"
          />

          <Text className="text-base font-bold mb-1 ml-2">Lecture AI Notes</Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 100, marginBottom: 10 }}
            activeOutlineColor="#0D509D"
            multiline
            value={lectureAI}
            onChangeText={setLectureAI}
            placeholder="Enter AI Notes or Comments"
            textColor="black"
          />

          {/* Lecture Date */}
          <Text className="text-base font-bold mb-1 ml-2">Lecture Date</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={{
              backgroundColor: "#57BA47",
              padding: 10,
              borderRadius: 5,
              marginBottom: 10,
              width: "100%",
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>
              {lectureDate ? moment(lectureDate).format("MM/DD/YYYY") : "Select Date"}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setLectureDate(date);
              }}
            />
          )}

          {/* Lecture Time */}
          <Text className="text-base font-bold mb-1 ml-2">Lecture Time</Text>
          <TouchableOpacity
            onPress={() => setShowTimePicker(true)}
            style={{
              backgroundColor: "#57BA47",
              padding: 10,
              borderRadius: 5,
              marginBottom: 10,
              width: "100%",
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>
              {lectureTime ? moment(lectureTime).format("hh:mm A") : "Select Time"}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display="default"
              onChange={(event, time) => {
                setShowTimePicker(false);
                if (time) setLectureTime(time);
              }}
            />
          )}

          {/* Buttons */}
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Button
              mode="contained"
              buttonColor="#57BA47"
              textColor="white"
              theme={{ roundness: 1 }}
              onPress={async () => await onUploadLecture()}
              style={{ width: "48%" }}
            >
              Upload Lecture
            </Button>
          </View>
        </ScrollView>
      </View>
    </>
  );
};

export default UploadEventLectures;
