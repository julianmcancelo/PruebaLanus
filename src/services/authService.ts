import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithRedirect, signOut, onAuthStateChanged, User, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { ref } from 'vue';

const ALLOWED_EMAIL = 'jcancelo.dev@gmail.com';
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const currentUser = ref<User | null>(null);
export const authError = ref<string | null>(null);
export const isChecking = ref(true);
export const isLoggingIn = ref(false);

setPersistence(auth, browserLocalPersistence).catch(console.error);

let authInitialized = false;

onAuthStateChanged(auth, async (user) => {
  if (!authInitialized) {
    authInitialized = true;
    isChecking.value = false;
  }
  isLoggingIn.value = false;

  if (user && user.email !== ALLOWED_EMAIL) {
    authError.value = `Acceso denegado. Solo ${ALLOWED_EMAIL} puede ingresar.`;
    await signOut(auth);
    currentUser.value = null;
  } else {
    currentUser.value = user;
    authError.value = null;
  }
});

export const loginWithGoogle = async () => {
  authError.value = null;
  isLoggingIn.value = true;
  isChecking.value = false;
  try {
    await signInWithRedirect(auth, provider);
  } catch (error: any) {
    isLoggingIn.value = false;
    if (error?.code !== 'auth/redirect-cancelled-by-user') {
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
