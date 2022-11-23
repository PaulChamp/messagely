/** routes for users */

const express = require("express");
const ExpressError = require("../expressError");

const User = require("../models/user");

const router = new express.Router();

const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");


router.get('/', ensureLoggedIn, async (req, res, next) => {
    try {
        const users = await User.all();
        return res.json({ users });
    } catch (err) {
        return next(err);
    }
});



router.get('/:username', ensureCorrectUser, async (req, res, next) => {
    try {
        const user = await User.get(req.params.username);
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});


router.get('/:username/to', ensureCorrectUser, async (req, res, next) => {
    try {
        const messages = await User.messagesTo(req.params.username);
        return res.json({ messages });
    } catch (err) {
        return next(err);
    }
});


router.get('/:username/from', ensureCorrectUser, async (req, res, next) => {
    try {
        const messages = await User.messagesFrom(req.params.username);
        return res.json({ messages });
    } catch (err) {
        return next(err);
    }
});



module.exports = router;