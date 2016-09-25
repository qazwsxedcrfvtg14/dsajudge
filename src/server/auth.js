import express from 'express';
import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';


passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
}, (email, password, done) => {
    if (email == 'haha' && password == 'hehe') {
        done(null, {email: 'haha'});
    }
    done(null, {a: 123});
}));

passport.serializeUser(function(user,done){
    done(null,user);
});

passport.deserializeUser(function(user,done){
    done(null,user);
});

export default (app) => {
    app.use(passport.initialize());
    app.use(passport.session());
    app.post('/login', (a, b, c) => { console.log(a); c(); }, passport.authenticate('local'),
    (a, b) => { console.log(a.user); b.send({user: a.user}); } );
};
