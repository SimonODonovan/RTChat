import React, { useState, useEffect } from 'react';

import css from './Message.module.css';

import useAuth from '../../../../hooks/auth/useAuth';

import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/storage';
import useFirebaseDataListener from '../../../../hooks/chat/useFirebaseDataListener';

import { Avatar, CircularProgress, Fade, IconButton, Tooltip, useTheme } from '@material-ui/core';
import SentimentVerySatisfiedOutlinedIcon from '@material-ui/icons/SentimentVerySatisfiedOutlined';
import LinkOutlinedIcon from '@material-ui/icons/LinkOutlined';
import ReplyIcon from '@material-ui/icons/Reply';
import PanoramaOutlinedIcon from '@material-ui/icons/PanoramaOutlined';

const Message = props => {
    const { messageKey, server, channel, openEmojiReactionMenu, replyToMessage } = props;
    const { message, timestamp, file, fileType, userUID, quote } = props.messageDetails;
    const auth = useAuth();
    const theme = useTheme();
    const hasImage = Boolean(file);

    const [avatarUrl, setAvatarUrl] = useState("");
    const [userDisplayName, setUserDisplayName] = useState("");
    const [imageUrlCompressed, setImageUrlCompressed] = useState(false);
    const [imageUrlUncompressed, setImageUrlUncompressed] = useState(false);
    const [gifUrl, setGifUrl] = useState(false);
    const [webmUrl, setWebmUrl] = useState(false);
    const [imageLoading, setImageLoading] = useState(hasImage);
    const [messageReactionsDisplay, setMessageReactionsDisplay] = useState(null);

    const messageReactionsPath = `serverMessages/${server}/${channel}/${messageKey}/reactions`;
    const messageReactions = useFirebaseDataListener(messageReactionsPath);

    if (file) {
        const ref = firebase.storage().ref(file);
        if (fileType === 'video/webm') {
            ref.getDownloadURL()
                .then(fileUrl => {
                    setWebmUrl(fileUrl);
                });
        } else if (fileType === 'image/gif') {
            ref.getDownloadURL()
                .then(fileUrl => {
                    setGifUrl(fileUrl);
                });
        } else {
            const splitFileURI = file.split('/');
            splitFileURI[splitFileURI.length] = splitFileURI[splitFileURI.length - 1];
            splitFileURI[splitFileURI.length - 2] = "uncompressed";
            const uncompressedImageFilePath = splitFileURI.join('/');
            firebase.storage().ref(uncompressedImageFilePath).getDownloadURL()
                .then(fileUrl => {
                    setImageUrlUncompressed(fileUrl);
                })
                .catch(error => null);
            ref.getDownloadURL()
                .then(fileUrl => {
                    setImageUrlCompressed(fileUrl);
                });
        }
    }

    // Track message reactions and update display on change
    useEffect(() => {
        const clickReactionPinHandler = (emoji, userPinnedReaction) => {
            const messageEmojiRef = firebase.database().ref(`${messageReactionsPath}/${emoji}/${auth.user.uid}`);
            if (userPinnedReaction) {
                messageEmojiRef.set(null);
            } else {
                messageEmojiRef.set(true);
            }
        }
        const getReactionPinUsernames = async (reactedUIDs) => {
            const reqs = [];
            const usernames = [];
            for (const uid of reactedUIDs) {
                reqs.push(
                    firebase.database().ref(`users/${uid}/userName`).once('value')
                );
            }
            await Promise.all(reqs)
                .then(snapshots => {
                    for (const snapshot of snapshots) {
                        const username = snapshot.val();
                        usernames.push(username);
                    }
                });
            return usernames.join('\n');
        }
        const createMessageReactionPins = async () => {
            const messageReactionPins = [];
            const reactionEntries = Object.entries(messageReactions);
            for (const [emoji, UIDs] of reactionEntries) {
                const reactedUIDs = Object.keys(UIDs);
                const reactedUsernames = await getReactionPinUsernames(reactedUIDs);
                const reactedUsersCount = reactedUIDs.length;
                const reactionPinClasses = `${css.MessageReactionPin} ${UIDs[auth.user.uid] && css.UserPinnedReaction}`
                const emojiReactionPin = (
                    <Tooltip title={reactedUsernames} key={`${messageKey}_reaction_${emoji}_pin`}>
                        <div className={reactionPinClasses} onClick={() => clickReactionPinHandler(emoji, UIDs[auth.user.uid])}>
                            {`${emoji} ${reactedUsersCount}`}
                        </div>
                    </Tooltip>
                );
                messageReactionPins.push(emojiReactionPin);
            }
            const messageReactionsDisplay = (
                <div className={css.MessageReactionDisplay}>
                    {messageReactionPins}
                </div>
            )
            setMessageReactionsDisplay(messageReactionsDisplay);
        }
        if (messageReactions) {
            createMessageReactionPins();
        } else {
            setMessageReactionsDisplay(null);
        }
    }, [messageKey, messageReactions, messageReactionsPath, auth.user.uid])

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
                <div className={css.MessageContentHeading}>
                    <p>
                        <span className={css.MessageName}>{userDisplayName}</span>
                        <span className={css.MessageTime}>{localeDate + " at " + localeTime}</span>
                    </p>

                    <div className={css.MessageActionButtons}>
                        <IconButton size="small" onClick={() => replyToMessage({ userUID: userUID, userDisplayName: userDisplayName, message: message, file: file, timestamp: localeDate + " at " + localeTime})}>
                            <ReplyIcon />
                        </IconButton>
                        <IconButton size="small" onClick={openEmojiReactionMenu}>
                            <SentimentVerySatisfiedOutlinedIcon />
                        </IconButton>
                    </div>
                </div>

                {quote && 
                    <div className={css.MessageQuote}>
                        <p>{quote.userDisplayName} <span className={css.MessageTime}>{quote.timestamp}</span></p>
                        {quote.hasFile && <PanoramaOutlinedIcon/>}
                        <p>"{quote.message}"</p>
                    </div>
                }

                {imageLoading ? <CircularProgress /> : null}
                {(imageUrlCompressed || gifUrl) &&
                    <Fade in={true}>
                        <div className={css.MessageImageWrapper}>
                            <img className={css.MessageImage} onLoad={() => setImageLoading(false)} src={imageUrlCompressed || gifUrl} alt="attached message file" />
                            {imageUrlUncompressed &&
                                <a href={imageUrlUncompressed} target="_blank" rel="noreferrer" className={css.UncompressedImageLink}>
                                    <LinkOutlinedIcon style={{ color: "#f9f9f9" }} />
                                </a>
                            }
                        </div>
                    </Fade>
                }
                {webmUrl &&
                    <Fade in={true}>
                        <div className={css.MessageImageWrapper}>
                            <video className={css.MessageImage} src={webmUrl} type="video/webm" controls preload="metadata" onLoadedData={() => setImageLoading(false)} />
                        </div>
                    </Fade>
                }
                <p className={css.MessageText}>{message}</p>
                {messageReactionsDisplay}
            </div>
        </div>
    )
};

const arePropsEqual = (prevState, nextState) => true;

export default React.memo(Message, arePropsEqual);
