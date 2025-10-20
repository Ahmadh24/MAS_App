import { View, Text, Image, useWindowDimensions, Pressable, Alert, FlatList } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import Animated, { Easing, FadeIn, FadeInUp, FadeOut, FadeOutUp, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { zodResolver } from '@hookform/resolvers/zod';
import { HelperText, Modal, TextInput } from 'react-native-paper';
import { NameQuestionsSchema } from './forms/MASQuestionaireForm';
import Lock from './Icons/Lock';
import Svg, { Path } from 'react-native-svg';
import { RunnyCircle } from './ProgramSpinningCircle';
import { RunnyOuterCircle } from './ProgramSpinningOuterCircle';
import * as ImagePicker from "expo-image-picker"
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';
import { Program } from '../types';
import { ExpoPushToken } from 'expo-notifications';
import { useAuth } from '../providers/AuthProvider';
import { registerForPushNotificationsAsync } from '../lib/notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { decode } from 'base64-arraybuffer';
import Confetti from './Confetti';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const MASQuestionaire = ({onCloseQuestionaire} : { onCloseQuestionaire : () => void }) => {
  const { session } = useAuth()
  const ConfettiRef = useRef(null)
  const [ newToken, setExpoPushToken ] = useState<ExpoPushToken>()
  const CurrentSection = useSharedValue(1)
  const [CurrSec, setCurrSec] = useState(1) 
  const [ ProfilePic, setProfilePic ] = useState<ImagePicker.ImagePickerAsset>()
  const LAYOUTWIDTH = useWindowDimensions().width
  const [ UserGender, setUserGender ] = useState('All') 
  const [ UserAgeRange, setUserAgeRange ] = useState('')
  const [ ProfilePicBG, setProfilePicBG ] = useState('')
  const [ programs, setPrograms ] = useState<Program[]>([])
  const [ AddedPrograms, setAddedPrograms ] = useState<Program[]>([])
  const [ selectedProgram, setSelectedProgram ] = useState<Program>()
  const PROGRESSBARWIDTH = LAYOUTWIDTH * .8
  const ProgressBarAnimation = useAnimatedStyle(() => {
    return {
        width : withTiming(interpolate(CurrentSection.value, [0, 6], [0, PROGRESSBARWIDTH]), {duration : 1000})
    }
  })
  const { register, handleSubmit, formState } = useForm();
  const { isValid } = formState;
  const [ isReady, setIsReady ] = useState(true)
  const Section1Questions : {schemaId : "first_name" | "last_name", label : string}[] = [{schemaId : "first_name", label : 'First Name'}, { schemaId : "last_name", label : 'Last Name'}]
  const Section2Questions = ['Male', 'Female']
  const Section3Questions = ['4 - 13 years old', '14 - 18 years old', '19 - 23 years old', '24 - 30 years old', '31+ years old'] 
  const NameMethods = useForm<NameQuestionsSchema>({
    resolver: zodResolver(NameQuestionsSchema),
    mode: 'onBlur',
  });
  
    const savePushToken = async ( newToken : ExpoPushToken | undefined ) => {
        setExpoPushToken(newToken)
        if( !newToken ){
        return;
        }
        if( session?.user.id ){
        console.log('session exists')
        const { error } = await supabase.from('profiles').update({  push_notification_token : newToken }).eq('id', session?.user.id)
        if( error ){
            Alert.alert(error.message)
        }
        }
        else{
        console.log('session fail')
        }
     }

  const GetPrograms = async () => {
    const { data : AllPrograms, error : AllProgramsError } = await supabase.from('programs').select().eq('program_gender', 'Both')
    const { data, error } = await supabase.from('programs').select().eq('program_gender', UserGender)
    if(data){
        const Combined = AllPrograms?.concat(data)
        setPrograms(Combined!)
    }
    }
    const onSelectImage = async () => {
        const options : ImagePicker.ImagePickerOptions = {
            mediaTypes : ImagePicker.MediaTypeOptions.Images,
            allowsEditing : true
        }
        const result = await ImagePicker.launchImageLibraryAsync(options)

        if( !result.canceled ){
            const img = result.assets[0]
            setProfilePicBG('')
            setProfilePic(img)
        }
    }

    const uploadImage = async () => {
        if( ProfilePic ){
            setIsReady(false)
            const base64 = await FileSystem.readAsStringAsync(ProfilePic.uri, { encoding: 'base64' });
            const filePath = `${session?.user.id}/${new Date().getTime()}.${ProfilePic.type === 'image' ? 'png' : 'mp4'}`;
            const contentType = ProfilePic.type === 'image' ? 'image/png' : 'video/mp4';
            const { data : image, error :image_upload_error } = await supabase.storage.from('profile_pic').upload(filePath, decode(base64));

            if( image ){
                const { data : profile_pic_url} = await supabase.storage.from('profile_pic').getPublicUrl(image?.path)
                if( profile_pic_url ) {
                    const { error } = await supabase.from("profiles").update({ profile_pic: profile_pic_url.publicUrl}).eq('id', session?.user.id)
                }
            }
        }
        else{
            setIsReady(false)
            const { error } = await supabase.from("user_playlist").update({ def_background : ProfilePicBG }).eq('id', session?.user.id)
        }
    }

    const onAddProgramsToNotification = async () => {

    }


    const onSetSelectProgram = (program : Program) => {
        setSelectedProgram(program)
    }

    const onAddToProgram = ( program: Program ) => {
        setAddedPrograms([...AddedPrograms, program])
        setPrograms(programs.filter((program) => program.program_id != selectedProgram?.program_id))
        setSelectedProgram(undefined)
    }

    const onRemoveFromAddToProgram = (removeProgram : Program) => {
        setAddedPrograms(AddedPrograms.filter((program) => program.program_id != removeProgram?.program_id))
        setPrograms([...programs, removeProgram])
        setSelectedProgram(undefined)
    }

    const onNotificationButtonPress = async () => {
        registerForPushNotificationsAsync().then((newToken : any) => savePushToken(newToken))
    } 

    useEffect(() => {
        GetPrograms()
    }, [UserGender, UserAgeRange])

    useEffect(() => {
        if( CurrSec == 6 ){
           setTimeout(() => ConfettiRef?.current.fire(), 500)
        }
    }, [ CurrSec == 6 ])

  return (
    <View className='h-[110%] w-full bg-white flex flex-col'>
      { 
      CurrSec != 1 && CurrSec != 6 ? 
        <Pressable className='bg-[#0E4F9F] rounded-full w-8 h-8 items-center justify-center ml-3  mt-[14%]'
            onPress={() => {setCurrSec(CurrSec - 1); CurrentSection.value -= 1}}
        >
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Path d="M3.33331 10L2.97976 10.3536L2.62621 10L2.97976 9.64645L3.33331 10ZM15.8333 9.5C16.1095 9.5 16.3333 9.72386 16.3333 10C16.3333 10.2761 16.1095 10.5 15.8333 10.5L15.8333 9.5ZM7.97976 15.3536L2.97976 10.3536L3.68687 9.64645L8.68687 14.6464L7.97976 15.3536ZM2.97976 9.64645L7.97976 4.64645L8.68687 5.35355L3.68687 10.3536L2.97976 9.64645ZM3.33331 9.5L15.8333 9.5L15.8333 10.5L3.33331 10.5V9.5Z" fill="white"/>
            </Svg>
        </Pressable>
        : <></>
      }

      {
        CurrSec != 6 &&
        <View className='flex-start h-[10%] w-[50%] self-center'
        style={{
            marginTop : CurrSec == 1 ? '14%' : 0
        }}
        >
          <Image source={require('@/assets/images/massiLogo.webp')} className='w-full h-full'  style={{ objectFit : 'contain' }}/>
          <View className={`self-center bg-[#E2E2E2] rounded-[30px] h-[6px]`}
          style={{
            width : PROGRESSBARWIDTH
          }}
          >
            <Animated.View style={[ProgressBarAnimation, { height : 6}]} className='bg-[#58BA47] absolute bottom-7.5 rounded-l-xl z-[1]'/>
         </View>
        </View>

     }


      {
        CurrSec == 1 &&
            <Animated.View className='h-[70%]  space-y-2 flex flex-col w-[90%] self-center'
            entering={FadeIn.duration(1000).easing(Easing.inOut(Easing.quad))}
            >
                <View className='h-[85%]'>
                    <Text className='font-bold text-3xl text-center py-6'>What's Your name?</Text>
                   { Section1Questions.map((item, index) => (
                        <View className='w-full self-center flex-2' key={index}>
                            <Controller
                                    control={NameMethods.control}
                                    name={item.schemaId}
                                    render={({
                                        field: { onChange , onBlur, value },
                                        fieldState: { error },
                                    }) => {
                                        return (
                                        <>
                                            <TextInput 
                                            mode='outlined'
                                            label={item.label}
                                            onBlur={onBlur}
                                            value={value}
                                            onChangeText={onChange}
                                            style={{ backgroundColor : '#EEEBE5', borderBottomWidth : 0, borderWidth : 0, paddingLeft : 10, fontSize : 12 }}
                                            outlineColor='#EEEBE5'
                                            activeOutlineColor='black'
                                            textColor='black'
                                            contentStyle={{ paddingLeft  : 3 }}
                                            selectionColor='black'
                                            theme={{
                                                roundness : 8
                                            }}
                                            />
                                            <HelperText type="error" visible={error ? true : false} className='text-red-500 font-bold'>
                                                {error?.message}
                                            </HelperText>
                                        </>
                                        );
                                    }}
                                />
                        </View>
                    )) }
                    <View className='flex flex-row space-x-4 w-full self-center'>
                        <Lock /> 
                        <Text className=' text-[#A4A4A4] text-[10px]'>This information is only shared with MAS employees </Text>
                    </View>
                </View>

                <Pressable className=' bg-[#0E4F9F] rounded-[10px] h-[75px] w-[75px] items-center justify-center self-end '
                onPress={() => {
                    // // get current form values
                    // const currFormValues = NameMethods.getValues();

                    // // Prevalidate using zod's safeParse
                    // const result = NameQuestionsSchema.safeParse(currFormValues);

                    // // If prevalidation is failed, display the error
                    // if (!result.success) {
                    //     Alert.alert('Fill out all questions please')
                    // }
                    // else{
                    // CurrentSection.value += 1; setCurrSec(CurrSec + 1)
                    // }

                    CurrentSection.value += 1; setCurrSec(CurrSec + 1)

                }}

                >
                    <Svg width="40" height="34" viewBox="0 0 40 34" fill="none">
                        <Path d="M33.3333 17L33.6572 16.619L34.1054 17L33.6572 17.381L33.3333 17ZM8.33334 17.5C8.0572 17.5 7.83334 17.2761 7.83334 17C7.83334 16.7239 8.0572 16.5 8.33334 16.5V17.5ZM23.6572 8.11903L33.6572 16.619L33.0095 17.381L23.0095 8.88097L23.6572 8.11903ZM33.6572 17.381L23.6572 25.881L23.0095 25.119L33.0095 16.619L33.6572 17.381ZM33.3333 17.5H8.33334V16.5H33.3333V17.5Z" fill="white"/>
                    </Svg>
                </Pressable>

            </Animated.View>
        } 

        {/* User Gender  */}
       { CurrSec== 2 &&
            <Animated.View className='h-[66%] flex flex-col w-[90%] self-center'
            entering={FadeIn.duration(1000).easing(Easing.inOut(Easing.quad))}
            >
                <View className='h-[85%] space-y-6'>
                    <Text className='font-bold text-2xl text-center py-6'>What's your Gender?</Text>
                    { Section2Questions.map((item, index) => (
                        <Pressable className='w-full self-center flex-2 rounded-[8px] h-[40px] items-start justify-center pl-3' key={index} onPress={() => {setUserGender(item);  CurrentSection.value += 1; setCurrSec(CurrSec + 1)}}
                        style={{
                            backgroundColor : UserGender == item ? '#58BA47' : '#EEEBE5'
                        }}
                        >
                            <Text className='text-black font-[500px]'>{item}</Text>
                        </Pressable>
                    )) }
                    <View className='flex flex-row space-x-4 w-full self-center'>
                        <Lock />                                                                         
                        <Text className=' text-[#A4A4A4] text-[10px] '>This information is only shared with MAS employees </Text>
                    </View>
                </View>

                {/* <Pressable className=' bg-[#0E4F9F] rounded-[10px] h-[75px] w-[75px] items-center justify-center self-end'
                onPress={() => {CurrentSection.value += 1; setCurrSec(CurrSec + 1)}}
                >
                    <Svg width="40" height="34" viewBox="0 0 40 34" fill="none">
                        <Path d="M33.3333 17L33.6572 16.619L34.1054 17L33.6572 17.381L33.3333 17ZM8.33334 17.5C8.0572 17.5 7.83334 17.2761 7.83334 17C7.83334 16.7239 8.0572 16.5 8.33334 16.5V17.5ZM23.6572 8.11903L33.6572 16.619L33.0095 17.381L23.0095 8.88097L23.6572 8.11903ZM33.6572 17.381L23.6572 25.881L23.0095 25.119L33.0095 16.619L33.6572 17.381ZM33.3333 17.5H8.33334V16.5H33.3333V17.5Z" fill="white"/>
                    </Svg>
                </Pressable> */}
            </Animated.View> 
        }

        {/* User Age Range */}
        {CurrSec == 3 &&
            <Animated.View className='h-[66%]  space-y-2 flex flex-col w-[90%] self-center'
            entering={FadeIn.duration(1000).easing(Easing.inOut(Easing.quad))}
            >
                <View className=' h-[85%] space-y-6'>
                    <Text className='font-bold text-2xl text-center py-6'>What age range do you fall in? </Text>
                    { Section3Questions.map((item, index) => (
                            <Pressable 
                            style={{
                                backgroundColor : UserAgeRange == item ? '#58BA47' : '#EEEBE5'
                            }}
                            className='w-full self-center flex-2 bg-[#EEEBE5] rounded-[8px] h-[40px] items-start justify-center pl-3' key={index} onPress={() => {setUserAgeRange(item); CurrentSection.value += 1; setCurrSec(CurrSec + 1)} }>
                                <Text className='text-black font-[500px]'>{item}</Text>
                            </Pressable>
                        )) }
                    <View className='flex flex-row space-x-4 w-full self-center'>
                        <Lock /> 
                        <Text className=' text-[#A4A4A4] text-[10px]'>This information is only shared with MAS employees </Text>
                    </View>
                </View>

                {/* <Pressable className=' bg-[#0E4F9F] rounded-[10px] h-[75px] w-[75px] items-center justify-center self-end'
                onPress={() => {CurrentSection.value += 1; setCurrSec(CurrSec + 1)}}
                >
                    <Svg width="40" height="34" viewBox="0 0 40 34" fill="none">
                        <Path d="M33.3333 17L33.6572 16.619L34.1054 17L33.6572 17.381L33.3333 17ZM8.33334 17.5C8.0572 17.5 7.83334 17.2761 7.83334 17C7.83334 16.7239 8.0572 16.5 8.33334 16.5V17.5ZM23.6572 8.11903L33.6572 16.619L33.0095 17.381L23.0095 8.88097L23.6572 8.11903ZM33.6572 17.381L23.6572 25.881L23.0095 25.119L33.0095 16.619L33.6572 17.381ZM33.3333 17.5H8.33334V16.5H33.3333V17.5Z" fill="white"/>
                    </Svg>
                </Pressable> */}
            </Animated.View> 
       }

       {/* Add a Profile Pi  */}
       { CurrSec == 4 &&
            <Animated.View className='h-[66%] space-y-2 flex flex-col w-[90%] self-center'
            entering={FadeIn.duration(1000).easing(Easing.inOut(Easing.quad))}
            >
                <View className='h-[85%] space-y-3'>
                    <Text className='font-bold text-2xl text-center py-6'>Add a profile picture !</Text>
    
                    <Pressable className='border-2 border-[#0E4F9F] rounded-full p-4 self-center w-[160px] h-[160px] aspect-1 items-center justify-center'
                    onPress={onSelectImage}
                    >
                        {ProfilePic && !ProfilePicBG ? 
                        <View className='bg-gray-200 rounded-full items-center justify-center w-[150px] h-[150px]'>
                            <Image source={ProfilePic} className='h-full w-full rounded-full'/>
                        </View>
                         :
                         ProfilePicBG ? 
                        <View className='bg-gray-200 rounded-full items-center justify-center w-[150px] h-[150px]'>
                             <Image source={require('@/assets/images/MasPlaylistDef.png')} className='rounded-full h-full w-full' 
                                style={{
                                    objectFit : 'contain',
                                    backgroundColor : ProfilePicBG,
                                }}
                                />
                        </View>
                        :
                        <View className='bg-gray-200 rounded-full items-center justify-center w-[150px] h-[150px]'>
                            <Svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                                <Path d="M13 6.5L13 19.5" stroke="#222222" stroke-linecap="square" stroke-linejoin="round"/>
                                <Path d="M19.5 13L6.5 13" stroke="#222222" stroke-linecap="square" stroke-linejoin="round"/>
                            </Svg>
                        </View>
                        }
                    </Pressable>
    
                    <Text className='text-left font-[400] text-black '>Default images</Text>
    
                    <View className='flex flex-row space-x-6 self-center'>
                        {
                            ['#FFFF','#FDE2E4','#BEE1E6','#F0E6EF','#FAEDCB',].map((item) => (
                                <Pressable onPress={() => {setProfilePicBG(item); setProfilePic(undefined)}} className=''>
                                    <Image source={require('@/assets/images/MasPlaylistDef.png')} key={item} className='rounded-full h-[50px] w-[50px]' 
                                    style={{
                                        objectFit : 'contain',
                                        backgroundColor : item
                                    }}
                                    />
                                </Pressable>
                            ))
                        }
                    </View>
    
                    <View className='flex flex-row space-x-4 w-full self-center'>
                        <Lock /> 
                        <Text className=' text-[#A4A4A4] text-[10px]'>This information is only shared with MAS employees </Text>
                    </View>
                </View>

                <Pressable className=' bg-[#0E4F9F] rounded-[10px] h-[75px] w-[75px] items-center justify-center self-end'
                onPress={() => {CurrentSection.value += 1; setCurrSec(CurrSec + 1)}}
                >
                    <Svg width="40" height="34" viewBox="0 0 40 34" fill="none">
                        <Path d="M33.3333 17L33.6572 16.619L34.1054 17L33.6572 17.381L33.3333 17ZM8.33334 17.5C8.0572 17.5 7.83334 17.2761 7.83334 17C7.83334 16.7239 8.0572 16.5 8.33334 16.5V17.5ZM23.6572 8.11903L33.6572 16.619L33.0095 17.381L23.0095 8.88097L23.6572 8.11903ZM33.6572 17.381L23.6572 25.881L23.0095 25.119L33.0095 16.619L33.6572 17.381ZM33.3333 17.5H8.33334V16.5H33.3333V17.5Z" fill="white"/>
                    </Svg>
                </Pressable>
            </Animated.View>       
       }

       {/* Add programs quickstart */}
       {
        CurrSec == 5 && 
        <View className='h-[67%] space-y-4 px-6 '>
            <View>
                <Text className='font-bold text-2xl text-black mt-4'>Add programs ...</Text>
                <Text className=' text-[10px] text-left'>Select the programs you want to be notified for </Text>
            </View>
            <View className='h-[60%] items-center justify-center relative'>
                <View className='z-[1] items-center justify-center  absolute rounded-2xl'><RunnyCircle programs={programs.slice(programs.length / 2)} onSetSelectProgram={onSetSelectProgram} /></View>
                <View className=' z-[-1] items-center justify-center  rounded-2xl'><RunnyOuterCircle programs={programs.slice(0, programs.length / 2)} onSetSelectProgram={onSetSelectProgram}/></View>
            </View>
            <Text className='text-2xl text-left'>Programs Added</Text>
            <View className='flex flex-row space-x-2 full '>
                <View className='w-[70%] space-x-2 flex-row flex overflow-scroll'>

                    <FlatList 
                        data={AddedPrograms}
                        renderItem={({item, index}) => (
                            <AnimatedPressable
                            onPress={() => {onRemoveFromAddToProgram(item)}}
                            exiting={FadeOutUp.duration(1000).easing(Easing.inOut(Easing.quad))}
                            className={'rounded-xl mx-2'}
                            >
                                <Animated.Image src={item?.program_img ? item.program_img : require('@/assets/images/MasPlaylistDef.png')} className='w-[75px] h-[75px] rounded-xl  border-4 border-[#CAFDC1]  '
                                style={{
                                    objectFit : 'fill'
                                }}
                                key={index}
                                entering={FadeIn.duration(500).easing(Easing.inOut(Easing.quad))}
                                />
                            </AnimatedPressable>
                        )}
                        horizontal
                        className=''
                    />
                </View>
                <View className='w-[30%] items-end'>
                    <Pressable className=' bg-[#0E4F9F] rounded-[10px] h-[75px] w-[75px] items-center justify-center mt-8 border'
                    onPress={() => {CurrentSection.value += 1; setCurrSec(CurrSec + 1)}}
                    >
                        <Svg width="40" height="34" viewBox="0 0 40 34" fill="none">
                            <Path d="M33.3333 17L33.6572 16.619L34.1054 17L33.6572 17.381L33.3333 17ZM8.33334 17.5C8.0572 17.5 7.83334 17.2761 7.83334 17C7.83334 16.7239 8.0572 16.5 8.33334 16.5V17.5ZM23.6572 8.11903L33.6572 16.619L33.0095 17.381L23.0095 8.88097L23.6572 8.11903ZM33.6572 17.381L23.6572 25.881L23.0095 25.119L33.0095 16.619L33.6572 17.381ZM33.3333 17.5H8.33334V16.5H33.3333V17.5Z" fill="white"/>
                        </Svg>
                    </Pressable>
                </View>
            </View>
        </View>
       }
       
       {/* Turn Notifications on */}
       {/* 
       
            GOES HERE
       
       */}


       {/* Account Completion */}
       {
        CurrSec == 6 && 
        <Animated.View className='h-full w-full bg-[#0E4F9F] flex flex-col items-center justify-start border pt-[45%]'
        entering={FadeIn.duration(1000).easing(Easing.inOut(Easing.quad))}
        >

            <Pressable className=' relative items-center justify-center border-green-500 h-[200px] w-[200px]' >
                <View className=' z-[2]'>
                    <Svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                        <Path d="M89.8413 21.7321C94.9433 15.0035 105.059 15.0035 110.161 21.7321L121.611 36.833C123.43 39.2326 126.403 40.4639 129.386 40.0537L148.161 37.4723C156.526 36.3221 163.679 43.4747 162.529 51.8402L159.947 70.6147C159.537 73.598 160.768 76.5706 163.168 78.3901L178.269 89.8404C184.997 94.9424 184.997 105.058 178.269 110.16L163.168 121.61C160.768 123.429 159.537 126.402 159.947 129.385L162.529 148.16C163.679 156.525 156.526 163.678 148.161 162.528L129.386 159.946C126.403 159.536 123.43 160.767 121.611 163.167L110.161 178.268C105.059 184.997 94.9433 184.997 89.8413 178.268L78.391 163.167C76.5715 160.767 73.5989 159.536 70.6156 159.946L51.841 162.528C43.4756 163.678 36.323 156.525 37.4732 148.16L40.0546 129.385C40.4648 126.402 39.2335 123.429 36.8339 121.61L21.733 110.16C15.0044 105.058 15.0044 94.9424 21.733 89.8404L36.8339 78.3901C39.2335 76.5706 40.4648 73.598 40.0546 70.6147L37.4732 51.8402C36.323 43.4747 43.4756 36.3221 51.8411 37.4723L70.6156 40.0537C73.5989 40.4639 76.5715 39.2326 78.391 36.833L89.8413 21.7321Z" fill="#CAFDC1"/>
                    </Svg>
                </View>
                <View className=' absolute self-center z-[2] '>
                    <Svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                        <Path d="M20.8333 58.3333L36.7331 70.2581C37.1618 70.5797 37.7677 70.5061 38.107 70.0914L75 25" stroke="#33363F" strokeWidth="2" strokeLinecap="round"/>
                    </Svg>
                </View>
                <View className=' absolute self-center'>
                    <Confetti ref={ConfettiRef}/>
                </View>
            </Pressable>

            <View className=' self-center w-[70%] space-y-10 text-center my-[15%]'>
                <Text className='text-white text-[36px] font-[400] font-serif text-center'
                style={{
                    fontFamily : 'Poltawski'
                }}
                >
                    Account Made !
                </Text>
    
                <Text className='text-white font-[400] text-center text-[15px]' 
                style={{
                    fontFamily : 'Poltawski'
                }}
                >
                    Account created successfully! Dive into a
                    unique adventure with MAS SI.
                </Text>
            </View>

            <Pressable 
            className=' w-[50%] h-[50px] rounded-[10px] border-[#58BA47] border-1 items-center justify-center mt-[15%]'
            onPress={onCloseQuestionaire}
            >
                <LinearGradient 
                    colors={['#FFF', '#CAFDC1']}
                    start={{x : 0, y : 0.5}}
                    locations={[0.2, 1]}
                    className='h-full w-full rounded-[10px] items-center justify-center'
                >
                <Text className=' font-serif text-black text-2xl'>Done</Text>
                </LinearGradient>
            </Pressable>



        </Animated.View> 
       }
        <View className=''>
            <Text className='text-[#A4A4A4] text-center'>experiencing issues? Email our team:</Text>
            <Text className='text-black underline text-center'>developer@massic.org</Text>
        </View>

        <Modal visible={selectedProgram != undefined} onDismiss={() => setSelectedProgram(undefined)}
        theme={{
            colors : {
                backdrop : 'rgba(0, 0, 0, 0.80)'
            }
        }}    
        >
            <View className='items-center justify-center w-[220px] space-y-10  self-center'>
                <View className='max-h-[230px] max-w-[250px] rounded-xl self-center  w-[100%] overflow-hidden'>
                    <Image src={selectedProgram?.program_img ? selectedProgram.program_img : require('@/assets/images/MasPlaylistDef.png')} className='w-full h-full rounded-[10px] '
                    style={{
                        objectFit : 'fill'
                    }}
                    />
                </View>
                <Pressable className=' border-[#58BA47] bg-[#CAFDC1] w-[100%] max-w-[220px] max-h-[45px] h-[45px] items-center justify-center rounded-[10px]'
                onPress={() => {
                    onAddToProgram(selectedProgram!)
                 }}
                >
                    <Text className='text-[20px]'>Add to Programs</Text>
                </Pressable>
            </View>
        </Modal>
    </View>
  )
}

export default MASQuestionaire

