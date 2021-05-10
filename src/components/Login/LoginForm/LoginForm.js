import React, { useEffect, useState } from 'react';

import css from './LoginForm.module.css';

import { Button, TextField } from '@material-ui/core';
import useAuth from '../../../hooks/auth/useAuth';

const LoginForm = props => {
    const auth = useAuth();
    const { resetPassword, setIsLogin, loading, setLoading } = props;
    const [email, setEmail] = useState("");
    const [isInvalidEmail, setIsInvalidEmail] = useState(false);
    const [password, setPassword] = useState("");
    const [formError, setFormError] = useState(false);

    useEffect(() => {
        loading && formError && setLoading(false)
    }, [loading, setLoading, formError])

    useEffect(() => {
        if (auth.error) {
            setFormError("Invalid Email or Password.")
        } else {
            setFormError(false);
        }
    }, [auth.error])

    const handleLogin = evt => {
        if (evt && evt.type === 'submit') {
            evt.preventDefault();
        }
        if (loading || !(email && password) || isInvalidEmail)
            return
        setLoading(true);
        auth.signInEmail(email, password);
    }

    const validateEmail = () => {
        if (email.length < 1)
            return
        const mailformat = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;
        if (email.trim().match(mailformat))
            setIsInvalidEmail(false);
        else
            setIsInvalidEmail(true);
    }

    return (
        <form onSubmit={handleLogin}>
            <input type="submit" style={{ display: "none" }} />
            <TextField required fullWidth margin="normal"
                label="Email" type="" value={email}
                onChange={(evt) => setEmail(evt.target.value)}
                onBlur={validateEmail}
                onClick={() => auth.error && auth.setError(false)}
                error={isInvalidEmail || Boolean(formError)} inputProps={{ spellCheck: "false" }}
            />

            <TextField required fullWidth margin="normal"
                label="Password" type="password" value={password}
                onChange={(evt) => setPassword(evt.target.value)}
                onClick={() => auth.error && auth.setError(false)}
                error={Boolean(formError)} helperText={formError}
                inputProps={{ spellCheck: "false" }}
            />

            <Button variant="contained" size="large"
                fullWidth color="primary"
                onClick={handleLogin}
                disabled={loading || !(email && password) || isInvalidEmail}
                style={{ "marginTop": "10px" }}
            >
                Log In
            </Button>

            <div className={css.FormButtons}>
                <Button color="secondary" onClick={() => setIsLogin(false)}>
                    Sign Up
                </Button>

                <Button color="secondary" disabled={isInvalidEmail} onClick={() => resetPassword(email)}>Forgot Password</Button>
            </div>
        </form>
    )
};

const arePropsEqual = (prevState, nextState) => {
    return prevState.loading === nextState.loading
};

export default React.memo(LoginForm, arePropsEqual);