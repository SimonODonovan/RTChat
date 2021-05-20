import React, { useEffect, useState, useCallback, useRef } from 'react';

import css from './ChannelChat.module.css';

import useAuth from '../../../hooks/auth/useAuth';
import firebase from 'firebase/app';
import 'firebase/database';

import Message from './Message/Message';

import 'emoji-mart/css/emoji-mart.css'
import { Picker } from 'emoji-mart'

import { InputAdornment, IconButton, TextField, Divider, Zoom, Tooltip, Grow, Snackbar, CircularProgress, Slide } from '@material-ui/core';
import SendOutlinedIcon from '@material-ui/icons/SendOutlined';
import ExpandMoreOutlinedIcon from '@material-ui/icons/ExpandMoreOutlined';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import CancelOutlinedIcon from '@material-ui/icons/CancelOutlined';
import SentimentVerySatisfiedOutlinedIcon from '@material-ui/icons/SentimentVerySatisfiedOutlined';
import ImageOutlinedIcon from '@material-ui/icons/ImageOutlined';
import ClearOutlinedIcon from '@material-ui/icons/ClearOutlined';

import { v4 as uuidv4 } from 'uuid';

const ChannelChat = props => {
    const { server, channel } = props;

    const auth = useAuth();
    const [retrievedInitialMessages, setRetrievedInitialMessages] = useState(false);
    const [messageList, setMessageList] = useState([]);
    const [newMessageText, setNewMessageText] = useState("");
    const [newFileName, setNewFileName] = useState(false);
    const [newFileUpload, setNewFileUpload] = useState(false);
    const [showScrollToBottomButton, setShowScrollToBottomButton] = useState(false);
    const [scrollAtBottom, setScrollAtBottom] = useState(false);
    const [chatRows, setChatRows] = useState(1);
    const [messageSending, setMessageSending] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [emojiTarget, setEmojiTarget] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [fetchingMessages, setFetchingMessages] = useState(false);
    const [messagesExhausted, setMessagesExhausted] = useState(false);
    const [newestMessageKey, setNewestMessageKey] = useState(false);
    const [oldestMessageKey, setOldestMessageKey] = useState(false);
    const [messageListenerActive, setMessageListenerActive] = useState(false);
    const [messageQuote, setMessageQuote] = useState(false);

    const messagesEndRef = useRef(null);
    const chatScrollerRef = useRef(null);
    const serverChannelMessagesPath = `/serverMessages/${server}/${channel}`;
    const messageFetchingLimit = 12;

    const clearFileUpload = useCallback(() => {
        if (messageSending)
            return
        setNewFileName(false);
        setNewFileUpload(false);
    }, [messageSending]);

    const openEmojiReactionMenu = useCallback((messageKey = false) => {
        if (showEmojiPicker) {
            setShowEmojiPicker(false);
        } else {
            setEmojiTarget(messageKey);
            setShowEmojiPicker(true);
        }
    }, [showEmojiPicker])

    // After moving channel chat scroll, make sure it sticks to the bottom during messageList updates
    useEffect(() => {
        if (scrollAtBottom && chatScrollerRef.current)
            chatScrollerRef.current.scrollTop = 0;
    }, [scrollAtBottom, messageList])

    const sendMessage = useCallback(() => {
        const downscaleImage = (img, newWidth = 500, imageType = "image/jpeg", quality = 0.8) => {
            // Create a temporary image so that we can compute the height of the downscaled image.
            const oldWidth = img.width;
            const oldHeight = img.height;
            const rescale = newWidth < oldWidth;
            const newHeight = rescale ? Math.floor(oldHeight / oldWidth * newWidth) : oldHeight

            // Create a temporary canvas to draw the downscaled image on.
            const canvas = document.createElement("canvas");
            canvas.width = rescale ? newWidth : oldWidth;
            canvas.height = newHeight;

            // Draw the downscaled image on the canvas and return the new data URL.
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            const newDataUrl = canvas.toDataURL(imageType, quality);
            return newDataUrl;
        }

        if ((!newMessageText && !newFileUpload) || messageSending) {
            return
        }
        setMessageSending(true);
        const uploadMessage = (filePath = false, fileType = false) => {
            const messageDetails = {
                userUID: auth.user.uid,
                message: newMessageText.trim(),
                file: filePath,
                timestamp: new Date().toUTCString(),
                fileType: fileType,
                quote: messageQuote
            }
            const serverChannelMessagesRef = firebase.database().ref(serverChannelMessagesPath);
            serverChannelMessagesRef.push(messageDetails, error => {
                if (error) {
                    setSnackbarMessage("Could not send, please try again.");
                    setSnackbarOpen(true);
                } else {
                    setNewMessageText("");
                    setMessageQuote(false)
                }
                clearFileUpload();
                setMessageSending(false);
                setChatRows(1);
            })
        }
        if (newFileUpload) {
            const uuid = uuidv4();
            if (newFileUpload.video) {
                const uncompressedStorRef = firebase.storage().ref(`serverChatImages/${server}/${channel}/uncompressed/${uuid}`);
                uncompressedStorRef.put(newFileUpload.video)
                    .then(ret => {
                        const filePath = ret.ref.fullPath;
                        uploadMessage(filePath, newFileUpload.fileType);
                    })
                    .catch(e => {
                        setSnackbarMessage("Could not upload file, please try again.");
                        setSnackbarOpen(true);
                        setMessageSending(false);
                    });
            } else {
                const downscaledImagedDataUrl = downscaleImage(newFileUpload.compressed);
                const compressedStorRef = firebase.storage().ref(`serverChatImages/${server}/${channel}/${uuid}`);
                compressedStorRef.putString(downscaledImagedDataUrl, 'data_url')
                    .then(ret => {
                        const filePath = ret.ref.fullPath;
                        const uncompressedStorRef = firebase.storage().ref(`serverChatImages/${server}/${channel}/uncompressed/${uuid}`);
                        uncompressedStorRef.put(newFileUpload.uncompressed)
                            .then(() => {
                                uploadMessage(filePath, newFileUpload.fileType);
                            })
                            .catch(e => {
                                setSnackbarMessage("Could not upload file, please try again.");
                                setSnackbarOpen(true);
                                setMessageSending(false);
                                firebase.storage().ref(filePath).delete();
                            });
                    })
                    .catch(() => {
                        setSnackbarMessage("Could not upload file, please try again.");
                        setSnackbarOpen(true);
                        setMessageSending(false);
                    });
            }
        } else {
            uploadMessage();
        };
    }, [newMessageText, newFileUpload, auth.user.uid, serverChannelMessagesPath,
        channel, server, messageSending, setMessageSending, clearFileUpload, messageQuote])

    const replyToMessage = messageDetails => {
        setMessageQuote(
            {
                userDisplayName: messageDetails.userDisplayName,
                message: messageDetails.message,
                hasFile: Boolean(messageDetails.file),
                timestamp: messageDetails.timestamp
            }
        )
    }

    // Set CTRL + Enter key listener to send new messages.
    // Clean event listener on component unmount.
    useEffect(() => {
        const sendMessageKeyListener = (event) => {
            if (event.ctrlKey && event.key === 'Enter' && (newMessageText || newFileUpload)) {
                sendMessage();
            }
        }
        document.addEventListener('keyup', sendMessageKeyListener)
        return () => document.removeEventListener('keyup', sendMessageKeyListener)
    }, [sendMessage, newMessageText, newFileUpload]);

    // Get the initial message list for this channel chat
    useEffect(() => {
        if (!retrievedInitialMessages) {
            firebase.database().ref(serverChannelMessagesPath).limitToLast(messageFetchingLimit)
                .once('value', snapshot => {
                    const snapshotVal = snapshot.val();
                    if (snapshotVal) {
                        const messageKeys = Object.keys(snapshotVal);
                        setOldestMessageKey(messageKeys[0])
                        setNewestMessageKey(messageKeys[messageKeys.length - 1])
                        if (messageKeys.length < messageFetchingLimit) {
                            setMessagesExhausted(true);
                        }
                        const initialMessageList = Object.entries(snapshotVal).map(([messageKey, messageDetails]) => (
                            <React.Fragment key={messageKey}>
                                <Message
                                    messageKey={messageKey}
                                    messageDetails={messageDetails}
                                    server={server}
                                    channel={channel}
                                    openEmojiReactionMenu={() => openEmojiReactionMenu(messageKey)}
                                    replyToMessage={replyToMessage}
                                />
                                <Divider style={{ backgroundColor: "#484c52" }} className={css.Divider} />
                            </React.Fragment>
                        ));
                        setMessageList(prev => prev.concat(initialMessageList));
                    } else {
                        setMessagesExhausted(true);
                    }
                    setRetrievedInitialMessages(true);
                });
        }
    }, [retrievedInitialMessages, server, channel, serverChannelMessagesPath, openEmojiReactionMenu])

    // Set up a listener for any new messages sent to this channel
    useEffect(() => {
        if (!messageListenerActive && (newestMessageKey || messagesExhausted)) {
            setMessageListenerActive(true);
            let ref = null;
            if (newestMessageKey) {
                ref = firebase.database().ref(serverChannelMessagesPath).orderByKey().startAfter(newestMessageKey);
            } else if (messagesExhausted) {
                ref = firebase.database().ref(serverChannelMessagesPath);
            }
            ref.on("child_added", snapshot => {
                const messageKey = snapshot.key;
                const messageDetails = snapshot.val();
                const newMessage = (
                    <React.Fragment key={messageKey}>
                        <Message
                            messageKey={messageKey}
                            messageDetails={messageDetails}
                            server={server}
                            channel={channel}
                            openEmojiReactionMenu={() => openEmojiReactionMenu(messageKey)}
                            replyToMessage={replyToMessage}
                        />
                        <Divider style={{ backgroundColor: "#484c52" }} className={css.Divider} />
                    </React.Fragment>
                );
                setMessageList(prev => prev.concat([newMessage]))
            });
            return (ref) => { ref?.off(); }
        }
    }, [messageListenerActive, newestMessageKey, messagesExhausted, serverChannelMessagesPath, server, channel, openEmojiReactionMenu])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const fetchEarlierMessages = () => {
        if (!fetchingMessages && !messagesExhausted && oldestMessageKey) {
            setFetchingMessages(true);
            firebase.database().ref(serverChannelMessagesPath)
                .orderByKey()
                .endBefore(oldestMessageKey)
                .limitToLast(messageFetchingLimit)
                .once("value", snapshot => {
                    const snapshotVal = snapshot.val();
                    if (snapshotVal) {
                        const messageKeys = Object.keys(snapshotVal);
                        setOldestMessageKey(messageKeys[0])
                        if (messageKeys.length < messageFetchingLimit) {
                            setMessagesExhausted(true);
                        }
                        const olderMessageList = Object.entries(snapshotVal).map(([messageKey, messageDetails]) => (
                            <React.Fragment key={messageKey}>
                                <Message
                                    messageKey={messageKey}
                                    messageDetails={messageDetails}
                                    server={server}
                                    channel={channel}
                                    openEmojiReactionMenu={() => openEmojiReactionMenu(messageKey)}
                                    replyToMessage={replyToMessage}
                                />
                                <Divider style={{ backgroundColor: "#484c52" }} className={css.Divider} />
                            </React.Fragment>
                        ));
                        setMessageList(prev => olderMessageList.concat(...prev));
                    } else {
                        setMessagesExhausted(true);
                    }
                    setFetchingMessages(false);
                });
        }
    }

    const updateScrollPosition = () => {
        const scroller = chatScrollerRef.current;
        const scrollPercentInverted = (scroller.scrollTop / (scroller.scrollHeight - scroller.clientHeight)) * 100;
        const scrollPercent = scrollPercentInverted * -1;
        setShowScrollToBottomButton(scrollPercent > 10);
        if (scrollPercent > 95 && !fetchingMessages) {
            fetchEarlierMessages();
        }
        setScrollAtBottom(scrollPercent < 1);
    }

    const updateMessageText = evt => {
        const messageText = evt.target.value;
        const rows = messageText.split(/\r\n|\r|\n/).length
        setNewMessageText(messageText)
        setChatRows(rows < 7 ? rows : 6);
    }

    const handleFileUploadSelected = (target) => {
        const showImageError = (errorMessage) => {
            setNewFileUpload(null);
            setSnackbarMessage(errorMessage);
            setSnackbarOpen(true);
        }
        const doPreliminaryValidation = imageFile => {
            let error = false;
            const isImage = imageFile.type.includes('image');
            const isWebm = imageFile.type === 'video/webm';
            const isImageTooLarge = imageFile.size > 8388608; //8MB
            if (!(isImage || isWebm)) {
                error = 'Invalid file content. Please try another image.';
            } else if (isImageTooLarge) {
                error = 'File too large, maximum size 8MB.';
            }
            return error;
        }
        const imageFile = target.files[0];
        if (imageFile) {
            const error = doPreliminaryValidation(imageFile)
            if (error) {
                showImageError(error);
                return;
            }
            const isVideoType = imageFile.type === 'video/webm' || imageFile.type === 'image/gif';
            setNewFileName(imageFile.name);
            setSnackbarMessage("");
            setSnackbarOpen(false);
            if (isVideoType) {
                setNewFileUpload({ video: imageFile, fileType: imageFile.type });
            } else {
                const img = new Image();
                img.onload = () => {
                    setNewFileUpload({ compressed: img, uncompressed: imageFile, fileType: imageFile.type });
                };
                img.onerror = () => showImageError('Invalid image content. Please try another image.');
                const fileURI = URL.createObjectURL(imageFile);
                img.src = fileURI;
            }
        }
    }

    const closeSnackbar = (event, reason) => {
        if (reason === 'clickaway')
            return
        setSnackbarOpen(false);
    }

    const handleEmojiSelect = emoji => {
        if (!emojiTarget) {
            setNewMessageText(prev => prev + emoji.native);
        } else {
            const messageReactionRef = firebase.database().ref(`serverMessages/${server}/${channel}/${emojiTarget}/reactions/${emoji.native}`);
            const update = { [auth.user.uid]: true };
            messageReactionRef.update(update);
        }
    }

    const clearEmojiPicker = () => {
        if (showEmojiPicker) {
            setEmojiTarget(false);
            setShowEmojiPicker(false);
        }
    }

    const wrapperClasses = ["FlexColStartCentered", css.ChannelChat];
    return (
        <div className={wrapperClasses.join(' ')}>
            <div ref={chatScrollerRef} onScroll={updateScrollPosition} className={css.ReverseScrolling} onClick={clearEmojiPicker}>
                <div className={css.MessageList}>
                    {fetchingMessages && <CircularProgress size={50} />}
                    {messageList}
                    {messageSending && <CircularProgress size={50} />}
                    <div ref={messagesEndRef}></div>
                </div>
            </div>

            <div className={css.NewMessageInputWrapper}>
                {messageQuote &&
                    <div style={{ overflow: 'hidden' }}>
                        <Slide direction="up" in={Boolean(messageQuote)}>
                            <div className={css.MessageReplyWrapper}>
                                <span />
                                <div>
                                    <p>
                                        {messageQuote.hasFile && <ImageOutlinedIcon />}
                                        {messageQuote.message && messageQuote.message}
                                    </p>
                                </div>
                                <IconButton onClick={() => setMessageQuote(false)}>
                                    <ClearOutlinedIcon />
                                </IconButton>
                            </div>
                        </Slide>
                    </div>
                }
                <div className={css.NewMessageInput}>
                    <TextField
                        variant="outlined"
                        autoComplete={"false"}
                        fullWidth
                        multiline
                        rows={chatRows}
                        placeholder={`Message ${channel}`}
                        disabled={messageSending}
                        value={newMessageText}
                        onChange={evt => updateMessageText(evt)}
                        inputProps={{ maxLength: 2000 }}
                        InputProps={{
                            style: { color: "#f9f9f9", fontFamily: "Roboto" },
                            startAdornment: (
                                <InputAdornment>
                                    {!newFileName ?
                                        <Tooltip title="Upload an image">
                                            <IconButton style={{ color: "#f9f9f9" }} component="label" disabled={messageSending}>
                                                <AttachFileIcon />
                                                <input type="file" accept="image/*;capture=camera" onChange={evt => handleFileUploadSelected(evt.target)} hidden />
                                            </IconButton>
                                        </Tooltip>
                                        :
                                        <Tooltip title={`Remove ${newFileName}`}>
                                            <IconButton onClick={clearFileUpload} style={{ color: "#f9f9f9" }}>
                                                <CancelOutlinedIcon />
                                            </IconButton>
                                        </Tooltip>
                                    }
                                    <IconButton style={{ color: "#f9f9f9" }} onClick={() => openEmojiReactionMenu()}>
                                        <SentimentVerySatisfiedOutlinedIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <Grow in={Boolean(newFileUpload) || Boolean(newMessageText)}>
                                    <InputAdornment>
                                        <Tooltip title="Ctrl + Enter also sends!">
                                            <IconButton onClick={sendMessage} style={{ color: "#f9f9f9" }}>
                                                <SendOutlinedIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </InputAdornment>
                                </Grow>
                            )
                        }}
                    />
                </div>
            </div>

            <div className={css.ScrollToBottom} >
                <Zoom in={showScrollToBottomButton} timeout={{ enter: 300, exit: 300 }} >
                    <IconButton onClick={scrollToBottom} style={{ backgroundColor: "#f9f9f9" }}>
                        <ExpandMoreOutlinedIcon />
                    </IconButton>
                </Zoom>
            </div>

            {showEmojiPicker &&
                <div className={css.EmojiPickerWrapper}>
                    <Picker emoji="" title="" onSelect={handleEmojiSelect} perLine={7} />
                </div>
            }
            <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={closeSnackbar} message={snackbarMessage} />
        </div>
    )
};

const arePropsEqual = (prevState, nextState) => true;

export default React.memo(ChannelChat, arePropsEqual);
