import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert, Share, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
  ChevronRight,
  Star,
  MessageSquare,
  Bug,
  Lightbulb,
  ShoppingBag,
  User,
  Lock,
  Store,
  Briefcase
} from 'lucide-react-native';
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/lib/supabase';
import { Profile } from '@/src/types';
import SignInAnonModal from '@/src/components/SignInAnonModal';

export default function MoreScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile>();
  const [anonStatus, setAnonStatus] = useState(true);
  const [signInModalVisible, setSignInModalVisible] = useState(false);

  const getProfile = async () => {
    if (!session?.user.id) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', session?.user.id).single();
    if (data) {
      setProfile(data);
    }
  };

  const checkIfAnon = () => {
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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
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

  const MenuButton = ({ icon: IconComponent, label, onPress }: { icon: any; label: string; onPress?: () => void }) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <IconComponent color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
      <Text style={styles.menuButtonText}>{label}</Text>
      <ChevronRight color="rgba(255,255,255,0.5)" size={18} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#87CEEB', '#214E91', '#2A2A2A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
          {anonStatus ? (
            <TouchableOpacity 
              style={styles.signInButton} 
              onPress={() => setSignInModalVisible(true)}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.logoutButtonSmall} onPress={handleLogout}>
              <LogOut color="white" size={16} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <Text style={styles.profileName}>
            {anonStatus 
              ? 'Guest Account' 
              : `${profile?.first_name || ''}${profile?.last_name ? ' ' + profile.last_name : ''}`.trim() || 'User'
            }
          </Text>
          {!anonStatus && profile?.profile_email && (
            <Text style={styles.memberEmail}>{profile.profile_email}</Text>
          )}
          <Text style={styles.memberSince}>Member Since 2025</Text>
          
          {/* Invite Friends Button */}
          {!anonStatus && (
            <View style={styles.inviteButtonContainer}>
              <TouchableOpacity style={styles.inviteButton} onPress={handleInviteFriends}>
                <UserPlus color="white" size={20} strokeWidth={2.5} style={{ marginRight: 8 }} />
                <Text style={styles.inviteButtonText}>Invite Friends</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Content Sections */}
        <View style={styles.contentSections}>
          
          {/* MY ACTIVITY */}
          <Text style={styles.sectionLabel}>MY ACTIVITY</Text>
          <View style={styles.menuCard}>
            <MenuButton icon={Bookmark} label="Saved Programs/Events" />
            <MenuButton icon={ListVideo} label="Playlist" />
          </View>

          {/* NOTIFICATIONS */}
          <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
          <View style={styles.menuCard}>
            <MenuButton icon={Bell} label="Prayer" />
            <MenuButton 
              icon={Calendar} 
              label="Program" 
              onPress={() => router.push('/myPrograms/notifications')}
            />
            <MenuButton icon={PartyPopper} label="Event" />
            <MenuButton icon={Settings} label="Settings" />
          </View>

          {/* DONATION */}
          <Text style={styles.sectionLabel}>DONATION</Text>
          <View style={styles.menuCard}>
            <MenuButton icon={Heart} label="Phase 1" />
            <MenuButton icon={Heart} label="Phase 2" />
            <MenuButton icon={Eye} label="View Full Project" />
          </View>

          {/* MAS SHOP */}
          <Text style={styles.sectionLabel}>MAS SHOP</Text>
          <View style={styles.menuCard}>
            <MenuButton icon={ShoppingBag} label="Merch" />
            <MenuButton icon={Store} label="Programs/Events" />
          </View>

          {/* BUSINESS ADS */}
          <Text style={styles.sectionLabel}>BUSINESS ADS</Text>
          <View style={styles.menuCard}>
            <MenuButton icon={Briefcase} label="Start an Application" />
            <MenuButton icon={Eye} label="Check the Status" />
          </View>

          {/* EDIT PROFILE */}
          <Text style={styles.sectionLabel}>EDIT PROFILE</Text>
          <View style={styles.menuCard}>
            <MenuButton icon={User} label="Profile Page" />
            <MenuButton icon={Lock} label="Username and Password" />
            <MenuButton icon={Lock} label="Change Password" />
          </View>

          {/* LEAVE A COMMENT */}
          <Text style={styles.sectionLabel}>LEAVE A COMMENT</Text>
          <View style={styles.menuCard}>
            <MenuButton icon={Lightbulb} label="Feature Request" />
            <MenuButton icon={Bug} label="Report a Bug" />
            <MenuButton icon={MessageSquare} label="Other Comments" />
          </View>

          {/* Admin Panel - Only show for admins */}
          {profile?.role === 'ADMIN' && (
            <>
              <Text style={styles.sectionLabel}>ADMIN</Text>
              <View style={styles.menuCard}>
                <MenuButton 
                  icon={Star} 
                  label="Admin Panel" 
                  onPress={() => router.push('/more/Admin/AdminScreen')}
                />
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

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Created By</Text>
            <Text style={styles.footerBrand}>AppFlow Creations</Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:appflowcreations@gmail.com')}>
              <Text style={styles.footerEmail}>appflowcreations@gmail.com</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Sign In Modal for Anonymous Users */}
      <SignInAnonModal visible={signInModalVisible} setVisible={() => setSignInModalVisible(false)} />
    </LinearGradient>
  );
}

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
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  signInButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  signInButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  logoutButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
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
  avatarIcon: {
    fontSize: 40,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginBottom: 12,
  },
  inviteButtonContainer: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(160, 170, 190, 0.55)',
  },
  inviteButton: {
    paddingVertical: 14,
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
    paddingHorizontal: 16,
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
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuButtonText: {
    fontSize: 17,
    fontWeight: '600',
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
    paddingVertical: 14,
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
  footer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  footerBrand: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  footerEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
