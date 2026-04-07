import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import type { Event } from '../types/event';
import type { Forum, ForumPost } from '../types/forum';
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
          ...(postDoc.data() as Omit<ForumPost, 'id'>),
        }))
      );
    },
    onError
  );
}

export async function createForumPost(
  event: Event,
  author: { uid: string; email: string },
  text: string
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
    text,
    userId: author.uid,
    userEmail: author.email,
    createdAt: serverTimestamp(),
  });
}
