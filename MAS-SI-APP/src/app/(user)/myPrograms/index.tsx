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
  // Menu item component
  const MenuItem = ({ 
    icon, 
    title, 
    subtitle, 
    href, 
    showArrow = true,
  }: { 
    icon: string, 
    title: string, 
    subtitle: string, 
    href?: string, 
    showArrow?: boolean,
  }) => {
    const content = (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginHorizontal: 12,
        marginVertical: 3,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F0F0F0',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: '#EBF5FF',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}>
            <Icon source={icon} size={20} color="#0D509D" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#1a1a1a' }}>
              {title}
            </Text>
            <Text style={{ fontSize: 11, color: '#888' }}>
              {subtitle}
            </Text>
          </View>
        </View>
        {showArrow && (
          <Icon source="chevron-right" size={18} color="#CCC" />
        )}
      </View>
    )

    if (href) {
      return (
        <Link href={href as any} asChild>
          <Pressable>{content}</Pressable>
        </Link>
      )
    }
    return content
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#F8F9FA' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle={"dark-content"}/>
      
      {/* Auth Modal */}
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

      {/* Header */}
      <View style={{ 
        paddingTop: Platform.OS === 'ios' ? 50 : 30, 
        paddingBottom: 8,
        paddingHorizontal: 18,
        backgroundColor: '#F8F9FA',
      }}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: '#1a1a1a' }}>
          My Library
        </Text>
      </View>

      {refreshing && <ActivityIndicator color='#0D509D' style={{ marginBottom: 4 }}/>}

      {/* Menu Items */}
      <View>
        <MenuItem title="Playlists" subtitle="Add Lectures to Playlist" href="/myPrograms/PlaylistIndex" icon="playlist-music" />
        <MenuItem title="Notifications" subtitle="Customize Your Notifications" href="/myPrograms/notifications/NotificationEvents" icon="bell" />
        <MenuItem title="Programs" subtitle="Enjoy a Lecture? Add it" showArrow={false} icon="play-box-multiple" />
        <MenuItem title="Recorded Lectures" subtitle="View your recorded lectures" href="/myPrograms/recordedLectures" icon="video" />
      </View>

      {/* My Programs */}
      {userPrograms && userPrograms.length > 0 && (
        <View style={{ marginTop: 12, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 10, marginLeft: 4 }}>
            My Programs
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {userPrograms.map((program, index) => (
              <View key={index} style={{ width: '48%', marginBottom: 10 }}>
                <RenderMyLibraryProgram program_id={program.program_id} />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Bottom spacing for tab bar */}
      <View style={{ height: 100 }} />
    </ScrollView>
  )
}