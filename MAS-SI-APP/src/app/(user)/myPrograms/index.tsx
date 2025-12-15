import { View, Text, FlatList, Pressable, ScrollView, StatusBar, Image, Dimensions, RefreshControl, ActivityIndicator, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import RenderMyLibraryProgram from '@/src/components/UserProgramComponets/renderMyLibraryProgram';
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/lib/supabase';
import { Program, UserPlaylistType } from '@/src/types';
import { Button, Divider, Icon, TextInput } from 'react-native-paper';
import { Link } from 'expo-router';
import RenderLikedLectures from '@/src/components/UserProgramComponets/RenderLikedLectures';
import { UserPlaylistFliers } from '@/src/components/UpcomingFliers';
import LottieView from 'lottie-react-native';
import { EventsType } from '@/src/types';
import SignInAnonModal from '@/src/components/SignInAnonModal';
import { BlurView } from 'expo-blur';
import * as AppleAuthentication from 'expo-apple-authentication'
import Svg, { Path } from 'react-native-svg'
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';
export default function userPrograms() {
  const { session } = useAuth()
  type program_id  = {
    program_id : string
  }
  const { height, width } = Dimensions.get('screen')
  const [ email, setEmail ] = useState('')
  const [ password, setPassword] = useState("")
  const [ loading, setLoading ] = useState(false)
  const [ name, setName ] = useState('')
  
  const [ userPrograms, setUserPrograms ] = useState<program_id[]>()
  const [ userPlaylists, setUserPlaylists ] = useState<UserPlaylistType[]>()
  const [ latestFlier, setLatestFlier ] = useState<Program>()
  const [ anonStatus, setAnonStatus ] = useState(true)
  const [ latestFlierEvent, setLatestFlierEvent ] = useState<EventsType>()
  const [ userNotis, setUserNotis ] = useState()
  const [ refreshing, setRefreshing ] = useState(false)
  const [ signIn, setSignIn ] = useState(true)
  const GoogleButtonSignUp = () => {
        GoogleSignin.configure({
          iosClientId : '991344123272-nk55l8nc7dcloc56m6mmnvnkhdtjfcbf.apps.googleusercontent.com'
        })
      
        return (
          <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            style={[ 
              Platform.OS == 'android' ? {
                height : 64
              } : {height: 48}
            ]}
            color={GoogleSigninButton.Color.Dark}
            onPress={async () => {
              try {
                await GoogleSignin.hasPlayServices()
                const response = await GoogleSignin.signIn()
                const idToken = (response as any).data?.idToken || (response as any).idToken;
                const user = (response as any).data?.user || (response as any).user;
                if (idToken) {
                  const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: idToken,
                  })
                  console.log(response)
                  if( !error ){
                    const {data : Profile , error : ProfileError } = await supabase.from('profiles').update({ first_name : user?.name, profile_email : user?.email }).eq('id', data?.user.id)
                    console.log(Profile, ProfileError)
                  }
                } else {
                  throw new Error('no ID token present!')
                }
              } catch (error: any) {
                if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                  // user cancelled the login flow
                } else if (error.code === statusCodes.IN_PROGRESS) {
                  // operation (e.g. sign in) is in progress already
                } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                  // play services not available or outdated
                } else {
                  // some other error happened
                }
              }
            }}
          />
        )
      }
  const checkIfAnon = async () => {
    if( session?.user.is_anonymous ){
      setAnonStatus(true)
    }
    else{
      setAnonStatus(false)
    }
  }
  async function getUserProgramLibrary(){
    setUserPrograms([])
    const {data, error} = await supabase.from("added_programs").select("program_id").eq("user_id", session?.user.id)
    if(error){
      console.log(error)
    }
    if(data){
      setUserPrograms(data)
    }
  }

 

  useEffect(() => {
    checkIfAnon()
  }, [ session ])

  useEffect(() => {
    getUserProgramLibrary()
    const channel = supabase.channel("user_programs").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table : "added_programs",
        filter : `user_id=eq.${session?.user.id}`
      },
      async (payload) => await getUserProgramLibrary()
    )
    .subscribe()

    return() => { supabase.removeChannel(channel);  }
  }, [])
  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
  
    if (error) alert(error.message);
    setLoading(false);
    await getUserProgramLibrary()
    checkIfAnon()
  }  
  const tabBarHeight = 20
  const onRefresh = async () => {
    await getUserProgramLibrary()
  }
