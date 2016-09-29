import express from 'express';
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

export default router;
