/** routes for auth */

const express = require('express');
const router = new express.Router();

const jwt = require("jsonwebtoken");
const ExpressError = require("../expressError");

const User = require("../models/user");

const { SECRET_KEY } = require("../config");

router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (await User.authenticate(username, password)) {

            await User.updateLoginTimestamp(username);
            // login successfully, send the token
            const token = jwt.sign({ username }, SECRET_KEY);
            return res.json({ token });
        }

        throw new ExpressError("Invalid username / password", 400);

    } catch (err) {
        return next(err);
    }
});



router.post('/register', async (req, res, next) => {
    try {
        const { username, password, first_name, last_name, phone } = req.body;

        const user = await User.register({ username, password, first_name, last_name, phone });

        const token = jwt.sign({ username }, SECRET_KEY);
        return res.json({ token });
    } catch (err) {
        return next(err);
    }
});


module.exports = router;