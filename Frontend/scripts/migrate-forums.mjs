import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  console.error('Missing Firebase env vars:', missingEnvVars.join(', '));
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function buildEventSnapshot(event) {
  return {
    title: event.title ?? '',
    description: event.description ?? '',
    location: event.location ?? '',
    category: event.category ?? '',
    imageUrl: event.imageUrl ?? '',
    organizerName: event.organizerName ?? '',
    endtime: event.endtime ?? null,
  };
}

async function migrateForums() {
  const eventsSnapshot = await getDocs(collection(db, 'events'));

  let migratedForumCount = 0;
  let migratedPostCount = 0;
  let skippedEventCount = 0;

  for (const eventDoc of eventsSnapshot.docs) {
    const eventId = eventDoc.id;
    const eventData = eventDoc.data();
    const oldPostsSnapshot = await getDocs(collection(db, 'events', eventId, 'posts'));

    if (oldPostsSnapshot.empty) {
      skippedEventCount += 1;
      continue;
    }

    const forumRef = doc(db, 'forums', eventId);

    await setDoc(
      forumRef,
      {
        eventId,
        eventTitle: eventData.title ?? 'Untitled event',
        eventSnapshot: buildEventSnapshot(eventData),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastPostAt: oldPostsSnapshot.docs[0]?.data()?.createdAt ?? serverTimestamp(),
        migration: {
          source: `events/${eventId}/posts`,
          migratedAt: new Date().toISOString(),
          migratedPostCount: oldPostsSnapshot.size,
        },
      },
      { merge: true }
    );

    for (const oldPostDoc of oldPostsSnapshot.docs) {
      const oldPostData = oldPostDoc.data();

      await setDoc(doc(db, 'forums', eventId, 'posts', oldPostDoc.id), {
        text: oldPostData.text ?? '',
        userId: oldPostData.userId ?? '',
        userEmail: oldPostData.userEmail ?? null,
        createdAt: oldPostData.createdAt ?? null,
        migratedFrom: `events/${eventId}/posts/${oldPostDoc.id}`,
      });

      migratedPostCount += 1;
    }

    migratedForumCount += 1;
    console.log(`Migrated ${oldPostsSnapshot.size} posts for event ${eventId}`);
  }

  console.log('');
  console.log('Forum migration complete.');
  console.log(`Forums migrated: ${migratedForumCount}`);
  console.log(`Posts migrated: ${migratedPostCount}`);
  console.log(`Events skipped (no old posts): ${skippedEventCount}`);
}

migrateForums().catch((error) => {
  console.error('Forum migration failed:', error);
  process.exit(1);
});
