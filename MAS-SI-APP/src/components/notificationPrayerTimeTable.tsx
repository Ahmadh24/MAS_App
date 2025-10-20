import { Button, DataTable, Dialog, Icon, IconButton } from "react-native-paper";
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
} from "react-native";
import AlertBell from "../app/(user)/prayersTable/alertBell";
import { usePrayer } from "../providers/prayerTimesProvider";
import { Link, useNavigation } from "expo-router";
import { useState } from "react";
import Marquee from "./Marquee";
import JummahMarquee from "./JummahMarquee";
import { format } from "date-fns";

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
  const { currentPrayer } = usePrayer();
  const { width, height } = Dimensions.get("window");
  const navigation = useNavigation<any>();
  const nextPress = () => {
    const nextPressNum = Math.ceil(index + 1);
    setTableIndex(Math.min(6, nextPressNum));
  };
  const backPress = () => {
    setTableIndex(Math.max(0, index - 1));
  };
  


  const goToPrayer = (prayerName: string, prayerImage: ImageSourcePropType) => {
    navigation.navigate("myPrograms", {
      screen: "notifications/Prayer/[prayerDetails]",
      params: { prayerName:prayerName, prayerImage:prayerImage  },
    });
  };

  const [ jummahDialog, setJummahDialog ] = useState(false)
  const FirstTaraweehTime = setTimeToCurrentDate(convertTo24Hour(prayerData.iqa_isha))
  const FirstTaraweehEndTime = new Date(FirstTaraweehTime).setHours(FirstTaraweehTime.getHours() + 1)
  const SecondTaraweehTime = new Date(FirstTaraweehTime).setHours(FirstTaraweehTime.getHours() + 1, FirstTaraweehTime.getMinutes() + 20)
  const SecondTaraweehEndTime = new Date(FirstTaraweehTime).setHours(FirstTaraweehTime.getHours() + 2, FirstTaraweehTime.getMinutes() + 20)
  return (
    <View style={{ width: width }} className="items-center">
      <View className="items-center  justify-center w-[100%]">
        <View className="w-[100%]">
          <ScrollView
            style={{ width: "100%", height: "95%", paddingLeft:'4%'}}
            showsVerticalScrollIndicator={false}
          >
            {
              Prayers.map((prayer) => (
                <Link 
                href={{
                  pathname : '/myPrograms/notifications/Prayer/[prayerDetails]',
                  params : {prayerName: prayer.PrayerCap, prayerImage: prayer.img }
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
                          prayer.img
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
                      <Text className="font-bold text-xl  text-gray-800 ">{prayer.PrayerCap}</Text>
                      <View className="flex-row mt-2">
                        <Text className="text-left  text-[#6077F5] font-bold ">
                          Athan :{" "}
                        </Text>
                        <Text
                          className="text-left  text-gray-600 font-bold "
                          adjustsFontSizeToFit
                          numberOfLines={1}
                        >
                          {prayerData[prayer.athan]}
                        </Text>
                      </View>
                      <View className="flex-row">
                        <Text className="text-left  text-[#6077F5] font-bold ">
                          Iqamah :{" "}
                        </Text>
                        <Text
                          className="text-left  text-gray-600 font-bold "
                          adjustsFontSizeToFit
                          numberOfLines={1}
                        >
                          {prayerData[prayer.iqamah]}
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
              ))
            }

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


            <Text className="font-bold text-lg mt-[15%] mb-1">Jummah Notifications</Text>
            <View className="flex items-center justify-center flex-1">
              {/* <JummahMarquee /> */}
              <View className="flex flex-row w-[100%]">
                <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap : 8 }}
                >
                   {
                      ['12:15 PM', '1:00 PM', '1:45 PM', '3:45 PM'].map((item, index) => (
                          <Link href={{
                            pathname : `/(user)/myPrograms/notifications/Prayer/Jummah/[jummahDetails]`,
                            params : { jummahName : item, index : index + 1 }
                          }}
                            
                            >
                            <ImageBackground className="w-[150] h-[170] items-start justify-end"
                            source={index == 0 || index == 1 ? require('@/assets/images/Jummah12.png') : require('@/assets/images/Jummah34.png')}
                            imageStyle={{ height : '100%', width : '100%', borderRadius : 15, objectFit : 'fill' }}
                            
                            >
                              <Text className='text-white ml-3 text-md font-semibold'>Prayer {index + 1}</Text>
                              <Text className='text-white ml-3 font-bold text-lg'>{item}</Text>
                            </ImageBackground>
                          </Link>
                      ))
                  }
                </ScrollView>
              </View>
            </View>
            
          </ScrollView>
          
        </View>
       
      </View>
    </View>
  );
};

export default NotificationPrayerTable;

const Prayers = [
  {
    PrayerCap : "Fajr", img : require('@/assets//images/fajr.jpeg'), athan : 'athan_fajr', iqamah : 'iqa_fajr'
  },
  {
    PrayerCap : "Dhuhr", img : require('@/assets//images/dhuhr.jpeg'), athan : 'athan_zuhr', iqamah : 'iqa_zuhr'
  },
  {
    PrayerCap : "Asr", img : require('@/assets//images/asr.jpeg'), athan : 'athan_asr', iqamah : 'iqa_asr'
  },
  {
    PrayerCap : "Maghrib", img : require('@/assets//images/maghrib.jpeg'), athan : 'athan_maghrib', iqamah : 'iqa_maghrib'
  },
  {
    PrayerCap : "Isha", img : require('@/assets//images/isha.jpeg'), athan : 'athan_isha', iqamah : 'iqa_isha'
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

function setTimeToCurrentDate(timeString : string) {

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

 function convertTo24Hour(timeStr : string) {
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
