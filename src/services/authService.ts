import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { ref } from 'vue';

const ALLOWED_EMAIL = 'jcancelo.dev@gmail.com';
const provider = new GoogleAuthProvider();

export const currentUser = ref<User | null>(auth.currentUser);
export const authError = ref<string | null>(null);

onAuthStateChanged(auth, (user) => {
  if (user && user.email !== ALLOWED_EMAIL) {
    authError.value = `Acceso denegado. Solo ${ALLOWED_EMAIL} puede ingresar.`;
    signOut(auth);
    currentUser.value = null;
  } else {
    currentUser.value = user;
    authError.value = null;
  }
});

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    if (result.user.email !== ALLOWED_EMAIL) {
      authError.value = `Acceso denegado. Solo ${ALLOWED_EMAIL} puede ingresar.`;
      await signOut(auth);
      throw new Error('Email no autorizado');
    }
    authError.value = null;
    return result.user;
  } catch (error: any) {
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
