import { View, Text, Pressable, ScrollView, useWindowDimensions, Image, StyleSheet, Platform } from 'react-native'
import { Link, Stack, useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { Icon } from "react-native-paper"
import { supabase } from '@/src/lib/supabase'
import { useAuth } from "@/src/providers/AuthProvider"
import { UserPlaylistType } from '@/src/types'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { Heart, Music2, BookOpen, Sparkles, Play, ChevronRight, Plus, LogIn } from 'lucide-react-native'
import CreatePlaylistBottomSheet from '@/src/components/UserProgramComponets/CreatePlaylistBottomSheet'
import SignInAnonModal from '@/src/components/SignInAnonModal'

const PlaylistIndex = () => {
  const { session } = useAuth()
  const [userPlayLists, setUserPlaylists] = useState<UserPlaylistType[]>([])
  const { width } = useWindowDimensions()
  const cardWidth = (width - 48) / 2
  const bottomSheetRef = useRef<{ present: () => void; dismiss: () => void; snapToIndex: (index: number) => void }>(null)
  const [signInModalVisible, setSignInModalVisible] = useState(false)
  const router = useRouter()

  const isAnonymous = session?.user?.is_anonymous ?? true

  const handlePresentModalPress = () => {
    if (isAnonymous) {
      setSignInModalVisible(true)
    } else {
      bottomSheetRef.current?.present()
    }
  }

  const getUserPlaylists = async () => {
    const { data: user_playlist, error } = await supabase.from("user_playlist").select("*").eq("user_id", session?.user.id)
    if (error) {
      console.log(error)
    }
    if (user_playlist) {
      setUserPlaylists(user_playlist)
    }
  }

  useEffect(() => {
    getUserPlaylists()

    const listenForUserPlaylistChanges = supabase
      .channel('listen for user playlist change')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: "user_playlist",
        },
        async (payload) => await getUserPlaylists()
      )
      .subscribe()

    return () => { supabase.removeChannel(listenForUserPlaylistChanges) }
  }, [])

  // Featured Playlist Card Component
  const FeaturedCard = ({ 
    title, 
    subtitle, 
    icon: IconComponent, 
    iconColor,
    gradientColors, 
    href,
    delay = 0,
    backgroundImage
  }: { 
    title: string
    subtitle: string
    icon: any
    iconColor: string
    gradientColors: [string, string, string]
    href: string
    delay?: number
    backgroundImage?: any
  }) => (
    <Animated.View 
      entering={FadeInDown.delay(delay).springify()}
      style={{ width: cardWidth, marginBottom: 16 }}
    >
      <Link href={href as any} asChild>
        <Pressable>
          {({ pressed }) => (
            <View style={[styles.featuredCard, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
              {backgroundImage && (
                <Image 
                  source={backgroundImage}
                  style={styles.featuredCardBackground}
                  resizeMode="cover"
                />
              )}
              {backgroundImage ? (
                <View style={styles.featuredCardGradient}>
                  <View style={styles.featuredCardIcon}>
                    <IconComponent color={iconColor} size={32} strokeWidth={1.5} />
                  </View>
                  <View style={styles.featuredCardContent}>
                    <Text style={styles.featuredCardTitle}>{title}</Text>
                    <Text style={styles.featuredCardSubtitle}>{subtitle}</Text>
                  </View>
                  <View style={styles.playButton}>
                    <Play color="#fff" size={16} fill="#fff" />
                  </View>
                </View>
              ) : (
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featuredCardGradient}
                >
                  <View style={styles.featuredCardIcon}>
                    <IconComponent color={iconColor} size={32} strokeWidth={1.5} />
                  </View>
                  <View style={styles.featuredCardContent}>
                    <Text style={styles.featuredCardTitle}>{title}</Text>
                    <Text style={styles.featuredCardSubtitle}>{subtitle}</Text>
                  </View>
                  <View style={styles.playButton}>
                    <Play color="#fff" size={16} fill="#fff" />
                  </View>
                </LinearGradient>
              )}
            </View>
          )}
        </Pressable>
      </Link>
    </Animated.View>
  )

  // User Playlist Card Component
  const PlaylistCard = ({ playlist, index }: { playlist: UserPlaylistType, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(300 + index * 100).springify()}
      style={{ width: cardWidth, marginBottom: 16 }}
    >
      <Link href={`/myPrograms/playlists/${playlist.playlist_id}`} asChild>
        <Pressable>
          {({ pressed }) => (
            <View style={[styles.playlistCard, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
              {playlist.playlist_img ? (
                <Image 
                  source={{ uri: playlist.playlist_img }}
                  style={styles.playlistImage}
                />
              ) : (
                <View style={[styles.playlistImagePlaceholder, { backgroundColor: playlist.def_background || '#6366F1' }]}>
                  <Music2 color="rgba(255,255,255,0.8)" size={40} strokeWidth={1.5} />
                </View>
              )}
              <View style={styles.playlistCardOverlay}>
                <Text style={styles.playlistCardTitle} numberOfLines={1}>{playlist.playlist_name}</Text>
              </View>
            </View>
          )}
        </Pressable>
      </Link>
    </Animated.View>
  )

  // Create New Playlist Card
  const CreatePlaylistCard = () => {
    return (
      <Animated.View 
        entering={FadeInDown.delay(200).springify()}
        style={{ width: cardWidth, marginBottom: 16 }}
      >
        <Pressable onPress={handlePresentModalPress}>
          {({ pressed }) => (
            <LinearGradient
              colors={isAnonymous ? ['#6B7280', '#4B5563', '#374151'] : ['#007AFF', '#0051D5', '#0039A3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.createCard, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <View style={styles.createCardContent}>
                <View style={styles.createCardIcon}>
                  {isAnonymous ? (
                    <LogIn color="#fff" size={28} strokeWidth={2.5} />
                  ) : (
                    <Plus color="#fff" size={28} strokeWidth={2.5} />
                  )}
                  <View style={styles.createCardIconGlow} />
                </View>
                <View style={styles.createCardTextContainer}>
                  <Text style={styles.createCardTitle}>
                    {isAnonymous ? 'Sign In' : 'Create Playlist'}
                  </Text>
                  <Text style={styles.createCardSubtitle}>
                    {isAnonymous ? 'To create playlists' : 'Start your collection'}
                  </Text>
                </View>
                <View style={styles.createCardSparkle}>
                  <Sparkles color="rgba(255, 255, 255, 0.6)" size={16} />
                </View>
              </View>
            </LinearGradient>
          )}
        </Pressable>
      </Animated.View>
    )
  }


  return (
    <LinearGradient
      colors={['#FFFFFF', '#E8F4FD', '#D1E8FA']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <Stack.Screen 
        options={{ 
          title: '',
          headerBackTitleVisible: false,
          headerTintColor: '#0E519F',
          headerStyle: { backgroundColor: 'transparent' },
          headerTransparent: true,
          headerShadowVisible: false,
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        bounces={true}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.header}>
          <Text style={styles.headerTitle}>Your Library</Text>
        </Animated.View>

        {/* Favorites Section */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Link href="/myPrograms/likedLectures/AllLikedLectures" asChild>
            <Pressable style={styles.favoritesCard}>
              {({ pressed }) => (
                <View style={[styles.favoritesContainer, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                  <View style={styles.favoritesContent}>
                    <View style={styles.favoritesIconWrapper}>
                      <Heart color="#fff" size={28} />
                    </View>
                    <View style={styles.favoritesTextWrapper}>
                      <Text style={styles.favoritesTitle}>Favorite Lectures</Text>
                      <Text style={styles.favoritesSubtitle}>Tap the heart on any lecture to save</Text>
                    </View>
                  </View>
                  <View style={styles.favoritesArrow}>
                    <ChevronRight color="rgba(255,255,255,0.8)" size={24} />
                  </View>
                </View>
              )}
            </Pressable>
          </Link>
        </Animated.View>

        {/* Section Header */}
        <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Collections</Text>
        </Animated.View>

        {/* Featured Playlists Grid */}
        <View style={styles.grid}>
          <FeaturedCard 
            title="Quran"
            subtitle="Recitations"
            icon={BookOpen}
            iconColor="#fff"
            gradientColors={['#10B981', '#059669', '#047857']}
            href="/myPrograms/playlists/QuranPlaylist"
            delay={300}
            backgroundImage={require('@/assets/images/Sheikh.png')}
          />
          <FeaturedCard 
            title="Athkar"
            subtitle="Daily Dhikr"
            icon={Sparkles}
            iconColor="#fff"
            gradientColors={['#8B5CF6', '#7C3AED', '#6D28D9']}
            href="/myPrograms/playlists/AthkarPlaylist"
            delay={350}
            backgroundImage={require('@/assets/images/AthkarImage.png')}
          />
        </View>

        {/* User Playlists Section */}
        {(userPlayLists.length > 0 || userPlayLists.length === 0) && (
          <>
            <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Playlists</Text>
              <Text style={styles.playlistCount}>{userPlayLists.length} playlist{userPlayLists.length !== 1 ? 's' : ''}</Text>
            </Animated.View>

            <View style={styles.grid}>
              <CreatePlaylistCard />
              {userPlayLists.map((playlist, index) => (
                <PlaylistCard key={playlist.playlist_id} playlist={playlist} index={index} />
              ))}
            </View>
          </>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {!isAnonymous && <CreatePlaylistBottomSheet ref={bottomSheetRef} />}
      <SignInAnonModal visible={signInModalVisible} setVisible={() => setSignInModalVisible(false)} />
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 20 : 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  favoritesCard: {
    marginBottom: 24,
  },
  favoritesContainer: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#064AA3',
    shadowColor: '#064AA3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  favoritesContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  favoritesIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  favoritesTextWrapper: {
    flex: 1,
  },
  favoritesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  favoritesSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  favoritesArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  playlistCount: {
    fontSize: 14,
    color: '#888',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featuredCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
  },
  featuredCardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  featuredCardGradient: {
    padding: 16,
    height: 180,
    justifyContent: 'space-between',
    position: 'relative',
  },
  featuredCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredCardContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  featuredCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  featuredCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  playButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistCard: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  playlistImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playlistImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  playlistCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  createCard: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  createCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    position: 'relative',
    zIndex: 1,
  },
  createCardIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    position: 'relative',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  createCardIconGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: -1,
  },
  createCardTextContainer: {
    alignItems: 'center',
  },
  createCardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.3,
  },
  createCardSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '500',
  },
  createCardSparkle: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
  },
})

export default PlaylistIndex
