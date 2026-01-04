import { Button, DataTable, Dialog, Icon, IconButton, Switch } from "react-native-paper";
import { gettingPrayerData, prayerTimeData } from "@/src/types";
import ProgramWidgetSlider from "@/src/components/programWidgetSlider";
import {
  View,
  Text,
  useWindowDimensions,
  StyleSheet,
  Pressable,
  ImageBackground,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  ImageSourcePropType,
  FlatList,
  Platform,
  Modal,
  Animated,
} from "react-native";
import AlertBell from "../app/(user)/prayersTable/alertBell";
import { useCurrentPrayer } from "../hooks/usePrayerTimes";
import { Link, useNavigation } from "expo-router";
import { useState, useRef, useEffect } from "react";
import Marquee from "./Marquee";
import JummahMarquee from "./JummahMarquee";
import { format } from "date-fns";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { LiquidGlassView, isLiquidGlassSupported } from '@/src/lib/liquidGlass';
import { Pencil, X, Check } from 'lucide-react-native';

type NotificationOption = 'prayer_time' | 'iqamah_time' | '30_min_before' | 'mute';

type PrayerNotificationSettings = {
  [key: string]: {
    enabled: boolean;
    option: NotificationOption;
  };
};

type prayerDataProp = {
  prayerData: gettingPrayerData;
  setTableIndex: (tableIndex: number) => void;
  tableIndex: number;
  index: number;
};
const NotificationPrayerTable = ({
  prayerData,
  setTableIndex,
  tableIndex,
  index,
}: prayerDataProp) => {
  const currentPrayer = useCurrentPrayer();
  const { width, height } = Dimensions.get("window");
  const navigation = useNavigation<any>();
  
  // Modal visibility state
  const [modalVisible, setModalVisible] = useState(false);
  
  // Blur fade animation
  const blurOpacity = useRef(new Animated.Value(0)).current;
  
  // Animate blur right after the modal starts sliding up
  useEffect(() => {
    if (modalVisible) {
      // Very short delay so blur appears right after modal starts
      setTimeout(() => {
        Animated.timing(blurOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }, 0);
    } else {
      blurOpacity.setValue(0);
    }
  }, [modalVisible]);
  
  // Selected prayer for the modal
  const [selectedPrayer, setSelectedPrayer] = useState<string | null>(null);
  
  // Prayer notification settings state
  const [prayerSettings, setPrayerSettings] = useState<PrayerNotificationSettings>({
    'Fajr': { enabled: false, option: 'prayer_time' },
    'Dhuhr': { enabled: false, option: 'prayer_time' },
    'Asr': { enabled: false, option: 'prayer_time' },
    'Maghrib': { enabled: false, option: 'prayer_time' },
    'Isha': { enabled: false, option: 'prayer_time' },
  });

  const handleToggle = (prayerName: string) => {
    const currentEnabled = prayerSettings[prayerName]?.enabled;
    
    if (!currentEnabled) {
      // Opening - show modal
      setSelectedPrayer(prayerName);
      setModalVisible(true);
    }
    
    // Update the toggle state
    setPrayerSettings(prev => ({
      ...prev,
      [prayerName]: {
        ...prev[prayerName],
        enabled: !currentEnabled,
      }
    }));
  };

  const handleOptionSelect = (option: NotificationOption) => {
    if (selectedPrayer) {
      setPrayerSettings(prev => ({
        ...prev,
        [selectedPrayer]: {
          ...prev[selectedPrayer],
          option: option,
        }
      }));
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedPrayer(null);
  };

  const handleSave = () => {
    // Here you would save to your backend/storage
    console.log('Saving settings for:', selectedPrayer, prayerSettings[selectedPrayer!]);
    handleCloseModal();
  };

  const nextPress = () => {
    const nextPressNum = Math.ceil(index + 1);
    setTableIndex(Math.min(6, nextPressNum));
  };
  const backPress = () => {
    setTableIndex(Math.max(0, index - 1));
  };

  const [jummahDialog, setJummahDialog] = useState(false)
  const FirstTaraweehTime = setTimeToCurrentDate(convertTo24Hour(prayerData.iqa_isha))
  const FirstTaraweehEndTime = new Date(FirstTaraweehTime).setHours(FirstTaraweehTime.getHours() + 1)
  const SecondTaraweehTime = new Date(FirstTaraweehTime).setHours(FirstTaraweehTime.getHours() + 1, FirstTaraweehTime.getMinutes() + 20)
  const SecondTaraweehEndTime = new Date(FirstTaraweehTime).setHours(FirstTaraweehTime.getHours() + 2, FirstTaraweehTime.getMinutes() + 20)
  // Color mapping for each prayer
  const prayerColors: { [key: string]: string } = {
    'Fajr': '#3B82F6',      // Blue
    'Dhuhr': '#57BA47',     // Green
    'Asr': '#9CAF50',       // Yellow-green/Olive
    'Maghrib': '#A0522D',   // Brown
    'Isha': '#7C3AED',      // Purple
  };

  // Arabic names for prayers
  const arabicNames: { [key: string]: string } = {
    'Fajr': 'الفجر',
    'Dhuhr': 'الظهر',
    'Asr': 'العصر',
    'Maghrib': 'المغرب',
    'Isha': 'العشاء',
  };

  // Emoji mapping for each prayer
  const prayerEmojis: { [key: string]: string } = {
    'Fajr': '🌅',      // Sunrise for dawn
    'Dhuhr': '☀️',     // Sun for noon
    'Asr': '⛅',       // Sun behind cloud for afternoon
    'Maghrib': '🌇',   // Sunset for evening
    'Isha': '🌙',      // Crescent moon for night
  };

  // Progressive blue gradient colors - getting darker from Fajr to Isha (exaggerated)
  const prayerGradients: { [key: string]: string[] } = {
    'Fajr': ['#D0E6F0', '#7AB8D4', '#3B7FCD'],       // Light blue (slightly darker)
    'Dhuhr': ['#B0E0E6', '#5A9FD4', '#3B7FCD'],      // Light blue
    'Asr': ['#9FD0DC', '#4A8FC7', '#2E5C8A'],        // Slightly darker than Dhuhr
    'Maghrib': ['#4A8FC7', '#2E5C8A', '#1A4A6B'],    // Medium-dark blue
    'Isha': ['#214E91', '#0F2D4A', '#000000'],      // Very dark blue (almost black)
  };

  // All prayer cards are white
  const prayerCardColors: { [key: string]: string } = {
    'Fajr': '#FFFFFF',
    'Dhuhr': '#FFFFFF',
    'Asr': '#FFFFFF',
    'Maghrib': '#FFFFFF',
    'Isha': '#FFFFFF',
  };

  return (
    <>
    <View style={{ width: width, backgroundColor: 'transparent', flex: 1 }}>
      <View style={{ width: "100%", paddingHorizontal: 20, paddingTop: 10 }}>
        <ScrollView
          style={{ width: "100%" }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
        >
          {
            Prayers.map((prayer) => {
              const isEnabled = prayerSettings[prayer.PrayerCap]?.enabled || false;
              
              return (
                <View key={prayer.PrayerCap} style={styles.prayerCardOffWhite}>
                  <View style={styles.prayerCard}>
                    {/* Icon Container */}
                    <Image 
                      source={require('@/assets/images/glowingTree.png')} 
                      style={styles.prayerIcon}
                      resizeMode="contain"
                    />

                    {/* Content */}
                    <View style={styles.contentContainer}>
                      <Text style={styles.prayerName}>{prayer.PrayerCap}</Text>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeLabel}>Athan</Text>
                        <Text style={styles.timeValue}>{prayerData[prayer.athan]}</Text>
                      </View>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeLabel}>Iqamah</Text>
                        <Text style={styles.timeValue}>{prayerData[prayer.iqamah]}</Text>
                      </View>
                    </View>

                    {/* Toggle Switch */}
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                      <Switch
                        value={isEnabled}
                        onValueChange={() => handleToggle(prayer.PrayerCap)}
                        color="#6EE7B7"
                      />
                    </View>
                  </View>
                </View>
              );
            })
          }
          </ScrollView>
            {/* Jummah section moved to its own tab */}
            {/* <Text className="font-bold text-lg mt-[15%] mb-1">Taraweeh Notifications</Text>
            <Link 
                href={{
                  pathname : '/myPrograms/notifications/Prayer/Tarawih/[tarawihDetails]',
                  params : {tarawihName: 'Tarawih One', tarawihTitle : 'Taraweeh One' }
                }}
                 className=""
                 asChild
                >
               <Pressable className="flex-row mt-4 flex w-[100%]">
                    <View style={[{
                       shadowColor : 'gray',
                       shadowOffset : { width : 0, height : 8 },
                       shadowOpacity : 1,
                       shadowRadius : 8,
                       elevation : 8
                    },
                    Platform.OS == 'android' ? {
                      borderWidth: 1,
                      borderColor : '#D3D3D3',
                      borderRadius : 8
                    } : {}
                    ]}
                    className="mr-3"
                    >
                      <Image
                        source={
                          require('@/assets/images/TarawihNotiCard.jpeg')
                        }
                        style={{
                          width: 116,
                          height: 110,
                          borderRadius: 8,
                          resizeMode: "stretch",
                         
                        }}
                        className=" rounded-xl "
                      />
                    </View>
  
                    <View className="mb-5 w-[40%]">
                      <Text className="font-bold text-xl  text-gray-800 ">Taraweeh One</Text>
                      <View className="flex-row mt-2">
                        <Text className="text-left  text-[#6077F5] font-bold ">
                          Starts :{" "}
                        </Text>
                        <Text
                          className="text-left  text-gray-600 font-bold "
                          adjustsFontSizeToFit
                          numberOfLines={1}
                        >
                          {format(FirstTaraweehTime, 'p')}
                        </Text>
                      </View>
                      <View className="flex-row">
                        <Text className="text-left  text-[#6077F5] font-bold ">
                          Ends :{" "}
                        </Text>
                        <Text
                          className="text-left  text-gray-600 font-bold "
                          adjustsFontSizeToFit
                          numberOfLines={1}
                        >
                          {format(FirstTaraweehEndTime, 'p')}
                        </Text>
                      </View>
                    </View>
  
                    <View 
                      style={[{
                        shadowColor : 'gray',
                        shadowOffset : { width : 0, height : 8 },
                        shadowOpacity : 1,
                        shadowRadius : 8
                      }
                    ]}
                      className="items-end justify-center"
                    >
                      <View className="bg-[#0D509E] h-[21] w-[65] self-center ml-[10%] text-white text-[10px] rounded-xl items-center justify-center mb-7">
                          <Text className=" text-white font-[300]">Edit</Text>
                      </View>
                    </View>
  
               </Pressable>
            </Link>
            <Link 
                href={{
                  pathname : '/myPrograms/notifications/Prayer/Tarawih/[tarawihDetails]',
                  params : {tarawihName: 'Tarawih Two',tarawihTitle : 'Taraweeh Two'  }
                }}
                 className=""
                 asChild
                >
               <Pressable className="flex-row mt-4 flex w-[100%]">
                    <View style={[{
                       shadowColor : 'gray',
                       shadowOffset : { width : 0, height : 8 },
                       shadowOpacity : 1,
                       shadowRadius : 8,
                       elevation : 8
                    },
                    Platform.OS == 'android' ? {
                      borderWidth: 1,
                      borderColor : '#D3D3D3',
                      borderRadius : 8
                    } : {}
                    ]}
                    className="mr-3"
                    >
                      <Image
                        source={
                          require('@/assets/images/TarawihNotiCard.jpeg')
                        }
                        style={{
                          width: 116,
                          height: 110,
                          borderRadius: 8,
                          resizeMode: "stretch",
                         
                        }}
                        className=" rounded-xl "
                      />
                    </View>
  
                    <View className="mb-5 w-[40%]">
                      <Text className="font-bold text-xl  text-gray-800 ">Taraweeh Two</Text>
                      <View className="flex-row mt-2">
                        <Text className="text-left  text-[#6077F5] font-bold ">
                          Starts :{" "}
                        </Text>
                        <Text
                          className="text-left  text-gray-600 font-bold "
                          adjustsFontSizeToFit
                          numberOfLines={1}
                        >
                          {format(SecondTaraweehTime, 'p')}
                        </Text>
                      </View>
                      <View className="flex-row">
                        <Text className="text-left  text-[#6077F5] font-bold ">
                          Ends :{" "}
                        </Text>
                        <Text
                          className="text-left  text-gray-600 font-bold "
                          adjustsFontSizeToFit
                          numberOfLines={1}
                        >
                          {format(SecondTaraweehEndTime, 'p')}
                        </Text>
                      </View>
                    </View>
  
                    <View 
                      style={[{
                        shadowColor : 'gray',
                        shadowOffset : { width : 0, height : 8 },
                        shadowOpacity : 1,
                        shadowRadius : 8
                      }
                    ]}
                      className="items-end justify-center"
                    >
                      <View className="bg-[#0D509E] h-[21] w-[65] self-center ml-[10%] text-white text-[10px] rounded-xl items-center justify-center mb-7">
                          <Text className=" text-white font-[300]">Edit</Text>
                      </View>
                    </View>
  
               </Pressable>
            </Link> */}
        </View>
      </View>

      {/* Modal for Notification Settings */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          {/* Animated blur background */}
          <Animated.View style={[styles.blurContainer, { opacity: blurOpacity }]}>
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          </Animated.View>
          
          <View style={styles.modalContent}>
            {/* Handle Indicator */}
            <View style={styles.modalIndicator} />
            
            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {selectedPrayer} notification settings
              </Text>
              <Pressable onPress={handleCloseModal} style={styles.closeButton}>
                <X color="rgba(255, 255, 255, 0.7)" size={24} />
              </Pressable>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {/* Notify at Prayer Time */}
              <Pressable 
                style={styles.optionRow}
                onPress={() => handleOptionSelect('prayer_time')}
              >
                <View style={[
                  styles.radioOuter,
                  prayerSettings[selectedPrayer || '']?.option === 'prayer_time' && styles.radioOuterSelected
                ]}>
                  {prayerSettings[selectedPrayer || '']?.option === 'prayer_time' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Notify at Prayer Time:</Text>
                  <Text style={styles.optionDescription}>Get notified exactly when it's time to pray</Text>
                </View>
              </Pressable>

              {/* Notify at Iqamah Time */}
              <Pressable 
                style={styles.optionRow}
                onPress={() => handleOptionSelect('iqamah_time')}
              >
                <View style={[
                  styles.radioOuter,
                  prayerSettings[selectedPrayer || '']?.option === 'iqamah_time' && styles.radioOuterSelected
                ]}>
                  {prayerSettings[selectedPrayer || '']?.option === 'iqamah_time' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Notify at Iqamah Time:</Text>
                  <Text style={styles.optionDescription}>Get notified when it's time to gather at the masjid</Text>
                </View>
              </Pressable>

              {/* 30-Minute Reminder */}
              <Pressable 
                style={styles.optionRow}
                onPress={() => handleOptionSelect('30_min_before')}
              >
                <View style={[
                  styles.radioOuter,
                  prayerSettings[selectedPrayer || '']?.option === '30_min_before' && styles.radioOuterSelected
                ]}>
                  {prayerSettings[selectedPrayer || '']?.option === '30_min_before' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>30-Minute Reminder Before Next Prayer:</Text>
                  <Text style={styles.optionDescription}>Get reminded 30 minutes before the next prayer time</Text>
                </View>
              </Pressable>

              {/* Mute */}
              <Pressable 
                style={styles.optionRow}
                onPress={() => handleOptionSelect('mute')}
              >
                <View style={[
                  styles.radioOuter,
                  prayerSettings[selectedPrayer || '']?.option === 'mute' && styles.radioOuterSelected
                ]}>
                  {prayerSettings[selectedPrayer || '']?.option === 'mute' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Mute</Text>
                </View>
              </Pressable>
            </View>

            {/* Save Button */}
            {isLiquidGlassSupported ? (
              <LiquidGlassView style={styles.saveButtonGlass} interactive effect="regular">
                <Pressable style={styles.saveButtonInner} onPress={handleSave}>
                  <Check color="white" size={20} strokeWidth={2.5} style={{ marginRight: 8 }} />
                  <Text style={styles.saveButtonTextGlass}>Save</Text>
                </Pressable>
              </LiquidGlassView>
            ) : (
              <Pressable style={styles.saveButton} onPress={handleSave}>
                <Check color="#6EE7B7" size={20} strokeWidth={2.5} style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

export default NotificationPrayerTable;

const Prayers = [
  {
    PrayerCap: "Fajr", img: require('@/assets//images/fajr.jpeg'), athan: 'athan_fajr', iqamah: 'iqa_fajr'
  },
  {
    PrayerCap: "Dhuhr", img: require('@/assets//images/dhuhr.jpeg'), athan: 'athan_zuhr', iqamah: 'iqa_zuhr'
  },
  {
    PrayerCap: "Asr", img: require('@/assets//images/asr.jpeg'), athan: 'athan_asr', iqamah: 'iqa_asr'
  },
  {
    PrayerCap: "Maghrib", img: require('@/assets//images/maghrib.jpeg'), athan: 'athan_maghrib', iqamah: 'iqa_maghrib'
  },
  {
    PrayerCap: "Isha", img: require('@/assets//images/isha.jpeg'), athan: 'athan_isha', iqamah: 'iqa_isha'
  },
]

{
  /*
     <TouchableOpacity 
            onPress={ () => 
              goToPrayer(
                 PrayerCap,
             require(prayer.img)
              )
            }
             className="flex-row mt-4">
              <Image
                source={
                  require(prayer.img)
                }
                style={{
                  width: width * 0.35,
                  height: height * 0.15,
                  borderRadius: 8,
                  resizeMode: "stretch",
                }}
              />
              <View className="ml-5">
                <Text className="font-bold text-xl  text-gray-800 ">{PrayerCap}</Text>
                <View className="flex-row mt-2">
                  <Text className="text-left  text-gray-600 font-bold ">
                    Athan :{" "}
                  </Text>
                  <Text
                    className="text-left  text-gray-600 font-bold "
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {prayerData[athan]}
                  </Text>
                </View>
                <View className="flex-row">
                  <Text className="text-left  text-gray-600 font-bold ">
                    Iqamah :{" "}
                  </Text>
                  <Text
                    className="text-left  text-gray-600 font-bold "
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {prayerData[iqamah]}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
  */
}

function setTimeToCurrentDate(timeString: string) {

  const currentDate = new Date(); // Get current date

  // Split the time string into hours, minutes, and seconds
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  // Create a new Date object with the current date
  const timestampWithTimeZone = new Date();

  // Set the time with setHours (adjust based on local timezone or UTC as needed)
  timestampWithTimeZone.setHours(hours, minutes, seconds, 0); // No milliseconds

  // Convert to ISO format with timezone (to ensure it's interpreted as a TIMESTAMPTZ)
  const timestampISO = timestampWithTimeZone // This gives a full timestamp with timezone in UTC

  return timestampISO
}

function convertTo24Hour(timeStr: string) {
  // Extract the period ("AM"/"PM") and the time part ("7:15")
  const period = timeStr.slice(-2).toUpperCase();
  const [hourStr, minuteStr] = timeStr.slice(0, -2).split(":");
  let hour = parseInt(hourStr, 10);

  // Adjust hour based on period
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  // Format hour and minute to two digits and add seconds ":00"
  const hh = hour.toString().padStart(2, '0');
  const mm = minuteStr.padStart(2, '0');
  return `${hh}:${mm}:00`;
}

const styles = StyleSheet.create({
  prayerCardBlur: {
    marginBottom: 30,
    borderRadius: 16,
    overflow: 'hidden',
  },
  prayerCardOffWhite: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  prayerCardGlass: {
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
  },
  prayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    position: 'relative',
  },
  masjidIcon: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  prayerIcon: {
    width: 56,
    height: 56,
    marginRight: 10,
  },
  arabicText: {
    fontSize: 8,
    color: 'white',
    fontWeight: '600',
    marginTop: 2,
    position: 'relative',
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  prayerName: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: 1,
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 4,
    minWidth: 40,
  },
  timeValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6EE7B7',
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 6,
  },
  editIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  editIconBlur: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    overflow: 'hidden',
  },
  editIconOffWhite: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBEDF0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  editIconGlass: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    overflow: 'hidden',
  },
  editButtonGlass: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginLeft: 6,
    overflow: 'hidden',
  },
  editButtonText: {
    color: 'black',
    fontSize: 12,
    fontWeight: '600',
  },
  editButtonTextGlass: {
    color: '#1a1a1a',
    fontSize: 12,
    fontWeight: '600',
  },
  // Glass-specific text styles for better contrast
  prayerNameGlass: {
    color: '#000000',
    fontWeight: '700',
  },
  timeLabelGlass: {
    color: '#333333',
  },
  timeValueGlass: {
    color: '#000000',
    fontWeight: '700',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#1a3a5c',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    gap: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6EE7B7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioOuterSelected: {
    backgroundColor: '#6EE7B7',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1a3a5c',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: 'rgba(110, 231, 183, 0.25)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 32,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(110, 231, 183, 0.5)',
  },
  saveButtonText: {
    color: '#6EE7B7',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonGlass: {
    borderRadius: 12,
    marginTop: 32,
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
  },
  saveButtonInner: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 122, 255, 0.85)',
  },
  saveButtonTextGlass: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
