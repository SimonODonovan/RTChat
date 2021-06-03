import React, { useEffect, useState } from 'react';

import useAuth from '../../hooks/auth/useAuth';
import firebase from 'firebase/app';
import 'firebase/database';
import useFirebaseDataListener from '../../hooks/chat/useFirebaseDataListener';

import { Dialog, DialogTitle, DialogContent, IconButton, Button, TextField, List, ListItem, ListItemSecondaryAction, Avatar, Tooltip, Snackbar } from '@material-ui/core';
import SettingsApplicationsOutlinedIcon from '@material-ui/icons/SettingsApplicationsOutlined';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import LockOpenOutlinedIcon from '@material-ui/icons/LockOpenOutlined';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import SaveOutlinedIcon from '@material-ui/icons/SaveOutlined';
import { green } from '@material-ui/core/colors';

const UserSettingsDialog = () => {
    const auth = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [newUserName, setNewUsername] = useState("");
    const [userNameWasUpdated, setUserNameWasUpdated] = useState(false);
    const [newUserNameError, setNewUserNameError] = useState(false);
    const [newUserNameErrorHelperText, setUserNameWasUpdatedHelperText] = useState("");
    const [currentAvatar, setCurrentAvatar] = useState(null);
    const [newAvatar, setnewAvatar] = useState(null);
    const [avatarWasUpdated, setAvatarWasUpdated] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [isDeleteAccountLocked, setIsDeleteAccountLocked] = useState(true);
    const [emailConfirmation, setEmailConfirmation] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [usernamePlaceholder, setUsernamePlaceholder] = useState("");

    const userName = useFirebaseDataListener(`users/${auth.user.uid}/userName`);
    const userCurrentAvatarPath = useFirebaseDataListener(`/userAvatars/${auth.user.uid}/avatar`);

    // All states should be stored as lowercase only
    const userStates = {
        ONLINE: "online",
        OFFLINE: "offline",
        AWAY: "away"
    }

    // Set the users current username
    useEffect(() => {
        if (userName) {
            setUsernamePlaceholder(userName);
        }
    }, [userName])

    // Set the users current Avatar
    useEffect(() => {
        if (userCurrentAvatarPath) {
            firebase.storage().ref(userCurrentAvatarPath).getDownloadURL()
                .then(snapshot => {
                    setCurrentAvatar(snapshot);
                });
        }
    }, [userCurrentAvatarPath, avatarWasUpdated])

    const handleSignOut = () => {
        firebase.database().ref(`users/${auth.user.uid}/status`).set(userStates.OFFLINE);
        auth.signOut();
    }

    const handleDeleteAccount = async (evt) => {
        if (evt && evt.type === 'submit')
            evt.preventDefault();
        if (emailConfirmation.length < 1 || passwordConfirmation.length < 1)
            return
        const authenticated = await auth.reauthenticateEmail(emailConfirmation, passwordConfirmation)
            .catch(e => {
                setSnackbarMessage(e.message);
                setSnackbarOpen(true);
                return
            })

        if (authenticated) {
            const res = await auth.deleteAccount();
            if (!res.success) {
                setSnackbarMessage(res.reason);
                setSnackbarOpen(true);
            }
        }
    }

    const resetDialog = () => {
        setIsOpen(false);
        setNewUsername("");
        setUserNameWasUpdated(false);
        setNewUserNameError(false);
        setUserNameWasUpdatedHelperText("");
        setnewAvatar(null);
        setAvatarWasUpdated(false);
        setSnackbarMessage("");
        setSnackbarOpen(false);
        setIsDeleteAccountLocked(true);
        setEmailConfirmation("");
        setPasswordConfirmation("");
    }

    const updateNewUsernameValue = userName => {
        setNewUsername(userName);
        setUserNameWasUpdated(false);
        if (newUserNameError) {
            setNewUserNameError(false);
            setUserNameWasUpdatedHelperText("");
        }
    }

    const saveUpdatedUsername = evt => {
        if (evt && evt.type === 'submit') {
            evt.preventDefault();
        }
        if (!newUserName) {
            setNewUserNameError(true);
            setUserNameWasUpdatedHelperText("Need at least 1 character");
            return
        }
        const userNameRef = firebase.database().ref(`users/${auth.user.uid}/userName`);
        userNameRef.set(newUserName)
            .then(() => {
                setUserNameWasUpdated(true);
                setNewUserNameError(false);
                setUserNameWasUpdatedHelperText("");
            })
            .catch((error) => {
                setUserNameWasUpdated(false);
                setNewUserNameError(true);
                setUserNameWasUpdatedHelperText("Could not set new Username");
            })
    }

    const saveUpdatedAvatar = () => {
        const userAvatarPath = `/userAvatars/${auth.user.uid}/avatar`;
        const customMetadata = { customMetadata: { owner: auth.user.uid } }
        firebase.storage().ref().child(userAvatarPath)
            .putString(newAvatar, 'data_url', customMetadata)
            .then(() => {
                const avatarUpdate = { [userAvatarPath]: userAvatarPath };
                firebase.database().ref().update(avatarUpdate);
                setAvatarWasUpdated(true);
            })
            .catch(e => {
                setSnackbarMessage("Could not update Avatar, please try again.");
                setSnackbarOpen(true);
            });
    }

    const handleAvatarSelected = (target) => {
        setAvatarWasUpdated(false);
        const imageFile = target.files[0];
        const fileReader = new FileReader();
        fileReader.onload = e => {
            const img = new Image();
            img.onload = () => {
                setnewAvatar(img.src);
                setSnackbarMessage("");
                setSnackbarOpen(false);
            };
            img.onerror = () => {
                setnewAvatar(null);
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
    };

    const avatarStyle = { "height": "60px", "width": "60px", "margin": "auto" }
    let avatarSrc = null
    if (currentAvatar)
        avatarSrc = currentAvatar;
    if (newAvatar)
        avatarSrc = newAvatar;
    const userAvatar = <Avatar src={avatarSrc} style={avatarStyle} />;

    return (
        <React.Fragment >
            <Tooltip title={"Settings"}>
                <IconButton onClick={() => setIsOpen(true)} style={{ color: "#f9f9f9" }}>
                    <SettingsApplicationsOutlinedIcon />
                </IconButton>
            </Tooltip>

            <Dialog open={isOpen} onClose={resetDialog}>
                <DialogTitle>Settings</DialogTitle>
                <DialogContent>
                    <List>
                        <ListItem divider style={{ display: "flex", justifyContent: "center" }}>
                            <form onSubmit={saveUpdatedUsername}>
                                <TextField margin="normal" label="Set Username"
                                    type="" value={newUserName} placeholder={usernamePlaceholder}
                                    onChange={(evt) => updateNewUsernameValue(evt.target.value)}
                                    error={newUserNameError} helperText={newUserNameErrorHelperText}
                                    inputProps={{ maxLength: 15, spellCheck: "false" }}
                                />
                            </form>
                            <ListItemSecondaryAction>
                                <IconButton onClick={saveUpdatedUsername} disabled={newUserName.length === 0}>
                                    {userNameWasUpdated ?
                                        <CheckCircleOutlineIcon style={{ color: green[500] }} />
                                        :
                                        <SaveOutlinedIcon />
                                    }
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>

                        <ListItem divider>
                            <div style={{ margin: "auto" }}>
                                <Tooltip title={"Set avatar"} placement="left">
                                    <Button component="label">
                                        <input type="file" accept="image/*" onChange={evt => handleAvatarSelected(evt.target)} hidden />
                                        {userAvatar}
                                    </Button>
                                </Tooltip>
                            </div>
                            <ListItemSecondaryAction>
                                <IconButton onClick={saveUpdatedAvatar} disabled={!Boolean(newAvatar)}>
                                    {avatarWasUpdated ?
                                        <CheckCircleOutlineIcon style={{ color: green[500] }} />
                                        :
                                        <SaveOutlinedIcon />
                                    }
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>

                        <ListItem divider style={{ display: "flex", justifyContent: "center" }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSignOut}
                            >
                                Sign Out
                            </Button>
                            <ListItemSecondaryAction></ListItemSecondaryAction>
                        </ListItem>

                        <ListItem style={{ display: "flex", justifyContent: "center" }}>
                            <Button
                                variant="outlined"
                                color="secondary"
                                disabled={isDeleteAccountLocked || emailConfirmation.length < 1 || passwordConfirmation.length < 1}
                                onClick={handleDeleteAccount}
                            >
                                Delete Account
                            </Button>
                            <ListItemSecondaryAction>
                                {isDeleteAccountLocked ?
                                    <IconButton onClick={() => setIsDeleteAccountLocked(false)}>
                                        <LockOpenOutlinedIcon />
                                    </IconButton>
                                    :
                                    <IconButton onClick={() => setIsDeleteAccountLocked(true)}>
                                        <LockOutlinedIcon />
                                    </IconButton>
                                }
                            </ListItemSecondaryAction>
                        </ListItem>
                        {!isDeleteAccountLocked &&
                            <ListItem style={{ "display": "flex", "flexDirection": "column" }}>
                                <form onSubmit={handleDeleteAccount}>
                                    <div>
                                        <TextField margin="normal" label="Email confirmation"
                                            type="" value={emailConfirmation} variant="outlined"
                                            onChange={(evt) => setEmailConfirmation(evt.target.value)}
                                            inputProps={{ maxLength: 50, spellCheck: "false" }}
                                        />
                                    </div>
                                    <div>
                                        <TextField margin="normal" label="Password confirmation"
                                            type="password" value={passwordConfirmation} variant="outlined"
                                            onChange={(evt) => setPasswordConfirmation(evt.target.value)}
                                            inputProps={{ maxLength: 50, spellCheck: "false" }}
                                        />
                                    </div>
                                    <input type="submit" style={{ display: "none" }} />
                                </form>
                            </ListItem>
                        }
                    </List>
                </DialogContent>
            </Dialog>
            <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={closeSnackbar} message={snackbarMessage} />
        </React.Fragment>
    );
}

const arePropsEqual = (prevState, nextState) => true;

export default React.memo(UserSettingsDialog, arePropsEqual);