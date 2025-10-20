import { View, Text, ScrollView, Pressable, Dimensions, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { Button, Divider, Icon, TextInput, HelperText } from 'react-native-paper'
import BusinessAdsDurationCard from '@/src/components/BusinessAdsComponets/BusinessAdsDurationCard'
import BusinessAdsLocationCard from '@/src/components/BusinessAdsComponets/BusinessAdsLocationCard'
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import * as ImagePicker from "expo-image-picker"
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '@/src/providers/AuthProvider'
import { supabase } from '@/src/lib/supabase'
import { BlurView } from 'expo-blur'
import { Stack, useRouter } from 'expo-router'
import { useRoute } from '@react-navigation/native'
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmissionFormSchema, submissionFormSchema, businessInfoSubmissions, BusinessInfoSchema } from '@/src/components/forms/Personal-Info'
import Animated, { Easing, FadeIn, FadeInLeft, FadeInRight, FadeOut, FadeOutLeft, FadeOutRight, useAnimatedStyle } from 'react-native-reanimated'
import Toast from 'react-native-toast-message'
const BusinessAdsDurationInfoTooltip = () => {
    return(
        <Menu>
            <MenuTrigger>
                <Icon source={'information-outline'} size={20}/>
            </MenuTrigger>
            <MenuOptions customStyles={{optionsContainer: {width: 150, borderRadius: 8, marginTop: 20, padding: 8}}}>
                <MenuOption>
                    <Text>How long would you like your business to be displayed?</Text>
                </MenuOption>
            </MenuOptions>
        </Menu>
    )
}
type BusinessSchemaId = {
    schemaId :  "businessName" | "businessPhoneNumber" | "businessEmail" | "city" | "state" | "address",
    label : string
}
type PersonalSchemaId = {
    schemaId :  "name" | "phoneNumber" | "email",
    label : string
}
function formatPhoneNumber( phoneNumberString : string | undefined ) {
    if( phoneNumberString == undefined ){
        return ''
    }
    var cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return null;
}
const BusinessAds = () => {
  const { session } = useAuth()
  const router = useRouter()
  const tabBarHeight = useBottomTabBarHeight() * 3.7
  const { height, width } = Dimensions.get('screen')
  const [ currentStage, setCurrentStage ] = useState(0)
  const listItemWidth = Dimensions.get('screen').width
  const [ PreviewBusinessAdInfo, setPreviewBusinessAdInfo ] = useState<{ businessName: string; businessPhoneNumber: string; businessEmail: string; city: string; state: string; address: string }>()
  
  const methods = useForm<SubmissionFormSchema>({
    resolver: zodResolver(submissionFormSchema),
    mode: 'onBlur',
  });

  const businessMethods = useForm<BusinessInfoSchema>({
    resolver: zodResolver(businessInfoSubmissions),
    mode: 'onBlur',
  })

  const [ selectedDuration, setSelectedDuration ] = useState([''])
  const [ finishedSelectedChoices, setFinishedSelectedChoices ] = useState(false)
  const [ businessFlyer, setBusinessFlyer ] = useState<ImagePicker.ImagePickerAsset>()


  useEffect(() => {
    if( selectedDuration.length > 0 && businessFlyer ){
        setFinishedSelectedChoices(true)
    }
    else{
        setFinishedSelectedChoices(false)
    }
  }, [ selectedDuration, businessFlyer])

  const ADDURATIONOPTIONS = ['1 Month', '3 Months', '1 Year']
  const stageInfo = ['Personal Info', 'Business Info', 'Ad details']
  const personalStageQuestions : PersonalSchemaId[] = [{ schemaId : 'name' ,label : 'Full Name'}, { schemaId : 'phoneNumber' ,label : 'Phone Number'}, { schemaId : 'email', label : 'Email'}]
  const onFinished = () => {
    setCurrentStage(currentStage + 1)
  }
  
  const onGoBack = () => {
    setCurrentStage(currentStage - 1)
  }
  const businessStageQuestions : BusinessSchemaId[] = [{ schemaId : 'businessName', label: 'Business Name'}, { schemaId : 'address', label : 'Address'}, { schemaId : 'city', label: 'City'},{schemaId : 'state', label : 'State'}, { schemaId : 'businessPhoneNumber', label : 'Phone Number' }, { schemaId : 'businessEmail', label : 'Email' }]

  const onSelectImage = async () => {
    const options : ImagePicker.ImagePickerOptions = {
        mediaTypes : ImagePicker.MediaTypeOptions.Images,
        allowsEditing : true
    }

    const result = await ImagePicker.launchImageLibraryAsync(options)

    if( !result.canceled ){
      const img = result.assets[0]
      setBusinessFlyer(img)
      setPreviewBusinessAdInfo(businessMethods.getValues())
    }
  }

  const onSubmit = async () => {
    if( businessFlyer ){
        setFinishedSelectedChoices(false)
        const base64 = await FileSystem.readAsStringAsync(businessFlyer.uri, { encoding: 'base64' });
        const filePath = `${session?.user.id}/${new Date().getTime()}.${businessFlyer.type === 'image' ? 'png' : 'mp4'}`;
        const contentType = businessFlyer.type === 'image' ? 'image/png' : 'video/mp4';
        const { data : image, error : image_upload_error } = await supabase.storage.from('business_flyers').upload(filePath, decode(base64));
        console.log(image_upload_error)
        if( image ){
            const { data : business_flyer_url } = await supabase.storage.from('business_flyers').getPublicUrl(image?.path)
            const personalInfo = methods.getValues()
            const businessInfo = businessMethods.getValues()
            if( business_flyer_url ) {
                const onApprove = async () => {
                    const { error } = await supabase.from('business_ads_submissions').update({ status : 'APPROVED' }).eq('business_flyer_img', business_flyer_url.publicUrl)
                }
                const { data, error } = await supabase.from('business_ads_submissions').insert({'personal_full_name' : personalInfo.name, 'personal_phone_number' : personalInfo.phoneNumber, 'personal_email' : personalInfo.email, 'business_name': businessInfo.businessName, 'business_address' : businessInfo.address, 'business_phone_number': businessInfo.businessPhoneNumber, 'business_email' : businessInfo.businessEmail,  'business_flyer_duration' : selectedDuration[0], 'business_flyer_img' : business_flyer_url.publicUrl, user_id : session?.user.id, onApprove : onApprove })
                if( error ){
                    console.log(error)
                }else{
                     await supabase.functions.invoke('resend', { body : {submission : { personal_full_name : personalInfo.name, personal_phone_number : personalInfo.phoneNumber, personal_email : personalInfo.email,  business_name: businessInfo.businessName, business_address : businessInfo.address,  business_phone_number :  businessInfo.businessPhoneNumber,  business_email  : businessInfo.businessEmail,  business_flyer_duration : selectedDuration[0],  business_flyer_img : business_flyer_url.publicUrl } }})
                }
                router.back()
            }
        }
        Toast.show(
            {
                type : 'success',
                text1 : 'Submission Received!',
                position: "top",
                topOffset: 50,
                visibilityTime: 2000,
            }
        )
        setFinishedSelectedChoices(true)
    }
    else{
        Alert.alert("Submit Business Flyer")
    }

}
  const personalSubmit: SubmitHandler<SubmissionFormSchema> = (data) => {
    console.log(JSON.stringify(data));
  };
  
  return (
        <ScrollView className='flex-1 bg-white' contentContainerStyle={{ paddingBottom : tabBarHeight }}
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior='scrollableAxes'
        >
        <Stack.Screen options={{ title : 'Business Application', headerTintColor : '#007AFF' , headerTitleStyle: { color : 'black'}, headerStyle : {backgroundColor : 'white',} }}/>
        <View className='w-[100%] bg-[#0D509D] h-[15%] flex-row items-center justify-evenly'>
            { stageInfo.map((item, index) => {
                return(
                    <View key={index} style={{ width : '25%', height : 65 }} className='items-center justify-center flex-col'> 
                        <View style={[{ backgroundColor : currentStage == index ? 'white' : currentStage < index ?  'gray' : 'green'}, {borderRadius : 50, width : '48%', height : '70%', alignItems : 'center' }]}>
                            {currentStage > index ? <Icon source={'check-bold'} color='white' size={40}/> : <></>}
                        </View>
                        <Text className='text-center text-white'>{item}</Text>
                    </View>
                )
                })
            }
        </View>
        <View className='flex-1 bg-white'>
            <View className='flex-2 pt-2'>
            { currentStage == 0 && <Text className='text-3xl font-bold pl-2'>Personal Information</Text>}
            { currentStage == 1 && <Text className='text-3xl font-bold pl-2'>Business Information</Text>}
            { currentStage == 2 && <Text className='text-3xl font-bold pl-2'>Advertisment Details</Text>}
                <Divider style={{ backgroundColor : 'black'}}/>     
            </View>
            { currentStage == 0 && (
                    <Animated.View className='flex-1 flex-col gap-y-8 mt-5' entering={FadeInLeft.duration(500).easing(Easing.inOut(Easing.quad))} exiting={FadeOut} > 
                        {personalStageQuestions.map((item, index) => {
                            return(
                                <View className='w-[90%] self-center flex-2' key={index}>
                                    <Controller
                                        control={methods.control}
                                        name={item.schemaId}
                                        render={({
                                            field: { onChange, onBlur, value },
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
                                                style={{ backgroundColor : 'white', borderBottomWidth : 0, borderWidth : 0, paddingLeft : 10 }}
                                                outlineColor='blue'
                                                activeOutlineColor='blue'
                                                textColor='black'
                                                contentStyle={{ paddingLeft  : 3 }}
                                                selectionColor='black'
                                                keyboardType={item.schemaId == 'phoneNumber' ? 'number-pad' : item.schemaId == 'email' ? 'email-address' : 'default'}
                                                />
                                                <HelperText type="error" visible={error ? true : false} className='text-red-500 font-bold'>
                                                    {error?.message}
                                                </HelperText>
                                            </>
                                            );
                                        }}
                                    />
                                </View>
                            )
                        })}
                        <View className='flex-row items-center w-[100%] justify-end flex-2 px-5' > 
                            <Button className='bg-[#57BA47] ' mode='contained' theme={{ roundness : 1 }} textColor='white' onPress={() => {
                                    // get current form values
                                    const currFormValues = methods.getValues();

                                    // Prevalidate using zod's safeParse
                                    const result = submissionFormSchema.safeParse(currFormValues);

                                    // If prevalidation is failed, display the error
                                    if (!result.success) {
                                        Alert.alert('Fill out all questions please')
                                    } else {
                                    // If prevalidation is successful, notify the user
                                    console.log(methods.getValues())
                                    onFinished()
                                    }
                                }}>
                                <Text>Next</Text>
                            </Button>
                        </View>
                    </Animated.View>
                )} 
                { currentStage == 1 && (
                    <Animated.View className='flex-1 flex-col gap-y-3 mt-5' entering={FadeInLeft.duration(500).easing(Easing.inOut(Easing.quad))} exiting={FadeOut}> 
                        {businessStageQuestions.map((item, index) => {
                            return(
                                <View className='w-[90%] self-center flex-2' key={index}>
                                <Controller
                                        control={businessMethods.control}
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
                                                style={{ backgroundColor : 'white', borderBottomWidth : 0, borderWidth : 0, paddingLeft : 10 }}
                                                outlineColor='blue'
                                                activeOutlineColor='blue'
                                                textColor='black'
                                                contentStyle={{ paddingLeft  : 3 }}
                                                selectionColor='black'
                                                />
                                                <HelperText type="error" visible={error ? true : false} className='text-red-500 font-bold'>
                                                    {error?.message}
                                                </HelperText>
                                            </>
                                            );
                                        }}
                                    />
                                </View>
                            )}
                        )}
                        <View className='flex-row items-center w-[100%] justify-between flex-2 px-5' > 
                            <Button className=' bg-gray-500 ' mode='contained' theme={{ roundness : 1 }} textColor='white' onPress={onGoBack}>
                                <Text>Back</Text>
                            </Button>
                            <Button className='bg-[#57BA47] ' mode='contained' theme={{ roundness : 1 }} textColor='white' onPress={() => {
                                // get current form values
                                const currFormValues = businessMethods.getValues();

                                // Prevalidate using zod's safeParse
                                const result = businessInfoSubmissions.safeParse(currFormValues);

                                // If prevalidation is failed, display the error
                                if (!result.success) {
                                    Alert.alert('Fill out all questions please')
                                } else {
                                // If prevalidation is successful, notify the user
                                console.log(businessMethods.getValues())
                                onFinished()
                                }
                            }}>
                                <Text>Next</Text>
                            </Button>
                        </View>
                    </Animated.View>
                )} 
                { currentStage == 2 && (
                    <Animated.View className='flex-col' entering={FadeInLeft.duration(500).easing(Easing.inOut(Easing.quad))}>
                        <View className='flex-row justify-between items-center px-2'> 
                            <Text className='text-gray-400 text-xl'>Duration</Text>
                            <BusinessAdsDurationInfoTooltip />
                        </View>
                        <View className='items-center flex-col gap-y-2'>
                            {
                                ADDURATIONOPTIONS.map((item, index) => (
                                    <View key={index}>
                                        <BusinessAdsDurationCard height={height / 15} width={width * .8} selectedDuration={selectedDuration} setDuration={setSelectedDuration} duration={item} index={index} />
                                    </View>
                                ))
                            }
                        </View>
                        <View className='flex-row justify-between items-center px-2 mt-4'> 
                            <Text className='text-gray-400 text-xl'>Upload Flyer</Text>
                        </View>
                        <Pressable className='items-center justify-center bg-white self-center mt-2' onPress={onSelectImage} style={{ borderRadius : 20, width : listItemWidth * .93 }}>
                            {businessFlyer ? 
                            <View className='h-[300] flex flex-col bg-gray-500' style={{  borderRadius : 19, overflow : 'hidden', width : listItemWidth * .93}}>
                                <Image source={{ uri : businessFlyer.uri}} style={{  width : '100%', height : 250, objectFit : 'fill' }}/>
                                <View className='px-2 mt-1'>
                                <Text className='text-white text-[12px]' numberOfLines={1} adjustsFontSizeToFit><Text className='font-bold'>{PreviewBusinessAdInfo?.businessName}</Text> {PreviewBusinessAdInfo?.address}</Text>
                                <Text className='text-white text-[12px]' numberOfLines={1} adjustsFontSizeToFit>Contacts: {PreviewBusinessAdInfo?.businessEmail} {formatPhoneNumber(PreviewBusinessAdInfo?.businessPhoneNumber)}</Text>
                                </View>
                            </View>
                            
                            : (
                                <View className=' overflow-hidden w-[100%] h-[100%]' style={{ borderRadius : 20 }}>
                                    <BlurView intensity={10} style={{ height : '100%', width : '100%', borderRadius : 20, alignItems : 'center', justifyContent : 'center'}} >
                                        <View className='p-2 rounded-full bg-gray-50' >
                                            <Icon source={"camera"} size={60} color='#007AFF'/>
                                        </View>
                                    </BlurView>
                                </View>
                            )}
                        </Pressable>
                        <View className='flex-row items-center w-[100%] justify-between  px-5 mt-[20%]' > 
                            <Button className=' bg-gray-500 ' mode='contained' theme={{ roundness : 1 }} onPress={onGoBack} textColor='white'>
                                <Text>Back</Text>
                            </Button>
                            <Button className='bg-[#57BA47] ' mode='contained' theme={{ roundness : 1 }} disabled={!finishedSelectedChoices} onPress={onSubmit} textColor='white'>
                                <Text>Submit</Text>
                            </Button>
                        </View>
                    </Animated.View>
                ) 
            }
        </View>
        </ScrollView>
  )
}

export default BusinessAds
