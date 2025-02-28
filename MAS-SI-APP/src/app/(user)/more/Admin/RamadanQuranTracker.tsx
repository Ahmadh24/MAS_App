import { View, Text, Pressable, ScrollView, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import Svg, { Path } from 'react-native-svg'
import { router, Stack } from 'expo-router'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
  } from 'react-native-popup-menu';
import { Divider, TextInput } from 'react-native-paper'
import { supabase } from '@/src/lib/supabase'
import Toast from 'react-native-toast-message'

const Surahs =  [
    { "number": 1, "name": "Al-Fatiha", "ayahs": 7 },
    { "number": 2, "name": "Al-Baqara", "ayahs": 286 },
    { "number": 3, "name": "Aal-E-Imran", "ayahs": 200 },
    { "number": 4, "name": "An-Nisa", "ayahs": 176 },
    { "number": 5, "name": "Al-Maeda", "ayahs": 120 },
    { "number": 6, "name": "Al-Anaam", "ayahs": 165 },
    { "number": 7, "name": "Al-Araf", "ayahs": 206 },
    { "number": 8, "name": "Al-Anfal", "ayahs": 75 },
    { "number": 9, "name": "At-Tawba", "ayahs": 129 },
    { "number": 10, "name": "Yunus", "ayahs": 109 },
    { "number": 11, "name": "Hud", "ayahs": 123 },
    { "number": 12, "name": "Yusuf", "ayahs": 111 },
    { "number": 13, "name": "Ar-Rad", "ayahs": 43 },
    { "number": 14, "name": "Ibrahim", "ayahs": 52 },
    { "number": 15, "name": "Al-Hijr", "ayahs": 99 },
    { "number": 16, "name": "An-Nahl", "ayahs": 128 },
    { "number": 17, "name": "Al-Isra", "ayahs": 111 },
    { "number": 18, "name": "Al-Kahf", "ayahs": 110 },
    { "number": 19, "name": "Maryam", "ayahs": 98 },
    { "number": 20, "name": "Taha", "ayahs": 135 },
    { "number": 21, "name": "Al-Anbiya", "ayahs": 112 },
    { "number": 22, "name": "Al-Hajj", "ayahs": 78 },
    { "number": 23, "name": "Al-Mumenoon", "ayahs": 118 },
    { "number": 24, "name": "An-Noor", "ayahs": 64 },
    { "number": 25, "name": "Al-Furqan", "ayahs": 77 },
    { "number": 26, "name": "Ash-Shuara", "ayahs": 227 },
    { "number": 27, "name": "An-Naml", "ayahs": 93 },
    { "number": 28, "name": "Al-Qasas", "ayahs": 88 },
    { "number": 29, "name": "Al-Ankaboot", "ayahs": 69 },
    { "number": 30, "name": "Ar-Room", "ayahs": 60 },
    { "number": 31, "name": "Luqman", "ayahs": 34 },
    { "number": 32, "name": "As-Sajda", "ayahs": 30 },
    { "number": 33, "name": "Al-Ahzab", "ayahs": 73 },
    { "number": 34, "name": "Saba", "ayahs": 54 },
    { "number": 35, "name": "Fatir", "ayahs": 45 },
    { "number": 36, "name": "Ya-Seen", "ayahs": 83 },
    { "number": 37, "name": "As-Saaffat", "ayahs": 182 },
    { "number": 38, "name": "Sad", "ayahs": 88 },
    { "number": 39, "name": "Az-Zumar", "ayahs": 75 },
    { "number": 40, "name": "Al-Ghafir", "ayahs": 85 },
    { "number": 41, "name": "Fussilat", "ayahs": 54 },
    { "number": 42, "name": "Ash-Shura", "ayahs": 53 },
    { "number": 43, "name": "Az-Zukhruf", "ayahs": 89 },
    { "number": 44, "name": "Ad-Dukhan", "ayahs": 59 },
    { "number": 45, "name": "Al-Jathiya", "ayahs": 37 },
    { "number": 46, "name": "Al-Ahqaf", "ayahs": 35 },
    { "number": 47, "name": "Muhammad", "ayahs": 38 },
    { "number": 48, "name": "Al-Fatha", "ayahs": 29 },
    { "number": 49, "name": "Al-Hujraat", "ayahs": 18 },
    { "number": 50, "name": "Qaf", "ayahs": 45 },
    { "number": 51, "name": "Adh-Dhariyat", "ayahs": 60 },
    { "number": 52, "name": "At-Tur", "ayahs": 49 },
    { "number": 53, "name": "An-Najm", "ayahs": 62 },
    { "number": 54, "name": "Al-Qamar", "ayahs": 55 },
    { "number": 55, "name": "Ar-Rahman", "ayahs": 78 },
    { "number": 56, "name": "Al-Waqia", "ayahs": 96 },
    { "number": 57, "name": "Al-Hadid", "ayahs": 29 },
    { "number": 58, "name": "Al-Mujadila", "ayahs": 22 },
    { "number": 59, "name": "Al-Hashr", "ayahs": 24 },
    { "number": 60, "name": "Al-Mumtahina", "ayahs": 13 },
    { "number": 61, "name": "As-Saff", "ayahs": 14 },
    { "number": 62, "name": "Al-Jumua", "ayahs": 11 },
    { "number": 63, "name": "Al-Munafiqoon", "ayahs": 11 },
    { "number": 64, "name": "At-Taghabun", "ayahs": 18 },
    { "number": 65, "name": "At-Talaq", "ayahs": 12 },
    { "number": 66, "name": "At-Tahrim", "ayahs": 12 },
    { "number": 67, "name": "Al-Mulk", "ayahs": 30 },
    { "number": 68, "name": "Al-Qalam", "ayahs": 52 },
    { "number": 69, "name": "Al-Haaqqa", "ayahs": 52 },
    { "number": 70, "name": "Al-Maarij", "ayahs": 44 },
    { "number": 71, "name": "Nooh", "ayahs": 28 },
    { "number": 72, "name": "Al-Jinn", "ayahs": 28 },
    { "number": 73, "name": "Al-Muzzammil", "ayahs": 20 },
    { "number": 74, "name": "Al-Muddaththir", "ayahs": 56 },
    { "number": 75, "name": "Al-Qiyama", "ayahs": 40 },
    { "number": 76, "name": "Al-Insan", "ayahs": 31 },
    { "number": 77, "name": "Al-Mursalat", "ayahs": 50 },
    { "number": 78, "name": "An-Naba", "ayahs": 40 },
    { "number": 79, "name": "An-Naziat", "ayahs": 46 },
    { "number": 80, "name": "Abasa", "ayahs": 42 },
    { "number": 81, "name": "At-Takwir", "ayahs": 29 },
    { "number": 82, "name": "Al-Infitar", "ayahs": 19 },
    { "number": 83, "name": "Al-Mutaffifin", "ayahs": 36 },
    { "number": 84, "name": "Al-Inshiqaq", "ayahs": 25 },
    { "number": 85, "name": "Al-Burooj", "ayahs": 22 },
    { "number": 86, "name": "At-Tariq", "ayahs": 17 },
    { "number": 87, "name": "Al-Ala", "ayahs": 19 },
    { "number": 88, "name": "Al-Ghashiya", "ayahs": 26 },
    { "number": 89, "name": "Al-Fajr", "ayahs": 30 },
    { "number": 90, "name": "Al-Balad", "ayahs": 20 },
    { "number": 91, "name": "Ash-Shams", "ayahs": 15 },
    { "number": 92, "name": "Al-Lail", "ayahs": 21 },
    { "number": 93, "name": "Ad-Dhuha", "ayahs": 11 },
    { "number": 94, "name": "Al-Inshirah", "ayahs": 8 },
    { "number": 95, "name": "At-Tin", "ayahs": 8 },
    { "number": 96, "name": "Al-Alaq", "ayahs": 19 },
    { "number": 97, "name": "Al-Qadr", "ayahs": 5 },
    { "number": 98, "name": "Al-Bayyina", "ayahs": 8 },
    { "number": 99, "name": "Az-Zalzala", "ayahs": 8 },
    { "number": 100, "name": "Al-Adiyat", "ayahs": 11 },
    { "number": 101, "name": "Al-Qaria", "ayahs": 11 },
    { "number": 102, "name": "At-Takathur", "ayahs": 8 },
    { "number": 103, "name": "Al-Asr", "ayahs": 3 },
    { "number": 104, "name": "Al-Humaza", "ayahs": 9 },
    { "number": 105, "name": "Al-Fil", "ayahs": 5 },
    { "number": 106, "name": "Quraish", "ayahs": 4 },
    { "number": 107, "name": "Al-Maun", "ayahs": 7 },
    { "number": 108, "name": "Al-Kauther", "ayahs": 3 },
    { "number": 109, "name": "Al-Kafiroon", "ayahs": 6 },
    { "number": 110, "name": "An-Nasr", "ayahs": 3 },
    { "number": 111, "name": "Al-Masadd", "ayahs": 5 },
    { "number": 112, "name": "Al-Ikhlas", "ayahs": 4 },
    { "number": 113, "name": "Al-Falaq", "ayahs": 5 },
    { "number": 114, "name": "An-Nas", "ayahs": 6 }
]





