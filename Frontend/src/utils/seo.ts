import { watchEffect } from 'vue';
import { useRoute } from 'vue-router';

export interface PageSeo {
  title: string;
  description: string;
}

export const homeSeo: PageSeo = {
  title: 'UW Social | University of Washington Events & Clubs',
  description: 'UW Social is a student-built platform for the University of Washington community. Discover campus events, explore student clubs, find event details and sign-up links, and connect with fellow Huskies.',
};

// Edit the title and description for each route here.
export const routeSeo: Record<string, PageSeo> = {
  Home: homeSeo,
  Events: { title: 'Campus Events | UW Social', description: 'Discover events at the University of Washington. Browse activities, workshops, and meetups, and find event details and sign-up links.' },
  Clubs: { title: 'Student Clubs | UW Social', description: 'Explore student clubs at the University of Washington. Find organizations by interest, learn about their activities, and discover ways to get involved.' },
  Forum: { title: 'Student Experiences | UW Social', description: 'Read student experiences and discussions about campus events, and share your own perspective with the UW Social community.' },
  Forums: { title: 'Event Discussions | UW Social', description: 'Explore discussions about University of Washington events. Read questions, replies, and experiences from fellow Huskies.' },
  EventDetail: { title: 'Event Details | UW Social', description: 'View campus event details, including the description, location, organizer, and sign-up information on UW Social.' },
  ClubDetail: { title: 'Club Details | UW Social', description: 'Learn about a University of Washington student club, its activities, and ways to get involved on UW Social.' },
  ForumDetail: { title: 'Event Discussion | UW Social', description: 'Read and join a campus event discussion on UW Social.' },
  ExperiencePostDetail: { title: 'Student Experience | UW Social', description: 'Read a student experience and community replies on UW Social.' },
  ScoreFramework: { title: 'Event Scoring Framework | UW Social', description: 'Learn how UW Social evaluates tech events based on knowledge growth, networking quality, time efficiency, and organizer credibility.' },
  AIConsultant: { title: 'AI Campus Consultant | UW Social', description: 'Explore campus events, student clubs, and opportunities with the UW Social AI consultant.' },
  Login: { title: 'Log In | UW Social', description: 'Log in to your UW Social account to participate in the campus community.' },
  Profile: { title: 'Your Profile | UW Social', description: 'View your UW Social profile and campus activity.' },
  EditProfile: { title: 'Edit Your Profile | UW Social', description: 'Update your UW Social profile.' },
  Mailbox: { title: 'Your Mailbox | UW Social', description: 'View your UW Social mailbox.' },
  Onboarding: { title: 'Get Started | UW Social', description: 'Set up your UW Social profile and interests.' },
  ForumNewPost: { title: 'Share an Experience | UW Social', description: 'Share your campus event experience with the UW Social community.' },
  EditEvent: { title: 'Edit Event | UW Social', description: 'Update your event details on UW Social.' },
  Publish: { title: 'Publish an Event or Club | UW Social', description: 'Share an event or student club with the UW Social community.' },
};

function plainText(value: string): string {
  const element = document.createElement('div');
  element.innerHTML = value;
  return (element.textContent || '').replace(/\s+/g, ' ').trim();
}

export function setPageSeo(seo: PageSeo): void {
  document.title = plainText(seo.title);
  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'description';
    document.head.appendChild(meta);
  }
  meta.content = plainText(seo.description);
}

// Component-scoped watcher stops automatically when the detail page unmounts.
export function usePageSeo(source: () => PageSeo | null): void {
  const route = useRoute();
  watchEffect(() => {
    // Reapply detail metadata when only the query or hash changes.
    void route.fullPath;
    const seo = source();
    if (seo) setPageSeo(seo);
  });
}
