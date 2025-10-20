import { View, Text, ScrollView, useWindowDimensions, Image, Pressable, StatusBar, Linking, Alert, KeyboardAvoidingView  } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import LottieView from 'lottie-react-native'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { Button, Icon, Portal, Modal,TextInput, Divider } from 'react-native-paper'
import { Link } from 'expo-router'
import { Profile } from '@/src/types'
import { useAuth } from '@/src/providers/AuthProvider'
import { supabase } from '@/src/lib/supabase'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import SignInAnonModal from '@/src/components/SignInAnonModal'
import Toast from 'react-native-toast-message'
import Svg, { Circle, err, Path, Rect } from 'react-native-svg'
import { BlurView } from 'expo-blur'
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
//import { AdminClient } from '@/src/lib/supabase'
const Index = () => {
  const [ profile, setProfile ] = useState<Profile>()
  const { session } = useAuth()
  const width = useWindowDimensions().width
  const height = useWindowDimensions().height
  const [ visible, setVisible ] = useState(false)
  const [ anonStatus, setAnonStatus ] = useState(true)
  const tabBarHeight = useBottomTabBarHeight() + 10
  const spin = useSharedValue(0)
  const [ profileFirstName , setProfileFirstName ] = useState('')
  const [ profileLastName , setProfileLastName ] = useState('')
  const [ profileEmail, setProfileEmail ] = useState('')
  const [loading, setLoading] = useState(true)
  const [editProfileVisible, setEditProfileVisible] = React.useState(false);
  const [ feedbackOpen, setFeedBackOpen ] = useState(false);
  const [ feedbackMessage, setFeedBackMessage ] = useState('')
  const FeedBackRight = useSharedValue(0)
  const FeedBackInputWidth = useSharedValue(0)
  const feedbackRef = useRef()
  const appflowRef = useRef<View>()
  const scrollViewRef = useRef<ScrollView>()
  const [ sendAble, setSendAble ] = useState(true)
  const FeedBackInput = useAnimatedStyle(() => {
    return{
      width : feedbackOpen ? withTiming(width * .75, { duration : 1500 }) : withTiming(0, { duration : 1500 } ),
      opacity : feedbackOpen ? withTiming(1, { duration : 1500 }) : withTiming(0, { duration : 1500 } )
    }
  })
  const FeedBackButton = useAnimatedStyle(() => {
    return {
      right : feedbackOpen ? withTiming(width * .05, { duration : 1500 }) : withTiming(0, { duration : 1500 } ),
      width : feedbackOpen ? withTiming(width * .75 / 5, { duration : 500 }) : withTiming(150, { duration : 1500})
    }
  })
  const FeedBackArrowOpacity = useAnimatedStyle(() => {
    return{
      opacity : feedbackOpen ? withTiming(0, { duration : 500 }) : withTiming(1, { duration : 3000 } )
    }
  })
  const flip = useAnimatedStyle(() => {
    const spinVal = interpolate(spin.value, [0, 1], [0, 360])
    return{
      transform: [
        {
          rotateY: withTiming(`${spinVal}deg`, { duration: 500 }),
        },
      ],
    }
  })
  const getProfile = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', session?.user.id).single()
    if( data ){
      setProfile(data)
    }
  }
  const checkIfAnon = async () => {
    if( session?.user.is_anonymous ){
      setAnonStatus(true)
    }
    else{
      setAnonStatus(false)
    }
  }
  const SignInModalCheck = () => {
    if( anonStatus ){
      setVisible(true)
      return true
    }else{
      return false
    }
  }

  useEffect(() => {
    getProfile()
  }, [session])
  useEffect(() => {
    checkIfAnon()
  }, [session])
  useEffect(() => {
    // Check for Feedback open and no message => Close after 7000 else stay open
    let timerId;
    if( feedbackOpen && feedbackMessage.length <= 0 ){
      timerId = setTimeout(() => 
      {
        setFeedBackOpen(false);

      }
    ,8000) 
    }
    else if ( feedbackMessage ) {
      clearTimeout(timerId);
      setFeedBackOpen(true);
    }
  }, [ feedbackOpen, feedbackMessage ])
  const hideModal = () => setEditProfileVisible(false);
  const onConfirmButton = async () => {
    Toast.show({
      type: 'success',
      text1: "Profile is Sucessfully Edited",
      position: 'top',
      topOffset : 50,
      visibilityTime: 2000,
    });
    const { error } = await supabase.from('profiles').update({ first_name : profileFirstName, last_name : profileLastName, profile_email : profileEmail }).eq('id', session?.user.id)
    setEditProfileVisible(false);
    setProfileFirstName('');
    setProfileLastName('');
    setProfileEmail('');
    await getProfile();
  }
  const MASHOPLINK = () => Linking.canOpenURL("https://massic.shop/").then(() => {
    Linking.openURL("https://massic.shop/");
  });
  const MASDONATIONLINK = () => Linking.canOpenURL("https://massic.org/give/").then(() => {
    Linking.openURL("https://massic.org/give/");
  });
  const LogoutButton  = () => {
    return(
      <Menu style={{ alignSelf : 'flex-end', marginRight : 8 }}>
            <MenuTrigger>          
              <View className='w-[100%] px-10 ml-[8]'>
                <Text className='text-right text-gray-400'>Logout</Text>
              </View>
            </MenuTrigger>
            <MenuOptions customStyles={{optionsContainer: {width: 135, borderRadius: 8, marginTop: 20, padding: 8 }}}>
              <MenuOption 
              onSelect={
                async () => {
                     await supabase.from('profiles').update({ push_notification_token : null }).eq('id', session?.user.id)
                     if( session?.user.is_anonymous ){ 
                      const { data, error } = await supabase.functions.invoke('delete-user', {
                         body : { user_id : session.user.id }
                        })
                     }
                     await supabase.auth.signOut()
                  }}>
                <View>
                  <Text 
                 
                  className='text-gray-400'
                  >Logout</Text>
                </View>
                
              </MenuOption>
              <Divider className=' h-[0.5]'/>
              <MenuOption
              onSelect={ async () => {
                Alert.alert(
                  'Are you sure you would like to Delete your Account?', '', [{
                    text : 'Cancel',
                    style : 'default',
                    onPress : () => {}
                  },
                  {
                    text : 'Confirm',
                    style : 'destructive',
                    onPress : async ( ) => {
                      const { data, error } = await supabase.functions.invoke('delete-user', {
                        body : { user_id : session?.user.id }
                       })
                       
                      await supabase.auth.signOut()
                    }
                  }
                ]
                )
                
              }}
              >
                <Text className='text-red-500'>Delete Account</Text>
              </MenuOption>
            </MenuOptions>
        </Menu>
    )
  }
  return (
    <ScrollView className='bg-white pt-[18%] h-[100%]' 
    ref={scrollViewRef}
    keyboardDismissMode='on-drag'
    automaticallyAdjustKeyboardInsets
    >
      <StatusBar barStyle={'dark-content'}/>
      <View className='w-[100%] items-center justify-start' style={{ height : anonStatus ? height / 6 : height / 3.5  }}>
        <LogoutButton />
        <Pressable style={{  shadowColor : "black", shadowOffset : {width : 0, height : 0}, shadowOpacity : 1, shadowRadius : 5  }} onPress={() => (spin.value = spin.value ? 0 : 1)} className='mt-3'>
          <Animated.Image 
            source={require('@/assets/images/MASHomeLogo.png')}
            style={[{ width : 100, height : 100, borderRadius : 50, borderColor : "yellow", borderWidth : 2 }, flip]}
          />
        </Pressable>

     { !anonStatus &&  
     <View className='flex-col mt-4 items-center'>
            <View className='bg-white p-1 rounded-xl'>
              <Text numberOfLines={1}>{profile?.first_name} {profile?.last_name}</Text>
            </View>
            <View className='bg-white p-1 rounded-xl'>
              <Text numberOfLines={1}>{profile?.profile_email}</Text>
            </View>
            <View className='pt-2'>
              <Button mode='contained' buttonColor='#6077F5' textColor='white' className='w-[150]' onPress={()=> !SignInModalCheck() ?  setEditProfileVisible(true) : ''} disabled={anonStatus}>Edit Profile </Button>
            </View>
        </View>
      }
      </View>
      <View className='items-center justify-center w-[100%]' style={{ paddingBottom : tabBarHeight }}>
        
      <View className='flex-col items-center pb-10 w-[100%] justify-center' >
        {/*Donations and Notification Center */}
        <View className=' flex flex-row w-[100%] gap-x-1  items-center justify-between px-2 ml-[0.5]'>

          {/*<Link href={"/more/Donation"} asChild disabled>*/}
            <Pressable className='w-[60%] bg-[#DAE8F6] mt-5 items-center flex-col px-3 py-2 relative' style={{ borderRadius  : 10 }}
            onPress={MASDONATIONLINK}
            >

              <View className='flex-row px-1 w-[100%]'>
                <Text className=' text-gray-400 text-[10px]'>Support Your Community by</Text>
              </View>
              <View className='flex-row w-[100%] items-center justify-between pt-1'>
                <Text className='text-lg ml-1 font-semibold'>Donation</Text>
              </View>
              <View className='w-[100%]'>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M21 6L15.7071 11.2929C15.3166 11.6834 14.6834 11.6834 14.2929 11.2929L12.7071 9.70711C12.3166 9.31658 11.6834 9.31658 11.2929 9.70711L7 14" stroke="#12BD30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <Path d="M3 3V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21H21" stroke="black" stroke-width="2" stroke-linecap="round"/>
              </Svg>
              <View className='flex flex-row items-center justify-between'>
                <Text className=' text-gray-400 text-[12px]'>Phase 2 Expansion Project </Text>
                <Svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                    <Path d="M11.5 1L15 5.5M15 5.5L11.5 10M15 5.5H1" stroke="#6077F5" stroke-linecap="round"/>
                </Svg>
              </View>                  
              </View>

             {/* <View className='absolute w-[112%] h-[120%] rounded-[10px] top-0 overflow-hidden'>
                <BlurView className='w-[100%] h-[100%] items-center justify-center left-0' intensity={10}
                experimentalBlurMethod={'dimezisBlurView'}
                >
                  <Text className='text-black font-bold'>Coming soon...</Text>
                </BlurView>
             </View> */}
            </Pressable>
          {/*</Link>*/}

          <Pressable onPress={SignInModalCheck} className=' w-[35%] mt-5 bg-[#CBFED0] rounded-xl px-[0.5] h-[100px]'>
          <Link
          push 
          href='/(user)/myPrograms/notifications/NotificationEvents' asChild disabled={anonStatus}>
          <Pressable className='w-[100%] items-center flex-col justify-center' style={{ borderRadius  : 10 }}>
                <Text className=' text-gray-400 text-[10px] pt-1'>Edit Your Custom </Text>
               <View className='mt-3'>
                  <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                    <Path fill-rule="evenodd" clip-rule="evenodd" d="M18.3638 5.29755C17.3492 4.7863 16.2052 4.5 15.0003 4.5C11.1874 4.5 7.98424 7.36697 7.56318 11.1566L7.24842 13.9893C7.19584 14.4626 7.17151 14.6798 7.13537 14.8918C7.00345 15.6655 6.75087 16.4138 6.38687 17.1092C6.28715 17.2997 6.17488 17.4872 5.92989 17.8956L5.13896 19.2138L5.11731 19.2498L5.1173 19.2499C4.73284 19.8906 4.41506 20.4202 4.23528 20.8537C4.05076 21.2986 3.95193 21.7811 4.2112 22.239C4.47048 22.697 4.93508 22.8605 5.41154 22.9312C5.87577 23 6.4934 23 7.24062 23H7.28269H22.7179H22.76C23.5072 23 24.1249 23 24.5891 22.9312C25.0655 22.8605 25.5301 22.697 25.7894 22.239C26.0487 21.7811 25.9499 21.2986 25.7653 20.8537C25.5856 20.4202 25.2678 19.8906 24.8833 19.2499L24.8833 19.2498L24.8617 19.2138L24.0707 17.8956C23.8258 17.4872 23.7135 17.2997 23.6138 17.1092C23.2498 16.4138 22.9972 15.6655 22.8653 14.8918C22.8291 14.6798 22.8048 14.4626 22.7522 13.9893L22.6456 13.0295C22.3314 13.1319 22.0021 13.2006 21.6618 13.2314L21.7583 14.0998L21.7603 14.1177L21.7603 14.1178C21.8104 14.5686 21.8379 14.8158 21.8795 15.0598C22.029 15.9368 22.3153 16.7848 22.7278 17.573C22.8426 17.7923 22.9706 18.0056 23.2039 18.3945L23.2132 18.41L24.0042 19.7283C24.4158 20.4142 24.6937 20.8801 24.8416 21.2368C24.9882 21.5901 24.9472 21.697 24.9192 21.7463C24.8913 21.7957 24.8207 21.8859 24.4423 21.942C24.0604 21.9987 23.5179 22 22.7179 22H7.28269C6.48272 22 5.94025 21.9987 5.5583 21.942C5.1799 21.8859 5.10936 21.7957 5.0814 21.7463C5.05345 21.697 5.01245 21.5901 5.15899 21.2368C5.30692 20.8801 5.58487 20.4142 5.99646 19.7283L6.78738 18.41L6.79665 18.3946C7.03004 18.0056 7.15805 17.7923 7.27284 17.573C7.68538 16.7848 7.97163 15.9368 8.12114 15.0598C8.16275 14.8158 8.19022 14.5685 8.24031 14.1177L8.24231 14.0998L8.55706 11.267C8.92185 7.98383 11.697 5.5 15.0003 5.5C15.9375 5.5 16.8322 5.69994 17.6414 6.06135C17.8518 5.77945 18.0944 5.52302 18.3638 5.29755ZM20.1158 6.52162C19.8111 6.67707 19.5425 6.8932 19.3259 7.15407C20.4714 8.18024 21.2536 9.61221 21.4408 11.2428C21.79 11.2165 22.1191 11.1185 22.4135 10.9635C22.1728 9.20824 21.3331 7.66156 20.1158 6.52162Z" fill="#0D509E"/>
                    <Path d="M11.3778 23.0073C11.5914 23.9376 12.0622 24.7596 12.7171 25.3459C13.3721 25.9322 14.1745 26.25 15 26.25C15.8255 26.25 16.6279 25.9322 17.2829 25.3459C17.9378 24.7596 18.4086 23.9376 18.6222 23.0073" stroke="#0D509E" stroke-linecap="round"/>
                    <Circle cx="21.25" cy="8.75" r="2.5" fill="#0D509E"/>
                  </Svg>
               </View>
                <View className='self-end mt-5 flex flex-row items-center justify-between w-[100%] px-1'>
                  <Text className='text-[10px] font-semibold'>Notification Center</Text>
                  <Svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                      <Path d="M11.5 1L15 5.5M15 5.5L11.5 10M15 5.5H1" stroke="#6077F5" stroke-linecap="round"/>
                  </Svg>
                </View>
            </Pressable>
            </Link>
            </Pressable>

        </View>

      {/*MAS Shop Link &  Upcoming*/}
      <View className=' flex flex-row w-[100%] gap-x-1  items-center justify-between px-2 ml-[0.5]'>

          <Pressable onPress={MASHOPLINK} className='h-[116px] w-[35%] rounded-[15px] bg-[#CBFED0] items-center justify-center flex flex-col mt-5'>
              <Text className='text-[10px] text-black pb-4'> Top-Tier Programs</Text>
              <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                <Path d="M4.375 5.625H6.68348C7.3792 5.625 7.72706 5.625 7.98895 5.81376C8.25084 6.00252 8.36084 6.33253 8.58085 6.99254L9.375 9.375" stroke="#0D509E" stroke-linecap="round"/>
                <Path d="M21.875 21.875H10.0636C9.56935 21.875 9.32221 21.875 9.14528 21.8052C8.7817 21.6617 8.53507 21.3195 8.51389 20.9292C8.50359 20.7392 8.58174 20.5048 8.73805 20.0359V20.0359C8.91136 19.5159 8.99802 19.2559 9.13257 19.046C9.40659 18.6183 9.83303 18.311 10.3254 18.1862C10.5671 18.125 10.8412 18.125 11.3892 18.125H18.125" stroke="#0D509E" stroke-linecap="round" stroke-linejoin="round"/>
                <Path d="M18.3037 18.125H13.2626C11.9834 18.125 11.3438 18.125 10.8428 17.7947C10.3419 17.4644 10.0899 16.8765 9.586 15.7007L8.66718 13.5568C7.85769 11.6679 7.45294 10.7235 7.89755 10.0493C8.34215 9.375 9.36964 9.375 11.4246 9.375H20.4555C22.7545 9.375 23.904 9.375 24.3376 10.1221C24.7712 10.8692 24.2008 11.8673 23.0602 13.8634L21.7767 16.1096C21.2147 17.0929 20.9338 17.5846 20.4682 17.8548C20.0026 18.125 19.4363 18.125 18.3037 18.125Z" stroke="#0D509E" stroke-linecap="round"/>
                <Circle cx="21.25" cy="25" r="1.25" fill="#0D509E"/>
                <Circle cx="11.25" cy="25" r="1.25" fill="#0D509E"/>
              </Svg>
              <View className='flex flex-row items-center justify-between w-[100%] px-4'>
                <Text className='text-[13px] text-[#0D509E] font-bold pt-4'>MAS SHOP</Text>
                <View className='pt-4'>
                  <Svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                      <Path d="M11.5 1L15 5.5M15 5.5L11.5 10M15 5.5H1" stroke="#6077F5" stroke-linecap="round"/>
                  </Svg>
                </View>
              </View>
          </Pressable>



          <Pressable onPress={SignInModalCheck} className=' w-[60%] mt-5 bg-[#DAE8F6] rounded-xl px-3 py-2 h-[116px]'>
            <Link href={'/menu/program'} asChild disabled={anonStatus}>
              <Pressable className='w-[100%] items-center flex-col' style={{ borderRadius  : 10 }}>
                  <View className='flex-row items-center justify-between px-1 w-[100%]'>
                    <Text className=' text-gray-400 text-[10px]'>Stay Updated With Knowing What’s  </Text>
                  </View>
                  <View className='flex-row w-[100%] items-center justify-between pt-1'>
                    <View  className='flex-row items-center'>
                      <Svg  width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <Rect width="24" height="24" fill="#DAE8F6"/>
                        <Circle cx="15.5" cy="7.5" r="2.5" fill="#BBBEC6"/>
                        <Path d="M11.0126 16.5002C11.1557 13.6757 12.5251 11 15.5 11C18.4749 11 19.8443 13.6757 19.9874 16.5002C20.0014 16.7759 19.7761 17 19.5 17H11.5C11.2239 17 10.9986 16.7759 11.0126 16.5002Z" fill="#BBBEC6"/>
                        <Path d="M4.0126 16.5002C4.15567 13.6757 5.52513 11 8.5 11C11.4749 11 12.8443 13.6757 12.9874 16.5002C13.0014 16.7759 12.7761 17 12.5 17H4.5C4.22386 17 3.99863 16.7759 4.0126 16.5002Z" fill="#BBBEC6"/>
                        <Path d="M7.01399 17.5002C7.17295 14.6757 8.69457 12 12 12C15.3054 12 16.827 14.6757 16.986 17.5002C17.0015 17.7759 16.7761 18 16.5 18H7.5C7.22386 18 6.99848 17.7759 7.01399 17.5002Z" fill="#222222"/>
                        <Circle  cx="2.5" cy="2.5" r="2.5" transform="matrix(-1 0 0 1 11 5)" fill="#BBBEC6"/>
                        <Circle  cx="12" cy="8" r="3" fill="#222222"/>
                      </Svg>
                      <Text className='text-2xl font-semibold ml-1'>Upcoming</Text>
                    </View>
                  </View>

                  <View className='flex flex-row items-center justify-between w-[100%] pt-8'>
                    <Text className='text-[12px] '>Classes, Lectures, Events, Etc </Text>
                    <Svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                      <Path d="M11.5 1L15 5.5M15 5.5L11.5 10M15 5.5H1" stroke="#6077F5" stroke-linecap="round"/>
                    </Svg>
                  </View>
                </Pressable>
              </Link>
            </Pressable>


        </View>

      { /* Business Ads  */ }
      <View className='px-2 w-[100%]'>
        <Pressable onPress={SignInModalCheck} className=' w-[100%] mt-5 bg-[#EAEBED] rounded-xl'>
          <Link href={'/more/BusinessSponsersScreen'} asChild disabled={anonStatus} className=''>
            <Pressable className='w-[100%] items-center flex-col py-2 px-3' style={{ borderRadius  : 10 }}>
                <View className='flex-row  px-1 w-[100%]'>
                    <Text className=' text-gray-400 text-[12px]'>Showcase Your Business Through </Text>
                </View>
                  <View className='flex-row w-[100%] items-center justify-between pt-1'>
                    <View  className='flex-row items-center'>
                      <View className='relative'>
                        <View className=' absolute left-[5] bottom-[9]'>
                          <Svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                            <Path d="M11.5 8V4.16274C11.5 3.91815 11.5 3.79586 11.4724 3.68077C11.4479 3.57873 11.4075 3.48119 11.3526 3.39172C11.2908 3.2908 11.2043 3.20432 11.0314 3.03137L8.96863 0.968629C8.79568 0.795677 8.7092 0.709202 8.60828 0.64736C8.51881 0.592531 8.42127 0.552127 8.31923 0.52763C8.20414 0.5 8.08185 0.5 7.83726 0.5H2.9C2.05992 0.5 1.63988 0.5 1.31901 0.66349C1.03677 0.8073 0.8073 1.03677 0.66349 1.31901C0.5 1.63988 0.5 2.05992 0.5 2.9V5" stroke="#12BD30"/>
                            <Path d="M7.5 0.5L7.5 2.9C7.5 3.46005 7.5 3.74008 7.60899 3.95399C7.70487 4.14215 7.85785 4.29513 8.04601 4.39101C8.25992 4.5 8.53995 4.5 9.1 4.5L11.5 4.5" stroke="#12BD30"/>
                          </Svg>
                        </View>
                        <Svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                          <Path d="M0.5 2.9C0.5 2.05992 0.5 1.63988 0.66349 1.31901C0.8073 1.03677 1.03677 0.8073 1.31901 0.66349C1.63988 0.5 2.05992 0.5 2.9 0.5H5.31332C5.74409 0.5 5.95947 0.5 6.14963 0.56559C6.31778 0.623593 6.47094 0.718254 6.59801 0.842722C6.74171 0.983472 6.83803 1.17612 7.03066 1.56142L7.96934 3.43898C8.16197 3.82428 8.25829 4.01693 8.40199 4.15768C8.52906 4.28215 8.68222 4.37681 8.85037 4.43481C9.04053 4.5004 9.25591 4.5004 9.68668 4.5004H15.1C15.9401 4.5004 16.3601 4.5004 16.681 4.66389C16.9632 4.8077 17.1927 5.03717 17.3365 5.31942C17.5 5.64028 17.5 6.06032 17.5 6.9004V11.1004C17.5 11.9405 17.5 12.3605 17.3365 12.6814C17.1927 12.9636 16.9632 13.1931 16.681 13.3369C16.3601 13.5004 15.9401 13.5004 15.1 13.5004H2.9C2.05992 13.5004 1.63988 13.5004 1.31901 13.3369C1.03677 13.1931 0.8073 12.9636 0.66349 12.6814C0.5 12.3605 0.5 11.9405 0.5 11.1004V2.9Z" stroke="#12BD30"/>
                        </Svg>
                      </View>
                      <Text className='text-2xl font-semibold ml-1'>Business Ads</Text>
                  </View>
                  </View>
              </Pressable>  
          </Link>
            <View className='w-[100%] flex-col px-3'>
            <Link href={'/more/BusinessAds'} asChild disabled={anonStatus}>
            <Pressable className='p-1 flex-row items-center justify-between '>
                <Text className=' text-black font-[300]'>Start an Application </Text>
                <Svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                  <Path d="M11.5 1L15 5.5M15 5.5L11.5 10M15 5.5H1" stroke="#6077F5" stroke-linecap="round"/>
                </Svg>
              </Pressable>
            </Link>
              <Link href={`/more/BusinessSubmissions/${session?.user.id}`} asChild disabled={anonStatus}>
                <Pressable className='p-1 flex-row items-center justify-between py-2'>
                  <Text className='text-black font-[300]'>Check the Status </Text>
                  <Svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                    <Path d="M11.5 1L15 5.5M15 5.5L11.5 10M15 5.5H1" stroke="#6077F5" stroke-linecap="round"/>
                  </Svg>
                </Pressable>
              </Link>
              </View>
          </Pressable>
      </View>

      {
      profile?.role == 'ADMIN' &&  
        <Link href={"/more/Admin/AdminScreen"} asChild>
            <Pressable className='w-[95%] bg-[#6A6A6A] mt-5 items-center flex-row px-3 py-2 h-[50px] justify-between' style={{ borderRadius  : 10 }}>
            <View className='flex flex-row gap-x-4 items-center justify-center'>
              <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                <Path d="M3.75 15C3.75 8.7868 8.7868 3.75 15 3.75C21.2132 3.75 26.25 8.7868 26.25 15C26.25 21.2132 21.2132 26.25 15 26.25C8.7868 26.25 3.75 21.2132 3.75 15Z" fill="#D9D9D9" fill-opacity="0.38"/>
                <Circle cx="15" cy="12.5" r="5" fill="white"/>
                <Path fill-rule="evenodd" clip-rule="evenodd" d="M22.8008 22.8487C22.8583 22.9454 22.8406 23.0686 22.7591 23.1463C20.7406 25.0694 18.0083 26.25 15.0002 26.25C11.9922 26.25 9.25986 25.0694 7.24135 23.1464C7.15987 23.0687 7.14214 22.9455 7.19966 22.8488C8.64628 20.4161 11.5963 18.75 15.0003 18.75C18.4042 18.75 21.3542 20.416 22.8008 22.8487Z" fill="white"/>
              </Svg>
              <Text className='text-white font-bold text-lg'>Admin</Text>
            </View>

              <Svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                <Path d="M11.5 1L15 5.5M15 5.5L11.5 10M15 5.5H1" stroke="#6077F5" stroke-linecap="round"/>
              </Svg>
            </Pressable>
        </Link>
      }

      <View className='w-[100%] flex flex-row justify-end items-center mt-5 mb-2'>
        <Animated.View className='h-[40px] items-center justify-center rounded-[15px] self-end relative' style={[FeedBackButton, { backgroundColor : feedbackOpen ? '#12BD30' : '#6A6A6A'}]}>
          <Pressable 
          disabled={!sendAble}
          onPress={async () => {
            if( feedbackOpen && feedbackMessage.trim() ){
              setSendAble(false)
              const { error } =  await supabase.functions.invoke('donation-confirmation-email',{body : { message : feedbackMessage, userinfo : profile }})
              if (error) return
              Toast.show({
                type: 'success',
                text1: "Thank you for your feedback!",
                position: 'top',
                topOffset : 50,
                visibilityTime: 2000,
              });
              setFeedBackMessage('')
              setFeedBackOpen(false)
              setSendAble(true)
            }
            else{
            if (feedbackOpen) Alert.alert('Input FeedBack To Send') 
            setFeedBackOpen(!feedbackOpen)
            }
          }} 
          className='items-center justify-between flex flex-row w-[100%] h-[100%] py-2 px-2 rounded-[15px]'>
            <Text className='text-white font-bold'>{feedbackOpen ? 'Send' : 'Feature Request'}</Text>
            {
            feedbackOpen ? <></> : 
            <Animated.View style={FeedBackArrowOpacity} >
              <Svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                  <Path d="M11.5 1L15 5.5M15 5.5L11.5 10M15 5.5H1" stroke="#6077F5" stroke-linecap="round"/>
              </Svg>
            </Animated.View>
            }
            </Pressable>
        </Animated.View>

          <Animated.View style={FeedBackInput} className='relative self-end mr-3'>
              <TextInput
                mode='outlined'
                ref={feedbackRef}
                style={{ width: "100%", height: 45, backgroundColor : 'white' }}
                value={feedbackMessage}
                onChangeText={setFeedBackMessage}
                placeholder="Enter Feedback Message..."
                className=''
                textColor="black"
                activeOutlineColor="#0D509D"
                enterKeyHint='done'
                contentStyle={{ }}
                
              />
          </Animated.View>

       
      </View>
      
        <View className='w-[95%] mt-8 items-center justify-center p-4 flex flex-col gap-y-4' style={{ borderRadius : 10}}
          ref={appflowRef}
        >
          <Text adjustsFontSizeToFit allowFontScaling numberOfLines={1}  className='text-black text-xl'>Created By: AppFlowCreations</Text>
          <Text className='text-[#6077F5]'>appflowcreations@gmail.com </Text>
        </View>
      </View>
      </View>
      <SignInAnonModal visible={visible} setVisible={() => setVisible(false)}/>
      <View style={[{paddingBottom : tabBarHeight}]}></View>
      <Portal>
      <Modal  visible={editProfileVisible} onDismiss={hideModal} contentContainerStyle={{
          height : '60%',
          width : '95%',
          borderRadius : 10,
          backgroundColor : 'white',
          alignSelf : 'center',
          alignItems : 'center'
               }}>
                <View className='flex-col'>
                  <View>
                    <Text className='text-center font-bold text-3xl'>Edit Profile </Text>
                  </View>
                  <View>
                    <Text className='mt-2 mb-1 ml-3'>Enter Your First Name</Text>
                    <TextInput
                    mode='outlined'
                    theme={{ roundness : 50 }}
                    style={{ width: 300, backgroundColor: "#e8e8e8", height: 45 }}
                    activeOutlineColor='#0D509D'
                    value={profileFirstName}
                    onChangeText={setProfileFirstName}
                    placeholder="First Name"
                    textColor='black'
                    />
                    <Text className='mt-2 mb-1 ml-3'>Enter Your Last Name</Text>
                  <TextInput
                    mode='outlined'
                    theme={{ roundness : 50 }}
                    style={{ width: 300, backgroundColor: "#e8e8e8", height: 45, }}
                    activeOutlineColor='#0D509D'
                    value={profileLastName}
                    onChangeText={setProfileLastName}
                    placeholder="Last Name"
                    textColor='black'
                    />
                  <Text className='mt-2 mb-1 ml-3'>Enter Your Email</Text>
                  <TextInput
                    mode='outlined'
                    theme={{ roundness : 50 }}
                    style={{ width: 300, backgroundColor: "#e8e8e8", height: 45 }}
                    activeOutlineColor='#0D509D'
                    value={profileEmail}
                    onChangeText={setProfileEmail}
                    placeholder="Email"
                    textColor='black'
                    />
                  </View>
                  <View className='self-center'>
                    <Button  mode='contained' buttonColor='#57BA47' textColor='white' className='w-[300] h-15 mt-8' onPress={onConfirmButton}>Submit</Button>
                  </View>
                  </View>
      </Modal>
      </Portal>
    </ScrollView>
  )
}

export default Index