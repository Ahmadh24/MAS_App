import FontAwesome from '@expo/vector-icons/FontAwesome';

export type Lectures ={
    lecture_id: string,
    lecture_name: string,
    lecture_speaker: string | null,
    lecture_link: string | "N/A",
    lecture_ai: string | "N/A",
    lecture_date: string | "N/A",
    lecture_time: string
    lecture_key_notes : string[]
}
export type Program = {
    id : number,
    program_id: string,
    program_name: string,
    program_img: string | null,
    program_desc: string | null,
    program_speaker: string | null,
    lectures: Lectures[],
    has_lectures : boolean,
    program_is_paid : boolean,
    program_price : number
    is_paid : boolean
    is_kids : boolean
    is_fourteen_plus : boolean
    is_education : boolean
    program_start_date : string
    program_end_date : string
    program_days : string[]
    program_start_time : string
    paid_link : string
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
    prayerData : salahData[]
    iqamahData : iqamahData[]
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
    topic : string,
    desc : string,
    speaker : { speaker_name : string, speaker_creds : string[], speaker_img : string },
    jummah_time : string
}

export type TabArrayType = {
    name: string, 
    title : string,
    icon : string
}

export type SheikDataType = {
    speaker_name: string,
    speaker_creds : string[],
    speaker_img : string
    speaker_id : string
}

export type EventsType = {
    id : number,
    event_id : string,
    event_name : string,
    event_speaker : string,
    event_desc : string,
    event_img: string,
    has_lecture : boolean
    event_price : number,
    is_paid : boolean
    is_kids : boolean
    is_fourteen_plus : boolean
    is_education : boolean
    event_start_date : string
    event_end_date: string
    event_start_time : string
    event_days : string []
    pace : boolean
    paid_link : string

}
export type EventLectureType = {
    id : number,
    event_lecture_id : string
    event_id : string,
    event_lecture_name : string,
    event_lecture_speaker : string,
    event_lecture_desc : string,
    event_lecture_link: string,
    event_lecture_date : string
    event_lecture_keynotes : string[]
}

export type UserPlaylistType = {
    user_id : string,
    playlist_id : string,
    playlist_img : string,
    playlist_name : string
    def_background : string
}

export type UserPlaylistLectureType = {
    user_id : string
    playlist_id : string
    program_lecture_id : string | null
    event_lecture_id : string | null
    quran_lecture_id : string | null
    id : number
}

export type ProgramFormType = {
    program_id : string
    question_type : string
    question : string
    radio_button_prompts : [string]
}

export type Profile = {
    id : string
    first_name : string
    last_name : string
    profile_email : string
    role : string
}

export type addProgramToNotificationsToastProp = {
    props : Program
}

export type BusinessSubmissionsProp = {
    personal_full_name : string
    personal_phone_number : string
    personal_email : string
    business_name : string
    business_address : string
    business_phone_number : string
    business_flyer_duration : string
    business_flyer_location : string
    business_flyer_img : string
    user_id : string
    status : string 
    created_at : string
    submission_id : string
}