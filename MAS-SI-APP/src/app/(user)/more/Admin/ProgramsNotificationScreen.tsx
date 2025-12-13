import { Image, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { Link, router, Stack, useLocalSearchParams } from "expo-router";
import { Button, Modal, Portal, TextInput } from "react-native-paper";
import { supabase } from "@/src/lib/supabase";
import Svg, { Path } from "react-native-svg";
import { BlurView } from "expo-blur";

const ProgramsEventNotificationScreen = () => {
  const { program_id, has_lecture, program_name, program_img } = useLocalSearchParams();
  const [notificationMessage, setNotificationMessage] = useState("");
  const [users, setUsers] = useState<any>([])
  const [previewModal, setPreviewModal] = useState(false);
  const [hasLectures, sethasLectures] = useState(has_lecture == 'true')
  const [keyboardOffset, setKeyboardOffset] = useState(200)
  const characterLimit = 255;
  const totalUsers = 100;
  const scrollViewRef = useRef<ScrollView>()
  const getUsers = async () => {
    const { data: users, error } = await supabase.from('added_notifications_programs').select('*').eq('program_id', program_id)
    if (users) {
      setUsers(users)
    }
    if (error) {
      console.log('error', error)
    }
  }

  const hideModal = () => setPreviewModal(false);
  const sendNotification = async () => {
    setPreviewModal(!previewModal), setNotificationMessage(""); await onSend();
  };

  const onSend = async () => {
    const notification_batch: any[] = []
    await Promise.all(
      users.map(async (user) => {
        const { data: profile, error } = await supabase.from('profiles').select('push_notification_token').eq('id', user.user_id).not('push_notification_token', 'is', null).single()
        if (profile) {
          profile['message'] = notificationMessage
          profile['title'] = program_name
          notification_batch.push(profile)
        }
      })
    )
    if (notification_batch.length > 0) {
      const { error } = await supabase.functions.invoke('send-prayer-notification', { body: { notifications_batch: notification_batch } })
      if (error) {
        console.log(error)
      }
    }
  }
  useEffect(() => {
    getUsers()
  }, [])
  return (
    <>
      <Stack.Screen
        options={{
          title: "Create Program Notification",
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

      <View
        style={{
          paddingHorizontal: 10,
          backgroundColor: '#F9FAFB'
        }}
      >

        <ScrollView contentContainerStyle={{ paddingBottom: 30 }} className="h-[100%] " ref={scrollViewRef}
          onScroll={(e) => {
            setKeyboardOffset(200 - e.nativeEvent.contentOffset.y)
          }}
        >
          <Image
            src={program_img}
            className="h-[250] w-[250] rounded-[15px] self-center my-4"
          />

          <Text className="text-center text-gray-600 mb-2">Only Users With This Program Added to their Notification Center Will Get The Notification</Text>

          <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
            <Text className="text-base font-bold mb-3 text-gray-800">Notification Message</Text>
            <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={keyboardOffset}>
              <TextInput
                mode="outlined"
                value={notificationMessage}
                onChangeText={(text) => {
                  if (text.length <= characterLimit) setNotificationMessage(text);
                }}
                theme={{ roundness: 12 }}
                style={{
                  height: 150,
                  width: "100%",
                  backgroundColor: "white",
                }}
                activeOutlineColor="#6077F5"
                outlineColor="#E2E8F0"
                placeholder="Enter your message here"
                textColor="black"
                multiline
              />
              <Text className="text-right text-gray-500 text-xs mt-2">{`${notificationMessage.length}/${characterLimit} characters`}</Text>
            </KeyboardAvoidingView>
          </View>

          <Pressable
            onPress={() => setPreviewModal(true)}
            className="h-[45px] items-center justify-center mb-6 bg-[#6077F5] rounded-xl self-center w-[50%]"
          >
            <Text className="text-white font-semibold text-base">Preview</Text>
          </Pressable>

          <Portal>
            <Modal
              visible={previewModal}
              onDismiss={hideModal}
              contentContainerStyle={{
                height: "55%",
                width: '95%',
                borderRadius: 10,
                backgroundColor: "white",
                alignSelf: "center",
                alignItems: "center",
                justifyContent: "flex-start",
                paddingTop: "5%",
                paddingHorizontal: "2%",
              }}
            >
              <View className="">
                <Text className="font-bold text-3xl">Preview Notification </Text>
                <View className="rounded-[20px] overflow-hidden w-[340px] mt-4">
                  <BlurView
                    style={{
                      width: 340,
                      borderRadius: 20,
                      padding: "3%",
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#959595",
                    }}
                    intensity={50}
                  >
                    <Image
                      source={
                        require('@/assets/images/MASsplash.png')
                      }
                      className="h-11 w-11 rounded-xl "
                    />
                    <View className="px-2">
                      <View style={{ width: '92%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} className="">
                        <Text className="text-md font-bold text-white " numberOfLines={1}>{program_name}</Text>
                        <Text className="text-gray-800 " adjustsFontSizeToFit numberOfLines={1}>Now</Text>
                      </View>
                      <View style={{ width: '90%' }} >
                        <Text numberOfLines={2} className="text-base text-white">{notificationMessage}</Text>
                      </View>
                    </View>
                  </BlurView>
                </View>
                <Text className="self-end mt-1 font-bold">
                  Total Users: {users.length}
                </Text>
                <View className="self-center">
                  <Button
                    mode="contained"
                    buttonColor="#6077F5"
                    textColor="white"
                    className="w-[300] h-15 mt-8"
                    onPress={sendNotification}
                  >
                    Send
                  </Button>
                </View>
              </View>
            </Modal>
          </Portal>
        </ScrollView>
      </View>
    </>
  );
};

export default ProgramsEventNotificationScreen;

const styles = StyleSheet.create({});


/* 
    {
    hasLectures &&  
    (<>
    <Text className="text-xl mt-4"> Upload Program Lecture</Text>
      <Link  href={{
        pathname : '/(user)/more/Admin/UploadProgramLectures',
        params : { program_id : program_id, }
        }} asChild >
          <TouchableOpacity className="bg-[#57BA47] w-[35%] px-3 py-2  my-2 rounded-md">
            <Text className="font-bold text-sm text-white">Upload Lecture</Text>
          </TouchableOpacity>
      </Link>
     

      <Text className="text-xl mt-4"> Update Existing Program Lecture</Text>
      <Link  href={{
        pathname : '/(user)/more/Admin/ProgramLecturesScreen',
        params : { program_id : program_id, }
        }} asChild >
          <TouchableOpacity className="bg-[#57BA47] w-[35%] items-center py-2  my-2 rounded-md">
            <Text className="font-bold text-sm text-white">Update</Text>
          </TouchableOpacity>
      </Link>
      </>)
      }

        <Text className="text-xl mt-4"> Update Program</Text>
      <Link  href={{
        pathname : '/(user)/more/Admin/UpdateProgramScreen',
        params : { program_id : program_id, }
        }} asChild >
          <TouchableOpacity className="bg-[#57BA47] w-[35%] items-center py-2  my-2 rounded-md">
            <Text className="font-bold text-sm text-white">Update</Text>
          </TouchableOpacity>
      </Link>

*/