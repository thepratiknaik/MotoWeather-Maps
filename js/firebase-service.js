import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// PASTE YOUR REAL CONFIG HERE
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "...",
    appId: "..."
};

// Keeping the generic ID or you can change it to 'local-dev'
const appId = 'moto-local-dev';

let db, auth, user;

export function initFirebase(onUserLogin) {
    if (!firebaseConfig) return; // Skip if no config
    
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    const initAuth = async () => {
        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
            } else {
                await signInAnonymously(auth);
            }
        } catch (err) {
            console.error("Auth failed", err);
        }
    };
    initAuth();

    onAuthStateChanged(auth, (currentUser) => {
        user = currentUser;
        if (user && onUserLogin) onUserLogin(user);
    });
}

export async function saveRoute(routeData) {
    if (!user || !db) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'moto_routes'), {
        ...routeData,
        timestamp: serverTimestamp()
    });
}

export function listenToRoutes(callback) {
    if (!user || !db) return;
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'moto_routes'));
    return onSnapshot(q, (snapshot) => {
        const routes = [];
        snapshot.forEach(doc => routes.push({ id: doc.id, ...doc.data() }));
        callback(routes);
    });
}

export async function deleteRoute(routeId) {
    if (!user || !db) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'moto_routes', routeId));
}