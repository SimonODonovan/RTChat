import React, { useState, useEffect } from 'react';

import css from './ServerList.module.css';

import useAuth from '../../../hooks/auth/useAuth';
import UserServerController from './UserServerController/UserServerController';
import useFirebaseDataListener from '../../../hooks/chat/useFirebaseDataListener';
import UserSettingsDialog from '../../UserSettingsDialog/UserSettingsDialog';

import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/storage';

import { Avatar, CircularProgress, Grow, List, ListItem, ListItemAvatar, Tooltip } from '@material-ui/core';

const ServerList = props => {
    const auth = useAuth();
    const { selectedServer, updateSelectedServer, setSelectedChannel, setUserServers } = props;
    const [serverList, setServerList] = useState(null);
    const [serverAvatarUrls, setServerAvatarUrls] = useState({});
    const [selectedListItem, setSelectedListItem] = useState(null);
    const [loading, setLoading] = useState(false);

    const userServers = useFirebaseDataListener(`users/${auth.user.uid}/subscribedServers`);
    const servers = useFirebaseDataListener(`servers`);

    useEffect(() => {
        if (userServers) {
            setUserServers(userServers);
            setLoading(true);
            (async () => {
                const serverAvatarUrls = {};
                for (const serverName of Object.keys(userServers)) {
                    const serverAvatarSnapshot = await firebase.database().ref(`serverAvatars/${serverName}`).once("value");
                    const serverAvatarPath = serverAvatarSnapshot.val();
                    let url = null;
                    if (serverAvatarPath)
                        url = await firebase.storage().ref(serverAvatarPath).getDownloadURL();
                    serverAvatarUrls[serverName] = url;
                }
                setServerAvatarUrls(serverAvatarUrls);
                setLoading(false);
            })();
        } else {
            updateSelectedServer(false);
            setServerList(null);
        }
    }, [userServers, setServerList, updateSelectedServer, setUserServers])

    useEffect(() => {
        const updateSelectedServerListItem = serverName => {
            updateSelectedServer(serverName);
            setSelectedListItem(serverName);
        }
        if (servers) {
            setLoading(true);
            const serverDisplayList = (
                Object.keys(serverAvatarUrls).map(serverName => {
                    const key = serverName + '_sl';
                    const isSelectedClass = selectedListItem === serverName ? "SelectedListItem" : "";
                    const avatar = (
                        serverAvatarUrls[serverName] ?
                            <Avatar src={serverAvatarUrls[serverName]} />
                            :
                            <Avatar>{serverName.charAt(0).toUpperCase()}</Avatar>
                    )
                    return (
                        <Grow in={true} key={key}>
                            <div className={"ListItem"}>
                                <ListItem onClick={() => updateSelectedServerListItem(serverName)}>
                                    <Tooltip title={servers[serverName] || ""}>
                                        <ListItemAvatar className={isSelectedClass}>{avatar}</ListItemAvatar>
                                    </Tooltip>
                                </ListItem>
                            </div>
                        </Grow>
                    )
                })
            );
            setLoading(false);
            setServerList(serverDisplayList);
        } else {
            setServerList([]);
        }
    }, [serverAvatarUrls, selectedListItem, updateSelectedServer, servers])

    //Unsubscribe user if userServers not found in all servers
    useEffect(() => {
        const missingServersUpdate = {}
        for (const server in userServers) {
            if (!servers || !servers[server]) {
                missingServersUpdate[server] = null;
            }
        }
        if (Object.keys(missingServersUpdate).length > 0) {
            setLoading(true);
            firebase.database().ref(`users/${auth.user.uid}/subscribedServers`)
                .update(missingServersUpdate);
            setLoading(false);
        }
        if(missingServersUpdate[selectedServer])
            setSelectedChannel(null);
    }, [userServers, servers, auth.user.uid, selectedServer, setSelectedChannel])

    const userServerControllerClasses = [css.ControllerIcons, css.UserServerController].join(' ');
    const userSettingsClasses = [css.ControllerIcons, css.UserSettingsDialog].join(' ');
    return (
        <div className={css.ServerList}>
            <div className={userServerControllerClasses}>
                <UserServerController selectedServer={selectedServer} updateSelectedServer={updateSelectedServer} setSelectedChannel={setSelectedChannel} />
            </div>
            <List className={css.Servers}>
                {loading && <ListItem><CircularProgress /></ListItem>}
                {serverList}
            </List>
            <div className={userSettingsClasses}>
                <UserSettingsDialog />
            </div>
        </div>
    )
};

const arePropsEqual = (prevState, nextState) => {
    return prevState.selectedServer === nextState.selectedServer;
};

export default React.memo(ServerList, arePropsEqual);