import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuração do Firebase
// IMPORTANTE: Substitua pelos valores do seu projeto Firebase
const firebaseConfig = {
  apiKey: "REMOVED_GOOGLE_API_KEY",
  authDomain: "finance-ruasapp.firebaseapp.com",
  projectId: "finance-ruasapp",
  storageBucket: "finance-ruasapp.firebasestorage.app",
  messagingSenderId: "481292774309",
  appId: "1:481292774309:web:59ab56299b34eff158d64c",
  measurementId: "G-W8Z9681MF5"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

const auth: Auth = getAuth(app);
export { auth };

// Inicializar Firestore
export const db = getFirestore(app);

export default app;
