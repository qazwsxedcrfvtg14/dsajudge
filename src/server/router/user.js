import express from 'express';
import {requireLogin} from '/utils';
import bcrypt from 'bcrypt';
import wrap from 'express-async-wrap';
import {promisify} from 'bluebird';
const router = express.Router();

router.get('/me', (req, res) => {
    if (req.user) {
        res.send({
            login: true,
            user: req.user,
        });
    } else {
        res.send({
            login: false,
        });
    }
});

router.post('/changePassword', requireLogin, wrap(async (req, res) => {

    const comp = await promisify(bcrypt.compareAsync)(req.body['current-password'], req.user.password);
    if (!comp)
        return res.status(403).send(`Old password is not correct`);
    const newPassword = req.body['new-password'];
    if(newPassword.length > 0){
        if (newPassword !== req.body['confirm-password']) 
            return res.status(400).send(`Two password are not equal.`);
        if (newPassword.length <= 8)
            return res.status(400).send(`New password too short`);
        if (newPassword.length > 30)
            return res.status(400).send(`New password too long`);
        try {
            const hash = await promisify(bcrypt.hash)(newPassword, 10);
            req.user.password = hash;
            await req.user.save();
        } catch(e) {
            return res.status(500).send(`Something bad happened... New password may not be saved.`);
        }
        res.send(`Password changed successfully.`);
    }
    const newSshKey = req.body['new-sshkey'];
    if(req.user.ssh_key!=newSshKey){
        req.user.ssh_key=newSshKey;
        await req.user.save();
        res.send(`SSH Key changed successfully.`);
    }
}));

export default router;
