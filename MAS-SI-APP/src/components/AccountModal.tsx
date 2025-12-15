import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { 
  X, 
  UserPlus, 
  LogOut, 
  Bookmark, 
  ListVideo, 
  Bell, 
  Calendar, 
  PartyPopper, 
  Settings, 
  Heart, 
  Eye 
} from 'lucide-react-native';

interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AccountModal({ visible, onClose }: AccountModalProps) {
  const router = useRouter();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
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
            <View style={styles.closeButton}>
              <TouchableOpacity style={styles.closeButtonInner} onPress={onClose}>
                <X color="white" size={20} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <Text style={styles.profileName}>Ahmad Hamoudeh</Text>
          <Text style={styles.memberSince}>Member Since 2025</Text>
          
          {/* Invite Friends Button */}
          <View style={styles.inviteButtonContainer}>
            <TouchableOpacity style={styles.inviteButton}>
              <UserPlus color="white" size={20} strokeWidth={2.5} style={{ marginRight: 8 }} />
              <Text style={styles.inviteButtonText}>Invite Friends</Text>
            </TouchableOpacity>
          </View>
        </View>

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
            <TouchableOpacity style={styles.menuButton}>
              <Bell color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>Prayer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => {
                onClose();
                router.push('/myPrograms/notifications');
              }}
            >
              <Calendar color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>Program</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton}>
              <PartyPopper color="white" size={20} strokeWidth={2.5} style={{ marginRight: 12 }} />
              <Text style={styles.menuButtonText}>Event</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton}>
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

          {/* Logout Button */}
          <View style={styles.logoutButtonContainer}>
            <TouchableOpacity style={styles.logoutButton}>
              <LogOut color="white" size={20} strokeWidth={2.5} style={{ marginRight: 8 }} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
    </Modal>
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
    paddingBottom: 40,
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
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(160, 170, 190, 0.55)',
  },
  closeButtonInner: {
    flex: 1,
            alignItems: 'center',
                justifyContent: 'center',
    backgroundColor: 'transparent',
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
  avatarIcon: {
    fontSize: 40,
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
});



