<template>
  <EventDetail />
</template>

<script setup lang="ts">
import { usePageSeo } from '../../utils/seo';
import { computed, ref, onMounted, watch, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEventStore } from '../../stores/event';
import { useUserStore } from '../../stores/user';
import { formatEventSchedule } from '../../types/event';
import type { Event } from '../../types/event';
import type { DiscussionPost, ExperiencePost } from '../../types/forum';
import ExperiencePostCard from '../ExperiencePostCard.vue';
import ForumPostCard from '../ForumPostCard.vue';
import ReplyInput from '../ReplyInput.vue';
import EventList from '../EventList.vue';
import { downloadIcs } from '../../utils/icsUtils';
import { addEventToGoogleCalendar } from '../../utils/googleCalendar';
import { buildEventJsonLd, useJsonLd } from '../../utils/structuredData';
import {
  createDiscussionReply,
  createEventDiscussionPost,
  deleteEventDiscussionPost,
  deleteEventExperiencePost,
  subscribeToEventDiscussionPosts,
  subscribeToEventExperiencePosts,
  toggleDiscussionPostLike,
  toggleDiscussionReplyLike,
  toggleExperiencePostLike,
} from '../../api/forums';

const route = useRoute();
const router = useRouter();
const eventStore = useEventStore();
const userStore = useUserStore();
const event = ref<Event | null>(null);
usePageSeo(() => event.value ? {
  title: `${event.value.title || 'Student Experience'} | UW Social`,
  description: event.value.description || `Learn more about ${event.value.title || 'this experience'} on UW Social.`,
} : null);
const isLoading = ref(true);
const commentsSectionRef = ref<HTMLElement | null>(null);
const experienceSectionRef = ref<HTMLElement | null>(null);
const calendarMenuRef = ref<HTMLElement | null>(null);
const posts = ref<DiscussionPost[]>([]);
const experiencePosts = ref<ExperiencePost[]>([]);
const isPosting = ref(false);
const isSavingEvent = ref(false);
const isAddingToGoogleCalendar = ref(false);
const isCalendarMenuOpen = ref(false);
const postError = ref('');
const experienceError = ref('');
let unsubscribePosts: (() => void) | null = null;
let unsubscribeExperiencePosts: (() => void) | null = null;
const highlightedPostId = computed(() => {
  const postId = route.query.postId;
  return typeof postId === 'string' ? postId : '';
});

const eventJsonLd = computed(() => event.value ? buildEventJsonLd(event.value) : null);
useJsonLd('mobile-event-detail', eventJsonLd);

const currentUserInitials = computed(() => {
  const profile = userStore.userProfile;
  const value = profile?.displayName || profile?.email || 'Y';
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return (words[0]?.slice(0, 2) || 'Y').toUpperCase();
});

const isSavedEvent = computed(() => {
  if (!event.value?.id) return false;
  return (userStore.userProfile?.savedEventIds ?? []).includes(event.value.id);
});

const primaryBadge = computed(() => event.value?.category?.trim() || 'Academic');

const secondaryBadge = computed(() => {
  const tags = event.value?.tags ?? [];
  return tags.find((tag) => tag && tag.trim())?.trim() || '';
});

const reviewDisplay = computed(() => {
  const review = event.value?.review;
  const stars = typeof review?.stars === 'number'
    ? Math.min(5, Math.max(0, Math.round(review.stars)))
    : 0;
  const score = typeof review?.score === 'number'
    ? Math.min(5, Math.max(0, review.score))
    : 0;
  const sentence = review?.sentence?.trim() || 'Review details coming soon';

  return {
    starsText: score > 0 ? score.toFixed(1) : '--',
    fullStars: stars,
    sentence,
  };
});

const eventSummary = computed(() => {
  const description = event.value?.description?.trim();
  if (!description) return 'Witness the convergence of cutting-edge technology and visionary minds.';
  const firstLine = description.split(/\n+/).find(Boolean) || description;
  return firstLine.length > 108 ? `${firstLine.slice(0, 105).trim()}...` : firstLine;
});

