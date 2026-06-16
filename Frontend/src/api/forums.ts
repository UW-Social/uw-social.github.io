import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import type { Event } from '../types/event';
import type {
  AggregatedDiscussionPost,
  AggregatedExperiencePost,
  AggregatedForumPost,
  DiscussionPost,
  DiscussionReply,
  ExperiencePost,
  Forum,
  ForumPost,
} from '../types/forum';
import { buildForumEventSnapshot } from '../types/forum';
import { db } from '../firebase/config';

const forumsCollection = collection(db, 'forums');

export async function listForums(): Promise<Forum[]> {
  const forumsQuery = query(forumsCollection, orderBy('lastPostAt', 'desc'));
  const snapshot = await getDocs(forumsQuery);

  return snapshot.docs.map((forumDoc) => ({
    id: forumDoc.id,
    ...(forumDoc.data() as Omit<Forum, 'id'>),
  }));
}

export async function getForum(forumId: string): Promise<Forum | null> {
  const forumRef = doc(db, 'forums', forumId);
  const forumDoc = await getDoc(forumRef);

  if (!forumDoc.exists()) return null;

  return {
    id: forumDoc.id,
    ...(forumDoc.data() as Omit<Forum, 'id'>),
  };
}

export async function ensureForumForEvent(event: Event): Promise<Forum> {
  const forumRef = doc(db, 'forums', event.id);
  const existingForum = await getDoc(forumRef);

  await setDoc(
    forumRef,
    {
      eventId: event.id,
      eventTitle: event.title,
      eventSnapshot: buildForumEventSnapshot(event),
      updatedAt: serverTimestamp(),
      ...(existingForum.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  );

  const forumDoc = await getDoc(forumRef);

  return {
    id: forumDoc.id,
    ...(forumDoc.data() as Omit<Forum, 'id'>),
  };
}

export function subscribeToForumPosts(
  forumId: string,
  onData: (posts: ForumPost[]) => void,
  onError: (error: unknown) => void
) {
  const postsRef = collection(db, 'forums', forumId, 'posts');
  const postsQuery = query(postsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    postsQuery,
    (snapshot) => {
      onData(
        snapshot.docs.map((postDoc) => ({
          id: postDoc.id,
          ...normalizeForumPostData(forumId, postDoc.data() as Record<string, unknown>),
        }))
      );
    },
    onError
  );
}

export async function createForumPost(
  event: Event,
  author: { uid: string; email: string; displayName?: string | null },
  content: string
) {
  const forumRef = doc(db, 'forums', event.id);
  const existingForum = await getDoc(forumRef);

  await setDoc(
    forumRef,
    {
      eventId: event.id,
      eventTitle: event.title,
      eventSnapshot: buildForumEventSnapshot(event),
      ...(existingForum.exists() ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
      lastPostAt: serverTimestamp(),
    },
    { merge: true }
  );

  await addDoc(collection(db, 'forums', event.id, 'posts'), {
    eventId: event.id,
    content,
    text: content,
    authorName: author.displayName || author.email.split('@')[0],
    postType: 'event',
    replyCount: 0,
    userId: author.uid,
    userEmail: author.email,
    createdAt: serverTimestamp(),
  });
}

export async function deleteForumPost(forumId: string, postId: string) {
  await deleteDoc(doc(db, 'forums', forumId, 'posts', postId));
}

export async function listAggregatedForumPosts(): Promise<AggregatedForumPost[]> {
  const forums = await listForums();

  const postsByForum = await Promise.all(
    forums.map(async (forum) => {
      const postsRef = collection(db, 'forums', forum.id, 'posts');
      const postsQuery = query(postsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(postsQuery);

      return snapshot.docs.map((postDoc) =>
        buildAggregatedForumPost(
          forum,
          postDoc.id,
          postDoc.data() as Record<string, unknown>
        )
      );
    })
  );

  return postsByForum
    .flat()
    .sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
}

function buildAggregatedForumPost(
  forum: Forum,
  id: string,
  raw: Record<string, unknown>
): AggregatedForumPost {
  return {
    id,
    ...normalizeForumPostData(forum.id, raw),
    eventTitle: forum.eventTitle || forum.eventSnapshot?.title || 'Untitled event',
    eventLocation: forum.eventSnapshot?.location || '',
    eventSchedule: forum.eventSnapshot?.scheduleSummary || '',
  };
}

function normalizeForumPostData(
  forumId: string,
  raw: Record<string, unknown>
): Omit<ForumPost, 'id'> {
  const content = typeof raw.content === 'string'
    ? raw.content
    : typeof raw.text === 'string'
      ? raw.text
      : '';

  const postType = raw.postType === 'review' || raw.postType === 'general'
    ? raw.postType
    : 'event';

  return {
    eventId: typeof raw.eventId === 'string' ? raw.eventId : forumId,
    title: typeof raw.title === 'string' ? raw.title : undefined,
    content,
    text: content,
    authorName: typeof raw.authorName === 'string' ? raw.authorName : undefined,
    postType,
    replyCount: typeof raw.replyCount === 'number' ? raw.replyCount : 0,
    userId: typeof raw.userId === 'string' ? raw.userId : undefined,
    userEmail: typeof raw.userEmail === 'string' ? raw.userEmail : null,
    createdAt: raw.createdAt,
  };
}

function getTimestampMs(value: unknown) {
  if (!value) return 0;

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    typeof (value as { seconds?: number }).seconds === 'number'
  ) {
    return ((value as { seconds: number }).seconds) * 1000;
  }

  const parsed = new Date(value as string).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

type DiscussionAuthor = {
  uid: string;
  email: string;
  displayName?: string | null;
};

type ExperiencePostInput = string | {
  title: string;
  subtitle?: string;
  body: string;
  bodyHtml?: string;
  mediaUrls?: string[];
};

export function subscribeToEventDiscussionPosts(
  eventId: string,
  currentUserId: string | null | undefined,
  onData: (posts: DiscussionPost[]) => void,
  onError: (error: unknown) => void
) {
  const postsRef = collection(db, 'events', eventId, 'posts');
  const postsQuery = query(postsRef, orderBy('createdAt', 'desc'));
  let active = true;

  const unsubscribe = onSnapshot(
    postsQuery,
    async (snapshot) => {
      try {
        const hydratedPosts = await Promise.all(
          snapshot.docs.map((postDoc) =>
            hydrateDiscussionPost(
              eventId,
              postDoc.id,
              postDoc.data() as Record<string, unknown>,
              currentUserId,
              { replyPreviewLimit: undefined }
            )
          )
        );

        if (active) {
          onData(hydratedPosts.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt)));
        }
      } catch (error) {
        if (active) onError(error);
      }
    },
    onError
  );

  return () => {
    active = false;
    unsubscribe();
  };
}

export async function listAggregatedDiscussionPosts(
  events: Event[],
  currentUserId?: string | null
): Promise<AggregatedDiscussionPost[]> {
  const postsByEvent = await Promise.all(
    events.map(async (event) => {
      const postsRef = collection(db, 'events', event.id, 'posts');
      const postsQuery = query(postsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(postsQuery);

      const posts = await Promise.all(
        snapshot.docs.map(async (postDoc) => {
          const hydratedPost = await hydrateDiscussionPost(
            event.id,
            postDoc.id,
            postDoc.data() as Record<string, unknown>,
            currentUserId,
            { replyPreviewLimit: 2 }
          );

          return {
            ...hydratedPost,
            eventTitle: event.title,
            eventLocation: event.location,
            eventSchedule: buildForumEventSnapshot(event).scheduleSummary,
          } satisfies AggregatedDiscussionPost;
        })
      );

      return posts;
    })
  );

  return postsByEvent
    .flat()
    .sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
}

export async function createEventDiscussionPost(
  eventId: string,
  author: DiscussionAuthor,
  content: string
) {
  await addDoc(collection(db, 'events', eventId, 'posts'), {
    eventId,
    content,
    text: content,
    authorName: author.displayName || author.email.split('@')[0],
    postType: 'event',
    likeCount: 0,
    replyCount: 0,
    userId: author.uid,
    userEmail: author.email,
    createdAt: serverTimestamp(),
  });
}

export async function deleteEventDiscussionPost(eventId: string, postId: string) {
  await deleteDoc(doc(db, 'events', eventId, 'posts', postId));
}

export function subscribeToEventExperiencePosts(
  eventId: string,
  currentUserId: string | null | undefined,
  onData: (posts: ExperiencePost[]) => void,
  onError: (error: unknown) => void
) {
  const postsRef = collection(db, 'events', eventId, 'forumPosts');
  const postsQuery = query(postsRef, orderBy('createdAt', 'desc'));
  let active = true;

  const unsubscribe = onSnapshot(
    postsQuery,
    async (snapshot) => {
      try {
        const hydratedPosts = await Promise.all(
          snapshot.docs.map((postDoc) =>
            hydrateExperiencePost(
              eventId,
              postDoc.id,
              postDoc.data() as Record<string, unknown>,
              currentUserId
            )
          )
        );

        if (active) {
          onData(hydratedPosts.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt)));
        }
      } catch (error) {
        if (active) onError(error);
      }
    },
    onError
  );

  return () => {
    active = false;
    unsubscribe();
  };
}

export async function listAggregatedExperiencePosts(
  events: Event[],
  currentUserId?: string | null
): Promise<AggregatedExperiencePost[]> {
  const postsByEvent = await Promise.all(
    events.map(async (event) => {
      const postsRef = collection(db, 'events', event.id, 'forumPosts');
      const postsQuery = query(postsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(postsQuery);

      const posts = await Promise.all(
        snapshot.docs.map(async (postDoc) => {
          const hydratedPost = await hydrateExperiencePost(
            event.id,
            postDoc.id,
            postDoc.data() as Record<string, unknown>,
            currentUserId
          );

          return {
            ...hydratedPost,
            eventTitle: event.title,
            eventLocation: event.location,
            eventSchedule: buildForumEventSnapshot(event).scheduleSummary,
          } satisfies AggregatedExperiencePost;
        })
      );

      return posts;
    })
  );

  return postsByEvent
    .flat()
    .sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
}

export async function createEventExperiencePost(
  eventId: string,
  author: DiscussionAuthor,
  input: ExperiencePostInput
) {
  const content = typeof input === 'string' ? input : input.body;
  const title = typeof input === 'string' ? deriveExperienceTitle(input) : input.title.trim();
  const subtitle = typeof input === 'string' ? undefined : input.subtitle?.trim() || undefined;
  const bodyHtml = typeof input === 'string' ? undefined : input.bodyHtml;
  const mediaUrls = typeof input === 'string' ? [] : input.mediaUrls ?? [];

  const postRef = await addDoc(collection(db, 'events', eventId, 'forumPosts'), {
    eventId,
    content,
    text: content,
    title,
    ...(subtitle ? { subtitle } : {}),
    ...(bodyHtml ? { bodyHtml } : {}),
    mediaUrls,
    authorName: author.displayName || author.email.split('@')[0],
    postType: 'review',
    likeCount: 0,
    replyCount: 0,
    userId: author.uid,
    userEmail: author.email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return postRef.id;
}

export async function deleteEventExperiencePost(eventId: string, postId: string) {
  await deleteDoc(doc(db, 'events', eventId, 'forumPosts', postId));
}

export async function getEventExperiencePost(
  eventId: string,
  postId: string,
  currentUserId?: string | null
): Promise<ExperiencePost | null> {
  const postRef = doc(db, 'events', eventId, 'forumPosts', postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) return null;

  return hydrateExperiencePost(
    eventId,
    postSnap.id,
    postSnap.data() as Record<string, unknown>,
    currentUserId
  );
}

export async function listExperiencePostReplies(
  eventId: string,
  postId: string,
  currentUserId?: string | null
): Promise<DiscussionReply[]> {
  const repliesRef = collection(db, 'events', eventId, 'forumPosts', postId, 'replies');
  const repliesSnapshot = await getDocs(query(repliesRef, orderBy('createdAt', 'asc')));

  return Promise.all(
    repliesSnapshot.docs.map(async (replyDoc) => {
      const [likesSnapshot, likedDoc] = await Promise.all([
        getDocs(collection(db, 'events', eventId, 'forumPosts', postId, 'replies', replyDoc.id, 'likes')),
        currentUserId
          ? getDoc(doc(db, 'events', eventId, 'forumPosts', postId, 'replies', replyDoc.id, 'likes', currentUserId))
          : Promise.resolve(null),
      ]);

      return {
        id: replyDoc.id,
        ...normalizeDiscussionReplyData(postId, eventId, replyDoc.data() as Record<string, unknown>),
        likeCount: likesSnapshot.size || 0,
        hasLiked: likedDoc?.exists?.() ?? false,
      } satisfies DiscussionReply;
    })
  );
}

export async function toggleExperiencePostLike(
  eventId: string,
  postId: string,
  userId: string
) {
  const postRef = doc(db, 'events', eventId, 'forumPosts', postId);
  const likeRef = doc(db, 'events', eventId, 'forumPosts', postId, 'likes', userId);

  await runTransaction(db, async (transaction) => {
    const [postSnap, likeSnap] = await Promise.all([
      transaction.get(postRef),
      transaction.get(likeRef),
    ]);

    if (!postSnap.exists()) {
      throw new Error('Experience post not found');
    }

    const currentLikeCount = typeof postSnap.data().likeCount === 'number'
      ? postSnap.data().likeCount
      : 0;

    if (likeSnap.exists()) {
      transaction.delete(likeRef);
      transaction.update(postRef, {
        likeCount: Math.max(0, currentLikeCount - 1),
      });
      return;
    }

    transaction.set(likeRef, {
      userId,
      createdAt: serverTimestamp(),
    });
    transaction.update(postRef, {
      likeCount: currentLikeCount + 1,
    });
  });
}

export async function createDiscussionReply(
  eventId: string,
  postId: string,
  author: DiscussionAuthor,
  content: string
) {
  const postRef = doc(db, 'events', eventId, 'posts', postId);
  const repliesRef = collection(db, 'events', eventId, 'posts', postId, 'replies');

  await addDoc(repliesRef, {
    postId,
    eventId,
    content,
    text: content,
    authorName: author.displayName || author.email.split('@')[0],
    likeCount: 0,
    userId: author.uid,
    userEmail: author.email,
    createdAt: serverTimestamp(),
  });

  try {
    await runTransaction(db, async (transaction) => {
      const postSnap = await transaction.get(postRef);
      if (!postSnap.exists()) {
        throw new Error('Post not found');
      }

      const currentReplyCount = typeof postSnap.data().replyCount === 'number'
        ? postSnap.data().replyCount
        : 0;

      transaction.update(postRef, {
        replyCount: currentReplyCount + 1,
      });
    });
  } catch (error) {
    // The reply itself is already saved at this point, so treat counter sync as best-effort.
    console.warn('Reply saved but replyCount update failed:', error);
  }
}

export async function toggleDiscussionPostLike(
  eventId: string,
  postId: string,
  userId: string
) {
  const postRef = doc(db, 'events', eventId, 'posts', postId);
  const likeRef = doc(db, 'events', eventId, 'posts', postId, 'likes', userId);

  await runTransaction(db, async (transaction) => {
    const [postSnap, likeSnap] = await Promise.all([
      transaction.get(postRef),
      transaction.get(likeRef),
    ]);

    if (!postSnap.exists()) {
      throw new Error('Post not found');
    }

    const currentLikeCount = typeof postSnap.data().likeCount === 'number'
      ? postSnap.data().likeCount
      : 0;

    if (likeSnap.exists()) {
      transaction.delete(likeRef);
      transaction.update(postRef, {
        likeCount: Math.max(0, currentLikeCount - 1),
      });
      return;
    }

    transaction.set(likeRef, {
      userId,
      createdAt: serverTimestamp(),
    });
    transaction.update(postRef, {
      likeCount: currentLikeCount + 1,
    });
  });
}

export async function toggleDiscussionReplyLike(
  eventId: string,
  postId: string,
  replyId: string,
  userId: string
) {
  const replyRef = doc(db, 'events', eventId, 'posts', postId, 'replies', replyId);
  const likeRef = doc(db, 'events', eventId, 'posts', postId, 'replies', replyId, 'likes', userId);

  await runTransaction(db, async (transaction) => {
    const [replySnap, likeSnap] = await Promise.all([
      transaction.get(replyRef),
      transaction.get(likeRef),
    ]);

    if (!replySnap.exists()) {
      throw new Error('Reply not found');
    }

    const currentLikeCount = typeof replySnap.data().likeCount === 'number'
      ? replySnap.data().likeCount
      : 0;

    if (likeSnap.exists()) {
      transaction.delete(likeRef);
      transaction.update(replyRef, {
        likeCount: Math.max(0, currentLikeCount - 1),
      });
      return;
    }

    transaction.set(likeRef, {
      userId,
      createdAt: serverTimestamp(),
    });
    transaction.update(replyRef, {
      likeCount: currentLikeCount + 1,
    });
  });
}

async function hydrateDiscussionPost(
  eventId: string,
  postId: string,
  raw: Record<string, unknown>,
  currentUserId: string | null | undefined,
  options: { replyPreviewLimit?: number | undefined }
): Promise<DiscussionPost> {
  const [replyData, likesSnapshot, likedDoc] = await Promise.all([
    loadDiscussionReplies(eventId, postId, currentUserId, options.replyPreviewLimit),
    getDocs(collection(db, 'events', eventId, 'posts', postId, 'likes')),
    currentUserId
      ? getDoc(doc(db, 'events', eventId, 'posts', postId, 'likes', currentUserId))
      : Promise.resolve(null),
  ]);

  const normalizedPost = normalizeDiscussionPostData(eventId, raw);

  return {
    id: postId,
    ...normalizedPost,
    likeCount: likesSnapshot.size || normalizedPost.likeCount || 0,
    replyCount: Math.max(
      typeof raw.replyCount === 'number' ? raw.replyCount : 0,
      replyData.totalCount
    ),
    replies: replyData.replies,
    hasLiked: likedDoc?.exists?.() ?? false,
  };
}

async function hydrateExperiencePost(
  eventId: string,
  postId: string,
  raw: Record<string, unknown>,
  currentUserId: string | null | undefined
): Promise<ExperiencePost> {
  const [likesSnapshot, likedDoc] = await Promise.all([
    getDocs(collection(db, 'events', eventId, 'forumPosts', postId, 'likes')),
    currentUserId
      ? getDoc(doc(db, 'events', eventId, 'forumPosts', postId, 'likes', currentUserId))
      : Promise.resolve(null),
  ]);

  const normalizedPost = normalizeExperiencePostData(eventId, raw);

  return {
    id: postId,
    ...normalizedPost,
    likeCount: likesSnapshot.size || normalizedPost.likeCount || 0,
    replyCount: normalizedPost.replyCount || 0,
    hasLiked: likedDoc?.exists?.() ?? false,
  };
}

async function loadDiscussionReplies(
  eventId: string,
  postId: string,
  currentUserId: string | null | undefined,
  replyPreviewLimit?: number
): Promise<{ replies: DiscussionReply[]; totalCount: number }> {
  const repliesRef = collection(db, 'events', eventId, 'posts', postId, 'replies');
  const repliesSnapshot = await getDocs(query(repliesRef, orderBy('createdAt', 'asc')));

  const normalizedReplies = await Promise.all(
    repliesSnapshot.docs.map(async (replyDoc) => {
      const [likesSnapshot, likedDoc] = await Promise.all([
        getDocs(collection(db, 'events', eventId, 'posts', postId, 'replies', replyDoc.id, 'likes')),
        currentUserId
          ? getDoc(doc(db, 'events', eventId, 'posts', postId, 'replies', replyDoc.id, 'likes', currentUserId))
          : Promise.resolve(null),
      ]);

      return {
        id: replyDoc.id,
        ...normalizeDiscussionReplyData(postId, eventId, replyDoc.data() as Record<string, unknown>),
        likeCount: likesSnapshot.size || 0,
        hasLiked: likedDoc?.exists?.() ?? false,
      } satisfies DiscussionReply;
    })
  );

  if (!replyPreviewLimit || normalizedReplies.length <= replyPreviewLimit) {
    return {
      replies: normalizedReplies,
      totalCount: normalizedReplies.length,
    };
  }

  return {
    replies: normalizedReplies.slice(-replyPreviewLimit),
    totalCount: normalizedReplies.length,
  };
}

function normalizeDiscussionPostData(
  eventId: string,
  raw: Record<string, unknown>
): Omit<DiscussionPost, 'id' | 'replies' | 'hasLiked'> {
  const content = typeof raw.content === 'string'
    ? raw.content
    : typeof raw.text === 'string'
      ? raw.text
      : '';

  const postType = raw.postType === 'review' || raw.postType === 'general'
    ? raw.postType
    : 'event';

  return {
    eventId: typeof raw.eventId === 'string' ? raw.eventId : eventId,
    title: typeof raw.title === 'string' ? raw.title : undefined,
    content,
    text: content,
    authorName: typeof raw.authorName === 'string' ? raw.authorName : undefined,
    postType,
    likeCount: typeof raw.likeCount === 'number' ? raw.likeCount : 0,
    replyCount: typeof raw.replyCount === 'number' ? raw.replyCount : 0,
    userId: typeof raw.userId === 'string' ? raw.userId : undefined,
    userEmail: typeof raw.userEmail === 'string' ? raw.userEmail : null,
    createdAt: raw.createdAt,
  };
}

function normalizeExperiencePostData(
  eventId: string,
  raw: Record<string, unknown>
): Omit<ExperiencePost, 'id' | 'hasLiked'> {
  const content = typeof raw.content === 'string'
    ? raw.content
    : typeof raw.body === 'string'
      ? raw.body
      : typeof raw.text === 'string'
        ? raw.text
        : '';

  return {
    eventId: typeof raw.eventId === 'string' ? raw.eventId : eventId,
    title: typeof raw.title === 'string' && raw.title.trim()
      ? raw.title
      : deriveExperienceTitle(content),
    subtitle: typeof raw.subtitle === 'string' ? raw.subtitle : undefined,
    content,
    text: content,
    bodyHtml: typeof raw.bodyHtml === 'string' ? raw.bodyHtml : undefined,
    mediaUrls: Array.isArray(raw.mediaUrls)
      ? raw.mediaUrls.filter((url): url is string => typeof url === 'string')
      : [],
    authorName: typeof raw.authorName === 'string' ? raw.authorName : undefined,
    postType: 'review',
    likeCount: typeof raw.likeCount === 'number' ? raw.likeCount : 0,
    replyCount: typeof raw.replyCount === 'number' ? raw.replyCount : 0,
    userId: typeof raw.userId === 'string' ? raw.userId : undefined,
    userEmail: typeof raw.userEmail === 'string' ? raw.userEmail : null,
    createdAt: raw.createdAt,
  };
}

function deriveExperienceTitle(content: string) {
  const firstLine = content
    .split(/\n+/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  const source = firstLine || content.replace(/\s+/g, ' ').trim() || 'Event experience';
  return source.length <= 72 ? source : `${source.slice(0, 72).trimEnd()}...`;
}

function normalizeDiscussionReplyData(
  postId: string,
  eventId: string,
  raw: Record<string, unknown>
): Omit<DiscussionReply, 'id' | 'hasLiked'> {
  const content = typeof raw.content === 'string'
    ? raw.content
    : typeof raw.text === 'string'
      ? raw.text
      : '';

  return {
    postId: typeof raw.postId === 'string' ? raw.postId : postId,
    eventId: typeof raw.eventId === 'string' ? raw.eventId : eventId,
    content,
    text: content,
    authorName: typeof raw.authorName === 'string' ? raw.authorName : undefined,
    userId: typeof raw.userId === 'string' ? raw.userId : undefined,
    userEmail: typeof raw.userEmail === 'string' ? raw.userEmail : null,
    createdAt: raw.createdAt,
    likeCount: typeof raw.likeCount === 'number' ? raw.likeCount : 0,
  };
}
