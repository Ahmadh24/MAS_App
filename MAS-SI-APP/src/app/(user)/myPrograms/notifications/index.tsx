import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Pressable, Platform, Image } from 'react-native';
import { Stack, useRouter, useNavigation } from 'expo-router';
import { Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { Bell } from 'lucide-react-native';

export default function NotificationsIndex() {
  const router = useRouter();
  const navigation = useNavigation();

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Notifications',
          headerBackTitleVisible: false,
          headerTintColor: '#007AFF',
          headerTitleStyle: { color: 'black' },
          headerStyle: { backgroundColor: 'white' },
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable
              style={{ 
                marginLeft: 0, 
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
              <Icon source={'chevron-left'} color='black' size={28} />
            </Pressable>
          ),
          headerRight: () => null,
        }}
      />
      <LinearGradient
        colors={['#FFFFFF', '#6BA8D1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
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
                onPress={() => {
                  router.push('/myPrograms/notifications/NotificationEvents');
                }}
              >
                <Bell color="#1a1a1a" size={20} strokeWidth={2.5} style={{ marginRight: 10 }} />
                <Text style={styles.enableButtonTextGlass}>Enable Push Notifications</Text>
              </TouchableOpacity>
            </LiquidGlassView>
          ) : (
            <TouchableOpacity 
              style={styles.enableButton}
              onPress={() => {
                router.push('/myPrograms/notifications/NotificationEvents');
              }}
            >
              <Bell color="white" size={20} strokeWidth={2.5} style={{ marginRight: 10 }} />
              <Text style={styles.enableButtonText}>Enable Push Notifications</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardTitleGlass: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  cardSubtitleGlass: {
    fontSize: 14,
    color: '#333333',
  },
  cardTime: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 8,
  },
  cardTimeGlass: {
    fontSize: 12,
    color: '#444444',
    marginLeft: 8,
  },
  mainContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  noNotificationsText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 24,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 999,
    minWidth: 280,
    justifyContent: 'center',
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
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

