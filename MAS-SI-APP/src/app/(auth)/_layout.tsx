import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/src/providers/AuthProvider';
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

const UserAuthStack = () => {
  const { session, loading } = useAuth(); // ✅ loading must come from your AuthProvider
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single();
        
        if (!error && data) {
          setOnboardingCompleted(data.onboarding_completed ?? false);
        } else {
          setOnboardingCompleted(false);
        }
      }
      setCheckingOnboarding(false);
    };

    if (!loading && session) {
      checkOnboardingStatus();
    } else if (!loading) {
      setCheckingOnboarding(false);
    }
  }, [session, loading]);

  if (loading || (session && checkingOnboarding)) return null; // ✅ Don't render anything until session and onboarding status are checked

  if (session) {
    // If onboarding is not completed, show onboarding screen
    if (onboardingCompleted === false) {
      return (
        <Stack>
          <Stack.Screen name="Onboarding" options={{ headerShown: false }} />
        </Stack>
      );
    }
    return <Redirect href="/(user)" />;
  }

  return <Stack />;
};

export default UserAuthStack;
