import Vue from 'vue';
import html from './index.pug';
import _ from 'lodash';
import './index.css';
import store, {userLogin, userLogout, getUser} from '/store';

const formValidateObj = {
    email: {
        identifier: 'email',
        rules: [
            {
                type: 'regExp',
                value: /\w+@\w+/,
                prompt: `Not a valid email`,
            },
        ],
    },
    password: {
        identifier: 'password',
        rules: [
            {
                type: 'empty',
                prompt: `Password can't be empty`,
            },
        ],
    },
};


export default Vue.extend({
    data() {
        return {
            //user: null,
            isAdmin: false,
        };
    },
    template: html,
    methods: {
        init() {
            this.$loginModal = $('#login-modal');
            this.$loginForm = $('#login-form');

            (async () => {
                await Promise.all([this.getUser(), this.initComponents()]);
            })();
        },
        async initComponents() {
            const me = this;

            this.$loginModal.modal('setting', {
                onApprove() {
                    me.$loginForm.form('validate form');
                    return false;
                },
            });  

            this.$loginForm.form({
                fields: formValidateObj,
                async onSuccess(e, fields) {
                    let res;
                    try {
                        res = await me.$http.post('/login', fields);
                        me.$loginModal.modal('hide');
                        await me.getUser();
                    } catch (err) {
                        if ('status' in err && err.status == 401) {
                            me.$loginForm.form('add errors', ['Username or Password incorrect']);
                        }
                    }
                }
            });
        },
        clickLogin() {
            this.$loginModal.modal('show');
        },
        async clickLogout() {
            this.userLogout();
            this.$route.router.go('/');
            this.$http.post('/logout');
        },
        async getUser() {
            const result = (await this.$http.get('/user/me')).data;
            if (result.login) {
                this.userLogin(result.user);
                this.isAdmin = _.includes(this.user.roles, 'admin');
            }
        }
    },
    ready() {
        this.init();
    },
    store,
    vuex: {
        actions: {
            userLogin,
            userLogout,
        },
        getters: {
            user: getUser,
        }
    },
});
