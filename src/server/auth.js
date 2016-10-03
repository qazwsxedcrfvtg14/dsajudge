import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import {promisifyAll} from 'bluebird';
import bcrypt from 'bcrypt';
import User from '/model/user';

promisifyAll(bcrypt);

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
}, async (email, password, done) => {
    let user;
    try {
        user = await User.findOne({email});
    } catch(err) {
        done(err);
    }
    if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
    }

    let res = await bcrypt.compareAsync(password, user.password);
    if (res) {
        done(null, {email: user.email, _id: user._id, roles: user.roles});
    } else {
        done(null, false, { message: 'Incorrect password.' });
    }
}));

passport.serializeUser( (user,done) => {
    done(null, user._id);
});

passport.deserializeUser( (user, done) => {
    (async () => {
        let u;
        try {
            u = await User.findOne({_id: user});
        } catch(e) {
            done(e, null);
            return;
        }
        done(null, u);
    })();
});

export default (app) => {
    app.use(passport.initialize());
    app.use(passport.session());

    app.post('/login',
        passport.authenticate('local'),
        (req, res) => {
            res.send({
                result: "ok",
            }); 
        } 
    );

    app.post('/logout',
        (req, res) => {
            req.session.destroy();
            req.logout();
            res.sendStatus(203);
        } 
    );
};
