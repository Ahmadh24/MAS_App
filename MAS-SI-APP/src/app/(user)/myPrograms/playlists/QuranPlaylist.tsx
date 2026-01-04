import { View, Text, StatusBar, Dimensions, Pressable, StyleSheet, Platform, Image, ScrollView } from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { Stack } from "expo-router"
import Animated, { interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset, FadeInDown, withTiming, useSharedValue, runOnJS } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { LiquidGlassView, isLiquidGlassSupported } from '@/src/lib/liquidGlass'
import { BookOpen, Play, User, Shuffle, MoreVertical, X } from 'lucide-react-native'
import YoutubePlayer from "react-native-youtube-iframe"
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu'
import { Modal, Portal, Button, Divider, Icon } from 'react-native-paper'
import { useAuth } from '@/src/providers/AuthProvider'
import { UserPlaylistType } from '@/src/types'
import Toast from 'react-native-toast-message'

const QuranPlaylist = () => {
  const { session } = useAuth()
  const [videos, setVideos] = useState<{ youtube_id: string, reciter: string, surah: string, id: string }[]>([])
  const [reciters, setReciters] = useState<{ speaker_id: string, speaker_name: string, speaker_creds: string[], speaker_img: string }[]>([])
  const [imageReady, setImageReady] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [playingVideo, setPlayingVideo] = useState<{ youtube_id: string, surah: string, speaker_name: string } | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const miniPlayerHeight = useSharedValue(0)
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
        text2: `This recitation is already in ${playlistName}`,
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
    const { data, error } = await supabase.from('quran_playlist').select('*').eq('video_type', 'Quran')
    const { data: Reciters, error: RecitersError } = await supabase.from('speaker_data').select('*')
    if (data && Reciters) {
      setVideos(data)
      setReciters(Reciters)
    }
  }

  const { width } = Dimensions.get("window")
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollOffset = useScrollViewOffset(scrollRef)

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      // Keep image fixed, no fade or transform
    }
  })

  useEffect(() => {
    getVideos()
  }, [])

  const handlePlayVideo = (vid: { youtube_id: string, surah: string }, speakerName: string) => {
    setPlayingVideo({ youtube_id: vid.youtube_id, surah: vid.surah, speaker_name: speakerName })
    setIsPlaying(true)
    miniPlayerHeight.value = withTiming(200, { duration: 300 })
  }

  const clearPlayingVideo = () => {
    setPlayingVideo(null)
  }

  const handleCloseMiniPlayer = () => {
    setIsPlaying(false)
    miniPlayerHeight.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(clearPlayingVideo)()
      }
    })
  }

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setIsPlaying(false)
    }
  }, [])

  const miniPlayerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: miniPlayerHeight.value,
      opacity: miniPlayerHeight.value > 0 ? 1 : 0,
    }
  })

  const VideoItem = ({ vid, index, speaker }: { 
    vid: { youtube_id: string, reciter: string, surah: string, id: string },
    index: number,
    speaker: { speaker_id: string, speaker_name: string, speaker_img: string }[]
  }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Link 
        href={{
          pathname: '/myPrograms/quran/QuranVideo',
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
        <Pressable style={styles.trackItem}>
          <View style={styles.trackNumberContainer}>
            <Text style={styles.trackNumber}>{index + 1}</Text>
          </View>
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle} numberOfLines={1}>{vid.surah}</Text>
            <View style={styles.reciterRow}>
              {speaker[0]?.speaker_img ? (
                <Image source={{ uri: speaker[0].speaker_img }} style={styles.reciterAvatar} />
              ) : (
                <View style={styles.reciterAvatarPlaceholder}>
                  <User color="#888" size={12} />
                </View>
              )}
              <Text style={styles.trackArtist} numberOfLines={1}>{speaker[0]?.speaker_name || 'Unknown Reciter'}</Text>
            </View>
          </View>
          <View style={styles.trackActions}>
            <Menu>
              <MenuTrigger>
                <MoreVertical color="#888" size={20} />
              </MenuTrigger>
              <MenuOptions customStyles={{optionsContainer: {width: 180, borderRadius: 12, marginTop: 20, padding: 8}}}>
                <MenuOption onSelect={() => openAddToPlaylist(vid.id)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                    <Text style={{ fontSize: 15 }}>Add to Playlist</Text>
                    <Icon source="playlist-plus" color="#064AA3" size={18} />
                  </View>
                </MenuOption>
              </MenuOptions>
            </Menu>
          </View>
        </Pressable>
      </Link>
    </Animated.View>
  )

  const mainReciter = reciters.find(r => r.speaker_id === videos[0]?.reciter) || reciters[0]

  return (
    <LinearGradient
      colors={['#064AA3', '#053D8A', '#043070']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <Stack.Screen 
        options={{ 
          title: "",
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
            source={require('@/assets/images/Sheikh.png')}
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
            <Text style={styles.sectionTitle}>All Recitations</Text>
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
          <View style={{ height: playingVideo ? 220 : 100 }} />
        </View>
      </Animated.ScrollView>

      {/* Mini Player */}
      {playingVideo && (
        <Animated.View style={[styles.miniPlayer, miniPlayerAnimatedStyle]}>
          <View style={styles.miniPlayerHeader}>
            <View style={styles.miniPlayerInfo}>
              <Text style={styles.miniPlayerTitle} numberOfLines={1}>{playingVideo.surah}</Text>
              <Text style={styles.miniPlayerArtist} numberOfLines={1}>{playingVideo.speaker_name}</Text>
            </View>
            <Pressable onPress={handleCloseMiniPlayer} style={styles.closeButton}>
              <X color="#fff" size={16} />
            </Pressable>
          </View>
          <View style={styles.miniPlayerVideo}>
            <YoutubePlayer
              height={160}
              width={width - 32}
              play={isPlaying}
              videoId={playingVideo.youtube_id}
              onChangeState={onStateChange}
              webViewStyle={{ borderRadius: 12 }}
            />
          </View>
        </Animated.View>
      )}

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
              colors={['#064AA3', '#0A5DC2']}
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
                        backgroundColor: playlist.def_background || '#064AA3',
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
                          Tap to add recitation
                        </Text>
                      </View>

                      {/* Add Button */}
                      <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: '#064AA3',
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
                  backgroundColor: '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}>
                  <Icon source="playlist-music" color="#94A3B8" size={32} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#475569' }}>No playlists yet</Text>
                <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, textAlign: 'center' }}>
                  Create a playlist to save recitations
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
    backgroundColor: '#064AA3',
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
    backgroundColor: '#064AA3',
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
    backgroundColor: '#064AA3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContent: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(6, 74, 163, 0.3)',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  heroIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
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
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  trackNumberContainer: {
    width: 40,
    height: 40,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#064AA3',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 14,
    color: '#888',
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
  trackActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButtonSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(6, 74, 163, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPlayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#064AA3',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
    overflow: 'hidden',
  },
  miniPlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  miniPlayerInfo: {
    flex: 1,
    marginRight: 12,
  },
  miniPlayerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  miniPlayerArtist: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPlayerVideo: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
})

export default QuranPlaylist
