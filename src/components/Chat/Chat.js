import React, { useEffect, useState } from 'react';

import css from './Chat.module.css'
import './ChatGlobal.css'

import useAuth from '../../hooks/auth/useAuth';
import firebase from 'firebase/app';
import 'firebase/database';

import ServerList from './ServerList/ServerList';
import ServerChannels from './ServerChannels/ServerChannels';
import ChannelChat from './ChannelChat/ChannelChat';
import { AppBar, Backdrop, IconButton, Toolbar } from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';

const Chat = () => {
    const auth = useAuth();
    const [userServers, setUserServers] = useState(null);
    const [selectedServer, setSelectedServer] = useState(null);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [serverChats, setServerChats] = useState(null);
    const [width, setWindowWidth] = useState(0);
    const [menuOpen, setMenuOpen] = useState(true);

    // Set user online/offline status
    useEffect(() => {
        const cleanup = () => {
            firebase.database().ref(`users/${auth.user.uid}/status`).set("Offline");
        }
        firebase.database().ref(`users/${auth.user.uid}/status`).set("Online");
        window.addEventListener('beforeunload', cleanup);
        return () => {
            window.removeEventListener('beforeunload', cleanup);
        }
    }, [auth.user.uid]);

    // Listen for userServer updates from ServerList component and set ChannelChats to render 
    useEffect(() => {
        if (userServers) {
            const getServerChannels = async () => {
                const serverChannels = {};
                for (const serverName of Object.keys(userServers)) {
                    const snapshot = await firebase.database().ref(`serverChannels/${serverName}`).once('value');
                    const snapshotVal = snapshot.val();
                    if (snapshotVal) {
                        const channels = Object.keys(snapshotVal);
                        serverChannels[serverName] = channels;
                    }
                }
                if (Object.keys(serverChannels).length > 0) {
                    const serverChatsList = [];
                    for (const server of Object.keys(serverChannels)) {
                        for (const channel of serverChannels[server]) {
                            const hide = (selectedServer !== server || selectedChannel !== channel);
                            const chat = (
                                <div key={`${server}_${channel}_chat`} className={hide ? css.Hidden : css.ChannelChat}>
                                    <ChannelChat server={server} channel={channel} />
                                </div>
                            )
                            serverChatsList.push(chat);
                        }
                    }
                    setServerChats(serverChatsList);
                }
            }
            getServerChannels();
        }
    }, [userServers, selectedServer, selectedChannel]);

    useEffect(() => {
        const updateDimensions = () => {
            const width = window.innerWidth;
            setWindowWidth(width);
        }
        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    const AppBarStyles = {
        display: "none"
    }

    let slideState = "";
    if (width < 700) {
        AppBarStyles.display = "flex";
        slideState = menuOpen ? css.SlideIn : css.SlideOut;
    }

    return (
        <div className={css.ChatWrapper}>
            <AppBar position="static" style={AppBarStyles}>
                <Toolbar>
                    <IconButton edge="start" onClick={() => setMenuOpen(prev => !prev)}>
                        <MenuIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <div className={css.ChatComponents}>
                <div className={[css.NavWrapper, slideState].join(' ')}>
                    <ServerList
                        selectedServer={selectedServer}
                        setSelectedServer={setSelectedServer}
                        setSelectedChannel={setSelectedChannel}
                        setUserServers={setUserServers}
                    />

                    {selectedServer &&
                        <ServerChannels
                            selectedServer={selectedServer}
                            setSelectedChannel={setSelectedChannel}
                            selectedChannel={selectedChannel}
                        />
                    }
                </div>
                <div className={css.ServerChats} onClick={() => menuOpen && setMenuOpen(false)}>
                    <Backdrop open={menuOpen && width < 700} style={{ zIndex: 0 }} />
                    {serverChats}
                </div>
            </div>
        </div>
    )
};

const arePropsEqual = () => true;

export default React.memo(Chat, arePropsEqual);