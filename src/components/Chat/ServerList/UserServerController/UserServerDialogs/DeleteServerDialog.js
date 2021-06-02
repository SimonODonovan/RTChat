import React, { useEffect, useState, useCallback } from 'react';

import css from './UserServerDialog.module.css';

import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/storage';
import useFirebaseDataListener from '../../../../../hooks/chat/useFirebaseDataListener';
import useAuth from '../../../../../hooks/auth/useAuth';

import { Dialog, DialogTitle, DialogContent, List, ListItemText, IconButton, ListItem, ListItemSecondaryAction } from '@material-ui/core';
import DeleteForeverOutlinedIcon from '@material-ui/icons/DeleteForeverOutlined';
import CancelOutlinedIcon from '@material-ui/icons/CancelOutlined';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import { green } from '@material-ui/core/colors';

const DeleteServerDialog = props => {
    const auth = useAuth();

    const { selectedServer, updateSelectedServer, setSelectedChannel } = props;

    const [userOwnedServers, setUserOwnedServers] = useState([]);
    const [userOwnedServersDisplay, setUserOwnedServersDisplay] = useState(null);
    const [deleteServerChecks, setDeleteServerChecks] = useState({});

    const userServersListener = useFirebaseDataListener(`users/${auth.user.uid}/subscribedServers`);

    const setOwnedServers = useCallback(async userServers => {
        const servers = [];
        for (const server of Object.keys(userServers)) {
            await firebase.database().ref(`serverRoles/${server}/owners/${auth.user.uid}`).once('value', snapshot => {
                const serverOwner = snapshot.val();
                if (serverOwner) {
                    servers.push(server);
                }
            });
        }
        setUserOwnedServers(servers);
    }, [auth.user.uid])

    useEffect(() => {
        if (userServersListener)
            setOwnedServers(userServersListener);
        else
            setOwnedServers([]);
    }, [userServersListener, auth.user.uid, setOwnedServers])

    const deleteOwnedServer = useCallback(serverName => {
        const update = {
            [`serverAvatars/${serverName}`]: null,
            [`serverChannels/${serverName}`]: null,
            [`serverMessages/${serverName}`]: null,
            [`serverRoles/${serverName}`]: null,
            [`servers/${serverName}`]: null,
            [`serverUsers/${serverName}`]: null
        }
        firebase.database().ref().update(update, error => {
            if (!error) {
                const serverPath = `/serverAvatars/${serverName}`;
                firebase.storage().ref(serverPath).child("avatar").delete()
                    .catch(error => {
                        if (error.code !== 'storage/object-not-found') {
                            console.log(error);
                        }
                    });

                firebase.storage().ref(`/serverChatImages/${serverName}`).listAll()
                    .then(listResults => {
                        // Channels listResults
                        for (const folder of listResults.prefixes) {
                            firebase.storage().ref(folder.fullPath).listAll()
                                .then(listResults => {
                                    // Compressed images listResults
                                    for (const image of listResults.items) {
                                        image.delete();
                                    }
                                });
                            firebase.storage().ref(folder.fullPath).child("uncompressed").listAll()
                                .then(listResults => {
                                    // Uncompressed images listResults
                                    for (const image of listResults.items) {
                                        image.delete();
                                    }
                                });
                        }
                    })
                    .catch(error => {
                        if (error.code !== 'storage/object-not-found') {
                            console.log(error);
                        }
                    });
                if (serverName === selectedServer) {
                    updateSelectedServer(null);
                    setSelectedChannel(null);
                }
                setUserOwnedServers(prev => {
                    const update = [...prev];
                    update.splice(update.indexOf(serverName), 1);
                    return update;
                });
            }
        });
    }, [updateSelectedServer, selectedServer, setSelectedChannel]);

    useEffect(() => {
        const updateDeleteServerChecks = (serverName, isLeaving) => {
            setDeleteServerChecks(prev => { return { ...prev, [serverName]: isLeaving } })
        }
        if (userOwnedServers) {
            const deleteServerListItems = userOwnedServers.map(serverName => (
                <ListItem key={`${serverName}_dsd`} divider>
                    <ListItemText>{serverName}</ListItemText>
                    <ListItemSecondaryAction>
                        {!deleteServerChecks[serverName] ?
                            <IconButton onClick={() => updateDeleteServerChecks(serverName, true)}>
                                <DeleteForeverOutlinedIcon />
                            </IconButton>
                            :
                            <React.Fragment>
                                <IconButton onClick={() => updateDeleteServerChecks(serverName, false)}>
                                    <CancelOutlinedIcon />
                                </IconButton>
                                <IconButton onClick={() => deleteOwnedServer(serverName)}>
                                    <CheckCircleOutlineIcon style={{ color: green[500] }} />
                                </IconButton>
                            </React.Fragment>
                        }
                    </ListItemSecondaryAction>
                </ListItem>
            ))
            const deleteServerList = <List>{deleteServerListItems}</List>
            setUserOwnedServersDisplay(deleteServerList);
        }
    }, [userOwnedServers, deleteServerChecks, deleteOwnedServer])

    return (
        <Dialog open={props.open} onClose={() => props.setOpen(false)}>
            <div className={css.UserServerDialog}>
                <DialogTitle>Delete Servers</DialogTitle>
                <DialogContent>
                    {userOwnedServers.length > 0 ? userOwnedServersDisplay : <p>You do not own any servers.</p>}
                </DialogContent>
            </div>
        </Dialog>
    );
}

const arePropsEqual = (prevState, nextState) => {
    return prevState.open === nextState.open && prevState.selectedServer === nextState.selectedServer;
};

export default React.memo(DeleteServerDialog, arePropsEqual);