import { View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Program } from '../../types'
import { Link } from "expo-router"
import { useProgram } from '../../providers/programProvider'
import RenderMyLibraryProgramLectures from './RenderMyLibraryProgramLectures'
import { useAuth } from "@/src/providers/AuthProvider"
import { supabase } from '@/src/lib/supabase'
type RenderProgramProp = {
    program_id: string
}
const RenderMyLibraryProgram = ( {program_id} : RenderProgramProp) => {
  const { session } = useAuth()
  const [ program, setProgram ] = useState<Program>()
  const [ speakerString, setSpeakerString ] = useState('')
  async function fetchUserProgram(){
    const { data, error } = await supabase.from("programs").select("*").eq("program_id", program_id).single()
    if(data){
    setProgram(data)
    let speaker_string : string[] = data.program_speaker.map(() => {return ''})
    await Promise.all(
      data.program_speaker.map( async ( speaker_id : string, index : number) => {
        const {data : speakerInfo, error : speakerInfoError } = await supabase.from('speaker_data').select('*').eq('speaker_id', speaker_id).single()
        if ( speakerInfo ){
          if (index == data.program_speaker.length - 1 ){
            speaker_string[index]=speakerInfo.speaker_name
          }
          else {
            speaker_string[index]= speakerInfo.speaker_name + ' & '
          }
        }
      })
    )
    setSpeakerString(speaker_string.join(''))
    }
  }

  useEffect(() => {
    fetchUserProgram()
  }, [])

  return (
    <View style={{ width: 170, height: 200, justifyContent: "center", alignItems: "center"}} className=' '>
        <Link  href={`../myPrograms/${program?.program_id}`}  asChild>
            <TouchableOpacity className=''>
            <View style={{width: 170, height: 170}}>
                    <Image source={ program?.program_img ? {uri: program?.program_img } : require("@/assets/images/MASHomeLogo.png")} style={{width : "100%", height: "100%",borderRadius: 8, objectFit: "fill"}}/>
            </View>
            <View className='flex-col'>
                <Text className='text-black font-bold' numberOfLines={1}>{program?.program_name}</Text>
                <Text className='text-gray-500' numberOfLines={2}>{speakerString}</Text>
            </View>
            </TouchableOpacity>
        </Link>
    </View>
  )
}

export default RenderMyLibraryProgram