const RamadanQuranTracker = () => {
  const tabBar = useBottomTabBarHeight()
  const QURANAPIURL = 'https://quranapi.pages.dev/api'
  const handleSubmit = () => {
        Toast.show({
        type: "success",
        text1: "Quran Tracker Successfully Updated",
        position: "top",
        topOffset: 50,
        visibilityTime: 2000,
        });
  };
  const [ selectedSurah, setSelectedSurah ] = useState<{ayahs : number, name : string, number : number}>(null)
  const [ selectedAyah, setSelectedAyah ] = useState('')
  const [ ayahOptions, setAyahOptions ] = useState([])
  const [ ayahError, setAyahError ] = useState(false)
  const GetSurahsAyats = async (SurahNumber : number) => {
    const QURANAPIENDPOINT = `${QURANAPIURL}/${SurahNumber}.json`
    const QuranAPIResponse = await fetch(QURANAPIENDPOINT)
    const QuranAPIResponseData = await QuranAPIResponse.json()
    setAyahOptions(QuranAPIResponseData.arabic1)
  }

  const GetCurrentSurah = async () => {
     const { data, error } = await supabase.from('ramadan_quran_tracker').select('*').eq('id', 1).single()
        if( data ){
            setSelectedAyah(String(data.ayah_num))
            GetSurahsAyats(data.surah)
            setSelectedSurah({ayahs : data.num_of_ayahs, name : data.surah_name, number : data.surah})
        }
  }
  const OnSelectSurah  = ( surah : { ayahs : number, name : string, number : number } ) => {
    setSelectedSurah(surah)
    GetSurahsAyats(surah.number)
  }
  const SurahMenuDropDown = () => {
    return(
        <Menu style={{height : 50, alignItems : 'center', justifyContent : "center", width : '90%'}}> 
            <MenuTrigger>
                <View className='border-2 border-black w-full rounded-xl items-center justify-between h-[50px] flex flex-row p-2'>
                    { !selectedSurah ? 
                    <>
                        <Text>select the surah number</Text>
                        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <Path d="M6 9L12 15L18 9" stroke="black" stroke-width="2"/>
                        </Svg> 
                    </>
                    : 
                    <>
                    <Text className='w-[90%]' numberOfLines={1} >{selectedSurah.number}: {selectedSurah.name}</Text>
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <Path d="M6 9L12 15L18 9" stroke="black" stroke-width="2"/>
                    </Svg> 
                    </>
                    }
                </View>
            </MenuTrigger>
            <MenuOptions optionsContainerStyle={{
                height : '50%',
                overflow : 'hidden'
            }}
            >
                <ScrollView className='h-[100%]'>
                    {Surahs.map(( surah ) => {
                       return ( 
                       <MenuOption onSelect={() => OnSelectSurah(surah)}>
                            <Text>{surah.number}: {surah.name}</Text>
                       </MenuOption>
                       )
                    })}
                </ScrollView>
            </MenuOptions>
        </Menu>
    )
  }    
  
  const OnUpdate = async () => {
    if( selectedSurah && selectedAyah && !ayahError ){
        const { error } = await supabase.from('ramadan_quran_tracker').update({surah : selectedSurah.number, ayah_num : selectedAyah, ayah : ayahOptions[Number(selectedAyah) - 1], surah_name : selectedSurah.name}).eq('id',1)
        if( !error ){
            handleSubmit()
        }
    }
    else{
        Alert.alert('Enter Valid Surah & Ayah')
    }
  }

  useEffect(() => {
    GetCurrentSurah()
  }, [])



  return (
        <View className='flex-1 grow bg-white px-6 flex-col space-y-3' style={{ paddingBottom : tabBar + 30, paddingTop : 220 }}>
          <Stack.Screen 
            options={{
              headerTransparent : true,
              header : () => (
                <View className="relative">
                  <View className="h-[110px] w-[100%] rounded-br-[65px] bg-[#6077F5] items-start justify-end pb-[5%] z-[1]">
                    <Pressable className="flex flex-row items-center justify-between w-[70%]" onPress={() => router.back()}>
                      <Svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                        <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="white" stroke-width="2"/>
                      </Svg>
                      <Text className=" text-[25px] text-white">Ramadan Quran Tracker</Text>
                    </Pressable>
                  </View>
                  <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
                   <View className="w-[65%] items-center"> 
                    <Text className=" text-[15px] text-black ">Update Information</Text>
                  </View>
                  </View>
                </View>
              )
            }}
          />

          <Text>Select Surah Number</Text>
          <SurahMenuDropDown />
          {
           selectedSurah ? 
            <View>
                <Text>Select Ayah Number: (1-{selectedSurah.ayahs})</Text>
                <TextInput
                    mode='outlined' 
                    value={selectedAyah}
                    onChangeText={(text) => {
                        if ( !text ){
                            setSelectedAyah('')
                            return
                        }
                        const num = Number(text)
                        if( num > selectedSurah.ayahs || num < 1 || !num){
                            setAyahError(true)
                        }
                        else{
                            setAyahError(false)
                        }
                        setSelectedAyah(text)

                    }}
                    style={{ backgroundColor : 'white', borderBottomWidth : 0, borderWidth : 0, paddingLeft : 10 }}
                    theme={{ roundness : 20 }}
                    placeholder={'Enter Ayah Number'}
                    outlineColor='black'
                    activeOutlineColor='black'
                    textColor='black'
                    contentStyle={{ paddingLeft  : 3 }}
                    selectionColor='black'
                />
                {
                    ayahError ? 
                    <Text className='text-red-500'>Error Input a Valid Number Between 1-{selectedSurah.ayahs}</Text>
                    : <></>
                }
            </View>
          :
            <></>
         }

        {
            !ayahError && selectedAyah ? 
            <>
                <Text className='text-xl font-bold text-black px-4'>Ayah: </Text>
                <View className='rounded-xl border border-gray-500 p-4'>
                    <Text className='text-xl'>{ayahOptions[Number(selectedAyah) - 1]}</Text>
                </View>
            </>
            :<></>
        }

          <Pressable className='bg-[#6077F5] self-center w-[50%] p-4 rounded-[10px] items-center justify-center'
          onPress={OnUpdate}
          >
            <Text className='text-white '>Update</Text>
          </Pressable>   
          </View>
  )
}

export default RamadanQuranTracker