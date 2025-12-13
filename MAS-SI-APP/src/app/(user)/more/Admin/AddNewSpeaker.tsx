import { View, Text, TouchableOpacity, Image, Pressable, FlatList, Alert, ScrollView, KeyboardAvoidingView, useWindowDimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import { Link, router, Stack } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import Toast from 'react-native-toast-message'
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer'
import { TextInput } from 'react-native-paper'

const AddNewSpeaker = () => {
  const [speakerName, setSpeakerName] = useState('')
  const [speakerImg, setSpeakerImg] = useState<ImagePicker.ImagePickerAsset>()
  const [creds, setCreds] = useState<string[]>([])
  const [newCred, setNewCred] = useState<string>('')
  const [pressAddCred, setPressAddCred] = useState(false)
  const layoutHeight = useWindowDimensions().height
  const [submitDisabled, setSubmitDisabled] = useState(true)
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

      setSpeakerImg(img);
    }
  };
  const handleSubmit = () => {
    setSpeakerName('')
    setSpeakerImg(undefined)
    setCreds([])
    setNewCred('')
    setPressAddCred(false)
    Toast.show({
      type: "success",
      text1: "Speaker added",
      position: "top",
      topOffset: 50,
      visibilityTime: 2000,
    });
  }
  const UploadNewSpeaker = async () => {
    if (speakerName && speakerImg) {
      setSubmitDisabled(false)
      const base64 = await FileSystem.readAsStringAsync(speakerImg.uri, { encoding: 'base64' });
      const filePath = `${speakerName.trim().split(" ").join("_")}.${speakerImg.type === 'image' ? 'png' : 'mp4'}`;
      const contentType = speakerImg.type === 'image' ? 'image/png' : 'video/mp4';
      const { data: image, error: image_upload_error } = await supabase.storage.from('sheikh_img').upload(filePath, decode(base64));
      if (image) {
        const { data: speaker_img_url } = await supabase.storage.from('sheikh_img').getPublicUrl(image?.path)
        const { error } = await supabase.from('speaker_data').insert({ speaker_name: speakerName, speaker_img: speaker_img_url.publicUrl, speaker_creds: creds })
        if (error) {
          console.log(error)
        }
        handleSubmit()
        setSubmitDisabled(true)
        router.back()
      } else {
        Alert.alert(image_upload_error.message)
        return
      }
    } else {
      Alert.alert('Please Fill All Info Before Proceeding')
    }
  }
  return (
    <View className='flex-1 bg-gray-50'>
      <Stack.Screen
        options={{
          title: "Add New Speaker & Sheik Info",
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
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} style={{ paddingBottom: 30 }}>
        {/* Upload Image Card */}
        <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
          <Text className='text-base font-bold mb-3 text-gray-800'>Upload Speaker Image</Text>
          <Pressable
            className={`${!speakerImg ? 'border-2 border-dotted border-blue-300 bg-blue-50' : 'bg-gray-50'} items-center justify-center self-center rounded-xl py-8`}
            style={{ width: '100%' }}
            onPress={pickImage}
          >
            {speakerImg ? (
              <View className='items-center'>
                <Image src={speakerImg.uri} style={{ width: 120, height: 120, borderRadius: 60 }} />
                <View className="bg-blue-50 px-3 py-1 rounded-lg mt-3">
                  <Text className="text-blue-600 text-sm font-medium">Tap to change</Text>
                </View>
              </View>
            ) : (
              <View className='items-center'>
                <Svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <Path d="M30 20L30 40" stroke="#6077F5" strokeWidth="2" strokeLinecap="round" />
                  <Path d="M40 30L20 30" stroke="#6077F5" strokeWidth="2" strokeLinecap="round" />
                </Svg>
                <Text className='text-blue-600 font-medium mt-2'>Tap to upload photo</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Name Card */}
        <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
          <Text className='text-base font-bold mb-3 text-gray-800'>Title & Full Name</Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 12 }}
            style={{ width: "100%", height: 50, backgroundColor: 'white' }}
            activeOutlineColor="#6077F5"
            outlineColor="#E2E8F0"
            value={speakerName}
            onChangeText={setSpeakerName}
            placeholder="Enter the name..."
            textColor="black"
          />
        </View>

        {/* Credentials Card */}
        <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
          <Text className='text-base font-bold mb-3 text-gray-800'>Credentials</Text>

          {/* Current Credentials */}
          {creds.length > 0 ? (
            <View className='mb-3'>
              <Text className="text-xs text-gray-500 mb-2">{creds.length} Credential(s) Added:</Text>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {creds.map((item, index) => (
                  <Pressable
                    key={index}
                    onPress={() => {
                      const removeFromCred = creds.filter(cred => cred !== item)
                      setCreds(removeFromCred)
                    }}
                    className='bg-blue-50 px-3 py-3 rounded-lg flex-row items-center justify-between mb-2'
                  >
                    <Text className='text-blue-800 font-medium flex-1 mr-2'>{item}</Text>
                    <View className='bg-red-100 w-6 h-6 rounded-full items-center justify-center'>
                      <Text className='text-red-600 font-bold text-sm'>×</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View className='bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3'>
              <Text className="text-gray-400 text-center">No credentials added yet</Text>
            </View>
          )}
          {/* Add Credential Form */}
          {pressAddCred ? (
            <KeyboardAvoidingView behavior='position' keyboardVerticalOffset={layoutHeight * .25}>
              <View className='bg-gray-50 rounded-xl p-4'>
                <Text className="text-sm font-semibold text-gray-700 mb-3">Add New Credential</Text>
                <TextInput
                  mode="outlined"
                  theme={{ roundness: 12 }}
                  style={{ width: "100%", height: 50, marginBottom: 12, backgroundColor: 'white' }}
                  activeOutlineColor="#6077F5"
                  outlineColor="#E2E8F0"
                  value={newCred}
                  onChangeText={setNewCred}
                  placeholder="Enter new credential..."
                  textColor="black"
                />
                <View className='flex-row gap-3'>
                  <Pressable
                    className='bg-gray-200 px-4 py-3 rounded-xl flex-1'
                    onPress={() => { setPressAddCred(false); setNewCred('') }}
                  >
                    <Text className='text-gray-700 font-semibold text-center'>Cancel</Text>
                  </Pressable>
                  <Pressable
                    className='bg-blue-500 px-4 py-3 rounded-xl flex-1'
                    onPress={() => {
                      if (newCred.trim()) {
                        setCreds(prev => [...prev, newCred.trim()])
                        setNewCred('')
                      }
                      setPressAddCred(false)
                    }}
                  >
                    <Text className='text-white font-semibold text-center'>Add</Text>
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          ) : (
            <Pressable
              className='bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-4 items-center'
              onPress={() => setPressAddCred(true)}
            >
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path d="M12 5V19M5 12H19" stroke="#6077F5" strokeWidth="2" strokeLinecap="round" />
              </Svg>
              <Text className='text-blue-600 font-medium mt-2'>Add Credential</Text>
            </Pressable>
          )}
        </View>

        {/* Submit Button */}
        {!pressAddCred && (
          <View className='px-0 mb-8'>
            <Pressable
              className={`px-6 py-4 rounded-xl ${submitDisabled ? 'bg-blue-500' : 'bg-gray-300'}`}
              disabled={!submitDisabled}
              onPress={async () => await UploadNewSpeaker()}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2
              }}
            >
              <Text className={`font-semibold text-center text-lg ${submitDisabled ? 'text-white' : 'text-gray-500'}`}>
                Confirm New Speaker
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default AddNewSpeaker