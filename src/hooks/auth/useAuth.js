import React, { createContext, useContext, useState } from 'react'

import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/storage';

const firebaseConfig = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG);
firebase.initializeApp(firebaseConfig);

const AuthContext = createContext();

/**
 * Component wrapper which grants a sub-component access to the
 * value of AuthContext when they call useAuth().
 * 
 * @param {*} props 
 * @returns {*} Child component JSX wrapped with AuthContext access
 */
const AuthProvider = (props) => {
    const auth = useAuthProvider();
    return (
        <AuthContext.Provider value={auth}>
            {props.children}
        </AuthContext.Provider>
    )
}

/**
 * AuthContext consumer, import into sub-components of AuthProvider
 * to access the current value of AuthContext.
 * 
 * @returns {Object} useAuthProvider's user state and management functions
 */
const useAuth = () => {
    return useContext(AuthContext);
}

/**
 * Auth state and management hook. 
 * Do not call directly, instead use the useAuth hook to access AuthContext.
 * 
 * @returns {Object} user state and state management functions
 */
const useAuthProvider = () => {
    const [user, setUser] = useState(false);
    const [error, setError] = useState(false);

    const signInEmail = (email, password) => {
        setError();
        firebase.auth().signInWithEmailAndPassword(email.trim(), password)
            .then(userCredential => {
                setUser(userCredential.user);
                setError(false);
            })
            .catch(err => {
                setError(err);
            })
    }

    const reauthenticateEmail = async (email, password) => {
        const authCredential = firebase.auth.EmailAuthProvider.credential(email, password);
        const userCredential = await user.reauthenticateWithCredential(authCredential)
            .catch(e => {
                throw e
            });

        setUser(userCredential.user);
        return true;
    }

    const signUpEmail = (email, password, userName) => {
        setError();
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                const userRef = firebase.database().ref(`users/${userCredential.user.uid}`);
                const update = { "userName": userName };
                userRef.update(update);
                setUser(userCredential.user);
                setError(false);
            })
            .catch(err => {
                setError(err);
            });
    }

    const signOut = () => {
        firebase.auth().signOut()
    }

    const resetPassword = async (email) => {
        try {
            await firebase.auth().sendPasswordResetEmail(email);
            return true;
        } catch (e) {
            return false;
        }
    }

    const deleteAccount = async () => {
        const dbRef = firebase.database().ref();
        const storRef = firebase.storage().ref();
        const userServersPath = `users/${user.uid}/subscribedServers`;
        const res = { success: false };

        const serversSnapshot = await dbRef.child(userServersPath).once('value');
        const servers = serversSnapshot.val();
        if (servers !== null) {
            res.hasServers = true;
            res.reason = "Must unsubscribe from all servers to delete account."
            return res;
        }

        const avatarSnapshot = await dbRef.child(`userAvatars/${user.uid}/avatar`).once('value');
        const avatarPath = avatarSnapshot.val();
        const avatarPathList = await storRef.child(avatarPath).parent.list();
        if (avatarPath && avatarPathList.items.length>0) {
            await storRef.child(`userAvatars/${user.uid}/avatar`).delete();
        }

        const usersPath = `users/${user.uid}`;
        const userAvatarPath = `userAvatars/${user.uid}`;
        const update = {
            [usersPath]: null,
            [userAvatarPath]: null,
        }
        await dbRef.update(update);

        await user.delete();

        res.success = true;
        return res;
    }

    firebase.auth().onAuthStateChanged(user => {
        setUser(user);
    });

    return {
        user,
        error,
        signOut,
        signInEmail,
        signUpEmail,
        resetPassword,
        deleteAccount,
        reauthenticateEmail,
        setError,
    }
}

export default useAuth
export { AuthProvider }