/** routes for messages */

const express = require("express");
const ExpressError = require("../expressError");

const User = require("../models/user");
const Message = require("../models/message");

const router = new express.Router();

const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");


router.get('/:id', ensureLoggedIn, async (req, res, next) => {
    try {
        const message = await Message.get(req.params.id);

        if (message.from_user.username === req.user.username ||
            message.to_user.username === req.user.username) {
            return res.json({ message });
        }
        throw new ExpressError("Unauthorized", 401);
    } catch (err) {
        return next(err);
    }
});



router.post('/', ensureLoggedIn, async (req, res, next) => {
    try {
        const { to_username, body } = req.body;


        const message = await Message.create({ from_username: req.user.username, to_username, body });

        return res.status(201).json({ message });
    } catch (err) {
        return next(err);
    }
});


router.post('/:id/read', ensureLoggedIn, async (req, res, next) => {
    try {
        const message = await Message.get(req.params.id);

        if (message.to_user.username === req.user.username) {
            const message = await Message.markRead(req.params.id);

            return res.json({ message });
        }
        throw new ExpressError("Unauthorized", 401);
    } catch (err) {
        return next(err);
    }
});



module.exports = router;