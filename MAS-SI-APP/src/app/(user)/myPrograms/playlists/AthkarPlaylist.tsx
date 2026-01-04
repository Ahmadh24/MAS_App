import { View, Text, StatusBar, Dimensions, Pressable, StyleSheet, Platform, Image, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Link } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { Stack } from "expo-router"
import Animated, { useAnimatedRef, FadeInDown } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { LiquidGlassView, isLiquidGlassSupported } from '@/src/lib/liquidGlass'
import { User, MoreVertical } from 'lucide-react-native'
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu'
import { Modal, Portal, Divider, Icon } from 'react-native-paper'
import { useAuth } from '@/src/providers/AuthProvider'
import { UserPlaylistType } from '@/src/types'
import Toast from 'react-native-toast-message'

const AthkarPlaylist = () => {
  const { session } = useAuth()
  const [videos, setVideos] = useState<{ youtube_id: string, reciter: string, surah: string, id: string }[]>([])
  const [reciters, setReciters] = useState<{ speaker_id: string, speaker_name: string, speaker_creds: string[], speaker_img: string }[]>([])
  const [imageReady, setImageReady] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [addToPlaylistVisible, setAddToPlaylistVisible] = useState(false)
  const [selectedVideoId, setSelectedVideoId] = useState<string>('')
  const [usersPlaylists, setUsersPlaylists] = useState<UserPlaylistType[]>([])

  const getUserPlaylists = async () => {
    if (!session?.user.id) return
    const { data, error } = await supabase
      .from("user_playlist")
      .select("*")
      .eq("user_id", session.user.id)
    if (data && !error) {
      setUsersPlaylists(data)
    }
  }

  const handleAddToPlaylist = async (playlistId: string, playlistName: string) => {
    if (!session?.user.id || !selectedVideoId) {
      console.log('Missing session or selectedVideoId:', { session: session?.user.id, selectedVideoId })
      return
    }
    
    // Check for duplicate
    const { data: checkDupe } = await supabase
      .from("user_playlist_lectures")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("playlist_id", playlistId)
      .eq("quran_lecture_id", selectedVideoId)
      .single()
    
    if (checkDupe) {
      Toast.show({
        type: 'error',
        text1: 'Already in playlist',
        text2: `This dhikr is already in ${playlistName}`,
        position: 'bottom',
      })
    } else {
      console.log('Inserting to playlist:', { user_id: session.user.id, playlist_id: playlistId, quran_lecture_id: selectedVideoId })
      const { data, error } = await supabase
        .from("user_playlist_lectures")
        .insert({
          user_id: session.user.id,
          playlist_id: playlistId,
          quran_lecture_id: selectedVideoId
        })
        .select()
      
      if (error) {
        console.log('Error adding to playlist:', error)
        Toast.show({
          type: 'error',
          text1: 'Failed to add',
          text2: error.message,
          position: 'bottom',
        })
      } else {
        console.log('Successfully added:', data)
        Toast.show({
          type: 'success',
          text1: 'Added to playlist',
          text2: `Added to ${playlistName}`,
          position: 'bottom',
        })
      }
    }
    setAddToPlaylistVisible(false)
  }

  const openAddToPlaylist = (videoId: string) => {
    setSelectedVideoId(videoId)
    getUserPlaylists()
    setAddToPlaylistVisible(true)
  }
  
  const getVideos = async () => {
    const { data, error } = await supabase.from('quran_playlist').select('*').eq('video_type', 'Athkar')
    const { data: Reciters, error: RecitersError } = await supabase.from('speaker_data').select('*')
    if (data && Reciters) {
      setVideos(data)
      setReciters(Reciters)
    }
  }

  const { width } = Dimensions.get("window")
  const scrollRef = useAnimatedRef<Animated.ScrollView>()

  useEffect(() => {
    getVideos()
  }, [])

  const VideoItem = ({ vid, index, speaker }: { 
    vid: { youtube_id: string, reciter: string, surah: string, id: string },
    index: number,
    speaker: { speaker_id: string, speaker_name: string, speaker_img: string }[]
  }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <View style={styles.videoItemWrapper}>
        <Link 
          href={{
            pathname: '/myPrograms/athkar/AthkarVideo',
            params: {
              youtube_id: vid.youtube_id,
              quran_id: vid.id,
              surah: vid.surah,
              speaker_name: speaker[0]?.speaker_name,
              speaker_img: speaker[0]?.speaker_img,
              speaker_id: speaker[0]?.speaker_id
            }
          }} 
          asChild
        >
          <Pressable style={{ flex: 1 }}>
            {({ pressed }) => (
              <View style={[styles.videoItemFallback, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                <View style={styles.videoItemContent}>
                  <View style={styles.indexBadgeFallback}>
                    <Text style={styles.indexTextFallback}>{index + 1}</Text>
                  </View>
                  <View style={styles.videoInfo}>
                    <Text style={styles.surahTitleFallback} numberOfLines={1}>{vid.surah}</Text>
                    <View style={styles.reciterRow}>
                      {speaker[0]?.speaker_img ? (
                        <Image source={{ uri: speaker[0].speaker_img }} style={styles.reciterAvatar} />
                      ) : (
                        <View style={styles.reciterAvatarPlaceholder}>
                          <User color="#888" size={12} />
                        </View>
                      )}
                      <Text style={styles.reciterNameFallback} numberOfLines={1}>{speaker[0]?.speaker_name || 'Unknown Speaker'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </Pressable>
        </Link>
        <View style={styles.menuContainer}>
          <Menu>
            <MenuTrigger>
              <MoreVertical color="#888" size={20} />
            </MenuTrigger>
            <MenuOptions customStyles={{optionsContainer: {width: 180, borderRadius: 12, marginTop: 20, padding: 8}}}>
              <MenuOption onSelect={() => openAddToPlaylist(vid.id)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ fontSize: 15 }}>Add to Playlist</Text>
                  <Icon source="playlist-plus" color="#8B5CF6" size={18} />
                </View>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>
      </View>
    </Animated.View>
  )

  return (
    <LinearGradient
      colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 0.5 }}
      style={styles.container}
    >
      <Stack.Screen 
        options={{ 
          title: "",
          headerBackTitle: "",
          headerStyle: { backgroundColor: 'transparent' },
          headerTransparent: true,
          headerTintColor: '#fff',
          headerShadowVisible: false,
        }} 
      />
      <StatusBar barStyle="light-content" />

      {/* Fixed Hero Section - Profile Image */}
      <View style={styles.heroSection}>
        <View style={styles.profileImageContainer}>
          {!imageReady && !imageError && (
            <View style={styles.imagePlaceholder}>
              <View style={styles.placeholderContent} />
            </View>
          )}
          <Image 
            source={require('@/assets/images/AthkarImage.png')}
            style={[styles.profileImage, !imageReady && { opacity: 0 }]}
            resizeMode="cover"
            onLoad={() => setImageReady(true)}
            onError={() => {
              setImageError(true)
              setImageReady(true)
            }}
          />
        </View>
      </View>

      <Animated.ScrollView 
        ref={scrollRef} 
        scrollEventThrottle={16} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      >
        {/* Spacer to account for fixed hero - transparent so image shows through */}
        <View style={{ height: 280, backgroundColor: 'transparent' }} />

        {/* Content Section */}
        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Athkar</Text>
            <Text style={styles.sectionCount}>{videos.length} available</Text>
          </View>

          <View style={styles.videoList}>
            {videos.map((vid, index) => {
              const speaker = reciters.filter(id => id.speaker_id == vid.reciter)
              return (
                <VideoItem key={vid.id} vid={vid} index={index} speaker={speaker} />
              )
            })}
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>

      {/* Add to Playlist Modal */}
      <Portal>
        <Modal
          visible={addToPlaylistVisible}
          onDismiss={() => setAddToPlaylistVisible(false)}
          contentContainerStyle={{
            backgroundColor: 'white',
            padding: 0,
            width: "92%",
            borderRadius: 24,
            alignSelf: "center",
            overflow: 'hidden',
          }}
        >
          <View>
            {/* Header */}
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Icon source="playlist-plus" color="#fff" size={22} />
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>Add to Playlist</Text>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 }}>
                    {usersPlaylists.length} playlist{usersPlaylists.length !== 1 ? 's' : ''} available
                  </Text>
                </View>
              </View>
              <Pressable 
                onPress={() => setAddToPlaylistVisible(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon source="close" color="#fff" size={18} />
              </Pressable>
            </LinearGradient>

            {/* Vertical Playlist List */}
            {usersPlaylists.length > 0 ? (
              <ScrollView 
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 300 }}
                contentContainerStyle={{ paddingBottom: 4 }}
              >
                <View style={{ padding: 16 }}>
                  {usersPlaylists.map((playlist, index) => (
                    <Pressable
                      key={playlist.playlist_id}
                      onPress={() => handleAddToPlaylist(playlist.playlist_id, playlist.playlist_name)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#F8FAFC',
                        borderRadius: 16,
                        padding: 12,
                        borderWidth: 1.5,
                        borderColor: '#E2E8F0',
                        marginBottom: index < usersPlaylists.length - 1 ? 12 : 0,
                      }}
                    >
                      {/* Playlist Image */}
                      <View style={{
                        width: 56,
                        height: 56,
                        borderRadius: 12,
                        backgroundColor: playlist.def_background || '#8B5CF6',
                        overflow: 'hidden',
                      }}>
                        {playlist.playlist_img ? (
                          <Image source={{ uri: playlist.playlist_img }} style={{ width: 56, height: 56 }} resizeMode="cover" />
                        ) : (
                          <View style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
                            <Icon source="music" color="rgba(255,255,255,0.9)" size={26} />
                          </View>
                        )}
                      </View>

                      {/* Playlist Info */}
                      <View style={{ flex: 1, marginLeft: 14, marginRight: 10 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a' }} numberOfLines={1}>
                          {playlist.playlist_name}
                        </Text>
                        <Text style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>
                          Tap to add dhikr
                        </Text>
                      </View>

                      {/* Add Button */}
                      <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: '#8B5CF6',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Icon source="plus" color="#fff" size={20} />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: '#F5F3FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}>
                  <Icon source="playlist-music" color="#A78BFA" size={32} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#475569' }}>No playlists yet</Text>
                <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, textAlign: 'center' }}>
                  Create a playlist to save dhikr
                </Text>
              </View>
            )}
          </View>
        </Modal>
      </Portal>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingBottom: 0,
    paddingTop: 0,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 0,
    width: '100%',
  },
  profileImageContainer: {
    width: 240,
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#8B5CF6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContent: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  contentSection: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 24,
    paddingHorizontal: 16,
    minHeight: 500,
    position: 'relative',
    zIndex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  sectionCount: {
    fontSize: 14,
    color: '#888',
  },
  videoList: {
    gap: 12,
  },
  videoItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuContainer: {
    paddingLeft: 12,
    paddingRight: 4,
  },
  videoItemGlass: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
  },
  videoItemFallback: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  videoItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  indexBadge: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  indexBadgeFallback: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  indexText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  indexTextFallback: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  videoInfo: {
    flex: 1,
  },
  surahTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  surahTitleFallback: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  reciterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reciterAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  reciterAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  reciterName: {
    fontSize: 14,
    color: '#666',
  },
  reciterNameFallback: {
    fontSize: 14,
    color: '#888',
  },
})

export default AthkarPlaylist
