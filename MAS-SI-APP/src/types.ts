import FontAwesome from '@expo/vector-icons/FontAwesome';

export type Lectures ={
    lecture_id: number,
    lecture_name: string,
    lecture_speaker: string | null,
    lecture_link: string | "N/A",
    lecture_ai: string | "N/A",
    lecture_date: string | "N/A",
    lecture_time: string
}
export type Program = {
    id : number,
    program_id: number,
    program_name: string,
    program_img: string | null,
    program_desc: string | null,
    program_speaker: string | null,
    lectures: Lectures[]
}

export type salahData = {
    date : string,
    hijri_date: string,
    hijri_month: string,
    day: string,
    fajr: string,
    sunrise: string,
    zuhr: string,
    asr: string,
    maghrib: string,
    isha: string
}

export type iqamahData = {
    date: string,
    fajr: string,
    sunrise: string,
    zuhr: string,
    asr: string,
    maghrib: string,
    isha: string,
    jummah1: string,
    jummah2: string
}
export type prayerTimeData = {
    salah: salahData[],
    iqamah: iqamahData[]
}
export type prayerTimesType = {
    status: string,
    data: prayerTimeData,
    message: string
}

export type gettingPrayerData = {
    date : string,
    hijri_month: string,
    hijri_date: string,
    athan_fajr : string,
    athan_zuhr : string,
    athan_asr : string,
    athan_maghrib : string,
    athan_isha : string,
    iqa_fajr : string,
    iqa_zuhr : string,
    iqa_asr : string,
    iqa_maghrib : string,
    iqa_isha : string,
    jummah1: string,
    jummah2: string
}

export type salahDisplayWidget = {
    prayer: gettingPrayerData,
    nextPrayer: gettingPrayerData
}

export type JummahBottomSheetProp = {
    jummahSpeaker : string,
    jummahSpeakerImg : string,
    jummahTopic : string,
    jummahNum: string,
    jummahDesc: string
}

export type TabArrayType = {
    name: string, 
    title : string,
    icon : string
}

export type SheikDataType = {
    name: string,
    creds : string[],
    image : string
}