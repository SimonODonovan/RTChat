import React from 'react';
import useAuth from './hooks/auth/useAuth';
import Chat from './components/Chat/Chat';
import Login from './components/Login/Login';

const App = () => {
  const auth = useAuth();

  //TODO
  //Enhancements
  // Update users in serverUsers/${server} when joining/leaving/creating/delete
  // Add auth rules to Storage (set metadata on file uploads + https://firebase.google.com/docs/rules/insecure-rules?authuser=0#storage)
  
  //Fixes
  // Fetching Message Spinner now showing
  // ? Return message skeleton while fetching in progress
  // Hide emojiMart on message send
  // Hide emojiMart on clicking body
  // Set max length on dialog textFields

  //Done
  // Enhancements
  // Add user away status.
  // Add user timeout functionality which sets Online/Away status.
  // Set users away when they navigate away from the page in any manner.
  // Set users offline when they sign out.
  // Added textoverflow ellipses to ServerUserStatusPane names.


  return (
    <div className="App">
      {auth.user ? <Chat /> : <Login />}
    </div>
  );
}

const arePropsEqual = (prevState, nextState) => true;

export default React.memo(App, arePropsEqual);
