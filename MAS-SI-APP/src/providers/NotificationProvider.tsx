import { registerForPushNotificationsAsync } from '../lib/notifications';
import { ExpoPushToken, NotificationTriggerInput } from 'expo-notifications';
import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { format, setHours, setMinutes, subMinutes } from 'date-fns';
import { Alert } from 'react-native';
import { Session } from '@supabase/supabase-js';

export type PrayerNotificationTemplateProp = {
  prayer_name : string
  hour : number
  minute : number
  body : string
  title : string
}
export type ProgramNotificationTemplate = {
  program_name : string
  hour : number
  minute : number
  body : string
  title : string
}
Notifications.setNotificationHandler({
  handleNotification : async () =>({
    shouldShowAlert : true,
    shouldPlaySound : false,
    shouldSetBadge : false
  })
})

const NotificationProvider = ({ children }: PropsWithChildren) => {
  const [expoPushToken, setExpoPushToken] = useState<
    ExpoPushToken | undefined
  >();
  const { session } = useAuth()
  const [ CurrentSession, setCurrentSession ] = useState<Session | null>()
  const [notification, setNotification] =
    useState<Notifications.Notification>();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

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

  const DeleteOldPushToken = async () => {
    const { data , error } = await supabase.from('profiles').update({ 'push_notification_token' : null }).eq('id', CurrentSession?.user.id)
  }
  const DeleteGuestAcc = async() => {
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body : { user_id : CurrentSession?.user.id }
    })
  }
  useEffect(() => {
    if( session ){
      registerForPushNotificationsAsync().then( (token : any) => savePushToken(token) );
      if( session?.user.id != CurrentSession?.user.id && CurrentSession != null ){
        //Delete Push Token
        DeleteOldPushToken()
        if( CurrentSession?.user.is_anonymous ){
          DeleteGuestAcc()
        }
      }
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          setNotification(notification);
        });
  
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log('response', response);
        });
        setCurrentSession(session)  
      return () => {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(
            notificationListener.current
          );
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      };
    }
  }, [session]);
  return <>{children}</>;
};

export const SetNotificationOptions = async () => {
  
}

export default NotificationProvider;