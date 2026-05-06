import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { ref } from 'vue';

const ALLOWED_EMAIL = 'jcancelo.dev@gmail.com';
const provider = new GoogleAuthProvider();

export const currentUser = ref<User | null>(null);
export const authError = ref<string | null>(null);
export const isChecking = ref(true);

onAuthStateChanged(auth, (user) => {
  isChecking.value = false;
  if (user && user.email !== ALLOWED_EMAIL) {
    authError.value = `Acceso denegado. Solo ${ALLOWED_EMAIL} puede ingresar.`;
    signOut(auth);
    currentUser.value = null;
  } else {
    currentUser.value = user;
    authError.value = null;
  }
});

// Check redirect result on mount
getRedirectResult(auth).then((result) => {
  if (result?.user && result.user.email !== ALLOWED_EMAIL) {
    authError.value = `Acceso denegado. Solo ${ALLOWED_EMAIL} puede ingresar.`;
    signOut(auth);
  }
}).catch((error) => {
  console.error('Redirect result error:', error);
});

export const loginWithGoogle = async () => {
  authError.value = null;
  try {
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
      authError.value = 'El popup fue bloqueado. Intentando redirección...';
      try {
        await signInWithRedirect(auth, provider);
      } catch (redirectError: any) {
        authError.value = `Error de redirección: ${redirectError?.message || 'Error desconocido'}`;
      }
    } else if (code === 'auth/unauthorized-domain') {
      authError.value = 'Dominio no autorizado en Firebase. Agregá este dominio en Firebase Console → Authentication → Authorized domains.';
    } else if (code === 'auth/network-request-failed') {
      authError.value = 'Error de red. Verificá tu conexión a internet.';
    } else {
      authError.value = `Error: ${error?.message || 'Error desconocido'}`;
    }
    console.error('Login error:', error);
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
