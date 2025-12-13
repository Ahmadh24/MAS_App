import { View, Text, FlatList, ScrollView, Image, TouchableOpacity, RefreshControl } from 'react-native'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import { useAuth } from "@/src/providers/AuthProvider"
import { Program } from '@/src/types'
import { Searchbar, Divider } from 'react-native-paper'
import ProgramsListProgram from '@/src/components/ProgramsListProgram'
import Animated from 'react-native-reanimated'
import { Link } from 'expo-router'

const Kids = () => {
  const { session } = useAuth()
  const [kidsPrograms, setKidsPrograms] = useState<Program[]>()
  const [searchBarInput, setSearchBarInput] = useState("")
  const [refreshing, setRefreshing] = React.useState(false);

  const getKidsPrograms = async () => {
    setRefreshing(true)
    const currDate = new Date().toISOString()
    const { data, error } = await supabase.from("programs").select("*").eq("is_kids", true).gte("program_end_date", currDate)
    if (error) {
      console.log(error)
    }
    if (data) {
      setKidsPrograms(data)
    }
    setRefreshing(false)
  }

  useEffect(() => {
    getKidsPrograms()
  }, [])
  return (
    <View className=' bg-[#0D509D] flex-1'>
      <ScrollView style={{ borderTopLeftRadius: 40, borderTopRightRadius: 40, height: '100%', backgroundColor: 'white' }} contentContainerStyle={{
        paddingTop: 2, backgroundColor: 'white', paddingBottom: 30
      }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => await getKidsPrograms()} />}
      >
        <View className='mt-5 w-[100%]'
        >
          <Text className='font-bold text-black text-lg ml-3 mb-8'>Current Programs</Text>
          <View className='flex-row flex flex-wrap gap-y-5'>
            {
              kidsPrograms?.map((item) => {
                return (
                  <View key={item.program_id} style={{ width: "50%" }}>
                    <Link href={`/menu/program/${item.program_id}`}
                      asChild >
                      <TouchableOpacity className='items-center'>
                        <View style={{ flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <View style={{ justifyContent: "center", alignItems: "center", backgroundColor: "white", borderRadius: 15 }}>
                            <Image
                              source={{ uri: item.program_img || require('@/assets/images/MASHomeLogo.png') }}
                              style={{ width: 150, height: 150, objectFit: "cover", borderRadius: 15 }}
                            />
                          </View>
                          <View>
                            <View className='mt-2 items-center justify-center bg-white w-[80%] self-center'>
                              <Text style={{ textAlign: "center" }} className='text-md' numberOfLines={1}>{item.program_name}</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Link>
                  </View>
                )
              })
            }
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default Kids