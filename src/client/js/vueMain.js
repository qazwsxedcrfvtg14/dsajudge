import _ from 'lodash';
import Vue from 'vue';
import VueResource from 'vue-resource';
import VueRouter from 'vue-router';
Vue.use(VueResource);
Vue.use(VueRouter);

import router from './router';

console.log(router);

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


const App = Vue.extend({
    router,
    data() {
        return {
            user: null,
            isAdmin: false,
        };
    },
    //components: {
        //app: App,
    //},
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
            this.user = null;
            this.$http.post('/logout');
        },
        async getUser() {
            const result = (await this.$http.get('/me')).data;
            if (result.login) {
                this.user = result.user;
                this.isAdmin = _.includes(this.user.roles, 'admin');
            }
        }
    },
    ready() {
        this.init();
    },
});

router.start(App, 'body');
