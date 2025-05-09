import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { Link } from "expo-router"
import { UserPlaylistType } from '@/src/types'
type RenderUserPlaylistProp = {
    playlist : UserPlaylistType
}
const RenderUserPlaylist = ({ playlist } : RenderUserPlaylistProp) => {
  return (
        <Link  href={`/myPrograms/playlists/${playlist.playlist_id}`} asChild className='items-center h-[170] w-[100%] my-1'>
            <TouchableOpacity className='w-[100%]'>
                <View className='flex-col items-center px-2 '>
                    <View style={{justifyContent: "center", alignItems: "center", borderRadius: 15, width: "30%",}}>
                               { playlist.playlist_img ? <Image 
                                    source={ playlist.playlist_img ? { uri: playlist.playlist_img } : require("@/assets/images/MASHomeLogo.png")}
                                    style={{width: 160, height: 140, objectFit: "fill", borderRadius: 8}}
                                />
                                :
                                    <View style={{ height : 140, width : 160, borderRadius : 20, alignItems : 'center', justifyContent : 'center', backgroundColor : playlist.def_background }} >
                                        <Image source={require('@/assets/images/MasPlaylistDef.png')} style={{height : '70%', width : '70%', objectFit : 'fill'}} />
                                    </View>
                            }
                    </View>
                    <View className='items-center justify-center w-[100%]'>
                        <Text className='text-[20px] font-[300] text-black text-center my-1' numberOfLines={1}> {playlist.playlist_name} </Text>
                    </View>
                </View>
                
            </TouchableOpacity>
        </Link>
  )
}

export default RenderUserPlaylist