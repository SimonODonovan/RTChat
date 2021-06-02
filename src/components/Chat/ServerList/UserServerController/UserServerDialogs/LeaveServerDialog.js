import React, { useEffect, useState, useCallback } from 'react';

import css from './UserServerDialog.module.css';

import firebase from 'firebase/app';
import 'firebase/database';
import useFirebaseDataListener from '../../../../../hooks/chat/useFirebaseDataListener';
import useAuth from '../../../../../hooks/auth/useAuth';

import { Dialog, DialogTitle, DialogContent, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction } from '@material-ui/core';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import CancelOutlinedIcon from '@material-ui/icons/CancelOutlined';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import { green } from '@material-ui/core/colors';

const LeaveServerDialog = props => {
    const auth = useAuth();

    const { selectedServer, updateSelectedServer, setSelectedChannel } = props;

    const [userServers, setUserServers] = useState([]);
    const [leaveServerChecks, setLeaveServerChecks] = useState({});
    const [userServersDisplay, setUserServersDisplay] = useState([]);
    const [hasOwnedServers, setHasOwnedServers] = useState(false);
    const userServersListener = useFirebaseDataListener(`users/${auth.user.uid}/subscribedServers`);
    const serversListener = useFirebaseDataListener(`servers`);

    // Set the server names to display in the leave server dialog
    useEffect(() => {
        if (userServersListener && serversListener) {
            const setUserLeavableServers = async () => {
                const serverNames = Object.keys(userServersListener);
                const nonOwnedServers = [];
                for (const serverName of serverNames) {
                    const snapshot = await firebase.database().ref(`serverRoles/${serverName}/owners/${auth.user.uid}`).once('value');
                    const serverOwner = snapshot.val();
                    if (!serverOwner)
                        nonOwnedServers.push(serverName);
                }
                setHasOwnedServers(serverNames.length !== nonOwnedServers.length);

                const caseCorrectServers = nonOwnedServers.map(serverNameLower => serversListener[serverNameLower]);
                setUserServers(caseCorrectServers);

                const leaveChecks = { ...caseCorrectServers };
                Object.keys(leaveChecks).forEach(serverName => leaveChecks[serverName] = false);
                setLeaveServerChecks(leaveChecks);
            }
            setUserLeavableServers();
        } else {
            setUserServersDisplay("No subscribed servers!")
        }
    }, [userServersListener, serversListener, auth.user.uid])

    const leaveServer = useCallback(serverName => {
        const serverNameLower = serverName.toLowerCase();
        const subscribedServersPath = `users/${auth.user.uid}/subscribedServers/${serverNameLower}`;
        const serverUsersPath = `/serverUsers/${serverNameLower}/${auth.user.uid}`;
        const update = {
            [subscribedServersPath]: null,
            [serverUsersPath]: null
        }
        firebase.database().ref().update(update);

        if (serverName === selectedServer) {
            updateSelectedServer(null);
            setSelectedChannel(null);
        }
    }, [auth.user.uid, selectedServer, updateSelectedServer, setSelectedChannel])

    // Create and set the list display for the set users servers
    useEffect(() => {
        const updateLeaveServerChecks = (serverName, isLeaving) => {
            setLeaveServerChecks(prev => { return { ...prev, [serverName]: isLeaving } })
        }
        if (userServers.length > 0) {
            const serversDisplay = (
                <List>
                    {hasOwnedServers && <p>You can not leave owned servers.</p>}
                    {userServers.map((serverName) => {
                        const key = serverName + '_lsdItem';
                        return (
                            <ListItem key={key} divider>
                                <ListItemText>{serverName}</ListItemText>
                                <ListItemSecondaryAction>
                                    {!leaveServerChecks[serverName] ?
                                        <IconButton onClick={() => updateLeaveServerChecks(serverName, true)}>
                                            <ExitToAppIcon />
                                        </IconButton>
                                        :
                                        <React.Fragment>
                                            <IconButton onClick={() => updateLeaveServerChecks(serverName, false)}>
                                                <CancelOutlinedIcon />
                                            </IconButton>
                                            <IconButton onClick={() => leaveServer(serverName)}>
                                                <CheckCircleOutlineIcon style={{ color: green[500] }} />
                                            </IconButton>
                                        </React.Fragment>
                                    }
                                </ListItemSecondaryAction>
                            </ListItem>
                        )
                    })}
                </List>
            )
            setUserServersDisplay(serversDisplay);
        }
    }, [userServers, leaveServerChecks, leaveServer, hasOwnedServers])

    return (
        <Dialog open={props.open} onClose={() => props.setOpen(false)}>
            <div className={css.UserServerDialog}>
                <DialogTitle>Leave Server</DialogTitle>
                <DialogContent>
                    {userServersDisplay}
                </DialogContent>
            </div>
        </Dialog>
    )
};

const arePropsEqual = (prevState, nextState) => {
    return prevState.open === nextState.open && prevState.selectedServer === nextState.selectedServer;
};

export default React.memo(LeaveServerDialog, arePropsEqual);