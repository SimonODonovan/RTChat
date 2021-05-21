import React, { useState, useEffect } from 'react';

import css from './ServerUserStatusPane.module.css';

import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/storage';
import useFirebaseDataListener from '../../../hooks/chat/useFirebaseDataListener';

import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import { List, ListItem, ListItemIcon, ListItemText, ListSubheader, useTheme } from '@material-ui/core';

const ServerUserStatusPane = props => {
    const { server } = props;

    const [serverUsers, setServerUsers] = useState(false);
    const [userStates, setUserStates] = useState({});
    const [onlineUsers, setOnlineUsers] = useState([])
    const [offlineUsers, setOfflineUsers] = useState([])

    const serverUsersListener = useFirebaseDataListener(`serverUsers/${server}`);
    const theme = useTheme();
    const primary = theme.palette.primary.main;
    const secondary = theme.palette.secondary.main;

    // Set users of selected server when either selectedServer or serverUsers are updated.
    useEffect(() => {
        if (serverUsersListener) {
            setServerUsers(serverUsersListener);
        }
    }, [server, serverUsersListener])

    // Set usernames and status' when the serverUsers are updated
    useEffect(() => {
        const clearRefs = refs => {
            for (const ref of refs) {
                ref.off();
            }
        }
        const refs = [];
        if (serverUsers) {
            for (const userUID of Object.keys(serverUsers)) {
                const userStatusRef = firebase.database().ref(`users/${userUID}/status`)
                userStatusRef.on('value', snapshot => {
                    const val = snapshot.val();
                    setUserStates(prev => {
                        const update = Object.assign({}, prev);
                        update[userUID] = {
                            ...update[userUID],
                            status: val
                        }
                        return update;
                    });
                });
                refs.push(userStatusRef);
                const usernameRef = firebase.database().ref(`users/${userUID}/userName`)
                usernameRef.on('value', snapshot => {
                    const val = snapshot.val();
                    setUserStates(prev => {
                        const update = Object.assign({}, prev);
                        update[userUID] = {
                            ...update[userUID],
                            username: val
                        }
                        return update;
                    });
                });
                refs.push(usernameRef);
            }
        }
        return () => clearRefs(refs)
    }, [serverUsers])

    // Set online and offline users of the server when userStates is updated
    useEffect(() => {
        if (Object.keys(userStates).length > 0) {
            const onlineUsers = [];
            const offlineUsers = [];

            for (const userUID of Object.keys(userStates)) {
                const status = userStates[userUID].status;
                if (status && status.toLowerCase() === "online") {
                    onlineUsers.push(userStates[userUID]);
                }
                else if (status && status.toLowerCase() === "offline") {
                    offlineUsers.push(userStates[userUID]);
                }
            }

            setOnlineUsers(onlineUsers);
            setOfflineUsers(offlineUsers);
        }
    }, [userStates])

    return (
        <div className={css.ServerUserStatusPane}>
            <List dense={true} subheader={<ListSubheader component="div">Online</ListSubheader>}>
                {onlineUsers.map(userDetails => (
                    <ListItem key={`online_${userDetails.username}_${userDetails.status}_susp`}>
                        <ListItemIcon size={5}>
                            <FiberManualRecordIcon style={{ fontSize: "0.7rem", color: primary }} />
                        </ListItemIcon>
                        <ListItemText
                            primary={`${userDetails.username}`}
                        />
                    </ListItem>
                ))}
            </List>

            <List dense={true} subheader={<ListSubheader component="div">Offline</ListSubheader>}>
                {offlineUsers.map(userDetails => (
                    <ListItem key={`offline_${userDetails.username}_${userDetails.status}_susp`}>
                        <ListItemIcon>
                            <FiberManualRecordIcon style={{ fontSize: "0.7rem", color: secondary }} />
                        </ListItemIcon>
                        <ListItemText
                            primary={`${userDetails.username}`}
                        />
                    </ListItem>
                ))}
            </List>
        </div>
    )
}

const arePropsEqual = (prevState, nextState) => prevState.server === nextState.server;

export default React.memo(ServerUserStatusPane, arePropsEqual);