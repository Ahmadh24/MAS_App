import React, { createContext, useContext, useState, useRef, useCallback } from 'react'

type OnboardingContextType = {
  isOnboardingIncomplete: boolean
  setOnboardingIncomplete: (value: boolean) => void
  showOnboardingSheet: () => void
  onboardingSheetRef: React.RefObject<any>
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOnboardingIncomplete, setOnboardingIncomplete] = useState(false)
  const onboardingSheetRef = useRef<any>(null)

  const showOnboardingSheet = useCallback(() => {
    onboardingSheetRef.current?.present()
  }, [])

  return (
    <OnboardingContext.Provider 
      value={{ 
        isOnboardingIncomplete, 
        setOnboardingIncomplete,
        showOnboardingSheet,
        onboardingSheetRef,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}

