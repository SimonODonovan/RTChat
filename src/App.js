import React from 'react';
import useAuth from './hooks/auth/useAuth';
import Chat from './components/Chat/Chat';
import Login from './components/Login/Login';

const App = () => {
  const auth = useAuth();

  //TODO
  //Enhancements
  // Style ServerUserStatusPane
  // Add textoverflow ellipses to ServerUserStatusPane names
  // Update users in serverUsers/${server} when joining/leaving/creating/delete
  // Add auth rules to Storage (set metadata on file uploads + https://firebase.google.com/docs/rules/insecure-rules?authuser=0#storage)
  
  //Fixes
  // Possible to set mobile users offline if they close the browser ?

  //Done
  // Add implementation for ServerUserStatusPane + control buttons for mobile and desktop i.e. >700px && <700px


  return (
    <div className="App">
      {auth.user ? <Chat /> : <Login />}
    </div>
  );
}

const arePropsEqual = (prevState, nextState) => true;

export default React.memo(App, arePropsEqual);
