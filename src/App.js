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
  // Adjust emoji mart size for small mobile device widths (<360px)
  // Listen for channel add/remove in channel selector - not updated when owner removes channels
  //  Check delete of both compressed and uncompressed images when deleting a channel
  // Set delete servers width wider on mobiles, icon buttons overlapping text 
  // Do not allow .gifs for server and user avatars ? or remove .gifs from the image compression route
  // Some images do not get full link when sent to channel


  //Done
  // Emotes
  //  Add emoticon reaction click functionality, click emoticon reaction to upvote/downvote
  //  Add emoticon colouring based on if user has clicked that emote on that message
  //  Add emoticon picker controlled by emoticon buttons on messages and new chat message textfield
  // Images
  //  Remove FileReader from chat message image selection to prevent lag on file selection, use URL.createObjectURL(imageFile) instead
  //  Upload both the user image and a compressed version of this image
  //  Display the compressed user images in chat channels and present link to uncompressed version
  // Prevent editing file attachment or new message text after hitting send, until it resolves
  // Add circular progress feedback to message list when user is sending a message
  // Add spinner instead of images in messages when they are loading

  return (
    <div className="App">
      {auth.user ? <Chat /> : <Login />}
    </div>
  );
}

const arePropsEqual = (prevState, nextState) => true;

export default React.memo(App, arePropsEqual);
