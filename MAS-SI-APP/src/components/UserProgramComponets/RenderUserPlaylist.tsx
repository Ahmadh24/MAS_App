import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import React from 'react'
import { Link } from "expo-router"
import { UserPlaylistType } from '@/src/types'
import { Music2, Play } from 'lucide-react-native'
import Animated, { FadeIn } from 'react-native-reanimated'

type RenderUserPlaylistProp = {
    playlist: UserPlaylistType
}

const RenderUserPlaylist = ({ playlist }: RenderUserPlaylistProp) => {
    return (
        <Link href={`/myPrograms/playlists/${playlist.playlist_id}`} asChild>
            <TouchableOpacity activeOpacity={0.9}>
                <Animated.View entering={FadeIn.duration(400)} style={styles.card}>
                    {playlist.playlist_img ? (
                        <Image 
                            source={{ uri: playlist.playlist_img }}
                            style={styles.image}
                        />
                    ) : (
                        <View style={[styles.placeholder, { backgroundColor: playlist.def_background || '#6366F1' }]}>
                            <Music2 color="rgba(255,255,255,0.8)" size={40} strokeWidth={1.5} />
                        </View>
                    )}
                    
                    {/* Overlay with title */}
                    <View style={styles.overlay}>
                        <Text style={styles.title} numberOfLines={1}>{playlist.playlist_name}</Text>
                    </View>
                    
                    {/* Play button */}
                    <View style={styles.playButton}>
                        <Play color="#fff" size={16} fill="#fff" />
                    </View>
                </Animated.View>
            </TouchableOpacity>
        </Link>
    )
}

const styles = StyleSheet.create({
    card: {
        height: 180,
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    playButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
})

export default RenderUserPlaylist
