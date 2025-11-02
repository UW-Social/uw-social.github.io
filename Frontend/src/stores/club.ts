import { defineStore } from 'pinia';
import { ref } from 'vue';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Club } from '../types/club';
import { mockClubs } from '../mocks/clubs';

export const useClubStore = defineStore('club', () => {
  const clubs = ref<Club[]>([]);
  const selectedClubs = ref<Club[]>([]); // 存储选中的俱乐部

  const fetchClubs = async () => {
    try {
      const clubsCollection = collection(db, 'clubs');
      const clubsQuery = query(clubsCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(clubsQuery);

      const fetched = querySnapshot.docs.map((docSnap: any) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Club[];

      if (!fetched.length) {
        console.info('[clubStore] No clubs found in Firestore, using mock data.');
        clubs.value = mockClubs;
      } else {
        clubs.value = fetched;
      }
    } catch (error) {
      console.error('[clubStore] Failed to fetch clubs, using mock data instead:', error);
      clubs.value = mockClubs;
    }
  };

  const selectClub = (club: Club) => {
    selectedClubs.value.push(club);
  };

  const clearSelectedClubs = () => {
    selectedClubs.value = [];
  };

  return {
    clubs,
    selectedClubs,
    fetchClubs,
    selectClub,
    clearSelectedClubs,
  };
});
