export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  grade: string | null;
  major: string | null;
  tags?: string[] | null;
  goals?: string[] | null;
  savedEventIds?: string[] | null;
  onboardingCompleted?: boolean;
  photoURL?: string | null;
  emailVerified: boolean;
  metadata?: {
	creationTime: string;
	lastSignInTime: string;
  };
}
