import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  GoogleAuthProvider,
  User as FirebaseUser,
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { UserProfile } from '../types/user';

interface LoginOptions {
  redirectPath?: string | null;
}

interface LoginResult {
  user: FirebaseUser;
  profile: UserProfile;
  needsOnboarding: boolean;
  nextPath: string;
}

type StoredUserProfile = Partial<UserProfile> | null | undefined;

function buildUserProfile(user: FirebaseUser, storedProfile?: StoredUserProfile): UserProfile {
  const storedTags = storedProfile?.tags;
  const storedGoals = storedProfile?.goals;
  const storedSavedEventIds = storedProfile?.savedEventIds;
  const safeTags = Array.isArray(storedTags) ? storedTags : [];
  const safeGoals = Array.isArray(storedGoals) ? storedGoals : [];
  const safeSavedEventIds = Array.isArray(storedSavedEventIds) ? storedSavedEventIds : [];
  const creationTime = user.metadata.creationTime ?? storedProfile?.metadata?.creationTime ?? '';
  const lastSignInTime = user.metadata.lastSignInTime ?? storedProfile?.metadata?.lastSignInTime ?? '';
  const hasLegacyCompletedProfile = Boolean(safeTags.length && storedProfile?.grade && storedProfile?.major);

  return {
    uid: user.uid,
    email: storedProfile?.email ?? user.email ?? null,
    displayName: storedProfile?.displayName ?? user.displayName ?? '',
    grade: storedProfile?.grade ?? null,
    major: storedProfile?.major ?? null,
    tags: safeTags,
    goals: safeGoals,
    savedEventIds: safeSavedEventIds,
    onboardingCompleted: storedProfile?.onboardingCompleted ?? hasLegacyCompletedProfile,
    photoURL: storedProfile?.photoURL ?? user.photoURL ?? null,
    emailVerified: storedProfile?.emailVerified ?? user.emailVerified,
    metadata: creationTime || lastSignInTime
      ? {
          creationTime,
          lastSignInTime,
        }
      : undefined,
  };
}

export const useUserStore = defineStore('user', () => {
  const auth = getAuth();
  const isLoggedIn = ref(false);
  const userProfile = ref<UserProfile | null>(null);
  

  const hasInitialized = ref(false);

  const profileIsComplete = computed(() => {
    const profile = userProfile.value;
    if (!profile) return false;

    return Boolean(
      profile.onboardingCompleted &&
      Array.isArray(profile.tags) &&
      profile.tags.length > 0,
    );
  });

  const ensureUserDocument = async (user: FirebaseUser): Promise<UserProfile> => {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    const baseProfile = buildUserProfile(user);

    if (!userDoc.exists()) {
      await setDoc(userRef, baseProfile);
      userProfile.value = baseProfile;
      return baseProfile;
    }

    const storedProfile = userDoc.data() as StoredUserProfile;
    const mergedProfile = buildUserProfile(user, storedProfile);

    userProfile.value = mergedProfile;
    return mergedProfile;
  };

  const loadUser = async (): Promise<void> => {
    if (hasInitialized.value) return;
    hasInitialized.value = true;

    await new Promise<void>((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        isLoggedIn.value = !!user;

        if (!user) {
          userProfile.value = null;
          resolve();
          return;
        }

        try {
          await ensureUserDocument(user);
          const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
          if (gtag) {
            gtag('set', { user_id: user.uid });
          }
        } catch (error) {
          console.error('[UserStore] Failed to hydrate user profile:', error);
        } finally {
          resolve();
        }
      });
    });
  };

  const loginWithGoogle = async (options: LoginOptions = {}): Promise<LoginResult> => {
    const provider = new GoogleAuthProvider();

    await setPersistence(auth, browserLocalPersistence);

    const result = await signInWithPopup(auth, provider);
    const profile = await ensureUserDocument(result.user);

    isLoggedIn.value = true;

    const needsOnboarding = !profile.onboardingCompleted;
    const nextPath = needsOnboarding
      ? '/onboarding'
      : options.redirectPath || '/';

    return {
      user: result.user,
      profile,
      needsOnboarding,
      nextPath,
    };
  };

  const fetchUserProfile = async (): Promise<UserProfile | null> => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    return ensureUserDocument(currentUser);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be signed in to update a profile.');
    }

    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(
      userRef,
      {
        ...updates,
        uid: currentUser.uid,
      },
      { merge: true },
    );

    const mergedProfile = buildUserProfile(currentUser, {
      ...(userProfile.value ?? {}),
      ...updates,
      uid: currentUser.uid,
    });

    userProfile.value = mergedProfile;
    return mergedProfile;
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
    userProfile.value = null;
    isLoggedIn.value = false;
  };

  return {
    fetchUserProfile,
    isLoggedIn,
    loadUser,
    loginWithGoogle,
    logout,
    profileIsComplete,
    updateUserProfile,
    userProfile,
  };
});
