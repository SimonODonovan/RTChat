import React from 'react';
import useAuth from './hooks/auth/useAuth';
import Chat from './components/Chat/Chat';
import Login from './components/Login/Login';

const App = () => {
  const auth = useAuth();

  //TODO
  //Enhancements
  // Add indexed based gets for chat channels, only fetch messages when needed
  // Allow replies to messages
  // @ person functionality
  // Add server users status pane
  // Add auth rules to Storage (set metadata on file uploads + https://firebase.google.com/docs/rules/insecure-rules?authuser=0#storage)
  
  //Fixes
  // Set selectedChannel to null when changing servers
  // Adjust emoji mart size for small mobile device widths (<360px)
  // Listen for channel add/remove in channel selector - not updated when owner removes channels
  //  Check delete of both compressed and uncompressed images when deleting a channel
  // Set delete servers width wider on mobiles, icon buttons overlapping text 
  // Do not allow .gifs for server and user avatars ? or remove .gifs from the image compression route
  // Some images do not get full link when message is sent to channel


  //Done
  // ChannelChats
  //   Prevent loading every channel on every server on app init. Now channel chats only init when clicked for the first time.
  //   Will now only fetch a subset of messages to start. And will listen for any new messages after the last of the initial message list.
  //   Will now fetch earlier messages when scrolling has reached 95% of the way to the top of the current channel chat.
  // Change scrollToBottom FAB to be an IconButton instead.


  return (
    <div className="App">
      {auth.user ? <Chat /> : <Login />}
    </div>
  );
}

const arePropsEqual = (prevState, nextState) => true;

export default React.memo(App, arePropsEqual);
