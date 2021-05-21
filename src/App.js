import React from 'react';
import useAuth from './hooks/auth/useAuth';
import Chat from './components/Chat/Chat';
import Login from './components/Login/Login';

const App = () => {
  const auth = useAuth();

  //TODO
  //Enhancements
  // Style ServerUserStatusPane
  // Add auth rules to Storage (set metadata on file uploads + https://firebase.google.com/docs/rules/insecure-rules?authuser=0#storage)
  
  //Fixes

  //Done
  // Change SelectedListItem color to theme primary.
  // Enhancements
  // Message actions menu now appears when hovering on the message's menu icon rather than on the overall message container.
  // Created ServerUserStatusPane which tracks online/offline users for the selectedServer and displays them in two lists.

  return (
    <div className="App">
      {auth.user ? <Chat /> : <Login />}
    </div>
  );
}

const arePropsEqual = (prevState, nextState) => true;

export default React.memo(App, arePropsEqual);
