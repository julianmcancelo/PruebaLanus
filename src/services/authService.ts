import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { ref } from 'vue';

const ALLOWED_EMAIL = 'jcancelo.dev@gmail.com';
const provider = new GoogleAuthProvider();

export const currentUser = ref<User | null>(null);
export const authError = ref<string | null>(null);
export const isChecking = ref(true);
export const isLoggingIn = ref(false);

onAuthStateChanged(auth, (user) => {
  isChecking.value = false;
  isLoggingIn.value = false;
  if (user && user.email !== ALLOWED_EMAIL) {
    authError.value = `Acceso denegado. Solo ${ALLOWED_EMAIL} puede ingresar.`;
    signOut(auth);
    currentUser.value = null;
  } else {
    currentUser.value = user;
    authError.value = null;
  }
});

// Check redirect result on page load
getRedirectResult(auth).then((result) => {
  if (result?.user && result.user.email !== ALLOWED_EMAIL) {
    authError.value = `Acceso denegado. Solo ${ALLOWED_EMAIL} puede ingresar.`;
    signOut(auth);
  }
}).catch((error) => {
  console.error('Redirect result error:', error);
  authError.value = `Error al iniciar sesión: ${error?.message || 'Error desconocido'}`;
}).finally(() => {
  isLoggingIn.value = false;
});

export const loginWithGoogle = async () => {
  authError.value = null;
  isLoggingIn.value = true;
  try {
    await signInWithRedirect(auth, provider);
  } catch (error: any) {
    isLoggingIn.value = false;
    authError.value = `Error: ${error?.message || 'Error desconocido'}`;
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