const goToRelatedEvent = (relatedEvent: Event) => {
  router.push({
    path: `/events/${relatedEvent.id}`,
    query: {
      returnTo: route.fullPath,
    },
  });
};

// Load event data when component mounts
onMounted(async () => {
  document.addEventListener('click', handleCalendarClickOutside);
  try {
    const eventId = route.params.id as string;
    
    // Ensure events are loaded
    if (eventStore.events.length === 0) {
      await eventStore.fetchEvents();
    }
    
    // Find the specific event
    const foundEvent = eventStore.events.find((e: Event) => e.id === eventId);
    if (foundEvent) {
      event.value = foundEvent;
    } else {
      console.error('Event not found:', eventId);
    }
    
  } catch (error) {
    console.error('Error loading event:', error);
  } finally {
    isLoading.value = false;
    nextTick(() => {
      scrollToForum();
    });
  }
});

const subscribePosts = (id: string) => {
  if (!id) return;
  if (unsubscribePosts) {
    unsubscribePosts();
    unsubscribePosts = null;
  }

  unsubscribePosts = subscribeToEventDiscussionPosts(
    id,
    userStore.userProfile?.uid,
    (nextPosts) => {
      posts.value = nextPosts;
    },
    (error) => {
      console.error('Failed to load posts:', error);
      postError.value = 'Failed to load posts.';
    }
  );
};

const subscribeExperiencePosts = (id: string) => {
  if (!id) return;
  if (unsubscribeExperiencePosts) {
    unsubscribeExperiencePosts();
    unsubscribeExperiencePosts = null;
  }

  unsubscribeExperiencePosts = subscribeToEventExperiencePosts(
    id,
    userStore.userProfile?.uid,
    (nextPosts) => {
      experiencePosts.value = nextPosts;
    },
    (error) => {
      console.error('Failed to load experience posts:', error);
      experienceError.value = 'Failed to load experience posts.';
    }
  );
};

const goToLogin = () => {
  router.push({
    path: '/login',
    query: {
      redirect: route.fullPath,
      prompt: 'Please log in to join the event conversation.'
    }
  });
};

const goToExperienceEditor = () => {
  if (!event.value?.id) return;
  router.push({
    path: '/forum/new',
    query: {
      eventId: event.value.id,
    },
  });
};

