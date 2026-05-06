import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, User, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { ref } from 'vue';

const ALLOWED_EMAIL = 'jcancelo.dev@gmail.com';
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const currentUser = ref<User | null>(null);
export const authError = ref<string | null>(null);
export const isChecking = ref(true);
export const isLoggingIn = ref(false);

setPersistence(auth, browserLocalPersistence).catch(console.error);

let authDone = false;
const authTimeout = setTimeout(() => {
  if (!authDone) {
    authDone = true;
    isChecking.value = false;
    isLoggingIn.value = false;
  }
}, 5000);

onAuthStateChanged(auth, (user) => {
  authDone = true;
  clearTimeout(authTimeout);
  isChecking.value = false;
  isLoggingIn.value = false;

  if (user && user.email !== ALLOWED_EMAIL) {
    authError.value = `Acceso denegado. Solo ${ALLOWED_EMAIL} puede ingresar.`;
    signOut(auth);
    currentUser.value = null;
  } else {
    currentUser.value = user;
    if (user) authError.value = null;
  }
});

export const loginWithGoogle = async () => {
  authError.value = null;
  isLoggingIn.value = true;
  try {
    // Try popup first, fallback to redirect
    const result = await signInWithPopup(auth, provider);
    if (result.user.email !== ALLOWED_EMAIL) {
      authError.value = `Acceso denegado. Solo ${ALLOWED_EMAIL} puede ingresar.`;
      await signOut(auth);
      throw new Error('Email no autorizado');
    }
    return result.user;
  } catch (error: any) {
    const code = error?.code || '';
    if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
      // Fallback to redirect
      try {
        await signInWithRedirect(auth, provider);
      } catch (redirectError: any) {
        isLoggingIn.value = false;
        authError.value = `Error: ${redirectError?.message || 'Desconocido'}`;
      }
    } else if (code !== 'auth/redirect-cancelled-by-user') {
      isLoggingIn.value = false;
      authError.value = `Error: ${error?.message || 'Desconocido'}`;
    }
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};
