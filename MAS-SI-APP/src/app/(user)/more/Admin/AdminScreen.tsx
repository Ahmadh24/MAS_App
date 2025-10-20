import { ScrollView, StyleSheet, Text, useWindowDimensions, View, Pressable } from "react-native";
import React, { useState } from "react";
import { Stack, Link } from "expo-router";
import { Icon } from "react-native-paper";
import Svg, { Path } from "react-native-svg";
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from "react-native-reanimated";

const AdminOptions : { title : string, screens : { buttonTitle : string, link : string }[] }[] = [
  {
  title : 'Push Notifications', screens : [
    { buttonTitle : 'Create A Notification For All Users ', link : '/more/Admin/SendToEveryoneScreen'},
    { buttonTitle : 'Create A Program Notification', link : '/more/Admin/NotiPrograms'},
    { buttonTitle : 'Create A Event Notification', link : '/more/Admin/NotiEvents'}
   ]
  },{
    title : 'Programs', screens : [
      { buttonTitle : 'Create a new Program', link : '/more/Admin/AddNewProgramScreen' },
      { buttonTitle : 'Edit existing Programs', link : '/more/Admin/ProgramsScreen'},
      { buttonTitle : 'Delete a Program', link : '/more/Admin/DeleteProgramScreen'}
    ]
  },
  {
    title : 'Events', screens : [
      { buttonTitle : 'Create a new Event', link : '/more/Admin/AddNewEventScreen' },
      { buttonTitle : 'Edit existing Events', link : '/more/Admin/EventsScreen'},
      { buttonTitle : 'Delete a Event', link : '/more/Admin/DeleteEventScreen'}
    ]
  },
  {
    title : 'Business Advertisement', screens : [
      { buttonTitle : 'View and Review Submissions', link : '/more/Admin/BusinessAdsApprovalScreen'},
      { buttonTitle : 'Edit Approved Fliers', link : '/more/Admin/ApprovedAdsScreen'},
    ]
  },
  /* 
  {
    title : 'Donations', screens : [
      { buttonTitle : 'Create a new Category', link : '/more/Admin/CreateNewDonationProject'},
      { buttonTitle : 'Edit an existing Category', link : '/more/Admin/EditDonationCategory'}
    ]
  }
  */
  {
    title : 'Jummah', screens : [
      { buttonTitle : 'First Jummah', link : '/more/Admin/JummahDetails/1'},
      { buttonTitle : 'Second Jummah', link : '/more/Admin/JummahDetails/2'},
      { buttonTitle : 'Third Jummah', link : '/more/Admin/JummahDetails/3'},
      { buttonTitle : 'Student Jummah', link : '/more/Admin/JummahDetails/4'},
    ]
  },
  {
    title : 'Speaker & Sheik Info', screens : [
      { buttonTitle : 'Add New Speaker or Sheik Info', link : '/more/Admin/AddNewSpeaker'},
      { buttonTitle : 'Edit Speaker or Sheik Info', link : '/more/Admin/SpeakersScreen'},
      { buttonTitle : 'Delete a Speaker or Sheik', link : '/more/Admin/DeleteSpeakers'},
    ]
  },
  {
    title: 'Ramdan Quran Tracker', screens : [
      { buttonTitle : 'Update Information', link : '/more/Admin/RamadanQuranTracker'}
    ]
  }
]
// Dropdown Component
const AdminDropdown = ({ option, index }: { option: any, index: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const height = useSharedValue(0);

  const animatedRotation = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const animatedHeight = useAnimatedStyle(() => ({
    height: height.value,
    opacity: height.value > 0 ? 1 : 0,
  }));

  const toggleDropdown = () => {
    setIsExpanded(!isExpanded);
    rotation.value = withTiming(isExpanded ? 0 : 90, { duration: 200 });
    height.value = withTiming(isExpanded ? 0 : option.screens.length * 60 + 20, { duration: 200 });
  };

  return (
    <View className="mb-4">
      {/* Pill-shaped main button */}
      <Pressable
        onPress={toggleDropdown}
        className={`rounded-full px-6 py-4 flex-row items-center justify-between ${
          index % 2 === 0 ? 'bg-blue-500' : 'bg-gray-600'
        }`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2
        }}
      >
        <Text className="text-white font-semibold text-lg flex-1">
          {option.title}
        </Text>
        <Animated.View style={animatedRotation}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path 
              d="M9 18L15 12L9 6" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      </Pressable>

      {/* Dropdown content */}
      <Animated.View style={[animatedHeight, { overflow: 'hidden' }]}>
        <View className="mt-3 space-y-3">
          {option.screens.map((screen: any, screenIndex: number) => (
            <Link key={screen.link} href={screen.link} asChild>
              <Pressable 
                className="bg-white rounded-xl p-4 flex-row items-center justify-between ml-4"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1
                }}
              >
                <Text className="text-gray-800 font-medium text-base flex-1 mr-3">
                  {screen.buttonTitle}
                </Text>
                <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <Path 
                    d="M7.5 15L12.5 10L7.5 5" 
                    stroke="#6077F5" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </Svg>
              </Pressable>
            </Link>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const AdminScreen = () => {
  return (
    <View className='flex-1 bg-white'>
      <Stack.Screen
        options={{
          title: "",
          headerBackTitleVisible: false,
          headerTintColor: "#1B85FF",
          headerStyle: { backgroundColor: "white" },
        }}
      />
      
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Admin Portal Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="bg-white rounded-2xl p-6 shadow-sm" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3
          }}>
            <Text className="text-2xl font-bold text-black text-center">Admin Portal</Text>
          </View>
        </View>

        {/* Admin Options with Dropdowns */}
        <View className="px-6">
          {AdminOptions.map((option, index) => (
            <AdminDropdown key={option.title} option={option} index={index} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default AdminScreen;
