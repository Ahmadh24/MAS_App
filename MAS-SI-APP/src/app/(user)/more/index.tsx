import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Share, Platform, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Link } from 'expo-router';
import { 
  UserPlus, 
  LogOut, 
  Bookmark, 
  ListVideo, 
  Bell, 
  Calendar, 
  PartyPopper, 
  Settings, 
  Heart, 
  Eye,
  User,
  ChevronRight,
  Sparkles,
  Target
} from 'lucide-react-native';
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/lib/supabase';
import { Profile } from '@/src/types';
import SignInAnonModal from '@/src/components/SignInAnonModal';
import { useOnboarding } from '@/src/providers/OnboardingProvider';

const Index = () => {
  const router = useRouter();
  const { session } = useAuth();
  const { isOnboardingIncomplete, showOnboardingSheet } = useOnboarding();
  const [profile, setProfile] = useState<Profile>();
  const [visible, setVisible] = useState(false);
  const [anonStatus, setAnonStatus] = useState(true);
  const [preferencesCompleted, setPreferencesCompleted] = useState(true);

  const getProfile = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', session?.user.id).single();
    if (data) {
      setProfile(data);
      // Check if user has completed personalization preferences
      // If interests array is empty or null, preferences are not completed
      const hasCompletedPreferences = data.interests && data.interests.length > 0;
      setPreferencesCompleted(hasCompletedPreferences);
    }
  };

  const checkIfAnon = async () => {
    if (session?.user.is_anonymous) {
      setAnonStatus(true);
    } else {
      setAnonStatus(false);
    }
  };

  useEffect(() => {
    getProfile();
  }, [session]);

  useEffect(() => {
    checkIfAnon();
  }, [session]);

  const getMemberSinceYear = () => {
    if (profile?.created_at) {
      return new Date(profile.created_at).getFullYear();
    }
    return new Date().getFullYear();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {}
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('profiles').update({ push_notification_token: null }).eq('id', session?.user.id);
            if (session?.user.is_anonymous) {
              await supabase.functions.invoke('delete-user', {
                body: { user_id: session.user.id }
              });
            }
            await supabase.auth.signOut();
          }
        }
      ]
    );
  };

  const handleInviteFriends = async () => {
    try {
      await Share.share({
        message: '🕌 Join me at MAS Staten Island! Download the app to stay connected with our community, prayer times, events, and more!\n\nhttps://massic.org',
        title: 'Join MAS Staten Island'
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <LinearGradient
      colors={['#87CEEB', '#214E91', '#2A2A2A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={{ position: 'relative' }}>
            <View style={styles.avatarContainer}>
              <User color="#87CEEB" size={40} strokeWidth={1.5} />
            </View>
            {/* Notification badge on avatar for incomplete profile or preferences */}
            {((isOnboardingIncomplete || !preferencesCompleted) && !anonStatus) && (
              <View style={[
                styles.avatarBadge, 
                !isOnboardingIncomplete && !preferencesCompleted && styles.avatarBadgeBlue
              ]}>
                {isOnboardingIncomplete ? (
                  <Text style={styles.avatarBadgeText}>!</Text>
                ) : (
                  <Sparkles color="#ffffff" size={12} strokeWidth={2.5} />
                )}
              </View>
            )}
          </View>
          <Text style={styles.profileName}>
            {anonStatus 
              ? 'Guest Account' 
              : `${profile?.first_name || ''}${profile?.last_name ? ' ' + profile.last_name : ''}`.trim() || 'User'}
          </Text>
          <Text style={styles.memberSince}>Member Since {getMemberSinceYear()}</Text>
          
          {/* Invite Friends Button */}
          {!anonStatus && (
            <View style={styles.inviteButtonContainer}>
              <TouchableOpacity style={styles.inviteButton} onPress={handleInviteFriends}>
                <UserPlus color="white" size={20} strokeWidth={2.5} style={{ marginRight: 8 }} />
                <Text style={styles.inviteButtonText}>Invite Friends</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sign In & Sign Up Buttons for Anonymous Users */}
          {anonStatus && (
            <View style={styles.authButtonsRow}>
              <View style={[styles.inviteButtonContainer, { flex: 1 }]}>
                <TouchableOpacity style={styles.inviteButton} onPress={() => setVisible(true)}>
                  <Text style={styles.inviteButtonText}>Sign In</Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.inviteButtonContainer, { flex: 1 }]}>
                <TouchableOpacity style={styles.inviteButton} onPress={() => router.push('/(auth)/SignUp')}>
                  <Text style={styles.inviteButtonText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Setup Cards - Profile & Preferences */}
        {!anonStatus && (
          <View style={styles.contentSections}>
            <View style={styles.setupCardsRow}>
              {/* Complete Profile Card */}
              <TouchableOpacity 
                style={[
                  styles.setupCard,
                  isOnboardingIncomplete && styles.setupCardIncomplete,
                  !isOnboardingIncomplete && styles.setupCardComplete
                ]}
                onPress={() => showOnboardingSheet()}
                disabled={!isOnboardingIncomplete}
              >
                <View style={[
                  styles.setupCardIcon,
                  isOnboardingIncomplete && styles.setupCardIconIncomplete,
                  !isOnboardingIncomplete && styles.setupCardIconComplete
                ]}>
                  {isOnboardingIncomplete ? (
                    <User color="#ffffff" size={20} strokeWidth={2} />
                  ) : (
                    <Target color="#ffffff" size={20} strokeWidth={2} />
                  )}
                </View>
                {isOnboardingIncomplete && <View style={styles.setupCardBadge} />}
                <Text style={[
                  styles.setupCardTitle,
                  !isOnboardingIncomplete && styles.setupCardTitleComplete
                ]}>
                  {isOnboardingIncomplete ? 'Complete Profile' : 'Profile Complete'}
                </Text>
                <Text style={[
                  styles.setupCardSubtitle,
                  !isOnboardingIncomplete && styles.setupCardSubtitleComplete
                ]}>
                  {isOnboardingIncomplete ? 'Phone & details' : 'All set!'}
                </Text>
                {!isOnboardingIncomplete && (
                  <View style={styles.checkmarkBadge}>
                    <Target color="#fff" size={10} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Personalize Experience Card */}
              <TouchableOpacity 
                style={[
                  styles.setupCard,
                  preferencesCompleted && styles.setupCardComplete
                ]}
                onPress={() => router.push('/more/PreferencesOnboarding')}
              >
                <View style={[
                  styles.setupCardIcon,
                  preferencesCompleted && styles.setupCardIconComplete
                ]}>
                  <Sparkles color="#ffffff" size={20} strokeWidth={2} />
                </View>
                {!preferencesCompleted && <View style={styles.setupCardBadge} />}
                <Text style={[
                  styles.setupCardTitle,
                  preferencesCompleted && styles.setupCardTitleComplete
                ]}>
                  {!preferencesCompleted ? 'Personalize' : 'Personalized'}
                </Text>
                <Text style={[
                  styles.setupCardSubtitle,
                  preferencesCompleted && styles.setupCardSubtitleComplete
                ]}>
                  {!preferencesCompleted ? 'Interests & times' : 'Tap to edit'}
                </Text>
                {preferencesCompleted && (
                  <View style={styles.checkmarkBadge}>
                    <Sparkles color="#fff" size={10} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Content Sections */}
        <View style={styles.contentSections}>
          
          {/* MY ACTIVITY */}
          <Text style={styles.sectionLabel}>MY ACTIVITY</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuButton}>
              <Bookmark color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>Saved Programs/Events</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton}>
              <ListVideo color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>Playlist</Text>
            </TouchableOpacity>
          </View>

          {/* NOTIFICATIONS */}
          <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => {
                router.push({
                  pathname: '/myPrograms/notifications/NotificationEvents',
                  params: { initialTab: 'prayer' }
                });
              }}
            >
              <Bell color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>Prayer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => {
                router.push({
                  pathname: '/myPrograms/notifications/NotificationEvents',
                  params: { initialTab: 'programs' }
                });
              }}
            >
              <Calendar color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>Program</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => {
                router.push({
                  pathname: '/myPrograms/notifications/NotificationEvents',
                  params: { initialTab: 'programs' }
                });
              }}
            >
              <PartyPopper color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>Event</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => {
                Linking.openSettings();
              }}
            >
              <Settings color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>Setting</Text>
            </TouchableOpacity>
          </View>

          {/* DONATION */}
          <Text style={styles.sectionLabel}>DONATION</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuButton}>
              <Heart color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>Phase 1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton}>
              <Heart color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>Phase 2</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton}>
              <Eye color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>View Full Project</Text>
            </TouchableOpacity>
          </View>

          {/* Admin Panel - Only show for ADMIN users */}
          {profile?.role === 'ADMIN' && (
            <>
              <Text style={styles.sectionLabel}>ADMIN</Text>
              <View style={styles.menuCard}>
                <Link href="/more/Admin/AdminScreen" asChild>
                  <TouchableOpacity style={styles.menuButton}>
                    <Settings color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
                    <Text style={styles.menuButtonText}>Admin Panel</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </>
          )}

          {/* Logout Button */}
          {!anonStatus && (
            <View style={styles.logoutButtonContainer}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <LogOut color="white" size={20} strokeWidth={2.5} style={{ marginRight: 8 }} />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <SignInAnonModal visible={visible} setVisible={() => setVisible(false)} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 30,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(160, 170, 190, 0.5)',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginBottom: 12,
  },
  authButtonsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  inviteButtonContainer: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(160, 170, 190, 0.55)',
  },
  inviteButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  inviteButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 17,
  },
  contentSections: {
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'white',
    opacity: 0.9,
    marginBottom: 10,
    marginTop: 8,
  },
  menuCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: 'rgba(160, 170, 190, 0.55)',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  menuButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
  },
  logoutButtonContainer: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
    backgroundColor: 'rgba(160, 170, 190, 0.55)',
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 17,
  },
  avatarBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#87CEEB',
  },
  avatarBadgeBlue: {
    backgroundColor: '#0F4184',
  },
  avatarBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  // Setup Cards Styles
  setupCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  setupCard: {
    flex: 1,
    backgroundColor: 'rgba(160, 170, 190, 0.55)',
    borderRadius: 16,
    padding: 12,
    paddingTop: 14,
    paddingBottom: 12,
    alignItems: 'center',
    borderWidth: 0,
    borderColor: 'transparent',
    position: 'relative',
    minHeight: 110,
  },
  setupCardIncomplete: {
    backgroundColor: 'rgba(160, 170, 190, 0.55)',
    borderColor: 'transparent',
  },
  setupCardComplete: {
    backgroundColor: 'rgba(160, 170, 190, 0.55)',
    borderColor: 'transparent',
  },
  setupCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  setupCardIconIncomplete: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  setupCardIconComplete: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  setupCardBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  setupCardTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 2,
  },
  setupCardTitleComplete: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  setupCardSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    textAlign: 'center',
  },
  setupCardSubtitleComplete: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default Index;

