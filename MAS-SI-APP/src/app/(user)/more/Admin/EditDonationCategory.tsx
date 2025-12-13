import { View, Text, Pressable, FlatList, Image, ScrollView, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Link, router, Stack } from 'expo-router'
import Svg, { Circle, Path } from 'react-native-svg'
import { supabase } from '@/src/lib/supabase'
import { Icon, TextInput } from 'react-native-paper'
import { format, set } from 'date-fns'
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from "expo-image-picker";
import { encode, decode } from 'base64-arraybuffer'
import Toast from 'react-native-toast-message'
const EditDonationCategory = () => {
  const [projects, setProjects] = useState<any[]>()
  const [title, setTitle] = useState('')
  const [hasBarGraph, setHasBarGraph] = useState<boolean>(false)
  const [amount, setAmount] = useState('')
  const [thumbnail, setThumbnail] = useState<ImagePicker.ImagePickerAsset | string | undefined>();
  const [gallery, setGallery] = useState<ImagePicker.ImagePickerAsset[] | string[]>([]);
  const [projectEditing, setProjectEditing] = useState<{ project_id: string, project_name: string }>()
  const [donation, setDonation] = useState<number | undefined>()
  const [updating, setUpdating] = useState(false)
  const showToast = (project_name: string) => {
    Toast.show({
      type: 'success',
      text1: `${project_name.slice(0, 11)}${project_name.length > 11 && '...'} Sucessfully edited!`,
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
  const handleAmountChange = (text: string) => {
    const cleanedValue = text.replace(/[^0-9]/g, '')
    const parsedValue = parseFloat(cleanedValue)

    if (!isNaN(parsedValue)) {
      setAmount(parsedValue.toLocaleString('en-usd'))
    } else {
      setAmount('')
    }
  }
  const onPressCategory = async (project: { project_name: string, project_id: string, project_goal: number | undefined | null, thumbnail: string }) => {
    setThumbnail(undefined)
    setTitle('')
    setHasBarGraph(false)
    setAmount('')
    setGallery([])
    setProjectEditing(undefined)
    setTitle(project.project_name)
    setThumbnail(project.thumbnail)
    setProjectEditing({ project_id: project.project_id, project_name: project.project_name })
    setHasBarGraph(project.project_goal ? true : false)
    if (project.project_goal) handleAmountChange(project.project_goal.toString())
    if (!project.project_goal) {
      const { data: GalleryPics, error } = await supabase.storage.from('fliers').list(project.project_id)
      if (GalleryPics && GalleryPics.length > 0) {
        await Promise.all(
          GalleryPics.map(async (pic) => {
            const { data } = supabase
              .storage
              .from('fliers')
              .getPublicUrl(`${project.project_id}/${pic.name}`)
            if (data) {
              setGallery(prev => [...prev, data.publicUrl])
            }
          })
        )
      }
    }
  }

  const resetUpdate = () => {
    setThumbnail('')
    setTitle('')
    setHasBarGraph(false)
    setProjectEditing(undefined)
    setGallery([])
    setAmount('')

  }
  const onUpdate = async () => {
    if (projectEditing) {
      setUpdating(true)
      if (thumbnail && title && (amount || gallery.length > 0)) {

        if (typeof thumbnail != 'string') {
          const base64 = await FileSystem.readAsStringAsync(thumbnail.uri, { encoding: 'base64' });
          const filePath = `${title.trim()}.${thumbnail.type === 'image' ? 'png' : 'mp4'}`;
          const { data: image, error: image_upload_error } = await supabase.storage.from('fliers').upload(filePath, decode(base64));
          if (image) {
            const { data: project_img_url } = await supabase.storage.from('fliers').getPublicUrl(image?.path)
            const { data, error } = await supabase.from('projects').update({ project_name: title, project_goal: hasBarGraph ? amount : null, thumbnail: project_img_url.publicUrl }).eq('project_id', projectEditing.project_id)
          }
        }

        const { data, error } = await supabase.from('projects').update({ project_name: title, project_goal: hasBarGraph ? amount : null }).eq('project_id', projectEditing.project_id)
        const GalleryImageUrls = gallery.filter(pic => typeof pic == 'string')
        const GalleryImage64: string[] | ImagePicker.ImagePickerAsset[] = gallery.filter(pic => typeof pic != 'string')

        // Runs if We have string urls in our array
        if (GalleryImageUrls.length > 0) {

          const GalleryAsEncode = await Promise.all(
            GalleryImageUrls.map(async (url) => {
              const FetchImg = await fetch(url)
              const ImgToArrayBuff = await FetchImg.arrayBuffer()
              const ImgAsBase64Encode = encode(ImgToArrayBuff)
              return ImgAsBase64Encode
            })
          )

          // Combine pics encoded from string and pics chosen from library, Empty Bucket and Upload these new files
          const EnjoinedGallery: string[] | ImagePicker.ImagePickerAsset[] = GalleryImage64.concat(GalleryAsEncode)
          const { data: list, error: listError } = await supabase.storage.from('fliers').list(`${projectEditing.project_id}`);
          const filesToRemove = list && list.map((x) => `${projectEditing.project_id}/${x.name}`);
          if (filesToRemove) { const { data, error } = await supabase.storage.from('fliers').remove(filesToRemove) }

          await Promise.all(
            EnjoinedGallery.map(async (pic, index) => {
              if (typeof pic == 'string') {
                const filePath = `${projectEditing.project_id}/${index}.${'png'}`;
                const { data: image, error: image_upload_error } = await supabase.storage.from('fliers').upload(filePath, decode(pic));
                if (!image) {
                  Alert.alert(image_upload_error.message)
                  return
                }
              } else {
                const base64 = await FileSystem.readAsStringAsync(pic.uri, { encoding: 'base64' });
                const filePath = `${projectEditing.project_id}/${index}.${pic.type === 'image' ? 'png' : 'mp4'}`;
                const contentType = pic.type === 'image' ? 'image/png' : 'video/mp4';
                const { data: image, error: image_upload_error } = await supabase.storage.from('fliers').upload(filePath, decode(base64));
                if (image_upload_error) {
                  console.log(image_upload_error)
                }
                if (!image) {
                  Alert.alert(image_upload_error.message)
                  return
                }
              }
            })
          )

        }
        // Else We convert the files and send them straight to supabase 
        else if (gallery.length > 0) {
          const { data: list, error: listError } = await supabase.storage.from('fliers').list(`${projectEditing.project_id}`);
          const filesToRemove = list && list.map((x) => `${projectEditing.project_id}/${x.name}`);
          if (filesToRemove) { const { data, error } = await supabase.storage.from('fliers').remove(filesToRemove) }
          await Promise.all(
            gallery.map(async (pic, index) => {
              const base64 = await FileSystem.readAsStringAsync(pic.uri, { encoding: 'base64' });
              const filePath = `${projectEditing.project_id}/${index}.${pic.type === 'image' ? 'png' : 'mp4'}`;
              const contentType = pic.type === 'image' ? 'image/png' : 'video/mp4';
              const { data: image, error: image_upload_error } = await supabase.storage.from('fliers').upload(filePath, decode(base64));
              if (!image) {
                Alert.alert(image_upload_error.message)
                return
              }
            })
          )
        }
        // Show Toast and Reset After Sucess call 
        showToast(projectEditing.project_name)
        resetUpdate()
        setUpdating(false)
      }
      else Alert.alert('Fill out all forms!')

    } else {
      Alert.alert('Select a Category to Edit')
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
                <View className="w-[70%] items-center">
                  <Text className=" text-[15px] text-black ">Edit Exisiting Category</Text>
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
              <Pressable onPress={async () => { await onPressCategory(item) }}
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
          {
            projectEditing ?
              <View className='my-4'>
                <Text className='text-black font-bold'>Project Currently Editing : {'\n'}<Text className='text-lg'>{projectEditing.project_name}</Text></Text>
                <Text className='text-gray-400'>Project ID: {'\n'}{projectEditing.project_id}</Text>
              </View>
              :
              <></>
          }
          <Pressable className='border-[#57BA49] border-dotted h-[138px] w-[154px] border-2 items-center justify-center rounded-[15px] self-center'
            onPress={pickImage}
          >
            {thumbnail ?
              <Image src={typeof thumbnail == 'string' ? thumbnail : thumbnail.uri} className='w-[110%] h-[110%] rounded-[15px]' />
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
                <Text className='text-gray-400 '>Press on a photo to remove it</Text>
                <View className='flex flex-col gap-y-4 items-center justify-center mt-2'>
                  {
                    gallery && gallery?.length > 0 ?
                      gallery.map((pic, index) => (
                        <Pressable onPress={() => removeFromGallery(pic)} key={index}>
                          <Image src={typeof pic == 'string' ? pic : pic.uri} className='w-[154px] h-[138px] rounded-[15px]' />
                        </Pressable>
                      ))
                      :
                      <></>
                  }
                </View>
                <Text className='text-[#6077F5] text-center my-4' onPress={addToGallery}>Add Photos</Text>
              </View>
          }

        </View>

        <Pressable
          disabled={updating}
          className='bg-[#57BA49] h-[50px] w-[50%] p-2 items-center justify-center rounded-[15px] my-4 self-center' onPress={async () => await onUpdate()}>
          <Text className='text-white font-bold'>Submit</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

export default EditDonationCategory