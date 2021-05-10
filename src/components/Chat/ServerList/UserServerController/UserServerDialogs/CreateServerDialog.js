import React, { useState, useEffect } from 'react';

import css from './UserServerDialog.module.css';

import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/storage';
import useFirebaseDataListener from '../../../../../hooks/chat/useFirebaseDataListener';
import useAuth from '../../../../../hooks/auth/useAuth';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, LinearProgress, Avatar, Stepper, Step, StepLabel, List, ListItem, ListItemSecondaryAction, IconButton, ListSubheader, ListItemText, Divider } from '@material-ui/core';
import AddCircleOutlineOutlinedIcon from '@material-ui/icons/AddCircleOutlineOutlined';
import RemoveCircleOutlineOutlinedIcon from '@material-ui/icons/RemoveCircleOutlineOutlined';

const CreateServerDialog = props => {
    const auth = useAuth();
    const [newServerName, setNewServerName] = useState("");
    const [newServerNameError, setNewServerNameError] = useState(false);
    const [newServerNameHelperText, setNewServerNameHelperText] = useState("");
    const [newServerAvatar, setNewServerAvatar] = useState(null);
    const [newServerAvatarError, setNewServerAvatarError] = useState(null);
    const [newServerChannelName, setNewServerChannelName] = useState("");
    const [newServerChannelNameError, setNewServerChannelNameError] = useState(false);
    const [newServerChannelNameErrorHelperText, setNewServerChannelNameErrorHelperText] = useState("");
    const [newServerChannels, setNewServerChannels] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [width, setWindowWidth] = useState(0);
    const [progressButtonStatus, setProgressButtonStatus] = useState({ 0: true, 1: false, 2: true, });

    const servers = useFirebaseDataListener(`servers`);
    const invalidCharacters = [".", "#", "$", "/", "[", "]"];

    const createServer = async () => {
        const uploadServerAvatar = () => {
            const storageFilePath = `/serverAvatars/${newServerNameLower}/avatar`;
            const databaseFilePath = `/serverAvatars/${newServerNameLower}`;
            firebase.storage().ref().child(storageFilePath)
                .putString(newServerAvatar, 'data_url')
                .then(snapshot => {
                    const avatarUpdate = { [databaseFilePath]: snapshot.ref.fullPath };
                    firebase.database().ref().update(avatarUpdate);
                });
        };
        const setServerRoles = async () => {
            const serverRolesPath = `/serverRoles/${newServerNameLower}/owners/${auth.user.uid}`;
            const update = { [serverRolesPath]: true }
            await firebase.database().ref().update(update)
                .catch(error => { return false })
            return true
        };
        setIsLoading(true);
        const newServerNameLower = newServerName.toLowerCase();
        if (!servers || !servers[newServerNameLower]) {
            if (newServerAvatar) {
                uploadServerAvatar();
            };
            const rolesCreated = await setServerRoles();
            if (rolesCreated) {
                const serversPath = `/servers/${newServerNameLower}`;
                const userSubscriptionsPath = `/users/${auth.user.uid}/subscribedServers/${newServerNameLower}`;
                const serverChannelsPath = `/serverChannels/${newServerNameLower}`
                const channelsDict = Object.assign({}, ...newServerChannels.map((channel) => ({ [channel]: true })));
                const update = {
                    [serversPath]: newServerName,
                    [userSubscriptionsPath]: true,
                    [serverChannelsPath]: channelsDict
                };
                firebase.database().ref().update(update, error => {
                    setIsLoading(false);
                    if (error) {
                        setNewServerNameError(true);
                        setNewServerNameHelperText(error.message);
                        setActiveStep(0);
                    } else {
                        resetCreateServerDialog();
                    }
                });
            }
        } else {
            setNewServerNameError(true);
            setNewServerNameHelperText("Server name taken.");
            setIsLoading(false);
            setActiveStep(0);
        }
    }

    useEffect(() => {
        const updateDimensions = () => {
            const width = window.innerWidth
            setWindowWidth(width)
        }
        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    const stepperLabels = {
        SET_NAME: 'Name',
        SET_ICON: 'Icon',
        SET_CHANNELS: 'Channels'
    }

    const stepperSteps = [
        { label: stepperLabels.SET_NAME },
        { label: stepperLabels.SET_ICON },
        { label: stepperLabels.SET_CHANNELS }
    ];

    const getSetNameStepperContent = () => {
        const updateServerNameInput = newServerName => {
            setNewServerName(newServerName);
            setProgressButtonStatus(prev => {
                prev[0] = newServerName.length < 1;
                return prev;
            });
        }
        return (
            <form onSubmit={handleStepperForward}>
                <TextField
                    autoFocus={true}
                    autoComplete={"off"}
                    required={true}
                    label="Server Name"
                    fullWidth
                    inputprops={{ spellCheck: "false" }}
                    value={newServerName}
                    error={newServerNameError}
                    helperText={newServerNameHelperText}
                    onChange={evt => updateServerNameInput(evt.target.value)}
                />
            </form>
        )
    };

    const getSetIconStepperContent = () => {
        const clearFileError = () => {
            setNewServerAvatar(null);
            setNewServerAvatarError(null);
        }
        const handleAvatarSelected = (target) => {
            const imageFile = target.files[0];
            const fileReader = new FileReader();
            fileReader.onload = e => {
                const img = new Image();
                img.onload = () => {
                    setNewServerAvatar(img.src);
                    setNewServerAvatarError(null);
                };
                img.onerror = () => {
                    setNewServerAvatar(null);
                    setNewServerAvatarError('Invalid image content. Please try another image.')
                };
                const fileDataUrl = e.target.result;
                img.src = fileDataUrl;
            };
            fileReader.readAsDataURL(imageFile);
        }
        const avatarStyle = { "height": "60px", "width": "60px", "margin": "auto" }
        const serverAvatarPreview = (
            newServerAvatar ?
                <Avatar src={newServerAvatar} style={avatarStyle} />
                :
                <Avatar style={avatarStyle}>{newServerName.charAt(0).toUpperCase()}</Avatar>
        )
        return (
            <div style={{ "display": "flex", "flexDirection": "column", "alignItem": "center", "justifyContent": "center" }}>
                {serverAvatarPreview}
                <Button variant="outlined" component="label" style={{ "marginTop": "10px", "width": "100%" }}>
                    Set Server Icon
                <input type="file" accept="image/*" onChange={evt => handleAvatarSelected(evt.target)} hidden />
                </Button>
                {newServerAvatarError && <Button variant="outlined" color="secondary" onClick={clearFileError}>Invalid file. Click here to clear.</Button>}
            </div>
        )
    };

    const getSetChannelsStepperContent = () => {
        const addChannel = evt => {
            if (evt && evt.type === 'submit')
                evt.preventDefault();
            if (!newServerChannelName)
                return
            if (invalidCharacters.some(invalidCharacter => newServerChannelName.indexOf(invalidCharacter) > -1)) {
                setNewServerChannelNameError(true)
                setNewServerChannelNameErrorHelperText("Channel names can not contain . # $ / [ ]")
                return
            }
            const trimmedChannelName = newServerChannelName.trim();
            if (!trimmedChannelName) return
            if (!newServerChannels.includes(trimmedChannelName)) {
                setNewServerChannels(prev => prev.concat([trimmedChannelName]));
                if (progressButtonStatus[2]) {
                    setProgressButtonStatus(prev => {
                        prev[2] = false;
                        return prev;
                    });
                }
            }
        }
        const removeChannel = index => {
            setNewServerChannels(prev => {
                const copy = [...prev];
                copy.splice(index, 1);
                if (copy.length < 1) {
                    setProgressButtonStatus(prev => {
                        prev[2] = true;
                        return prev;
                    });
                }
                return copy;
            });
        }
        const clearNewChannelErrors = () => {
            if (newServerChannelNameError) {
                setNewServerChannelNameError(false)
                setNewServerChannelNameErrorHelperText("")
            }
        }
        return (
            <List>
                <ListItem>
                    <form onSubmit={addChannel}>
                        <TextField
                            placeholder="Add Channel"
                            autoFocus={true}
                            value={newServerChannelName}
                            onClick={clearNewChannelErrors}
                            onChange={evt => {
                                clearNewChannelErrors();
                                setNewServerChannelName(evt.target.value)
                            }}
                            error={newServerChannelNameError}
                            helperText={newServerChannelNameErrorHelperText}
                        />
                    </form>
                    <ListItemSecondaryAction>
                        <IconButton disabled={!newServerChannelName || newServerChannelNameError} edge="end" onClick={addChannel}>
                            <AddCircleOutlineOutlinedIcon />
                        </IconButton>
                    </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListSubheader>{"Channels"}</ListSubheader>
                {newServerChannels.map((channel, index) => (
                    <React.Fragment key={`${channel}_csd`}>
                        <ListItem>
                            <ListItemText primary={channel} inputprops={{ maxLength: 15 }} />
                            <ListItemSecondaryAction>
                                <IconButton edge="end" onClick={() => removeChannel(index)}>
                                    <RemoveCircleOutlineOutlinedIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    </React.Fragment>
                ))}
            </List>
        )
    };

    const getStepContent = () => {
        const label = stepperSteps[activeStep].label;
        switch (label) {
            case stepperLabels.SET_NAME:
                return getSetNameStepperContent();
            case stepperLabels.SET_ICON:
                return getSetIconStepperContent();
            case stepperLabels.SET_CHANNELS:
                return getSetChannelsStepperContent();
            default:
                break;
        }
    }

    const resetCreateServerDialog = () => {
        props.setOpen(false);
        setNewServerName("");
        setNewServerNameError(false);
        setNewServerNameHelperText("");
        setNewServerAvatar(null);
        setNewServerAvatarError(null);
        setNewServerChannelName("");
        setNewServerChannels([]);
        setIsLoading(false);
        setActiveStep(0);
    }

    const handleStepperBack = () => {
        if (activeStep === 0) {
            resetCreateServerDialog();
        } else {
            setActiveStep(prev => prev - 1);
        }
    }

    const validateStepperStep = () => {
        const label = stepperSteps[activeStep].label;
        switch (label) {
            case stepperLabels.SET_NAME:
                if (invalidCharacters.some(invalidCharacter => newServerName.indexOf(invalidCharacter) > -1)) {
                    setNewServerNameError(true);
                    setNewServerNameHelperText("Invalid name, can not contain . # $ / [ ]");
                    return false;
                }
                if (!Boolean(newServerName)) {
                    setNewServerNameError(true);
                    setNewServerNameHelperText("Name required");
                    return false;
                }
                return true;
            case stepperLabels.SET_ICON:
                return !Boolean(newServerAvatarError);
            case stepperLabels.SET_CHANNELS:
                return newServerChannels.length > 0
            default:
                return true;
        }
    }

    const handleStepperForward = evt => {
        if (evt && evt.type === 'submit')
            evt.preventDefault();
        if (!validateStepperStep())
            return
        if (activeStep === stepperSteps.length - 1) {
            createServer();
        } else {
            setActiveStep(prev => prev + 1);
        }
    }

    return (
        <Dialog open={props.open} onClose={resetCreateServerDialog}>
            <div className={css.UserServerDialog}>
                {isLoading && <LinearProgress />}
                <DialogTitle>Create Server</DialogTitle>

                <Stepper activeStep={activeStep} orientation={width < 700 ? "vertical" : "horizontal"}>
                    {stepperSteps.map(stepDict => (
                        <Step key={stepDict.label}>
                            <StepLabel>{stepDict.label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <DialogContent>
                    {getStepContent()}
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleStepperBack} color="secondary">
                        {activeStep === 0 ? "Close" : "Back"}
                    </Button>
                    <Button onClick={handleStepperForward} color="primary" disabled={progressButtonStatus[activeStep]}>
                        {activeStep === stepperSteps.length - 1 ? "Create" : "Next"}
                    </Button>
                </DialogActions>
                {isLoading && <LinearProgress />}
            </div>
        </Dialog>
    )
};

const arePropsEqual = (prevState, nextState) => {
    return prevState.open === nextState.open;
};

export default React.memo(CreateServerDialog, arePropsEqual);