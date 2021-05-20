import React from 'react';
import useAuth from './hooks/auth/useAuth';
import Chat from './components/Chat/Chat';
import Login from './components/Login/Login';

const App = () => {
  const auth = useAuth();

  //TODO
  //Enhancements
  // Add auth rules to Storage (set metadata on file uploads + https://firebase.google.com/docs/rules/insecure-rules?authuser=0#storage)
  // Change message hover buttons to appear when hovering over an options menu icon rather than on the message itself, css redrawing prevents smooth scrolling
  // Add server users status pane
  
  //Fixes

  //Done
  // Enhancements
  //   Added support for .webm video files up to 8MB in size.
  //   Add support for quoting contents of previous messages when writing a new chat message.

  // Fixes
  //   Set selectedChannel to null when changing servers.
  //   Set ServerChannels selectedListItem to null when selectedServer changes.
  //   Set EmojiMart emojis perLine to 7 to improve width scaling on smaller screens.
  //   Set value listener when loading channels to listen for channel deletion, on delete remove channel chat from loadedChannelChats.
  //   Delete both compressed and uncompressed images when deleting a channel.
  //   Set .UserServerDialog css class in UserServerDialogs to have 300px width regardless of screen size. Fixes button overlap on mobile.
  //   Remove gifs from image compression file upload path. They are stored only in the uncompressed folder now.
  //   Full image link now appears correctly. Will not upload message details until compressed & non-compressed images are uploaded.
  //   Delete all channel images when a server is deleted.
  //   Add missing call to update setLoadedChatStates in Chat.js when deleting a channel chat that has been loaded.
  //   Trim new message text in channel chat when it us uploaded.
  //   Limit new message text in channel chat to 2000 characters.


  return (
    <div className="App">
      {auth.user ? <Chat /> : <Login />}
    </div>
  );
}

const arePropsEqual = (prevState, nextState) => true;

export default React.memo(App, arePropsEqual);
