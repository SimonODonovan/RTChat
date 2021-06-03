import React, { useEffect, useState } from 'react';

import firebase from 'firebase/app';
import 'firebase/database';

import { Dialog, DialogTitle, Tooltip, DialogContent, DialogActions, ListSubheader, LinearProgress, IconButton, List, ListItemText, ListItemSecondaryAction, Checkbox, Button, ListItem, TextField, Divider } from '@material-ui/core';
import {
    AddCircleOutline as AddCircleOutlineIcon,
    ListAlt as ListAltIcon,
} from '@material-ui/icons';
import useFirebaseDataListener from '../../../../hooks/chat/useFirebaseDataListener';


const ServerChannelManager = props => {
    const { selectedServer, updateSelectedChannel, selectedChannel, setSelectedListItem } = props;
    const [showManageDialog, setShowManageDialog] = useState(false);
    const [serverChannels, setServerChannels] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [disableDeleteButton, setDisableDeleteButton] = useState(true);
    const [checked, setChecked] = React.useState([]);
    const [deleteError, setDeleteError] = React.useState("");
    const [addError, setAddError] = React.useState("");
    const [newChannelName, setNewChannelName] = React.useState("");
    const firebaseDB = firebase.database();

    const channels = useFirebaseDataListener(`serverChannels/${selectedServer}`)
    useEffect(() => {
        if (channels && Object.keys(channels).length > 0) {
            setServerChannels(Object.keys(channels));
        }
    }, [channels])

    const closeManageDialog = () => {
        setShowManageDialog(false);
        setChecked([]);
        setNewChannelName("");
    }

    const handleCheckboxToggle = value => {
        deleteError && setDeleteError("");
        const currentIndex = checked.indexOf(value);
        const newChecked = [...checked];
        if (currentIndex === -1) {
            newChecked.push(value);
        } else {
            newChecked.splice(currentIndex, 1);
        }
        setChecked(newChecked);
        setDisableDeleteButton(newChecked.length === serverChannels.length);
    }

    const deleteCheckedChannels = () => {
        const deleteChannels = () => {
            const serverChannelsPath = `serverChannels/${selectedServer}`
            const firebaseReference = firebaseDB.ref(serverChannelsPath);
            firebaseReference.get()
                .then(snapshot => {
                    const latestChannels = snapshot.val();
                    checked.map(channel => delete latestChannels[channel]);
                    firebaseReference.set(latestChannels, error => {
                        if (error)
                            setDeleteError("Error - Could not delete Channels.");
                    });
                });
        }
        const deleteChannelMessages = () => {
            const update = {};
            for (const checkedChannel of checked) {
                update[checkedChannel] = null;
            }
            const serverMessagesPath = `serverMessages/${selectedServer}`
            const firebaseReference = firebaseDB.ref(serverMessagesPath);
            firebaseReference.update(update);
        }
        const deleteChannelImages = async () => {
            for (const checkedChannel of checked) {
                const storRefCompressed = `serverChatImages/${selectedServer}/${checkedChannel}`;
                const compressedImages = await firebase.storage().ref(storRefCompressed).listAll();
                for (const item of compressedImages.items) {
                    item.delete();
                }
                const storRefUncompressed = `serverChatImages/${selectedServer}/${checkedChannel}/uncompressed`;
                const uncompressedImages = await firebase.storage().ref(storRefUncompressed).listAll();
                for (const item of uncompressedImages.items) {
                    item.delete();
                }
            }
        }

        setIsLoading(true);
        deleteError && setDeleteError("");
        if (serverChannels.length > 0) {
            if (checked.indexOf(selectedChannel) > -1) {
                updateSelectedChannel(null);
                setSelectedListItem(null);
            }
            deleteChannels();
            deleteChannelMessages();
            deleteChannelImages()
                .then(() => {
                    setIsLoading(false);
                    setChecked([]);
                });
        }
    }

    const addChannel = evt => {
        if (evt && evt.type === 'submit')
            evt.preventDefault();
        if (!newChannelName)
            return
        setIsLoading(true);
        const serverChannelsPath = `serverChannels/${selectedServer}`
        const firebaseReference = firebaseDB.ref(serverChannelsPath);
        const update = { [newChannelName]: true }
        firebaseReference.update(update, error => {
            setIsLoading(false);
            if (error) {
                setAddError("Error - Could not add channel.")
            } else {
                setNewChannelName("");
            }
        })
    }

    return (
        <div>
            <Tooltip title="Manage Channels">
                <IconButton onClick={() => setShowManageDialog(true)} style={{ color: "#f9f9f9" }}>
                    <ListAltIcon />
                </IconButton>
            </Tooltip>

            <Dialog open={showManageDialog} onClose={() => setShowManageDialog(false)}>
                {isLoading && <LinearProgress />}
                <DialogTitle>Manage Channels</DialogTitle>
                <DialogContent>
                    <List>
                        <ListItem>
                            <form onSubmit={addChannel}>
                                <TextField placeholder="Add Channel" inputProps={{ maxLength: 15, spellCheck: "false" }} autoFocus={true} value={newChannelName} onClick={() => addError && setAddError("")} onChange={evt => setNewChannelName(evt.target.value)} error={Boolean(addError)} helperText={addError} />
                            </form>
                            <ListItemSecondaryAction>
                                <IconButton disabled={!newChannelName} edge="end" onClick={addChannel}>
                                    <AddCircleOutlineIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                        <Divider />
                        <ListSubheader>{"Delete Channels"}</ListSubheader>
                        {serverChannels.map(channel => (
                            <React.Fragment key={`${channel}_scm`}>
                                <ListItem>
                                    <ListItemText primary={channel} />
                                    <ListItemSecondaryAction>
                                        <Checkbox
                                            edge="end"
                                            onChange={() => handleCheckboxToggle(channel)}
                                            checked={checked.indexOf(channel) !== -1}
                                        />
                                    </ListItemSecondaryAction>
                                </ListItem>
                            </React.Fragment>
                        ))}
                        {deleteError && <p>{deleteError}</p>}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button color="secondary" onClick={closeManageDialog}>Close</Button>
                    <Tooltip open={checked.length === serverChannels.length} title="Server must have at least one channel" placement="top">
                        <Button color="primary" disabled={checked.length === 0 || disableDeleteButton} onClick={() => deleteCheckedChannels()}>Delete</Button>
                    </Tooltip>
                </DialogActions>
                {isLoading && <LinearProgress />}
            </Dialog>
        </div>
    );
};

const arePropsEqual = (prevState, nextState) => {
    return prevState.selectedServer === nextState.selectedServer && prevState.selectedChannel === nextState.selectedChannel;
};

export default React.memo(ServerChannelManager, arePropsEqual);
