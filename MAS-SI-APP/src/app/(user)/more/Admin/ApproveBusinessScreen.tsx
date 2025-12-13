import { View, Text, ScrollView, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { Button } from 'react-native-paper'
import Toast from 'react-native-toast-message'
import { format } from 'date-fns'
const ApproveBusinessScreen = () => {
  const { submission } = useLocalSearchParams()
  const [submissionInfo, setSubmissionInfo] = useState<any>()
  const [date, setDate] = useState('')
  const router = useRouter()
  const handleSubmit = () => {
    Toast.show({
      type: "success",
      text1: "Ad Approved, It will now show in Home and Prayer table screen",
      position: "top",
      topOffset: 50,
    });
  };

  const handleReject = () => {
    Toast.show({
      type: "success",
      text1: "Ad Rejected",
      position: "top",
      topOffset: 50,
    });
  };
  const getSubmission = async () => {
    const { data, error } = await supabase.from('business_ads_submissions').select('*').eq('submission_id', submission).single()
    if (data) {
      setSubmissionInfo(data)
      setDate(data.created_at)
    }
  }
  if (!setSubmissionInfo) {
    return <></>
  }

  const onApprove = async () => {
    const { error } = await supabase.from('business_ads_submissions').update({ status: 'APPROVED' }).eq('submission_id', submission)
    console.log(error)
    handleSubmit()
    router.back()
  }

  const onReject = async () => {
    const { error } = await supabase.from('business_ads_submissions').update({ status: 'REJECT' }).eq('submission_id', submission)
    handleReject()
    router.back()
  }
  useEffect(() => {
    getSubmission()
  }, [])
  return (
    <>
      <Stack.Screen
        options={{
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: "#F9FAFB" },
          headerTintColor: '#4A5568',
          title: "Approve Business Ads",
          headerTitleStyle: {
            fontWeight: '600',
            color: '#1F2937'
          }
        }}
      />
      <View style={{ padding: 16, backgroundColor: '#F9FAFB', flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
            <Text className="text-base font-bold mb-3 text-gray-800">Personal Information</Text>
            <View className='space-y-2'>
              <View className='flex-row'>
                <Text className="text-gray-600 font-medium w-[35%]">Full Name:</Text>
                <Text className="text-gray-800 flex-1">{submissionInfo?.personal_full_name}</Text>
              </View>
              <View className='flex-row'>
                <Text className="text-gray-600 font-medium w-[35%]">Phone:</Text>
                <Text className="text-gray-800 flex-1">{submissionInfo?.personal_phone_number}</Text>
              </View>
              <View className='flex-row'>
                <Text className="text-gray-600 font-medium w-[35%]">Email:</Text>
                <Text className="text-gray-800 flex-1" numberOfLines={2}>{submissionInfo?.personal_email}</Text>
              </View>
            </View>
          </View>

          <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
            <Text className="text-base font-bold mb-3 text-gray-800">Business Information</Text>
            <View className='space-y-2'>
              <View className='flex-row'>
                <Text className="text-gray-600 font-medium w-[35%]">Business Name:</Text>
                <Text className="text-gray-800 flex-1">{submissionInfo?.business_name}</Text>
              </View>
              <View className='flex-row'>
                <Text className="text-gray-600 font-medium w-[35%]">Address:</Text>
                <Text className="text-gray-800 flex-1" numberOfLines={2}>{submissionInfo?.business_address}</Text>
              </View>
              <View className='flex-row'>
                <Text className="text-gray-600 font-medium w-[35%]">Phone:</Text>
                <Text className="text-gray-800 flex-1">{submissionInfo?.business_phone_number}</Text>
              </View>
              <View className='flex-row'>
                <Text className="text-gray-600 font-medium w-[35%]">Email:</Text>
                <Text className="text-gray-800 flex-1" numberOfLines={2}>{submissionInfo?.business_email}</Text>
              </View>
            </View>
          </View>

          <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
            <Text className="text-base font-bold mb-3 text-gray-800">Flyer Information</Text>
            <View className='flex-row mb-3'>
              <Text className="text-gray-600 font-medium w-[35%]">Duration:</Text>
              <Text className="text-gray-800 flex-1">{submissionInfo?.business_flyer_duration}</Text>
            </View>
            <Text className="text-sm font-semibold mb-2 text-gray-700">Flyer Preview:</Text>
            <View className='bg-gray-50 rounded-xl p-2'>
              <Image
                source={{ uri: submissionInfo?.business_flyer_img }}
                style={{
                  width: '100%',
                  height: 250,
                  borderRadius: 12,
                }}
                resizeMode="contain"
              />
            </View>
          </View>

          <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
            <Text className="text-base font-bold mb-3 text-gray-800">Submission Information</Text>
            <View className='space-y-2'>
              <View className='flex-row'>
                <Text className="text-gray-600 font-medium w-[35%]">Created At:</Text>
                <Text className="text-gray-800 flex-1">{date ? format(date, 'PPPP') : ''}</Text>
              </View>
              <View className='flex-row'>
                <Text className="text-gray-600 font-medium w-[35%]">Submission ID:</Text>
                <Text className="text-gray-800 flex-1 text-xs">{submissionInfo?.submission_id}</Text>
              </View>
            </View>
          </View>

          <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
            <Text className="text-base font-bold mb-4 text-gray-800">Approve or Reject</Text>
            <View className='flex-row gap-x-3 justify-center'>
              <Button
                mode="contained"
                buttonColor="#6077F5"
                textColor="white"
                theme={{ roundness: 12 }}
                style={{ flex: 1, height: 50, justifyContent: 'center' }}
                labelStyle={{ fontSize: 16, fontWeight: '600' }}
                onPress={async () => await onApprove()}
              >
                Approve
              </Button>

              <Button
                mode="contained"
                buttonColor="#EF4444"
                textColor="white"
                theme={{ roundness: 12 }}
                style={{ flex: 1, height: 50, justifyContent: 'center' }}
                labelStyle={{ fontSize: 16, fontWeight: '600' }}
                onPress={async () => await onReject()}
              >
                Reject
              </Button>
            </View>
          </View>
        </ScrollView>
      </View>

    </>
  )
}

export default ApproveBusinessScreen