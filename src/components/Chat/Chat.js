import React, { useEffect, useState, useMemo } from 'react';

import css from './Chat.module.css'
import './ChatGlobal.css'

import useAuth from '../../hooks/auth/useAuth';
import firebase from 'firebase/app';
import 'firebase/database';

import ServerList from './ServerList/ServerList';
import ServerChannels from './ServerChannels/ServerChannels';
import ChannelChat from './ChannelChat/ChannelChat';
import ServerUserStatusPane from './ServerUserStatusPane/ServerUserStatusPane';
import { AppBar, Backdrop, Fade, IconButton, Slide, Toolbar } from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import GroupOutlinedIcon from '@material-ui/icons/GroupOutlined';

const Chat = () => {
    const auth = useAuth();
    const [userServers, setUserServers] = useState(null);
    const [selectedServer, setSelectedServer] = useState(null);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [loadedChatStates, setLoadedChatStates] = useState({});
    const [loadedChats, setLoadedChats] = useState([]);
    const [width, setWindowWidth] = useState(0);
    const [menuOpen, setMenuOpen] = useState(true);
    const [userStatusPaneOpen, setUserStatusPaneOpen] = useState(true);
    const [showServerUserStatusPaneControls, setShowServerUserStatusPaneControls] = useState(false);

    // All states should be stored as lowercase only
    const userStates = useMemo(() => ({
        ONLINE: "online",
        OFFLINE: "offline",
        AWAY: "away"
    }), []);

    // Set user idle listener
    useEffect(() => {
        var timeout;
        var currentStatus; // always set on first login
        firebase.database().ref(`users/${auth.user.uid}/status`).on("value", snapshot => currentStatus = snapshot.val());

        function trackIdle() {
            document.onmousedown = resetTimer;  // catches touchscreen presses as well      
            document.ontouchstart = resetTimer; // catches touchscreen swipes as well 
            document.onclick = resetTimer;      // catches touchpad clicks as well
            document.onkeydown = resetTimer;
            document.addEventListener('scroll', resetTimer, true); // improved; see comments

            const setUserAway = () => {
                firebase.database().ref(`users/${auth.user.uid}/status`).set(userStates.AWAY);
            }

            function resetTimer() {
                clearTimeout(timeout);
                if (currentStatus && (currentStatus === userStates.AWAY || currentStatus === userStates.OFFLINE)) {
                    firebase.database().ref(`users/${auth.user.uid}/status`).set(userStates.ONLINE);
                    console.log("Set user online again");
                }
                timeout = setTimeout(setUserAway, 10000);
            }
        }
        trackIdle();

        return () => { timeout && clearTimeout(timeout); }
    }, [auth.user.uid, userStates])

    // Set user status on initial load and pagehide
    useEffect(() => {
        const setUserAway = () => {
            firebase.database().ref(`users/${auth.user.uid}/status`).set(userStates.AWAY);
        }
        firebase.database().ref(`users/${auth.user.uid}/status`).set(userStates.ONLINE);
        document.onvisibilitychange = () => document.visibilityState === 'hidden' && setUserAway();
    }, [auth.user.uid, userStates]);

    // Listen for userServer updates from ServerList component and update Loaded Chat Status dict with new servers
    useEffect(() => {
        if (userServers) {
            const setServerChannelLoadingStatusDict = async () => {
                const loadedChannelChats = {};
                for (const serverName of Object.keys(userServers)) {
                    if (loadedChatStates && !(serverName in loadedChatStates)) {
                        const snapshot = await firebase.database().ref(`serverChannels/${serverName}`).once('value');
                        const snapshotVal = snapshot.val();
                        if (snapshotVal) {
                            const channelsLoadingState = {}
                            for (const channel of Object.keys(snapshotVal)) {
                                channelsLoadingState[channel] = false;
                            }
                            loadedChannelChats[serverName] = channelsLoadingState;
                        }
                    }
                }
                if (Object.keys(loadedChannelChats).length > 0)
                    setLoadedChatStates(prev => ({ ...prev, ...loadedChannelChats }));
            };
            setServerChannelLoadingStatusDict();
        }
    }, [userServers, loadedChatStates]);

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

    const updateSelectedServer = serverName => {
        setSelectedServer(serverName);
        setSelectedChannel(null);
    }

    const updateSelectedChannel = channelName => {
        setSelectedChannel(channelName);
        if (channelName) {
            if (!loadedChatStates[selectedServer][channelName]) {
                setLoadedChatStates(prev => {
                    const update = { ...prev };
                    update[selectedServer][channelName] = true;
                    return update;
                });
                loadNewChannelChat(selectedServer, channelName);
            }
        }
    }

    const loadNewChannelChat = (serverName, channelName) => {
        setLoadedChats(prev => {
            const update = [...prev];
            const newChat = {
                channelChat: <ChannelChat server={selectedServer} channel={channelName} />,
                server: serverName,
                channel: channelName
            };
            update.push(newChat);
            return update;
        });
        const ref = firebase.database().ref(`serverChannels/${serverName}/${channelName}`);
        ref.on("value", snapshot => {
            if (!snapshot.exists()) {
                const channelName = snapshot.key;
                if (channelName) {
                    setLoadedChats(prev => prev.filter(chatDetails => (!(chatDetails.server === serverName && chatDetails.channel === channelName))));
                    setLoadedChatStates(prev => {
                        delete prev[serverName][channelName]
                        return prev
                    })
                }
                ref.off();
                if (selectedChannel === serverName && selectedChannel === channelName) {
                    setSelectedChannel(null);
                }
            }
        });

    }

    const openStatusPane = () => {
        setShowServerUserStatusPaneControls(false);
        setTimeout(() => setUserStatusPaneOpen(true), 500);
    }

    const closeStatusPane = () => {
        setUserStatusPaneOpen(false);
        setTimeout(() => setShowServerUserStatusPaneControls(true), 500);
    }

    return (
        <div className={css.ChatWrapper}>
            <AppBar position="static" style={AppBarStyles}>
                <Toolbar>
                    <IconButton onClick={() => setMenuOpen(prev => !prev)}>
                        <MenuIcon />
                    </IconButton>
                    <Fade in={Boolean(selectedServer)}>
                        <IconButton onClick={() => setUserStatusPaneOpen(prev => !prev)}>
                            <GroupOutlinedIcon />
                        </IconButton>
                    </Fade>
                </Toolbar>
            </AppBar>
            <div className={css.ChatComponents}>
                <div className={[css.NavWrapper, slideState].join(' ')}>
                    <ServerList
                        selectedServer={selectedServer}
                        updateSelectedServer={updateSelectedServer}
                        setSelectedChannel={setSelectedChannel}
                        setUserServers={setUserServers}
                    />

                    {selectedServer &&
                        <ServerChannels
                            selectedServer={selectedServer}
                            updateSelectedChannel={updateSelectedChannel}
                            selectedChannel={selectedChannel}
                        />
                    }
                </div>
                <div className={css.ServerChats} onClick={() => menuOpen && setMenuOpen(false)}>
                    <Backdrop open={menuOpen && width < 700} style={{ zIndex: 0 }} />
                    {loadedChats && loadedChats.map(chatDetails => {
                        const channelChatKey = chatDetails.server + chatDetails.channel + "_chat";
                        const showChat = selectedServer === chatDetails.server && selectedChannel === chatDetails.channel;
                        return (
                            <div key={channelChatKey} className={showChat ? css.ChannelChat : css.Hidden}>
                                {chatDetails.channelChat}
                            </div>
                        )
                    })}
                </div>

                <Slide in={showServerUserStatusPaneControls} direction="left" mountOnEnter unmountOnExit>
                    <div className={css.OpenUserStatusPanel} onClick={openStatusPane}>
                        <GroupOutlinedIcon />
                    </div>
                </Slide>

                {selectedServer && <ServerUserStatusPane server={selectedServer} userStatusPaneOpen={userStatusPaneOpen} setUserStatusPaneOpen={closeStatusPane} />}
            </div>
        </div>
    )
};

const arePropsEqual = () => true;

export default React.memo(Chat, arePropsEqual);