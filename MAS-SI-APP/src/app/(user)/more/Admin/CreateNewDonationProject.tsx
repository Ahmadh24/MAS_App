import { View, Text, Pressable, FlatList, Image, ScrollView, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Link, router, Stack } from 'expo-router'
import Svg, { Circle, Path } from 'react-native-svg'
import { supabase } from '@/src/lib/supabase'
import { Icon, TextInput } from 'react-native-paper'
import { format, set } from 'date-fns'
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from "expo-image-picker";
import { decode } from 'base64-arraybuffer'
import Toast from 'react-native-toast-message'

const CreateNewDonationProject = () => {
  const [projects, setProjects] = useState<any[]>()
  const [title, setTitle] = useState('')
  const [hasBarGraph, setHasBarGraph] = useState<boolean>(false)
  const [amount, setAmount] = useState('')
  const [thumbnail, setThumbnail] = useState<ImagePicker.ImagePickerAsset>();
  const [gallery, setGallery] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [projectLinkedTo, setProjectLinkedTo] = useState<{ project_id: string, project_name: string }>()
  const [donation, setDonation] = useState<number | undefined>()
  const showToast = () => {
    Toast.show({
      type: 'success', // You can customize the type (success, error, info, etc.)
      text1: 'New Donation Project Uploaded!',
    });
  };
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

      setThumbnail(img);
    }
  };

  const addToGallery = async () => {
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

      if (gallery.length > 0) {
        setGallery(prev => [...prev, img]);
      }
      else {
        setGallery([img])
      }
    }
  }

  function handleSubmit() {
    setAmount('')
    setThumbnail(undefined)
    setGallery([])
    setHasBarGraph(false)
    setTitle('')

  }

  const onSubmit = async () => {
    if (title && thumbnail && hasBarGraph) {
      // Upload new project with title and thumbnail and donation goal
      const base64 = await FileSystem.readAsStringAsync(thumbnail.uri, { encoding: 'base64' });
      const filePath = `${title.trim()}.${thumbnail.type === 'image' ? 'png' : 'mp4'}`;
      const contentType = thumbnail.type === 'image' ? 'image/png' : 'video/mp4';
      const { data: image, error: image_upload_error } = await supabase.storage.from('fliers').upload(filePath, decode(base64));
      if (image) {
        const { data: project_img_url } = await supabase.storage.from('fliers').getPublicUrl(image?.path)
        const { error } = await supabase.from('projects').insert({ project_name: title, thumbnail: project_img_url.publicUrl, project_goal: Number(amount.replaceAll(',', '')), project_linked_to: projectLinkedTo ? projectLinkedTo.project_id : null })
        if (error) {
          console.log(error)
        }
        showToast()
        handleSubmit()
      } else {
        Alert.alert(image_upload_error.message)
        return
      }
    } else if (title && thumbnail && !hasBarGraph) {
      // Upload Project With Thumbnail, Return project_id to serve as root folder that holds all other gallery images in supabase storage 'fliers' folder
      const base64 = await FileSystem.readAsStringAsync(thumbnail.uri, { encoding: 'base64' });
      const filePath = `${title.trim()}.${thumbnail.type === 'image' ? 'png' : 'mp4'}`;
      const { data: image, error: image_upload_error } = await supabase.storage.from('fliers').upload(filePath, decode(base64));
      if (image) {
        const { data: program_img_url } = await supabase.storage.from('fliers').getPublicUrl(image?.path)
        const { data: project_id, error } = await supabase.from('projects').insert({ project_name: title, thumbnail: program_img_url.publicUrl, project_linked_to: projectLinkedTo ? projectLinkedTo.project_id : null }).select('project_id').single()
        if (project_id) {
          if (gallery && gallery.length > 0) {
            await Promise.all(
              gallery.map(async (pic, index) => {
                const base64 = await FileSystem.readAsStringAsync(pic.uri, { encoding: 'base64' });
                const filePath = `${project_id.project_id}/${index}.${pic.type === 'image' ? 'png' : 'mp4'}`;
                const contentType = pic.type === 'image' ? 'image/png' : 'video/mp4';
                const { data: image, error: image_upload_error } = await supabase.storage.from('fliers').upload(filePath, decode(base64));
                if (!image) {
                  Alert.alert(image_upload_error.message)
                  return
                }
              })
            )
          }
        }
        showToast()
        handleSubmit()
      }
    }
    else {
      Alert.alert('Fill in all inputs')
      return
    }
  }

  const handleAmountChange = (text: string) => {
    const cleanedValue = text.replace(/[^0-9]/g, '')
    const parsedValue = parseFloat(cleanedValue)

    if (!isNaN(parsedValue)) {
      setAmount(parsedValue.toLocaleString('en-usd'))
    } else {
      setAmount('')
    }
  }
  const getProjects = async () => {
    const { data, error } = await supabase.from('projects').select('*')
    if (data) {
      setProjects(data)
    }
  }
  const removeFromGallery = (pic: string | ImagePicker.ImagePickerAsset) => {
    if (typeof pic == 'string') {
      const FilterImageOut = gallery.filter(picurl => typeof picurl == 'string' ? picurl != pic : picurl)
      setGallery(FilterImageOut)
    } else {
      const FilterImageOut = gallery.filter(picid => typeof picid != 'string' ? picid.uri != pic.uri : picid)
      setGallery(FilterImageOut)
    }
  }
  useEffect(() => {
    getProjects()
  }, [])
  return (
    <View className='flex-1 bg-white pt-[170px] px-5' >
      <Stack.Screen
        options={{
          headerTransparent: true,
          header: () => (
            <View className="relative">
              <View className="h-[110px] w-[100%] rounded-br-[65px] bg-[#6077F5] items-start justify-end pb-[5%] z-[1]">
                <Pressable className="flex flex-row items-center justify-between w-[40%]" onPress={() => router.back()}>
                  <Svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                    <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="white" stroke-width="2" />
                  </Svg>
                  <Text className=" text-[25px] text-white">Donation</Text>
                </Pressable>
              </View>
              <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
                <View className="w-[72%] items-center">
                  <Text className=" text-[15px] text-black ">Create A New Category</Text>
                </View>
              </View>
            </View>
          )
        }}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} >
        <View className=''>
          <Text className='text-black font-bold text-lg mt-2'>Already Existing Categories</Text>
          <FlatList
            data={projects}
            renderItem={({ item }) => (
              <Pressable onPress={() => { }}
                className='flex flex-col mx-1 w-[154px]'
              >
                <Image src={item.thumbnail ? item.thumbnail : require('@/assets/images/MASsplash.png')} className='w-[154px] h-[138px] bg-gray-400 rounded-[15px] object-cover' />
                <Text numberOfLines={1} className='text-[10px] text-gray-400 text-center'>{item.project_name}</Text>
              </Pressable>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ gap: 8 }}
          />

        </View>

        <View className='flex flex-col w-[100%] px-5 mt-4'>

          <Pressable className='border-[#57BA49] border-dotted h-[138px] w-[154px] border-2 items-center justify-center rounded-[15px] self-center '
            onPress={pickImage}
          >
            {thumbnail ?
              <Image src={thumbnail.uri} className='w-[110%] h-[110%] rounded-[15px]' />
              :
              <Svg width="55" height="55" viewBox="0 0 55 55" fill="none">
                <Path d="M27.5 18.3333L27.5 36.6666" stroke="#12BD30" stroke-linejoin="round" />
                <Path d="M36.668 27.5L18.3346 27.5" stroke="#12BD30" stroke-linejoin="round" />
              </Svg>
            }
          </Pressable>
          <Text className='font-bold text-black text-lg my-1 text-center'>Upload Thumbnail Image</Text>

          <Text className='text-left font-bold text-black my-2'>Title</Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 45, marginBottom: 10, backgroundColor: 'white' }}
            activeOutlineColor="#0D509D"
            value={title}
            onChangeText={setTitle}
            placeholder="Enter The Title..."
            textColor="black"
          />

          <Text>Will The Category Display A Bar Graph?</Text>

          <View className='flex flex-row justify-evenly items-center'>
            <Pressable
              style={{ flexDirection: "row", alignItems: "center" }}
              className="w-[25%]"
              onPress={() => setHasBarGraph(false)}
            >
              <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center rounded-full">
                {!hasBarGraph ? <Icon source={'check'} size={15} color="green" /> : <></>}
              </View>
              <Text className="ml-5">No</Text>
            </Pressable>

            <Pressable
              style={{ flexDirection: "row", alignItems: "center" }}
              className="w-[25%]"
              onPress={() => setHasBarGraph(true)}

            >
              <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center rounded-full my-4">
                {hasBarGraph ? <Icon source={'check'} size={15} color="green" /> : <></>}
              </View>
              <Text className="ml-5">Yes</Text>
            </Pressable>
          </View>

          {
            hasBarGraph ?
              <View>
                <Text>Category Donation Goal</Text>
                <TextInput
                  mode="outlined"
                  theme={{ roundness: 10 }}
                  style={{ width: "100%", height: 45, marginBottom: 10, backgroundColor: 'white' }}
                  activeOutlineColor="#0D509D"
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="Enter The Title..."
                  textColor="black"
                  keyboardType='numeric'
                />
              </View>
              :
              <View>
                <Text className=' text-sm'>If There Is No Donation Goal Add Photos Instead of the Bar Graph</Text>
                <View className='flex flex-col gap-y-4 items-center justify-center mt-2'>
                  {
                    gallery && gallery?.length > 0 ?
                      gallery.map((pic, index) => (
                        <Pressable onPress={() => removeFromGallery(pic)}><Image src={pic.uri} className='w-[154px] h-[138px] rounded-[15px]' key={index} /></Pressable>
                      ))
                      :
                      <></>
                  }
                </View>
                <Text className='text-[#6077F5] text-center my-4' onPress={addToGallery}>Add Photos</Text>
              </View>
          }

        </View>

        <Pressable className='bg-[#57BA49] h-[50px] w-[50%] p-2 items-center justify-center rounded-[15px] my-4 self-center' onPress={async () => await onSubmit()}>
          <Text className='text-white font-bold'>Submit</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

export default CreateNewDonationProject


