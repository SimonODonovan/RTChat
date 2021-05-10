import React, { useState, useEffect } from 'react';

import css from './Message.module.css';

import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/storage';

import { Avatar, useTheme } from '@material-ui/core';

const Message = props => {
    const { message, timestamp, file, userUID } = props.messageDetails;
    const theme = useTheme();

    const [avatarUrl, setAvatarUrl] = useState("");
    const [userDisplayName, setUserDisplayName] = useState("");
    const [imageUrl, setImageUrl] = useState(false);

    if (file) {
        firebase.storage().ref(file).getDownloadURL()
            .then(fileUrl => setImageUrl(fileUrl))
    }

    // Set users details for message. Use specific listener paths to prevent
    // unneccessary firebase "value" events from triggering.
    useEffect(() => {
        // Get users latest display name.
        const displayNameRef = firebase.database().ref(`users/${userUID}/userName`);
        displayNameRef.on("value", snapshot => {
            const data = snapshot.val();
            setUserDisplayName(data);
        });

        // Get users latest avatar filename from realtime database.
        // Then get the actual file URL from firebase storage.
        const avatarImageRef = firebase.database().ref(`/userAvatars/${userUID}/avatar`);
        avatarImageRef.on("value", snapshot => {
            const avatarImagePath = snapshot.val();
            if (avatarImagePath) {
                const avatarStorageRef = firebase.storage().ref(`/userAvatars/${userUID}/avatar`);
                avatarStorageRef.getDownloadURL()
                    .then(url => {
                        setAvatarUrl(url);
                    });
            }
        });
        return () => { displayNameRef.off(); avatarImageRef.off() };
    }, [userUID]);

    const messageDate = new Date(timestamp);
    const localeDate = messageDate.toLocaleDateString();
    const localeTime = messageDate.toLocaleTimeString().slice(0, 5);

    return (
        <div className={css.Message}>
            <div className={css.MessageAvatar}>
                <Avatar alt="Avatar Image" src={avatarUrl} style={{ width: theme.spacing(6), height: theme.spacing(6), }} />
            </div>
            <div className={css.MessageContent}>
                <p>
                    <span className={css.MessageName}>{userDisplayName}</span>
                    <span className={css.MessageTime}>{localeDate + " at " + localeTime}</span>
                </p>
                <div>

                </div>
                {imageUrl && <img className={css.MessageImage} src={imageUrl} alt="attached message file" />}
                <p className={css.MessageText}>{message}</p>
            </div>
        </div>
    )
};

const arePropsEqual = (prevState, nextState) => true;

export default React.memo(Message, arePropsEqual);