async function signUpWithEmail() {
    setLoading(true)
    if( email && password && name ){
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          first_name: name,
          profile_email: email,
        },
      },
    })

    if (error) {alert(error.message); return}
    setLoading(false)}
    else{
      alert('Fill in the fields to complete sign up')
    }
  } 
  return (
    <ScrollView className='bg-white flex-1 w-[100%]' refreshControl={  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
   }>
     <StatusBar barStyle={"dark-content"}/>
      { anonStatus && ( 

        <BlurView style={{ height : height, zIndex : 1, position : 'absolute', width : width, justifyContent : 'center', alignItems : 'center' }} intensity={50} className=''>
      { signIn ?  <View className=' justify-center items-center flex-2 mt-5 w-[100%]'>
        <View className='w-[95%]  items-center h-[550]  bg-white p-2' style={{shadowColor: "black", shadowOffset: {width: 0, height: 0}, shadowOpacity: 3, shadowRadius: 3, borderRadius: 8}}>
        <Text className='font-bold text-[#0D509D] text-3xl mt-[10%]'>Login</Text>

        <View className='mt-2 items-center w-[100%]'>
        
      <View className='w-[95%] items-center' style={{ shadowColor : 'black', shadowOffset : { width : 0, height : 2 }, shadowOpacity : 0.5, shadowRadius : 1 }}>
          <TextInput
          mode='outlined'
          theme={{ roundness : 50 }}
          style={{ width: 250, backgroundColor: "#e8e8e8", height: 45 }}
          activeOutlineColor='#0D509D'
          value={email}
          onChangeText={setEmail}
          left={<TextInput.Icon icon="email-outline" color="#b7b7b7"/>}
          placeholder="Email"
          textColor='black'
          />

          <View className='h-[20]'/>

          <TextInput
              mode='outlined'
              theme={{ roundness : 50 }}
              style={{ width: 250, backgroundColor: "#e8e8e8", height: 45}}
              activeOutlineColor='#0D509D'
              value={password}
              onChangeText={setPassword}
              left={<TextInput.Icon icon="key-outline" color="#b7b7b7"/>}
              placeholder="Password"
              secureTextEntry
              textColor='black'
          />
        </View>
      
       <Button  mode='contained' onPress={signInWithEmail} disabled={loading} buttonColor='#57BA47' textColor='white' className='w-[150] mt-[4%] mb-[1%]'>Login</Button>
    
        <View className=' flex-row mt-2 items-center mb-5'>
                <Divider className=' w-[100]' bold/>
                <Text className='font-semi text-black text-lg' > OR </Text>
                <Divider className=' w-[100]' bold/>

        </View>
        { Platform.OS == 'ios' ? (
          <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={5}
          style={{ width: 305, height: 40 }}
          onPress={async () => {
            try {
              const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                  AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                  AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
              })
              // Sign in via Supabase Auth.
              console.log(credential)
              if (credential.identityToken) {
                const {
                  error,
                  data: { user },
                } = await supabase.auth.signInWithIdToken({
                  provider: 'apple',
                  token: credential.identityToken,
                })
                console.log(JSON.stringify({ error, user }, null, 2))
                if (!error) {
                  // User is signed in.
                  const{
                    error,
                    data
                  } = await supabase.from('profiles').update({ profile_email : credential.email, first_name : credential.fullName?.givenName }).eq('id', user?.id)
                }
              } else {
                throw new Error('No identityToken.')
              }
            } catch (e) {
              if (e.code === 'ERR_REQUEST_CANCELED') {
                // handle that the user canceled the sign-in flow
              } else {
                // handle other errors
              }
            }
          }}
  
        />
        ) : <></>}
        <View className='h-[10]' />
        <GoogleButtonSignUp />
            </View>
            <View className='mt-5'/>

                <Pressable className='flex-row justify-center mt-[8%]' onPress={() => setSignIn(false)}>
                <Text>Don't have an account?  </Text>
                
                <Text className='text-[#0D509D]'>Sign Up</Text>
                </Pressable>        
        </View>
     
        </View> : 
        
        <View className='w-[95%]  items-center h-[550]  bg-white p-2' style={{shadowColor: "black", shadowOffset: {width: 0, height: 0}, shadowOpacity: 3, shadowRadius: 3, borderRadius: 8}}>
        <Text className='font-bold text-[#0D509D] text-3xl mt-[10%] mb-[2%]'>Sign Up</Text>

      <View className='w-[95%] items-center' style={{ shadowColor : 'black', shadowOffset : { width : 0, height : 2 }, shadowOpacity : 0.5, shadowRadius : 1 }}>
          <TextInput
            mode='outlined' 
            value={name}
            onChangeText={setName}
            style={{ width: 250, backgroundColor: "#e8e8e8", height: 45 }}
            theme={{ roundness : 50 }}
            placeholder={'name'}
            outlineColor='black'
            activeOutlineColor='#0D509D'
            textColor='black'
          />

         <View className='h-[15]'/>

          <TextInput
          mode='outlined'
          theme={{ roundness : 50 }}
          style={{ width: 250, backgroundColor: "#e8e8e8", height: 45 }}
          activeOutlineColor='#0D509D'
          value={email}
          onChangeText={setEmail}
          left={<TextInput.Icon icon="email-outline" color="#b7b7b7"/>}
          placeholder="Email"
          textColor='black'
          />

          <View className='h-[15]'/>
      
          <TextInput
              mode='outlined'
              theme={{ roundness : 50 }}
              style={{ width: 250, backgroundColor: "#e8e8e8", height: 45}}
              activeOutlineColor='#0D509D'
              value={password}
              onChangeText={setPassword}
              left={<TextInput.Icon icon="key-outline" color="#b7b7b7"/>}
              placeholder="Password"
              secureTextEntry
              textColor='black'
          />
      </View>
      <View className='w-[40%] flex-2 mt-[4%]' style={{ shadowColor : 'black', shadowOffset : { width : 0, height : 2 }, shadowOpacity : 0.5, shadowRadius : 1 }}>
      <Button onPress={signUpWithEmail} mode='contained' buttonColor='#57BA47' textColor='white'>Sign Up</Button>
      </View>
      <View className=' flex-row mt-2 items-center self-center'>
      <Divider className=' w-[100]' bold/>
      <Text className='font-semi text-black text-lg' > OR </Text>
      <Divider className=' w-[100]' bold/>
  </View>
  <View className='items-center mt-[5%] w-[100%]'>
      { Platform.OS == 'ios' ? (
      <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={5}
      style={{ width: 305, height: 40 }}
      onPress={async () => {
          try {
          const credential = await AppleAuthentication.signInAsync({
              requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
              ],
          })
          // Sign in via Supabase Auth.
          console.log(credential)
          if (credential.identityToken) {
              const {
              error,
              data: { user },
              } = await supabase.auth.signInWithIdToken({
              provider: 'apple',
              token: credential.identityToken,
              })
              console.log(JSON.stringify({ error, user }, null, 2))
              if (!error) {
              // User is signed in.
              const{
                  error,
                  data
              } = await supabase.from('profiles').update({ profile_email : credential.email, first_name : credential.fullName?.givenName }).eq('id', user?.id)
              }
          } else {
              throw new Error('No identityToken.')
          }
          } catch (e) {
          if (e.code === 'ERR_REQUEST_CANCELED') {
              // handle that the user canceled the sign-in flow
          } else {
              // handle other errors
          }
          }
      }}

      />
      ) : <></>}
      <View className='h-[10]' />
      <GoogleButtonSignUp />
      <Pressable className='flex-row justify-center mt-[8%]' onPress={() => setSignIn(true)}>
          <Text>Have an Account?  </Text>
          
          <Text className='text-[#0D509D]'>Sign In</Text>
      </Pressable>
      </View>
      </View>
        }
        </BlurView>
      )
      }
      <View className='ml-2 mt-[15%]'>
        <Text className='text-3xl font-bold'>My Library</Text>
      </View>
      <ActivityIndicator animating={refreshing} color='blue' style={{}}/>

      <View className='flex-row items-center ml-2 mt-2'>
        <Link href={"/myPrograms/PlaylistIndex"} asChild>
        <Pressable className='flex-row items-center justify-between w-[100%] pr-3'>
          <View className='flex-row items-center justify-center'>
            <Svg  width="31" height="30" viewBox="0 0 31 30" fill="none">
              <Path d="M6.25 8.75H23.75" stroke="#3E98FF" stroke-linecap="round"/>
              <Path d="M6.25 15H18.75" stroke="#3E98FF" stroke-linecap="round"/>
              <Path d="M6.25 21.25H13.75" stroke="#3E98FF" stroke-linecap="round"/>
              <Path d="M30 21.724L20.6897 27.9309L20.6897 15.5171L30 21.724Z" stroke="#3E98FF" stroke-width="2" stroke-linejoin="round"/>
            </Svg> 
            <View className='flex flex-col'>         
              <Text className='text-xl font-bold px-[2]'>Playlists</Text>
              <Text className='text-gray-400 text-sm mb-1'>Add Lectures to Playlist </Text>
            </View>  
          </View>
            <Text className='text-gray-400 text-right'>View All <Icon source={"chevron-right"} size={15} color='gray-400'/></Text>
        </Pressable>
        </Link>
      </View>
      <Divider className='my-2 w-[90%] self-center '/>
      <View className='flex-row items-center ml-2 mt-2'>
        <Link href={"/myPrograms/notifications/NotificationEvents"} asChild>
        <Pressable className='flex-row items-center justify-between w-[100%] pr-3'>
          <View className='flex-row items-center justify-center'>
          <Svg width="30" height="29" viewBox="0 0 30 29" fill="none">
            <Path d="M8.03631 11.0426C8.44301 7.50433 11.4384 4.8335 15 4.8335V4.8335C18.5616 4.8335 21.557 7.50433 21.9637 11.0426L22.2489 13.5237C22.295 13.9247 22.318 14.1252 22.3507 14.3222C22.4999 15.2221 22.802 16.0898 23.2438 16.8879C23.3405 17.0626 23.4469 17.2341 23.6598 17.577L24.3728 18.7257C25.194 20.0489 25.6047 20.7104 25.3363 21.2178C25.3297 21.2302 25.3229 21.2425 25.3158 21.2546C25.0263 21.7502 24.2476 21.7502 22.6903 21.7502H7.30966C5.75237 21.7502 4.97373 21.7502 4.68421 21.2546C4.67712 21.2425 4.67029 21.2302 4.66371 21.2178C4.39535 20.7104 4.80598 20.0489 5.62723 18.7257L6.34021 17.577C6.55309 17.2341 6.65953 17.0626 6.75623 16.8879C7.19803 16.0898 7.50008 15.2221 7.64932 14.3222C7.68199 14.1252 7.70504 13.9247 7.75113 13.5237L8.03631 11.0426Z" stroke="#1B85FF"/>
            <Path d="M11.3778 22.2404C11.5914 23.1397 12.0622 23.9343 12.7171 24.5011C13.3721 25.0678 14.1745 25.375 15 25.375C15.8255 25.375 16.6279 25.0678 17.2829 24.5011C17.9378 23.9343 18.4086 23.1397 18.6222 22.2404" stroke="#1B85FF" stroke-linecap="round"/>
          </Svg>
          <View className='flex flex-col'>         
              <Text className='text-xl font-bold px-[2]'>Notifications</Text>
              <Text className='text-gray-400 text-sm mb-1'>Customize Your Notifications</Text>
          </View>            
          </View>
          <Text className='text-gray-400 text-right'>View All <Icon source={"chevron-right"} size={15} color='gray-400'/></Text>
        </Pressable>
        </Link>
      </View> 
      <Divider className='my-2 w-[90%] self-center '/>
      <View className='flex-row items-center ml-2 mt-2'>
        <View className='flex-row items-center justify-between w-[100%] pr-3'>
          <View className='flex-row items-center justify-center'>
          <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <Path fill-rule="evenodd" clip-rule="evenodd" d="M12.1984 7.5H17.8016C18.8078 7.49998 19.6383 7.49997 20.3148 7.55524C21.0174 7.61265 21.6633 7.73585 22.27 8.04497C23.2108 8.52434 23.9757 9.28924 24.455 10.23C24.7641 10.8367 24.8874 11.4826 24.9448 12.1852C25 12.8617 25 13.6922 25 14.6984V20.3016C25 21.3078 25 22.1383 24.9448 22.8148C24.8874 23.5174 24.7641 24.1633 24.455 24.77C23.9757 25.7108 23.2108 26.4757 22.27 26.955C21.6633 27.2641 21.0174 27.3874 20.3148 27.4448C19.6383 27.5 18.8078 27.5 17.8016 27.5H12.1984C11.1922 27.5 10.3617 27.5 9.68522 27.4448C8.9826 27.3874 8.33672 27.2641 7.73005 26.955C6.78924 26.4757 6.02434 25.7108 5.54497 24.77C5.23586 24.1633 5.11265 23.5174 5.05524 22.8148C4.99997 22.1383 4.99998 21.3078 5 20.3016V14.6984C4.99998 13.6922 4.99997 12.8617 5.05524 12.1852C5.11265 11.4826 5.23585 10.8367 5.54497 10.23C6.02434 9.28924 6.78924 8.52434 7.73005 8.04497C8.33672 7.73586 8.9826 7.61265 9.68522 7.55524C10.3617 7.49997 11.1922 7.49998 12.1984 7.5ZM9.8888 10.0469C9.34078 10.0917 9.06052 10.1729 8.86503 10.2725C8.39462 10.5122 8.01217 10.8946 7.77248 11.365C7.67287 11.5605 7.59172 11.8408 7.54694 12.3888C7.50097 12.9514 7.5 13.6793 7.5 14.75V20.25C7.5 21.3207 7.50097 22.0486 7.54694 22.6112C7.59172 23.1592 7.67287 23.4395 7.77248 23.635C8.01217 24.1054 8.39462 24.4878 8.86503 24.7275C9.06052 24.8271 9.34078 24.9083 9.8888 24.9531C10.4514 24.999 11.1793 25 12.25 25H17.75C18.8207 25 19.5486 24.999 20.1112 24.9531C20.6592 24.9083 20.9395 24.8271 21.135 24.7275C21.6054 24.4878 21.9878 24.1054 22.2275 23.635C22.3271 23.4395 22.4083 23.1592 22.4531 22.6112C22.499 22.0486 22.5 21.3207 22.5 20.25V14.75C22.5 13.6793 22.499 12.9514 22.4531 12.3888C22.4083 11.8408 22.3271 11.5605 22.2275 11.365C21.9878 10.8946 21.6054 10.5122 21.135 10.2725C20.9395 10.1729 20.6592 10.0917 20.1112 10.0469C19.5486 10.001 18.8207 10 17.75 10H12.25C11.1793 10 10.4514 10.001 9.8888 10.0469Z" fill="#0073EE"/>
            <Path d="M12.5 15.004C12.5 14.007 13.61 13.4113 14.4409 13.9623L18.1886 16.4479C18.9415 16.9472 18.9415 18.0528 18.1886 18.5521L14.4409 21.0377C13.61 21.5888 12.5 20.993 12.5 19.996V15.004Z" fill="#0073EE"/>
            <Path d="M7.5 3.75C7.5 4.44036 8.05964 5 8.75 5H21.25C21.9404 5 22.5 4.44036 22.5 3.75C22.5 3.05964 21.9404 2.5 21.25 2.5H8.75C8.05964 2.5 7.5 3.05964 7.5 3.75Z" fill="#0073EE"/>
          </Svg>
          <View className='flex flex-col'>         
              <Text className='text-xl font-bold px-[2]'>Programs</Text>
              <Text className='text-gray-400 text-sm mb-1'>Enjoy a Lecture? Add it </Text>
          </View>           
        </View>
        </View>
      </View>
      <Divider className='my-2 w-[90%] self-center '/>
      <View className='flex-row items-center ml-2 mt-2'>
        <Link href={"/myPrograms/recordedLectures"} asChild>
        <Pressable className='flex-row items-center justify-between w-[100%] pr-3'>
          <View className='flex-row items-center justify-center'>
            <Icon source="video" size={30} color="#007AFF" />
            <View className='flex flex-col'>         
              <Text className='text-xl font-bold px-[2]'>Recorded Lectures</Text>
              <Text className='text-gray-400 text-sm mb-1'>View your recorded lectures</Text>
            </View>  
          </View>
          <Text className='text-gray-400 text-right'>View <Icon source={"chevron-right"} size={15} color='gray-400'/></Text>
        </Pressable>
        </Link>
      </View> 
      <View className='flex-row w-[100%] flex-wrap justify-center mt-5' style={{ paddingBottom : tabBarHeight }} > 
        {userPrograms ? userPrograms.map((program, index) => {
          return(
            <View className='pb-5 justify-between mx-2' key={index}>
              <RenderMyLibraryProgram program_id={program.program_id} />
            </View>
          )
        }) : <></>}
      </View>
    </ScrollView>
  )
}