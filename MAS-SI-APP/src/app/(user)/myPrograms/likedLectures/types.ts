import { EventLectureType, Lectures, Program } from '@/src/types'

export interface LikedLecturesProps {
  likedLecture?: Lectures[]
  refreshing?: boolean
  onRefresh?: () => void
}

export interface LikedEventLecturesProps {
  likedEventLecture?: EventLectureType[]
  refreshing?: boolean
  onRefresh?: () => void
}

export interface LikedProgramsProps {
  likedPrograms?: Program[]
  refreshing?: boolean
  onRefresh?: () => void
}

export interface StatCardProps {
  icon: React.ComponentType<{ color: string; size: number; strokeWidth: number; fill?: string }>
  count: number
  label: string
  isTotal?: boolean
  animatedStyle?: any
  displayCount: number
}

export interface TabBarProps {
  navigationState: {
    index: number
    routes: Array<{ key: string; title: string }>
  }
  jumpTo: (key: string) => void
  programCount: number
  eventCount: number
}

