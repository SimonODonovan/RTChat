import React, { useEffect, useState } from 'react';

import { Button, TextField } from '@material-ui/core';
import useAuth from '../../../hooks/auth/useAuth';

const SignUpForm = props => {
    const auth = useAuth();
    const { setIsLogin, loading, setLoading } = props;
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isInvalidEmail, setIsInvalidEmail] = useState(false);
    const [userName, setUserName] = useState("");
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

    const handleSignUp = () => {
        if(loading || !(email && password && userName) || isInvalidEmail)
            return
        setLoading(true);
        auth.signUpEmail(email, password, userName);
    }

    const validateEmail = () => {
        if(email.length < 1) 
            return
        const mailformat = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;
        if (email.trim().match(mailformat))
            setIsInvalidEmail(false);
        else
            setIsInvalidEmail(true);
    }

    return (
        <form onSubmit={handleSignUp}>
            <input type="submit" style={{ display: "none" }} />
            <TextField required={true} fullWidth margin="normal"
                label="Email" type="" value={email}
                onChange={(evt) => setEmail(evt.target.value)}
                onBlur={validateEmail}
                onClick={() => auth.error && auth.setError(false)}
                error={isInvalidEmail || Boolean(formError)} inputProps={{spellCheck: "false"}}
            />

            <TextField required={true} fullWidth margin="normal"
                label="Password" type="password" value={password}
                onChange={(evt) => setPassword(evt.target.value)}
                onClick={() => auth.error && auth.setError(false)}
                error={Boolean(formError)} inputProps={{spellCheck: "false"}}
            />

            <TextField required={true} fullWidth margin="normal"
                label="Username" type="" value={userName}
                onChange={(evt) => setUserName(evt.target.value)}
                onClick={() => auth.error && auth.setError(false)}
                error={Boolean(formError)} helperText={formError}
                inputProps={{spellCheck: "false"}}
            />

            <Button variant="contained" size="large"
                fullWidth color="secondary"
                onClick={handleSignUp}
                disabled={loading || !(email && password && userName) || isInvalidEmail}
                style={{ "marginTop": "10px" }}
            >
                Sign Up
            </Button>

            <Button color="secondary" onClick={() => setIsLogin(true)}>
                Log in
            </Button>

        </form>
    )
};

const arePropsEqual = (prevState, nextState) => {
    return prevState.loading === nextState.loading
};

export default React.memo(SignUpForm, arePropsEqual);