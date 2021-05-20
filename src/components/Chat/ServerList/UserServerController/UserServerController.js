import React, { useState } from 'react';

import CreateServerDialog from './UserServerDialogs/CreateServerDialog';
import JoinServerDialog from './UserServerDialogs/JoinServerDialog';
import LeaveServerDialog from './UserServerDialogs/LeaveServerDialog';
import DeleteServerDialog from './UserServerDialogs/DeleteServerDialog';

import { IconButton, Menu, Tooltip, MenuItem, ListItemIcon, ListItemText } from '@material-ui/core';
import {
    PostAdd as PostAddIcon,
    CreateOutlined as CreateOutlinedIcon,
    AddCircleOutline as AddCircleOutlineIcon,
    RemoveCircleOutline as RemoveCircleOutlineIcon,
    DeleteForeverOutlined as DeleteForeverOutlinedIcon
} from '@material-ui/icons';


const UserServerController = props => {
    const DIALOGTYPES = { CREATE: "create", JOIN: "join", LEAVE: "leave", DELETE: "delete" }

    const {selectedServer, updateSelectedServer, setSelectedChannel} = props;

    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const [showCreateServerDialog, setShowCreateServerDialog] = useState(false);
    const [showJoinServerDialog, setShowJoinServerDialog] = useState(false);
    const [showLeaveServerDialog, setShowLeaveServerDialog] = useState(false);
    const [showDeleteServerDialog, setShowDeleteServerDialog] = useState(false);

    const openUserServerControllerMenu = event => {
        setMenuAnchor(event.currentTarget);
        setMenuOpen(true);
    };

    const closeUserServerControllerMenu = event => {
        setMenuOpen(false);
    };

    const openServerDialog = dialogType => {
        switch (dialogType) {
            case DIALOGTYPES.CREATE:
                setShowCreateServerDialog(true);
                break;
            case DIALOGTYPES.JOIN:
                setShowJoinServerDialog(true);
                break;
            case DIALOGTYPES.LEAVE:
                setShowLeaveServerDialog(true);
                break;
            case DIALOGTYPES.DELETE:
                setShowDeleteServerDialog(true);
                break;
            default:
        }
        setMenuOpen(false);
    }

    return (
        <div>
            <Tooltip title="Manage Servers">
                <IconButton onClick={openUserServerControllerMenu} style={{color: "#f9f9f9"}}>
                    <PostAddIcon />
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={menuAnchor}
                keepMounted
                open={menuOpen}
                onClose={closeUserServerControllerMenu}
            >
                <MenuItem onClick={() => openServerDialog(DIALOGTYPES.CREATE)}>
                    <ListItemIcon><CreateOutlinedIcon /></ListItemIcon>
                    <ListItemText primary="Create Server" />
                </MenuItem>

                <MenuItem onClick={() => openServerDialog(DIALOGTYPES.JOIN)}>
                    <ListItemIcon><AddCircleOutlineIcon /></ListItemIcon>
                    <ListItemText primary="Join Server" />
                </MenuItem>

                <MenuItem onClick={() => openServerDialog(DIALOGTYPES.LEAVE)}>
                    <ListItemIcon><RemoveCircleOutlineIcon /></ListItemIcon>
                    <ListItemText primary="Leave Server" />
                </MenuItem>

                <MenuItem onClick={() => openServerDialog(DIALOGTYPES.DELETE)}>
                    <ListItemIcon><DeleteForeverOutlinedIcon /></ListItemIcon>
                    <ListItemText primary="Delete Server" />
                </MenuItem>
            </Menu>

            <CreateServerDialog open={showCreateServerDialog} setOpen={setShowCreateServerDialog} />
            <JoinServerDialog open={showJoinServerDialog} setOpen={setShowJoinServerDialog} />
            <LeaveServerDialog open={showLeaveServerDialog} setOpen={setShowLeaveServerDialog} updateSelectedServer={updateSelectedServer} selectedServer={selectedServer} setSelectedChannel={setSelectedChannel} />
            <DeleteServerDialog open={showDeleteServerDialog} setOpen={setShowDeleteServerDialog} updateSelectedServer={updateSelectedServer} selectedServer={selectedServer} setSelectedChannel={setSelectedChannel} />
        </div>
    );
};

const arePropsEqual = (prevState, nextState) => {
    return prevState.selectedServer === nextState.selectedServer;
};

export default React.memo(UserServerController, arePropsEqual);