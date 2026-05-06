import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { ref } from 'vue';

const ALLOWED_EMAIL = 'jcancelo.dev@gmail.com';
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const currentUser = ref<User | null>(null);
export const authError = ref<string | null>(null);
export const isChecking = ref(true);
export const isLoggingIn = ref(false);

// Set persistence to LOCAL so user stays logged in across tabs/sessions
setPersistence(auth, browserLocalPersistence).catch(console.error);

// Handle redirect result on page load
getRedirectResult(auth).then((result) => {
  if (result?.user) {
    if (result.user.email !== ALLOWED_EMAIL) {
      authError.value = `Acceso denegado. Solo ${ALLOWED_EMAIL} puede ingresar.`;
      signOut(auth);
    }
  }
}).catch((error) => {
  const code = error?.code || '';
  if (code === 'auth/unauthorized-domain') {
    authError.value = 'Dominio no autorizado en Firebase.';
  } else if (code !== 'auth/redirect-cancelled-by-user') {
    authError.value = `Error al iniciar sesión: ${error?.message || 'Desconocido'}`;
  }
}).finally(() => {
  isChecking.value = false;
  isLoggingIn.value = false;
});

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

export const loginWithGoogle = async () => {
  authError.value = null;
  isLoggingIn.value = true;
  try {
    await signInWithRedirect(auth, provider);
  } catch (error: any) {
    isLoggingIn.value = false;
    if (error?.code === 'auth/redirect-cancelled-by-user') {
      authError.value = null;
    } else {
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
