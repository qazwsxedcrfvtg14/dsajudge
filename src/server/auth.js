import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
}, (email, password, done) => {
    if (email == 'haha' && password == 'hehe') {
        done(null, {email: 'haha'});
    }
    done(null, false);
}));