const addToGoogleCalendar = async () => {
  if (!userStore.isLoggedIn) {
    router.push({
      path: '/login',
      query: {
        redirect: route.fullPath,
        prompt: 'Please log in to add events to your Google Calendar.',
      },
    });
    return;
  }

  if (!event.value || isAddingToGoogleCalendar.value) {
    return;
  }

  isAddingToGoogleCalendar.value = true;

  try {
    const created = await addEventToGoogleCalendar(event.value);
    if (created.htmlLink) {
      window.open(created.htmlLink, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    console.error('Failed to add event to Google Calendar:', error);
    const message = error instanceof Error
      ? error.message
      : 'Unable to add this event to Google Calendar.';
    window.alert(message);
  } finally {
    isAddingToGoogleCalendar.value = false;
  }
};

const closeCalendarMenu = () => {
  isCalendarMenuOpen.value = false;
};

const toggleCalendarMenu = () => {
  if (!event.value) return;
  isCalendarMenuOpen.value = !isCalendarMenuOpen.value;
};

const handleCalendarClickOutside = (clickEvent: MouseEvent) => {
  const target = clickEvent.target;
  if (
    !isCalendarMenuOpen.value ||
    !(target instanceof Node) ||
    calendarMenuRef.value?.contains(target)
  ) {
    return;
  }

  closeCalendarMenu();
};

const downloadEventCalendar = () => {
  if (!event.value) return;
  downloadIcs(event.value);
  closeCalendarMenu();
};

const addEventToGoogleCalendarFromMenu = async () => {
  closeCalendarMenu();
  await addToGoogleCalendar();
};

defineExpose({
  addToGoogleCalendar,
});

// Handle image loading errors
const handleImageError = (event: any) => {
  const target = event.target as HTMLImageElement;
  target.src = '/images/wavingdog.jpg';
};

// Format time using existing utility
const formattedTime = computed(() => {
  if (!event.value) return '';
  try {
    return formatEventSchedule(event.value);
  } catch (error) {
    // Fallback to simple date formatting
    const startDate = typeof event.value.startTime?.toDate === 'function' 
      ? event.value.startTime.toDate() 
      : new Date(event.value.startTime);
    
    return startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
});

const scheduleDetails = computed(() => {
  const fallback = formattedTime.value || 'Schedule TBD';
  const lines = fallback.split('\n').map((line: string) => line.trim()).filter(Boolean);
  const getValue = (label: string) => {
    const match = lines.find((line: string) => line.toLowerCase().startsWith(`${label.toLowerCase()}:`));
    return match ? match.split(':').slice(1).join(':').trim() : '';
  };

  const startDate = getValue('Start Date');
  const endDate = getValue('End Date');
  const time = getValue('Time');

  if (startDate || endDate || time) {
    return {
      primary: startDate && endDate ? `${startDate} - ${endDate}` : startDate || endDate || 'Schedule TBD',
      secondary: time || lines.find((line: string) => line.toLowerCase().startsWith('repeats:'))?.replace(/^Repeats:\s*/i, '') || 'Time TBD',
    };
  }

  if (fallback.includes(' - ')) {
    const [primary, ...rest] = fallback.split(' - ');
    return {
      primary: primary.trim(),
      secondary: rest.join(' - ').trim() || 'Time TBD',
    };
  }

  return {
    primary: fallback,
    secondary: 'Time TBD',
  };
});

const schedulePrimary = computed(() => scheduleDetails.value.primary);
const scheduleSecondary = computed(() => scheduleDetails.value.secondary);

const locationPrimary = computed(() => {
  const location = event.value?.location?.trim();
  if (!location) return 'Location TBD';
  return location.split(',')[0]?.trim() || location;
});

const locationSecondary = computed(() => {
  const location = event.value?.location?.trim();
  if (!location) return 'Details to be announced';
  const [, ...rest] = location.split(',');
  return rest.join(',').trim() || location;
});

const openRegistration = () => {
  if (!event.value?.link) return;
  window.open(event.value.link, '_blank', 'noopener,noreferrer');
};

const toggleSavedEvent = async () => {
  if (!event.value?.id) return;
  if (!userStore.isLoggedIn || !userStore.userProfile?.uid) {
    router.push({
      path: '/login',
      query: {
        redirect: route.fullPath,
        prompt: 'Please log in to save events.',
      },
    });
    return;
  }

  isSavingEvent.value = true;
  try {
    const currentSaved = userStore.userProfile.savedEventIds ?? [];
    const nextSaved = isSavedEvent.value
      ? currentSaved.filter((id) => id !== event.value?.id)
      : [...new Set([...currentSaved, event.value.id])];

    await userStore.updateUserProfile({ savedEventIds: nextSaved });
  } catch (error) {
    console.error('Failed to update saved event:', error);
  } finally {
    isSavingEvent.value = false;
  }
};

const submitPost = async (text: string) => {
  const eventId = route.params.id as string;
  if (!userStore.userProfile?.email || !text || !eventId) return;

  isPosting.value = true;
  postError.value = '';

  try {
    await createEventDiscussionPost(
      eventId,
      {
        uid: userStore.userProfile.uid,
        email: userStore.userProfile.email,
        displayName: userStore.userProfile.displayName,
      },
      text
    );
  } catch (error) {
    console.error('Failed to post message:', error);
    postError.value = 'Failed to post. Please try again.';
  } finally {
    isPosting.value = false;
  }
};

const submitReply = async (postId: string, text: string) => {
  const eventId = route.params.id as string;
  if (!userStore.userProfile?.email || !eventId) return;

  try {
    await createDiscussionReply(
      eventId,
      postId,
      {
        uid: userStore.userProfile.uid,
        email: userStore.userProfile.email,
        displayName: userStore.userProfile.displayName,
      },
      text
    );
    subscribePosts(eventId);
  } catch (error) {
    console.error('Failed to post reply:', error);
    postError.value = 'Failed to post reply. Please try again.';
  }
};

const getCurrentLikeActor = () => {
  const profile = userStore.userProfile;
  if (!profile?.uid) return null;

  return {
    uid: profile.uid,
    displayName: profile.displayName,
    email: profile.email,
    photoURL: profile.photoURL,
  };
};

const togglePostLike = async (postId: string) => {
  const eventId = route.params.id as string;
  const actor = getCurrentLikeActor();
  if (!actor || !eventId) return;

  try {
    await toggleDiscussionPostLike(eventId, postId, actor);
  } catch (error) {
    console.error('Failed to toggle post like:', error);
  }
};

const toggleReplyLike = async (postId: string, replyId: string) => {
  const eventId = route.params.id as string;
  const actor = getCurrentLikeActor();
  if (!actor || !eventId) return;

  try {
    await toggleDiscussionReplyLike(eventId, postId, replyId, actor);
  } catch (error) {
    console.error('Failed to toggle reply like:', error);
  }
};

const toggleExperienceLike = async (postId: string) => {
  const eventId = route.params.id as string;
  const actor = getCurrentLikeActor();
  if (!actor || !eventId) return;

  try {
    await toggleExperiencePostLike(eventId, postId, actor);
  } catch (error) {
    console.error('Failed to toggle experience like:', error);
  }
};

const deleteDiscussionPost = async (postId: string) => {
  const eventId = route.params.id as string;
  if (!userStore.userProfile?.uid || !eventId) return;

  const post = posts.value.find((item) => item.id === postId);
  if (!post || post.userId !== userStore.userProfile.uid) return;
  if (!window.confirm('Delete this comment?')) return;

  try {
    await deleteEventDiscussionPost(eventId, postId);
    posts.value = posts.value.filter((item) => item.id !== postId);
  } catch (error) {
    console.error('Failed to delete comment:', error);
    postError.value = 'Failed to delete comment. Please try again.';
  }
};

const deleteExperiencePost = async (postId: string) => {
  const eventId = route.params.id as string;
  if (!userStore.userProfile?.uid || !eventId) return;

  const post = experiencePosts.value.find((item) => item.id === postId);
  if (!post || post.userId !== userStore.userProfile.uid) return;
  if (!window.confirm('Delete this experience post?')) return;

  try {
    await deleteEventExperiencePost(eventId, postId);
    experiencePosts.value = experiencePosts.value.filter((item) => item.id !== postId);
  } catch (error) {
    console.error('Failed to delete experience post:', error);
    experienceError.value = 'Failed to delete experience post. Please try again.';
  }
};

const scrollToForum = () => {
  if (!route.query.postId && route.query.section !== 'forum' && route.query.section !== 'comments') return;
  if (route.query.section === 'comments') {
    commentsSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  experienceSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

watch(
  () => route.params.id as string,
  (id) => {
    if (id) {
      subscribePosts(id);
      subscribeExperiencePosts(id);
    }
  },
  { immediate: true }
);

watch(() => userStore.userProfile?.uid, () => {
  const id = route.params.id as string;
  if (id) {
    subscribePosts(id);
    subscribeExperiencePosts(id);
  }
});

watch(() => route.query, () => {
  scrollToForum();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleCalendarClickOutside);
  if (unsubscribePosts) unsubscribePosts();
  if (unsubscribeExperiencePosts) unsubscribeExperiencePosts();
});

// Share the responsive view so event sections stay consistent on every screen.
import EventDetail from '../../views/EventDetail.vue';
</script>
