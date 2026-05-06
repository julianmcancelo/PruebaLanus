import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { ref } from 'vue';

const provider = new GoogleAuthProvider();

export const currentUser = ref<User | null>(auth.currentUser);

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  currentUser.value = user;
});

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error logging in with Google:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};
