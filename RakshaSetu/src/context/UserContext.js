// UserContext.js (or UserProvider.js)
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore'; 
// If you want to store/fetch user data from Firestore

import { auth, firestore } from '../../config/firebaseConfig'; 
// Adjust import paths to match your setup

// 1) Create the context
const UserContext = createContext(null);

// 2) Create a provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  // or store more data (e.g. user profile) in a single object

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Example: user is logged in
        // If you want to also fetch Firestore user doc:
        const docRef = doc(firestore, 'users', firebaseUser.uid);
        const unsubDoc = onSnapshot(docRef, (snapshot) => {
          if (snapshot.exists()) {
            // Merge the doc data + user’s uid
            setUser({ uid: firebaseUser.uid, ...snapshot.data() });
          } else {
            // No doc, or handle as needed
            setUser({ uid: firebaseUser.uid });
          }
        });

        // Return unsubDoc if you want to stop listening for doc changes
      } else {
        // No user is signed in
        setUser(null);
      }
    });

    // Cleanup
    return () => {
      unsubscribe(); 
      // If you used unsubDoc above, also call it here
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// 3) A custom hook for easier consumption
export const useUser = () => {
  return useContext(UserContext);
};
