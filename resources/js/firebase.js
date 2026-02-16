import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
try {
    app = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization failed:', error);
}

// Initialize Firebase Cloud Messaging lazily
let messaging = null;

const getMessagingInstance = () => {
    if (!messaging && typeof window !== 'undefined' && app) {
        try {
            messaging = getMessaging(app);
        } catch (error) {
            console.warn('Firebase Messaging not supported:', error);
        }
    }
    return messaging;
};

export const requestForToken = async () => {
    const msg = getMessagingInstance();
    if (!msg) {
        console.warn('Messaging not available.');
        return null;
    }

    if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) {
        console.warn('VITE_FIREBASE_VAPID_KEY is missing. Token request skipped.');
        return null;
    }

    try {
        const currentToken = await getToken(msg, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
        if (currentToken) {
            console.log('Push token:', currentToken);
            return currentToken;
        } else {
            console.log('No registration token available.');
            return null;
        }
    } catch (err) {
        console.error('An error occurred while retrieving token:', err);
        return null;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        const msg = getMessagingInstance();
        if (!msg) return;
        onMessage(msg, (payload) => {
            console.log("Message received: ", payload);
            resolve(payload);
        });
    });

export default app;
