import { View, Text, Pressable, Image } from 'react-native'
import React, { useState } from 'react'
import { Link } from 'expo-router'
import { FlyerSkeleton } from './FlyerSkeleton'
import { Program } from '../types'

const FlyerImageComponent = ({item} : {item : Program}) => {
    const [ imageReady, setImageReady ] = useState(false)
    return (
    <Link href={`/menu/program/${item.program_id}`} asChild>
        <Pressable className='flex-col relative'>
            { !imageReady && 
                    <FlyerSkeleton width={150} height={150} style={{position : 'absolute', top : 0, zIndex : 2}}/>
            }
            <Image source={{ uri : item.program_img || undefined }} style={{ width : 150, height : 150, borderRadius : 8, margin : 5 }}  
            onLoad={() => setImageReady(true)}
            onError={() => setImageReady(false)}
            />
            <Text className='text-gray-500 font-medium pl-2 text-[10px] w-[150px] text-center' numberOfLines={1}>{item.program_name}</Text>
        </Pressable>
    </Link>
    )
}

export default FlyerImageComponent