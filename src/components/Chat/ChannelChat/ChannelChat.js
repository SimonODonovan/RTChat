import React, { useEffect, useState, useCallback, useRef } from 'react';

import css from './ChannelChat.module.css';

import useAuth from '../../../hooks/auth/useAuth';
import firebase from 'firebase/app';
import 'firebase/database';
import Message from './Message/Message';
import useFirebaseDataListener from '../../../hooks/chat/useFirebaseDataListener';
import { InputAdornment, IconButton, TextField, Divider, Fab, Zoom, Tooltip, Grow, Snackbar } from '@material-ui/core';
import SendOutlinedIcon from '@material-ui/icons/SendOutlined';
import ExpandMoreOutlinedIcon from '@material-ui/icons/ExpandMoreOutlined';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import CancelOutlinedIcon from '@material-ui/icons/CancelOutlined';

import { v4 as uuidv4 } from 'uuid';

const ChannelChat = props => {
    const { server, channel } = props;

    const auth = useAuth();
    const [messageList, setMessageList] = useState([]);
    const [newMessageText, setNewMessageText] = useState("");
    const [newFileName, setNewFileName] = useState(false);
    const [newFileUpload, setNewFileUpload] = useState(false);
    const [showScrollToBottomButton, setShowScrollToBottomButton] = useState(false);
    const [chatRows, setChatRows] = useState(1);
    const [snackbarMessage, setSnackbarMessage] = useState("")
    const [snackbarOpen, setSnackbarOpen] = useState(false)

    const messagesEndRef = useRef(null);
    const chatScrollerRef = useRef(null);

    const serverChannelMessagesPath = `/serverMessages/${server}/${channel}`;
    const channelMessages = useFirebaseDataListener(serverChannelMessagesPath);

    const sendMessage = useCallback(() => {
        if (!newMessageText && !newFileUpload)
            return

        const uploadMessage = (filePath = false) => {
            const messageDetails = {
                userUID: auth.user.uid,
                message: newMessageText,
                file: filePath,
                timestamp: new Date().toUTCString()
            }
            const serverChannelMessagesRef = firebase.database().ref(serverChannelMessagesPath);
            serverChannelMessagesRef.push(messageDetails, error => {
                if (error) {
                    setSnackbarMessage("Could not send, please try again.");
                    setSnackbarOpen(true);
                } else {
                    setNewMessageText("");
                }
                clearFileUpload();
            })
        }

        if (newFileUpload) {
            const uuid = uuidv4();
            const storRef = firebase.storage().ref(`serverChatImages/${server}/${channel}/${uuid}`);
            storRef.putString(newFileUpload, 'data_url')
                .then(ret => {
                    const filePath = ret.ref.fullPath;
                    uploadMessage(filePath);
                })
                .catch(e => {
                    setSnackbarMessage("Could not upload file, please try again.");
                    setSnackbarOpen(true);
                });
        } else {
            uploadMessage();
        };
    }, [serverChannelMessagesPath, newMessageText, newFileUpload, auth.user.uid, channel, server])

    // Set CTRL + Enter key listener to send new messages.
    // Clean event listener on component unmount.
    useEffect(() => {
        const sendMessageKeyListener = (event) => {
            if (event.ctrlKey && event.key === 'Enter' && (newMessageText || newFileUpload)) {
                sendMessage();
                setChatRows(1);
            }
        }
        document.addEventListener('keyup', sendMessageKeyListener)
        return () => document.removeEventListener('keyup', sendMessageKeyListener)
    }, [sendMessage, newMessageText, newFileUpload]);

    // Clear displayed messages when user changes server or channel.
    useEffect(() => {
        setMessageList([]);
    }, [server, channel])

    // When firebase sends a value event for new message update the display.
    useEffect(() => {
        if (channelMessages) {
            const messages = Object.keys(channelMessages).map((key) => {
                const messageDetails = channelMessages[key];
                return (
                    <React.Fragment key={key}>
                        <Message messageDetails={messageDetails} />
                        <Divider style={{ backgroundColor: "#484c52" }} className={css.Divider} />
                    </React.Fragment>
                )
            });
            setMessageList(messages);
        }
    }, [channelMessages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const toggleBottomScrollVisibility = () => {
        const scrolled = chatScrollerRef.current.scrollTop;
        setShowScrollToBottomButton(scrolled < 0)
    }

    const updateMessageText = evt => {
        const messageText = evt.target.value;
        const rows = messageText.split(/\r\n|\r|\n/).length
        setNewMessageText(messageText)
        setChatRows(rows < 7 ? rows : 6);
    }

    const handleFileUploadSelected = (target) => {
        const imageFile = target.files[0];
        const fileReader = new FileReader();
        fileReader.onload = e => {
            const img = new Image();
            img.onload = () => {
                setNewFileName(imageFile.name);
                setNewFileUpload(img.src);
                setSnackbarMessage("");
                setSnackbarOpen(false);
            };
            img.onerror = () => {
                setNewFileUpload(null);
                setSnackbarMessage('Invalid image content. Please try another image.');
                setSnackbarOpen(true);
            };
            const fileDataUrl = e.target.result;
            img.src = fileDataUrl;
        };
        fileReader.readAsDataURL(imageFile);
    }

    const closeSnackbar = (event, reason) => {
        if (reason === 'clickaway')
            return
        setSnackbarOpen(false);
    }

    const clearFileUpload = () => {
        setNewFileName(false);
        setNewFileUpload(false);
    }

    const wrapperClasses = ["FlexColStartCentered", css.ChannelChat];
    return (
        <div className={wrapperClasses.join(' ')}>
            <div ref={chatScrollerRef} onScroll={toggleBottomScrollVisibility} className={css.ReverseScrolling}>
                <div className={css.MessageList}>
                    {messageList}
                    <div ref={messagesEndRef}></div>
                </div>
            </div>

            <div className={css.NewMessageInput}>
                <TextField
                    variant="outlined"
                    autoComplete={"false"}
                    fullWidth
                    multiline
                    rows={chatRows}
                    placeholder={`Message ${channel}`}
                    value={newMessageText}
                    onChange={evt => updateMessageText(evt)}
                    InputProps={{
                        style: { color: "#f9f9f9", fontFamily: "Roboto" },
                        startAdornment: (
                            <InputAdornment>
                                {!newFileName ?
                                    <Tooltip title="Upload an image">
                                        <IconButton style={{ color: "#f9f9f9" }} component="label">
                                            <AttachFileIcon />
                                            <input type="file" accept="image/*" onChange={evt => handleFileUploadSelected(evt.target)} hidden />
                                        </IconButton>
                                    </Tooltip>
                                    :
                                    <Tooltip title={`Remove ${newFileName}`}>
                                        <IconButton onClick={clearFileUpload} style={{ color: "#f9f9f9" }}>
                                            <CancelOutlinedIcon />
                                        </IconButton>
                                    </Tooltip>
                                }
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

            <div className={css.ScrollToBottom} >
                <Zoom in={showScrollToBottomButton} timeout={{ enter: 300, exit: 300 }} unmountOnExit >
                    <Fab onClick={scrollToBottom}>
                        <ExpandMoreOutlinedIcon />
                    </Fab>
                </Zoom>
            </div>

            <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={closeSnackbar} message={snackbarMessage} />
        </div>
    )
};

const arePropsEqual = (prevState, nextState) => true;

export default React.memo(ChannelChat, arePropsEqual);
