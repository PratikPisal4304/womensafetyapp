// firebaseConfig.js

import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
// Import the AsyncStorage library for React Native:
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// --- Your existing Firebase web config:
const firebaseConfig = {
  apiKey: "AIzaSyBRD6pmrMCcuAksz8hqxXAkP8hV3jih47c",
  authDomain: "rakshasetu-c9e0b.firebaseapp.com",
  projectId: "rakshasetu-c9e0b",
  storageBucket: "rakshasetu-c9e0b.firebasestorage.app",
  messagingSenderId: "704291591905",
  appId: "1:704291591905:web:ffde7bd519cfad3106c9a0",
  measurementId: "G-JJ881F4VBQ"
};

// 1) Initialize the Firebase app:
const app = initializeApp(firebaseConfig);

// 2) Set up auth with RN persistence:
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);




