import React, { useState, useEffect, useMemo } from 'react';

import css from './ServerUserStatusPane.module.css';

import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/storage';
import useFirebaseDataListener from '../../../hooks/chat/useFirebaseDataListener';

import { CircularProgress, IconButton, List, ListItem, ListItemIcon, ListItemText, ListSubheader, Slide, useTheme } from '@material-ui/core';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import GroupOutlinedIcon from '@material-ui/icons/GroupOutlined';

const ServerUserStatusPane = props => {
    const { server, userStatusPaneOpen, setUserStatusPaneOpen } = props;

    const [serverUsers, setServerUsers] = useState(false);
    const [serverUserDetails, setServerUserDetails] = useState({});
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [offlineUsers, setOfflineUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const serverUsersListener = useFirebaseDataListener(`serverUsers/${server}`);
    const theme = useTheme();
    const primary = theme.palette.primary.main;
    const secondary = theme.palette.secondary.main;
    const away = "#d1b30b";

    // All states should be stored as lowercase only
    const userStates = useMemo(() => ({
        ONLINE: "online",
        OFFLINE: "offline",
        AWAY: "away"
    }), []);

    // Set users of selected server when either selectedServer or serverUsers are updated.
    useEffect(() => {
        if (serverUsersListener) {
            setLoading(true);
            setServerUserDetails({});
            setOnlineUsers([]);
            setOfflineUsers([]);
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
                    setServerUserDetails(prev => {
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
                    setServerUserDetails(prev => {
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
        if (Object.keys(serverUserDetails).length > 0) {
            const onlineUsers = [];
            const offlineUsers = [];
            const onlineStates = [userStates.ONLINE, userStates.AWAY];

            for (const userUID of Object.keys(serverUserDetails)) {
                const status = serverUserDetails[userUID].status;
                if (status && onlineStates.indexOf(status) > -1) {
                    onlineUsers.push(serverUserDetails[userUID]);
                }
                else if (status && status === userStates.OFFLINE) {
                    offlineUsers.push(serverUserDetails[userUID]);
                }
            }

            setOnlineUsers(onlineUsers);
            setOfflineUsers(offlineUsers);
            setLoading(false);
        }
    }, [serverUserDetails, userStates]);

    return (
        <Slide direction="left" in={userStatusPaneOpen} mountOnEnter unmountOnExit className={css.ServerUserStatusPane}>
            <div>
                <IconButton onClick={() => setUserStatusPaneOpen(false)}>
                    <GroupOutlinedIcon />
                </IconButton>

                <List dense={true} subheader={<ListSubheader component="div">Online</ListSubheader>}>
                    {loading &&
                        <ListItem>
                            <CircularProgress />
                        </ListItem>
                    }
                    {onlineUsers.map(userDetails => (
                        <ListItem key={`online_${userDetails.username}_${userDetails.status}_susp`}>
                            <ListItemIcon size={5}>
                                <FiberManualRecordIcon style={{ color: userDetails.status === userStates.ONLINE ? primary : away }} />
                            </ListItemIcon>
                            <ListItemText primary={`${userDetails.username}`} />
                        </ListItem>
                    ))}
                </List>

                <List dense={true} subheader={<ListSubheader component="div">Offline</ListSubheader>}>
                    {loading &&
                        <ListItem>
                            <CircularProgress />
                        </ListItem>
                    }
                    {offlineUsers.map(userDetails => (
                        <ListItem key={`offline_${userDetails.username}_${userDetails.status}_susp`}>
                            <ListItemIcon>
                                <FiberManualRecordIcon style={{ color: secondary }} />
                            </ListItemIcon>
                            <ListItemText primary={`${userDetails.username}`} />
                        </ListItem>
                    ))}
                </List>
            </div>
        </Slide>
    )
}

const arePropsEqual = (prevState, nextState) => {
    const sameServer = prevState.server === nextState.server;
    const sameOpenState = prevState.userStatusPaneOpen === nextState.userStatusPaneOpen;
    return sameServer && sameOpenState;
};

export default React.memo(ServerUserStatusPane, arePropsEqual);