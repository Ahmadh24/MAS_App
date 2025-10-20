import { center } from "@shopify/react-native-skia";
import React, { useState } from "react";
import { View, Text, Image, Modal, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { number } from "zod";
import ArrowRightIcon from "../components/ArrowRightIcon";
import ArrowLeftIcon from "../components/ArrowLeftIcon";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { Video } from 'expo-av';

const tutorialImages = [
  require("../app/images/MyRecording.mov"),
  require("../app/images/Tutorialdraft.mp4"),
  require("../app/images/Tutorialdraft.mp4"),
  require("../app/images/Tutorialdraft.mp4"),
];

const tutorialBenefits = [
  {
    title: "Learn To Add A Program To Notifications",
    description: "Benefits of adding programs to your notifications include:",
    benefits: ["Timely Reminders", "Better Consistency", "Enhanced Engagement", "Convenient Accountability", "Increased Awareness"],
  },
  {
    title: "Learn To Add A Lecture To A Playlist",
    description: "Benefits of adding programs to your playlist include:",
    benefits: ["Continuous Learning", "Personalization", "Convenient Access", "Better Organization", "Motivation & Engagement"],
  },
  {
    title: "Learn To Preview AI Notes",
    description: "Benefits of having Ai summary and Ai keynotes:",
    benefits: ["Time Efficiency", "Enhanced Comprehension", "Effective Revision", "Personalized Clarity", "Better Retention"],
  },
  {
    title: "Learn To View All Programs",
    description: "Benefits of having Ai summary and Ai keynotes:",
    benefits: ["Speaker Awareness", "Better Preparation", "Focused Listening", "Increased Engagement", "Personal Reflection"],
  },
];

const TutorialOverlay = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [step, setStep] = useState(0);
  const translateX = useSharedValue(0);

  // Smooth animation easing
  const transitionConfig = {
    duration: 545, // Increased for a smoother effect
    easing: Easing.out(Easing.exp), // Smooth out transition
  };

  const slideAnimation = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(translateX.value, transitionConfig) }],
  }));

  const handleNext = () => {
    if (step < tutorialImages.length - 1) {
      translateX.value = -Dimensions.get("window").width;
      setTimeout(() => {
        setStep((prev) => prev + 1);
        translateX.value = Dimensions.get("window").width;
        translateX.value = 0;
      }, transitionConfig.duration);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      translateX.value = Dimensions.get("window").width;
      setTimeout(() => {
        setStep((prev) => prev - 1);
        translateX.value = -Dimensions.get("window").width;
        translateX.value = 0;
      }, transitionConfig.duration);
    }
  };


  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.fullBackground}>
          <Text style={styles.headerText}>MAS SI Tutorial</Text>
          <TouchableOpacity style={styles.skipButton} onPress={onClose}>
            <Text style={styles.skipText}>Skip</Text>
            <ArrowRightIcon style={styles.skipArrow} />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.videoContainer, slideAnimation]}>
        <Video
            source={tutorialImages[step]}
            resizeMode="cover"
            shouldPlay
            isLooping
            useNativeControls={false}
            style={styles.image}
        />

        </Animated.View>

        <View style={styles.pageIndicator}>
          {tutorialImages.map((_, index) => (
            <View key={index} style={[styles.circle, step === index && styles.activeCircle]} />
          ))}
        </View>

        <View style={styles.learnSection}>
          <Text style={styles.learnTitle}>{tutorialBenefits[step].title}</Text>
          <Text style={styles.learnDescription}>{tutorialBenefits[step].description}</Text>
          <View style={styles.benefitsList}>
            {tutorialBenefits[step].benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <View style={styles.bullet} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.navButtons}>
          {step > 0 ? (
            <TouchableOpacity style={[styles.button, styles.backButton]} onPress={handleBack}>
              <View style={styles.iconContainer}>
                <ArrowLeftIcon style={styles.arrowIcon} />
              </View>
              <Text style={styles.backbuttonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <TouchableOpacity style={[styles.button, styles.nextButton]} onPress={handleNext}>
            <Text style={styles.nextbuttonText}>{step < tutorialImages.length - 1 ? "Next" : "Finish"}</Text>
            <View style={styles.iconContainer}>
              <ArrowRightIcon style={styles.arrowIcon} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  fullBackground: {
    position: "absolute",
    top: 0,
    width: 430,
    height: 531,
    flexShrink: 0,
    backgroundColor: "#CDE7FF",
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  
  headerText: {
    color: "#000", // Matches Figma
    textAlign: "center",
    fontFamily: "Poppins", // Ensure Poppins is loaded in your project
    fontSize: 24,
    fontStyle: "normal",
    fontWeight: "400",
    lineHeight: "normal",
    marginTop: 60, // Adjust if needed for proper alignment
  },
  
  videoContainer: {
    width: 350,
    height: 380,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 35,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#A8A8A8",
    overflow: "hidden", // ✅ This clips the zoomed video
  },
  image: {
    width: "105%",   // Zoom in horizontally
    height: "105%",  // Zoom in vertically
   // alignSelf: "center",
  },
  pageIndicator: {
    flexDirection: "row",
    marginTop: 10,
  },
  circle: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: "#D9D9D9",
    marginHorizontal: 15,

  },
  activeCircle: {
    backgroundColor: "#0084FF",
  },
  learnSection: {
    width: 430, // Matches Figma
    height: 200, // Matches Figma
    backgroundColor: "#FFFFFF", // Keeps it distinct
    borderRadius: 20, // Adds a rounded effect similar to the video container
    borderWidth: 2, // Border thickness
    borderColor: "#FFF", // Border color similar to video container
    padding: 20, // Adds spacing inside the container
    marginTop: 20, // Keeps spacing from the page indicator
    alignItems: "center", // Centers content
  },
  learnTitle: {
    color: "#000",
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    fontStyle: "normal",
    lineHeight: "normal",
    marginBottom: 10, // 🔹 Adds spacing between title & description
  },
  
  learnDescription: {
    color: "#000",
    textAlign: "center",
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    fontStyle: "normal",
    fontWeight: "500",
    lineHeight: "normal",
    marginBottom: 10, // 🔹 Adds spacing between description & benefits
  },
  
  benefitsList: {
    marginTop: 10, // 🔹 More spacing from description
    alignSelf: "flex-start",
    paddingLeft: 35, // Aligns list with the left edge
  },
  
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10, // 🔹 More spacing between each list item
  },
  
  bullet: {
    width: 15,
    height: 15,
    flexShrink: 0,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(87, 186, 71, 0.40)", // Green border
    backgroundColor: "#FFF", // White inside
    marginRight: 10, // Space between bullet and text
  },
  
  benefitText: {
    color: "#000",
    textAlign: "left",
    fontFamily: "Poppins_400Regular", // Matches Figma's weight
    fontSize: 11,
    fontStyle: "normal",
    fontWeight: "400",
    lineHeight: "normal",
  },
  

    navButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "80%",
      alignSelf: "center",
      marginTop: 10,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: 110,
      height: 35,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#0A4D8F",
      backgroundColor: "#0A4D8F",
      paddingHorizontal: 10,
      gap: 8, // Space between arrow & text
      marginTop: 20, // Adds spacing from the benefits list
    },
    nextButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: 110,
      height: 35,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#D9D9D9",
      backgroundColor: "#D9D9D9",
      paddingHorizontal: 10,
      gap: 8, // Space between text & arrow
      marginTop: 20, // Adds spacing from the benefits list
      
    },
    nextbuttonText: {
      fontSize: 14,
      fontFamily: "Poppins",
      fontWeight: "400",
      color: "#000",
      textAlign: "center",
    },
    backbuttonText: {
      fontSize: 14,
      fontFamily: "Poppins",
      fontWeight: "400",
      color: "#FFF",
      textAlign: "center",
    },
    arrowIcon: {
      width: 17,
      height: 17,
    },
    backArrow: {
      transform: [{ rotate: "180deg" }], // Flips the right arrow to make it left
    },
  
  // ✅ Skip Button
  skipButton: {
    position: "absolute",
    top: 40,
    right: 20,
    flexDirection: "row", // Aligns text and icon in one row
    alignItems: "center", // Centers them vertically
    padding: 10,
  },
  skipText: {
    color: "#A8A8A8",
    textAlign: "center",
    fontFamily: "Poppins",
    fontSize: 15,
    fontStyle: "normal",
    fontWeight: "400",
    lineHeight: "normal",
  },
  skipArrow: {
    width: 15, // Adjust size as needed
    height: 15,
    marginLeft: 5, // Adds spacing between text and arrow
  },
  
  iconContainer: {
    width: 20,
    height: 20,
    backgroundColor: "white",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TutorialOverlay;
