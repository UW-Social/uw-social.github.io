import type { Timestamp } from 'firebase/firestore';

/**
 * Represents a club/organization
 */
export interface Club {
  id: string;
  /** Name of the club */
  name: string;
  /** Club description */
  description: string;
  /** URL to the club's image */
  imageUrl?: string;
  /** Club category (e.g., Academic, Sports, Arts, etc.) */
  category: string;
  /** Tags associated with the club */
  tags?: string[];
  /** Contact email for the club */
  contactEmail?: string;
  /** Club website or social media link */
  link?: string;
  /** Meeting location */
  location?: string;
  /** Meeting schedule/frequency (e.g., "Every Wednesday 6PM") */
  meetingSchedule?: string;
  /** ID of the club organizer/president */
  organizerId: string;
  /** Club founder/organizer name */
  organizerName?: string;
  /** Number of members */
  memberCount?: number;
  /** Array of member UIDs */
  members?: string[];
  /** Timestamp when the club was created */
  createdAt: Timestamp;
  /** Timestamp when the club was last updated */
  updatedAt?: Timestamp;
  
  // Extended contact information
  /** Physical address */
  address?: string;
  /** City and state */
  city?: string;
  /** Phone number */
  phone?: string;
  /** Campus office location */
  campusOffice?: string;
  /** UW email address */
  uwEmail?: string;
  /** UW Department Advisor */
  departmentAdvisor?: string;
  /** Off-Campus Advisor */
  offCampusAdvisor?: string;
  /** National/local affiliation */
  affiliation?: string;
  /** Other social media contact */
  socialMedia?: string;
  /** Discord link */
  discord?: string;
  /** Instagram link */
  instagram?: string;
  /** WeChat link */
  wechat?: string;
  /** LinkedIn link */
  linkedin?: string;
}

/**
 * Club categories
 */
export enum ClubCategory {
  ACADEMIC = 'ACADEMIC',
  SPORTS = 'SPORTS',
  ARTS = 'ARTS',
  TECHNOLOGY = 'TECHNOLOGY',
  VOLUNTEERING = 'VOLUNTEERING',
  CULTURAL = 'CULTURAL',
  PROFESSIONAL = 'PROFESSIONAL',
  SOCIAL = 'SOCIAL',
  OTHER = 'OTHER',
}

/**
 * Format club category for display
 */
export function formatClubCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    ACADEMIC: 'Academic',
    SPORTS: 'Sports',
    ARTS: 'Arts & Culture',
    TECHNOLOGY: 'Technology',
    VOLUNTEERING: 'Volunteering',
    CULTURAL: 'Cultural',
    PROFESSIONAL: 'Professional',
    SOCIAL: 'Social',
    OTHER: 'Other',
  };
  return categoryMap[category.toUpperCase()] || category;
}
