import React from 'react';
import useAuth from './hooks/auth/useAuth';
import Chat from './components/Chat/Chat';
import Login from './components/Login/Login';

const App = () => {
  const auth = useAuth();

  return (
    <div className="App">
      {auth.user ? <Chat /> : <Login />}
    </div>
  );
}

const arePropsEqual = (prevState, nextState) => true;

export default React.memo(App, arePropsEqual);
