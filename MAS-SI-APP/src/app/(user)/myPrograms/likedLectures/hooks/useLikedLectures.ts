import { useState, useEffect } from 'react'
import { supabase } from '@/src/lib/supabase'
import { useAuth } from '@/src/providers/AuthProvider'
import { EventLectureType, Lectures, Program } from '@/src/types'

export const useLikedLectures = () => {
  const { session } = useAuth()
  const [likedLecture, setLikedLectures] = useState<Lectures[]>()
  const [likedEventLecture, setLikedEventLectures] = useState<EventLectureType[]>()
  const [likedPrograms, setLikedPrograms] = useState<Program[]>()
  const [loading, setLoading] = useState(true)

  const fetchLikedLectures = async () => {
    if (!session?.user.id) return

    const { data, error } = await supabase
      .from('liked_lectures')
      .select('lecture_id')
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error fetching liked lectures:', error)
      return
    }

    if (!data) return

    const lecturePromises = data.map(async (lecture) => {
      const { data: lectureInfo, error: lectureError } = await supabase
        .from('program_lectures')
        .select('*')
        .eq('lecture_id', lecture.lecture_id)
        .single()

      if (lectureError) {
        console.error('Error fetching lecture info:', lectureError)
        return null
      }

      return lectureInfo
    })

    const lectures = await Promise.all(lecturePromises)
    setLikedLectures(lectures.filter((l): l is Lectures => l !== null))
  }

  const fetchLikedEventLectures = async () => {
    if (!session?.user.id) return

    const { data, error } = await supabase
      .from('liked_event_lectures')
      .select('event_lecture_id')
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error fetching liked event lectures:', error)
      return
    }

    if (!data) return

    const lecturePromises = data.map(async (lecture) => {
      const { data: lectureInfo, error: lectureError } = await supabase
        .from('events_lectures')
        .select('*')
        .eq('event_lecture_id', lecture.event_lecture_id)
        .single()

      if (lectureError) {
        console.error('Error fetching event lecture info:', lectureError)
        return null
      }

      return lectureInfo
    })

    const lectures = await Promise.all(lecturePromises)
    setLikedEventLectures(lectures.filter((l): l is EventLectureType => l !== null))
  }

  const fetchLikedPrograms = async () => {
    if (!session?.user.id) return

    const { data, error } = await supabase
      .from('added_programs')
      .select('program_id')
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error fetching liked programs:', error)
      return
    }

    if (!data) return

    const programPromises = data.map(async (item) => {
      const { data: programInfo, error: programError } = await supabase
        .from('programs')
        .select('*')
        .eq('program_id', item.program_id)
        .single()

      if (programError) {
        console.error('Error fetching program info:', programError)
        return null
      }

      return programInfo
    })

    const programs = await Promise.all(programPromises)
    setLikedPrograms(programs.filter((p): p is Program => p !== null))
  }

  const refreshAll = async () => {
    await Promise.all([fetchLikedLectures(), fetchLikedEventLectures(), fetchLikedPrograms()])
  }

  useEffect(() => {
    if (!session?.user.id) return

    // Initial fetch
    refreshAll().finally(() => setLoading(false))

    // Set up real-time subscriptions
    const programChannel = supabase
      .channel('liked_program_lectures_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'liked_lectures',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => fetchLikedLectures()
      )
      .subscribe()

    const eventChannel = supabase
      .channel('liked_event_lectures_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'liked_event_lectures',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => fetchLikedEventLectures()
      )
      .subscribe()

    const programsChannel = supabase
      .channel('liked_programs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'added_programs',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => fetchLikedPrograms()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(programChannel)
      supabase.removeChannel(eventChannel)
      supabase.removeChannel(programsChannel)
    }
  }, [session?.user.id])

  return {
    likedLecture,
    likedEventLecture,
    likedPrograms,
    loading,
    refreshAll,
    fetchLikedLectures,
    fetchLikedEventLectures,
    fetchLikedPrograms,
  }
}

