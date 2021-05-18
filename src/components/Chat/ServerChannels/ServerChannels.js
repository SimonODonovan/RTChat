import React, { useState, useEffect } from 'react';

import css from './ServerChannels.module.css';

import ServerChannelManager from './ServerChannelManager/ServerChannelManager';
import useAuth from '../../../hooks/auth/useAuth';
import useFirebaseDataListener from '../../../hooks/chat/useFirebaseDataListener';
import { CircularProgress, Grow, List, ListItem, ListItemText } from '@material-ui/core';

const ServerChannels = props => {
    const { selectedServer, updateSelectedChannel, selectedChannel } = props;
    const auth = useAuth();
    const [serverChannelDisplay, setServerChannelDisplay] = useState([]);
    const [selectedListItem, setSelectedListItem] = useState(null);
    const [loading, setLoading] = useState(true);

    const serverAdmin = useFirebaseDataListener(`/serverRoles/${selectedServer}/owners/${auth.user.uid}`);
    const serverChannels = useFirebaseDataListener(`serverChannels/${selectedServer}`);

    useEffect(() => {
        setLoading(true);
        const selectChannelListItem = channelName => {
            setSelectedListItem(channelName);
            updateSelectedChannel(channelName);
        }
        if (serverChannels && Object.keys(serverChannels).length > 0) {
            const serverChannelDisplayList = (
                Object.keys(serverChannels).map(channelName => {
                    const key = channelName + '_sc';
                    const isSelectedClass = selectedListItem === channelName ? "SelectedListItem" : "UnselectedListItem";
                    return (
                        <Grow in={true} key={key}>
                            <ListItem className={"ListItem"} onClick={() => selectChannelListItem(channelName)} >
                                <ListItemText className={isSelectedClass} style={{ textAlign: "center", paddingRight: "5px" }}>
                                    {channelName}
                                </ListItemText>
                            </ListItem>
                        </Grow>
                    )
                })
            );
            setServerChannelDisplay(serverChannelDisplayList);
            setLoading(false);
        }
    }, [updateSelectedChannel, selectedListItem, serverChannels]);

    return (
        <div className={css.ChannelList}>
            {serverAdmin ?
                <div className={css.ChannelManager}>
                    <ServerChannelManager
                        selectedServer={selectedServer}
                        setSelectedChannel={updateSelectedChannel}
                        selectedChannel={selectedChannel}
                        setSelectedListItem={setSelectedListItem}
                    />
                </div>
                :
                null
            }
            <List className={css.Channels}>
                {loading && <ListItem><CircularProgress /></ListItem>}
                {serverChannelDisplay}
            </List>
        </div>
    )
};

const arePropsEqual = (prevState, nextState) => {
    return prevState.selectedServer === nextState.selectedServer && prevState.selectedChannel === nextState.selectedChannel;
};

export default React.memo(ServerChannels, arePropsEqual);