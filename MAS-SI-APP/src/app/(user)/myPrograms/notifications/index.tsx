import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Pressable, Platform, Image, Modal, Dimensions } from 'react-native';
import { Stack, useRouter, useNavigation } from 'expo-router';
import { Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { Bell } from 'lucide-react-native';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

export default function NotificationsIndex() {
  const router = useRouter();
  const navigation = useNavigation();
  const [showAnimation, setShowAnimation] = useState(false);
  const lottieRef = useRef<LottieView>(null);

  const handleEnableNotifications = () => {
    setShowAnimation(true);
    // Animation plays for 2.5 seconds then navigates
    setTimeout(() => {
      setShowAnimation(false);
      router.push('/myPrograms/notifications/NotificationEvents');
    }, 2500);
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }}
      />
      <LinearGradient
        colors={['#1d4681', '#3183bf']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Custom Header */}
          <View style={{ paddingTop: 30, paddingHorizontal: 0, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Pressable
              style={{ 
                width: 40, 
                height: 40, 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
              onPress={() => {
                navigation.getParent()?.getState().index == 0 
                  ? router.replace('/myPrograms') 
                  : router.back();
              }}
            >
              <Icon source={'chevron-left'} color='white' size={28} />
            </Pressable>
            <Text style={{ 
              color: 'white', 
              fontSize: 20, 
              fontWeight: '600', 
              flex: 1, 
              textAlign: 'center',
              marginRight: 40,
            }}>
              Notifications
            </Text>
          </View>

        {/* Notification Cards */}
        <View style={styles.notificationCards}>
          {isLiquidGlassSupported ? (
            <LiquidGlassView style={styles.notificationCardGlass} interactive effect="clear">
              <View style={styles.notificationCardInner}>
                <Image 
                  source={require('@/assets/images/glowingTree.png')} 
                  style={styles.cardIconImage}
                  resizeMode="contain"
                />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitleGlass}>Tonight's Isha is at 9:15 PM</Text>
                  <Text style={styles.cardSubtitleGlass}>Tap to view full prayer times.</Text>
                </View>
                <Text style={styles.cardTimeGlass}>1h ago</Text>
              </View>
            </LiquidGlassView>
          ) : (
            <View style={styles.notificationCard}>
              <Image 
                source={require('@/assets/images/glowingTree.png')} 
                style={styles.cardIconImage}
                resizeMode="contain"
              />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Tonight's Isha is at 9:15 PM</Text>
                <Text style={styles.cardSubtitle}>Tap to view full prayer times.</Text>
              </View>
              <Text style={styles.cardTime}>1h ago</Text>
            </View>
          )}

          {isLiquidGlassSupported ? (
            <LiquidGlassView style={styles.notificationCardGlass} interactive effect="clear">
              <View style={styles.notificationCardInner}>
                <Image 
                  source={require('@/assets/images/glowingTree.png')} 
                  style={styles.cardIconImage}
                  resizeMode="contain"
                />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitleGlass}>Community event this weekend</Text>
                  <Text style={styles.cardSubtitleGlass}>Tap to see details for the Family Night program.</Text>
                </View>
                <Text style={styles.cardTimeGlass}>Yesterday</Text>
              </View>
            </LiquidGlassView>
          ) : (
            <View style={styles.notificationCard}>
              <Image 
                source={require('@/assets/images/glowingTree.png')} 
                style={styles.cardIconImage}
                resizeMode="contain"
              />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Community event this weekend</Text>
                <Text style={styles.cardSubtitle}>Tap to see details for the Family Night program.</Text>
              </View>
              <Text style={styles.cardTime}>Yesterday</Text>
            </View>
          )}
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.noNotificationsText}>No Notifications Yet</Text>
          
          <Text style={styles.descriptionText}>
            You'll get updates here for prayer time changes, community announcements, upcoming events, and new messages from MAS SI.
          </Text>
          
          <Text style={styles.instructionText}>
            To get push notifications on your device, go to settings and enable Push Notifications.
          </Text>

          {/* Enable Push Notifications Button - with Liquid Glass effect */}
          {isLiquidGlassSupported ? (
            <LiquidGlassView
              style={styles.liquidGlassButton}
              interactive
              effect="clear"
            >
              <TouchableOpacity 
                style={styles.enableButtonInner}
                onPress={handleEnableNotifications}
              >
                <Bell color="#1a1a1a" size={20} strokeWidth={2.5} style={{ marginRight: 10 }} />
                <Text style={styles.enableButtonTextGlass}>Enable Push Notifications</Text>
              </TouchableOpacity>
            </LiquidGlassView>
          ) : (
            <TouchableOpacity 
              style={styles.enableButton}
              onPress={handleEnableNotifications}
            >
              <Bell color="#6EE7B7" size={20} strokeWidth={2.5} style={{ marginRight: 10 }} />
              <Text style={styles.enableButtonText}>Enable Push Notifications</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      </LinearGradient>

      {/* Lottie Animation Overlay */}
      <Modal
        visible={showAnimation}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.animationOverlay}>
          <LottieView
            ref={lottieRef}
            source={require('@/assets/animations/otp-notification.json')}
            autoPlay
            loop={false}
            speed={1.2}
            style={styles.lottieAnimation}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    paddingTop: 0,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  headerRightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerRightText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationCards: {
    marginBottom: 40,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  notificationCardGlass: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  notificationCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIconImage: {
    width: 72,
    height: 72,
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  cardTitleGlass: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  cardSubtitleGlass: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  cardTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 8,
  },
  cardTimeGlass: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 8,
  },
  mainContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  noNotificationsText: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    marginBottom: 24,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(110, 231, 183, 0.25)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 999,
    minWidth: 280,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(110, 231, 183, 0.5)',
  },
  liquidGlassButton: {
    borderRadius: 999,
    overflow: 'hidden',
    minWidth: 280,
  },
  enableButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 36,
    justifyContent: 'center',
  },
  enableButtonTextGlass: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSquare: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 2,
    position: 'absolute',
  },
  iconPlus: {
    position: 'absolute',
    width: 8,
    height: 2,
    backgroundColor: 'white',
    top: 9,
    left: 6,
  },
  enableButtonText: {
    color: '#6EE7B7',
    fontSize: 16,
    fontWeight: '600',
  },
  animationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: width * 0.8,
    height: width * 0.8,
  },
});

