import { View, Text, Pressable, Image, ScrollView, KeyboardAvoidingView, useWindowDimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import Svg, { Path } from 'react-native-svg'
import { TextInput } from 'react-native-paper'
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message'
import { decode } from 'base64-arraybuffer'
const handleSubmit = () => {
    Toast.show({
        type: "success",
        text1: "Speaker/Sheik Successfully Updated",
        position: "top",
        topOffset: 50,
        visibilityTime: 2000,
    });
};
const EditSpeakerInfo = () => {
    const { speaker_id, speaker_name, speaker_img, speaker_creds } = useLocalSearchParams<{ speaker_id: string, speaker_name: string, speaker_img: string, speaker_creds: string[] }>()
    const [speakerName, setSpeakerName] = useState<string>(speaker_name as string)
    const [speakerCreds, setSpeakerCreds] = useState<string[]>()
    const [speakerImg, setSpeakerImg] = useState<string>(speaker_img as string)
    const [uploadedImg, setUploadedImg] = useState<ImagePicker.ImagePickerAsset>()
    const [newCred, setNewCred] = useState<string>('')
    const [pressAddCred, setPressAddCred] = useState(false)
    const layoutHeight = useWindowDimensions().height
    const getCreds = async () => {
        const { data, error } = await supabase.from('speaker_data').select('speaker_creds').eq('speaker_id', speaker_id).single()
        if (data?.speaker_creds) {
            setSpeakerCreds(data.speaker_creds)
        }
    }
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

            setUploadedImg(img);
        }
    };

    const onUpdate = async () => {
        if (uploadedImg) {
            const base64 = await FileSystem.readAsStringAsync(uploadedImg.uri, { encoding: 'base64' });
            if (speakerName == speaker_name) {
                const filePath = `${speakerName.trim().split(" ").join("_")}.${uploadedImg.type === 'image' ? 'png' : 'mp4'}`;
                const { data: image, error: image_upload_error } = await supabase.storage.from('sheikh_img').update(filePath, decode(base64));
                const { error } = await supabase.from('speaker_data').update({ speaker_name: speakerName, speaker_creds: speakerCreds }).eq('speaker_id', speaker_id)
                handleSubmit()
                router.back()
                return
            }
            const filePath = `${speakerName.trim().split(" ").join("_")}.${uploadedImg.type === 'image' ? 'png' : 'mp4'}`;
            const { error: remove } = await supabase.storage.from('sheikh_img').remove([`${speaker_name.trim().split(" ").join("_")}.png`]);
            const { data: image, error: image_upload_error } = await supabase.storage.from('sheikh_img').upload(filePath, decode(base64));
            if (image) {
                const { data: speakerimage } = await supabase.storage.from('sheikh_img').getPublicUrl(image?.path)
                const { error } = await supabase.from('speaker_data').update({ speaker_name: speakerName, speaker_creds: speakerCreds, speaker_img: speakerimage }).eq('speaker_id', speaker_id)
            }
        }
        if (speakerCreds && speakerName) {
            const { error } = await supabase.from('speaker_data').update({ speaker_name: speakerName, speaker_creds: speakerCreds }).eq('speaker_id', speaker_id)
            handleSubmit()
        }
        return
    }
    useEffect(() => {
        getCreds()
    }, []);
    return (
        <View className='flex-1 bg-gray-50' style={{ paddingBottom: 30 }}>
            <Stack.Screen
                options={{
                    title: "Edit Speaker & Sheik Info",
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
            <View className='px-4'>
                <Text className='font-bold text-black text-lg my-1'>Upload Speaker Image </Text>
                <Pressable className={`max-h-[20%] w-[90%] ${!speakerImg ? 'border-2 border-dotted border-[#6077F5]' : ' my-3'} items-center justify-center self-center rounded-[15px]`} onPress={pickImage}>
                    {
                        uploadedImg ?
                            <Image src={uploadedImg.uri} style={{ width: 110, height: 110, borderRadius: 50 }} />
                            :
                            speakerImg ?
                                <Image src={speakerImg as string} style={{ width: 110, height: 110, borderRadius: 50 }} />
                                :
                                <Svg width="55" height="55" viewBox="0 0 55 55" fill="none">
                                    <Path d="M27.5 18.3333L27.5 36.6666" stroke="#6077F5" stroke-linejoin="round" />
                                    <Path d="M36.668 27.5L18.3346 27.5" stroke="#6077F5" stroke-linejoin="round" />
                                </Svg>
                    }
                </Pressable>

                <Text className='font-bold text-gray-800 text-md my-1'>Title & Full Name</Text>
                <TextInput
                    mode="outlined"
                    theme={{ roundness: 12 }}
                    style={{ width: "100%", height: 50, marginBottom: 10, backgroundColor: 'white' }}
                    activeOutlineColor="#6077F5"
                    outlineColor="#E2E8F0"
                    value={speakerName}
                    onChangeText={setSpeakerName}
                    placeholder="Enter the name..."
                    textColor="black"
                />

                <Text className='font-bold text-gray-800 text-md my-1'>Credentials</Text>
                <View className='max-h-[32%] border border-gray-300 border-solid rounded-xl p-4 bg-white'>
                    <ScrollView contentContainerStyle={{}}>
                        {
                            speakerCreds ? speakerCreds?.map((item, index) => (
                                <View key={index} className='flex-row items-center justify-between py-2 border-b border-gray-200'>
                                    <Text numberOfLines={3} className='flex-1 text-gray-800'>• {item}</Text>
                                    <Pressable
                                        onPress={() => {
                                            const removeFromCred = speakerCreds.filter(cred => cred != item)
                                            setSpeakerCreds(removeFromCred)
                                        }}
                                        className='ml-2 bg-red-100 w-7 h-7 rounded-full items-center justify-center'
                                    >
                                        <Text className='text-red-600 font-bold text-lg'>×</Text>
                                    </Pressable>
                                </View>
                            )) : <></>
                        }
                    </ScrollView>
                </View>
                {
                    pressAddCred && (
                        <KeyboardAvoidingView behavior='position' keyboardVerticalOffset={layoutHeight * .25}>
                            <View className='bg-white h-[100] mt-2'>
                                <TextInput
                                    mode="outlined"
                                    theme={{ roundness: 12 }}
                                    style={{ width: "100%", height: 50, marginBottom: 10, backgroundColor: 'white' }}
                                    activeOutlineColor="#6077F5"
                                    outlineColor="#E2E8F0"
                                    value={newCred}
                                    onChangeText={setNewCred}
                                    placeholder="Enter new credential..."
                                    textColor="black"
                                />

                                <View className='flex flex-row items-center justify-between w-[100%] gap-3'>
                                    <Pressable className='bg-gray-300 flex-1 h-[40px] items-center justify-center rounded-xl' onPress={() => { setPressAddCred(false); setNewCred('') }}>
                                        <Text className='text-gray-700 font-semibold'>Cancel</Text>
                                    </Pressable>
                                    <Pressable className='bg-[#6077F5] flex-1 h-[40px] items-center justify-center rounded-xl' onPress={() => { setPressAddCred(false); setSpeakerCreds(prev => prev ? [...prev, newCred] : [newCred]); setNewCred('') }}>
                                        <Text className='font-semibold text-white'>Confirm</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    )
                }
                <Text className='text-blue-600 underline self-center my-2' onPress={() => { pressAddCred != true && setPressAddCred(true) }}>
                    {
                        pressAddCred ? '' : 'Add Credentials'
                    }
                </Text>


                {
                    !pressAddCred &&
                    <Pressable className='bg-[#6077F5] w-[70%] h-[45px] items-center justify-center rounded-xl self-center my-10' onPress={async () => await onUpdate()}>
                        <Text className='font-semibold text-white text-base'>Confirm Speaker Updates</Text>
                    </Pressable>
                }
            </View>
        </View>
    )
}

export default EditSpeakerInfo