import { View, Text, ScrollView } from 'react-native'
import React, { useState, useEffect } from 'react'
import RenderSurahs from './RenderSurahs'
import { Divider } from 'react-native-paper'
import { Stack } from "expo-router"
export type surahProp = {
  number: number,
  name: string,
  englishName: string,
  englishNameTranslation: string,
  numberOfAyahs: number,
  revelationType: string
}
type data = {
  data: surahProp[]
}
const Surahs = () => {
  const [surah, setSurah] = useState<surahProp[] | null>()

  const getSurahs = async () => {
    const surahURL = "https://api.alquran.cloud/v1/surah"
    try {
      const response = await fetch(surahURL)
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const data = await response.json();

      setSurah(data.data)
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getSurahs()
  }, [])


  return (
    <ScrollView className='flex-col bg-white'>
      <Stack.Screen options={{ title: "Surahs" }} />
      <View style={{ paddingBottom: 35 }}>
        {
          surah ? surah.map((item, index) => {
            return (
              <View key={index}>
                <RenderSurahs surah={item} index={index} />
                <Divider />
              </View>
            )
          }) : <></>
        }
      </View>
    </ScrollView>
  )
}

export default Surahs