import { View, Text, Pressable, FlatList, ScrollView, Image, Alert, KeyboardAvoidingView, useWindowDimensions } from 'react-native'
import React, { useState } from 'react'
import { Dialog, TextInput } from 'react-native-paper';
import Svg, { Circle, Path } from 'react-native-svg'
import { supabase } from '@/src/lib/supabase';
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import Toast from 'react-native-toast-message';

const AddSpeakerModal = ( { isOpen, setIsOpen } : { isOpen : boolean , setIsOpen : ( isOpen : boolean) => void }  ) => {
  const hideDialog = () => setIsOpen(false);
  const [ speakerName, setSpeakerName ] = useState('')
  const [ speakerImg, setSpeakerImg ] = useState<ImagePicker.ImagePickerAsset>()
  const [ creds , setCreds ] = useState<string[]>([])
  const [ newCred, setNewCred ] = useState<string>('')
  const [ pressAddCred, setPressAddCred ] = useState(false) 
  const layoutHeight = useWindowDimensions().height
  const [ submitDisabled, setSubmitDisabled ] = useState(true)
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
    setIsOpen(false)
    Toast.show({
        type: "success",
        text1: "Speaker added",
        position: "top",
        topOffset: 50,
        visibilityTime: 2000,
      });
  }
   const UploadNewSpeaker = async () => {
        if ( speakerName && speakerImg ) {
            setSubmitDisabled(false)
            const base64 = await FileSystem.readAsStringAsync(speakerImg.uri, { encoding: 'base64' });
            const filePath = `${speakerName.trim().split(" ").join("_")}.${speakerImg.type === 'image' ? 'png' : 'mp4'}`;
            const contentType = speakerImg.type === 'image' ? 'image/png' : 'video/mp4';
            const { data : image, error :image_upload_error } = await supabase.storage.from('sheikh_img').upload(filePath, decode(base64));
            if( image ){
              const { data : speaker_img_url} = await supabase.storage.from('sheikh_img').getPublicUrl(image?.path)
              const { error } = await supabase.from('speaker_data').insert({ speaker_name : speakerName, speaker_img : speaker_img_url.publicUrl, speaker_creds : creds })
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
  return (
    <Dialog visible={isOpen} onDismiss={hideDialog} style={{ backgroundColor : "white", height : '80%', marginTop : 72.9}}>
        <Dialog.Content className='h-[100%]'>
            <ScrollView 
                className="px-4" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {/* Header */}
                <View className="mb-6">
                    <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                            <Text className='text-xl font-bold text-gray-900 mb-2'>Add New Speaker</Text>
                            <Text className='text-sm text-gray-600'>Create a speaker profile with photo and credentials</Text>
                        </View>
                        <Pressable 
                            onPress={hideDialog}
                            className="w-10 h-10 items-center justify-center rounded-full bg-red-100"
                        >
                            <Text className="text-red-600 text-xl font-bold">×</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Image Upload Section */}
                <View className="mb-6">
                    <Text className='text-lg font-semibold text-gray-700 mb-3'>Speaker Photo</Text>
                    <Pressable 
                        className={`items-center justify-center rounded-xl p-6 ${
                            !speakerImg 
                                ? 'bg-gray-50 border-2 border-dashed border-gray-300' 
                                : 'bg-white'
                        }`} 
                        onPress={pickImage}
                    >
                        {speakerImg ? (
                            <View className="items-center">
                                <Image 
                                    source={{ uri: speakerImg.uri }} 
                                    style={{width: 100, height: 100, borderRadius: 50}}
                                />
                                <View className="bg-blue-50 px-3 py-1 rounded-lg mt-2">
                                    <Text className="text-blue-600 text-sm font-medium">Tap to change</Text>
                                </View>
                            </View>
                        ) : (
                            <View className="items-center">
                                <Svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                                    <Circle cx="25" cy="25" r="23" stroke="#9CA3AF" strokeWidth="2"/>
                                    <Path d="M25 18L25 32" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                                    <Path d="M18 25L32 25" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                                </Svg>
                                <Text className="text-gray-500 text-sm font-medium mt-2">Tap to upload photo</Text>
                            </View>
                        )}
                    </Pressable>
                </View>

                {/* Name Input */}
                <View className="mb-6">
                    <Text className='text-lg font-semibold text-gray-700 mb-3'>Full Name</Text>
                    <TextInput
                        mode="outlined"
                        theme={{ roundness: 12 }}
                        style={{ backgroundColor: 'white', fontSize: 16 }}
                        activeOutlineColor="#6077F5"
                        value={speakerName}
                        onChangeText={setSpeakerName}
                        placeholder="Enter speaker's full name..."
                        textColor="black"
                    />
                </View>

                {/* Credentials Section */}
                <View className="mb-6">
                    <Text className='text-lg font-semibold text-gray-700 mb-3'>Credentials</Text>
                    
                    {/* Current Credentials */}
                    {creds.length > 0 && (
                        <View className="mb-4">
                            <Text className="text-xs text-gray-500 mb-2">{creds.length} Credential(s) Added:</Text>
                            <View className="space-y-2">
                                {creds.map((item, index) => (
                                    <View key={index} className="bg-blue-50 px-3 py-2 rounded-lg flex-row items-center justify-between">
                                        <Text className="text-blue-800 font-medium flex-1 mr-2 text-sm">{item}</Text>
                                        <Pressable 
                                            onPress={() => {
                                                const removeFromCred = creds.filter(cred => cred !== item);
                                                setCreds(removeFromCred);
                                            }}
                                            className="bg-red-100 w-6 h-6 rounded-full items-center justify-center"
                                        >
                                            <Text className="text-red-600 font-bold text-sm">×</Text>
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Credentials Container */}
                    <View className='bg-gray-50 border border-gray-200 rounded-xl p-3 min-h-[100px]'>
                        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                            {creds.length === 0 && (
                                <Text className="text-gray-400 text-center py-4">No credentials added yet</Text>
                            )}
                        </ScrollView>
                    </View>
                </View>
                {/* Add Credential Section */}
                {pressAddCred ? (
                    <KeyboardAvoidingView behavior='position' keyboardVerticalOffset={layoutHeight * .25}>
                        <View className='bg-gray-50 rounded-xl p-4 mb-4'>
                            <Text className="text-sm font-semibold text-gray-700 mb-3">Add New Credential</Text>
                            <TextInput
                                mode="outlined"
                                theme={{ roundness: 12 }}
                                style={{ backgroundColor: 'white', marginBottom: 12 }}
                                activeOutlineColor="#6077F5"
                                value={newCred}
                                onChangeText={setNewCred}
                                placeholder="Enter new credential..."
                                textColor="black"
                            />
                            <View className='flex-row gap-3'>
                                <Pressable 
                                    className='bg-gray-200 px-4 py-3 rounded-xl flex-1'
                                    onPress={() => { 
                                        setPressAddCred(false); 
                                        setNewCred(''); 
                                    }}
                                >
                                    <Text className='text-gray-700 font-semibold text-center'>Cancel</Text>
                                </Pressable>
                                <Pressable 
                                    className='bg-green-500 px-4 py-3 rounded-xl flex-1'
                                    onPress={() => {
                                        if (newCred.trim()) {
                                            setCreds(prev => [...prev, newCred.trim()]);
                                            setNewCred('');
                                        }
                                        setPressAddCred(false);
                                    }}
                                >
                                    <Text className='text-white font-semibold text-center'>Add</Text>
                                </Pressable>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                ) : (
                    <Pressable 
                        className='bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-4 items-center mb-6'
                        onPress={() => setPressAddCred(true)}
                    >
                        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <Path d="M12 5V19M5 12H19" stroke="#6077F5" strokeWidth="2" strokeLinecap="round"/>
                        </Svg>
                        <Text className='text-blue-600 font-medium mt-2'>Add Credential</Text>
                    </Pressable>
                )}

                {/* Submit Button */}
                {!pressAddCred && (
                    <Pressable 
                        className={`px-6 py-4 rounded-xl ${
                            submitDisabled 
                                ? 'bg-gray-300' 
                                : 'bg-green-500'
                        }`}
                        onPress={async () => await UploadNewSpeaker()}
                        disabled={!submitDisabled}
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 2
                        }}
                    >
                        <Text className={`font-semibold text-center text-lg ${
                            submitDisabled ? 'text-gray-500' : 'text-white'
                        }`}>
                            Add Speaker
                        </Text>
                    </Pressable>
                )}
            </ScrollView>
        </Dialog.Content>
    </Dialog>
  )
}

export default AddSpeakerModal