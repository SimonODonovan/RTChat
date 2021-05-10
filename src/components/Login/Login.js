import React, { useState } from 'react';

import css from './Login.module.css';

import useAuth from '../../hooks/auth/useAuth';

import LoginForm from './LoginForm/LoginForm';
import SignUpForm from './SignUpForm/SignUpForm';
import { Backdrop, CircularProgress, makeStyles, Snackbar } from '@material-ui/core';

const Login = () => {
    const auth = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const loginStyles = makeStyles((theme) => ({
        backdrop: {
            zIndex: theme.zIndex.drawer + 1,
            color: '#fff',
        },
    }))();

    const closeSnackbar = (event, reason) => {
        if (reason === 'clickaway')
            return
        setSnackbarOpen(false);
    };

    const resetPassword = async (email) => {
        const resetSent = await auth.resetPassword(email);
        if (resetSent) {
            setSnackbarMessage("Reset email sent!");
        } else {
            setSnackbarMessage("Could not send reset email.");
        }
        setSnackbarOpen(true);
    }

    return (
        <div className={css.Wrapper}>
            <div className={css.Login}>
                <Backdrop className={loginStyles.backdrop} open={loading}>
                    <CircularProgress color="inherit" />
                </Backdrop>
                <h1>
                    <span className={css.HeadingPre}>RT</span>
                    <span className={css.HeadingPost}>::Chat</span>
                </h1>
                {isLogin ?
                    <LoginForm loading={loading} setLoading={setLoading} resetPassword={resetPassword} setIsLogin={setIsLogin} /> :
                    <SignUpForm loading={loading} setLoading={setLoading} resetPassword={resetPassword} setIsLogin={setIsLogin} />
                }
                <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={closeSnackbar} message={snackbarMessage} />
            </div>
        </div>
    )
}

const arePropsEqual = (prevState, nextState) => true;

export default React.memo(Login, arePropsEqual)