import { writable } from 'svelte/store';
import { onAuthStateChange, signInWithGoogle, signOut, getIdToken, type User } from '../services/auth/firebase.client.js';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAdmin: false,
  loading: true,
};

export const authStore = writable<AuthState>(initialState);

// Check if user is admin based on email
function checkIsAdmin(user: User | null): boolean {
  if (!user?.email) return false;

  // Get admin emails from environment variable or use hardcoded list
  const adminEmailsEnv = import.meta.env.VITE_ADMIN_ALLOW_EMAILS;
  const adminEmails = adminEmailsEnv
    ? adminEmailsEnv.split(',').map(email => email.trim().toLowerCase())
    : ['antongolova@gmail.com']; // fallback

  return adminEmails.includes(user.email.toLowerCase());
}

// Initialize auth state listener
onAuthStateChange((user) => {
  authStore.update(state => ({
    ...state,
    user,
    isAdmin: checkIsAdmin(user),
    loading: false,
  }));
});

// Auth actions
export async function signIn() {
  try {
    await signInWithGoogle();
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

export async function signOutUser() {
  try {
    await signOut();
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

// Get current user's ID token
export async function getCurrentIdToken(forceRefresh = false): Promise<string | null> {
  const { subscribe } = authStore;
  let currentUser: User | null = null;

  subscribe(state => {
    currentUser = state.user;
  })();

  if (!currentUser) return null;

  try {
    return await getIdToken(currentUser, forceRefresh);
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}
