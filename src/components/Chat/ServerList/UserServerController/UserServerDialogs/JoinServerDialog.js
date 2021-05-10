import React, { useCallback, useEffect, useState } from 'react';
import { distance } from 'fastest-levenshtein';

import css from './UserServerDialog.module.css';

import firebase from 'firebase/app';
import 'firebase/database';
import useFirebaseDataListener from '../../../../../hooks/chat/useFirebaseDataListener';
import useAuth from '../../../../../hooks/auth/useAuth';

import { Dialog, DialogTitle, DialogContent, TextField, LinearProgress, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction, Tooltip } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import { green } from '@material-ui/core/colors';


const JoinServerDialog = props => {
    const [serverSearchInput, setServerSearchInput] = useState("");
    const [serverSearchResults, setServerSearchResults] = useState([]);
    const [serverSearchDisplay, setServerSearchDisplay] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const auth = useAuth();

    // Maintain latest server names.
    const servers = useFirebaseDataListener(`servers`);

    // Maintain latest user subscribed servers.
    const userSubscriptionsPath = `users/${auth.user.uid}/subscribedServers`;
    const userSubscriptions = useFirebaseDataListener(userSubscriptionsPath);

    const searchServers = evt => {
        if (evt && evt.type === 'submit')
            evt.preventDefault();
        if (servers) {
            const foundServers = Object.keys(servers)
                .map((server) => {
                    const nameDistance = distance(serverSearchInput, server);
                    return { distance: nameDistance, name: server }
                })
                .filter(({ distance }) => {
                    return distance < 3;
                })
                .sort((server1, server2) => {
                    return server1.distance - server2.distance;
                })
                .slice(0, 5)
                .map((server) => {
                    return server.name
                });
            if (foundServers.length > 0) {
                setServerSearchResults(foundServers)
                return
            }
        }
        setServerSearchDisplay(<p>{`No matching servers for "${serverSearchInput}"`}</p>)
    }

    const joinServer = useCallback(serverName => {
        setIsLoading(true);
        if (!userSubscriptions || !userSubscriptions[serverName]) {
            const update = { [serverName]: true };
            firebase.database().ref(userSubscriptionsPath).update(update, error => {
                setIsLoading(false);
            });
        }
    }, [userSubscriptions, userSubscriptionsPath])

    const updateServerSearchDisplay = useCallback(() => {
        const displayItems = (
            <List>
                {serverSearchResults.map(serverName => (
                    <ListItem key={`${serverName}_jsd`} divider>
                        <ListItemText>{serverName}</ListItemText>
                        <ListItemSecondaryAction>
                            {userSubscriptions && userSubscriptions[serverName] ?
                                <IconButton><CheckCircleOutlineIcon style={{ color: green[500] }} /> </IconButton>
                                :
                                <IconButton onClick={() => joinServer(serverName)} ><AddCircleOutlineIcon /></IconButton>
                            }
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>
        )
        setServerSearchDisplay(displayItems);
    }, [joinServer, userSubscriptions, serverSearchResults])

    // Track updates from firebase for users subscribedServers and user searches.
    // Update on either for correct IconButton (CheckCircleOutlineIcon or AddCircleOutlineIcon).
    useEffect(() => {
        if (serverSearchResults) {
            updateServerSearchDisplay();
        }
    }, [userSubscriptions, serverSearchResults, updateServerSearchDisplay])

    const resetJoinServerDialog = () => {
        setServerSearchInput("");
        setServerSearchResults([]);
        setServerSearchDisplay([]);
        setIsLoading(false);
        props.setOpen(false);
    }

    return (
        <Dialog open={props.open} onClose={resetJoinServerDialog}>
            <div className={css.UserServerDialog}>
                {isLoading && <LinearProgress />}
                <DialogTitle>Join Server</DialogTitle>
                <DialogContent>
                    <form onSubmit={searchServers}>
                        <TextField
                            autoFocus={true}
                            required={true}
                            label="Server Name"
                            inputProps={{ spellCheck: "false" }}
                            value={serverSearchInput}
                            onChange={evt => setServerSearchInput(evt.target.value)}
                        />
                        <Tooltip title="Find closest server name matches">
                            <span>
                                <IconButton onClick={searchServers} disabled={serverSearchInput.length === 0}>
                                    <SearchIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </form>
                    {serverSearchDisplay}
                </DialogContent>
                {isLoading && <LinearProgress />}
            </div>
        </Dialog>
    )
};

const arePropsEqual = (prevState, nextState) => {
    return prevState.open === nextState.open;
};

export default React.memo(JoinServerDialog, arePropsEqual);
