import '/css/style.css';
import 'babel-polyfill';

import Vue from 'vue';
import App from './components/problems.js';
import VueResource from 'vue-resource';
Vue.use(VueResource);

window.vue = Vue;

new Vue({
    el: 'body',
    data: {
        user: null,
    },
    components: {
        app: App,
    },
    methods: {
        clickLogin() {
            this.$loginModal.modal('show');
        }
    },
    created() {
        (async () => {
            const result = (await this.$http.get('/me')).data;
            console.log(result);
            if (result.login) {
                this.user = result.user;
            }
        })();

        const me = this;
        this.$loginModal = $('#login-modal');
        this.$loginForm = $('#login-form');

        console.log(window.$, this.$loginModal);

        this.$loginModal.modal('setting', {
            onApprove() {
                const result = me.$loginForm.form('validate form');
                if (!result) return false;

                const json = {};
                ['email', 'password'].forEach( (x) => {
                    json[x] = me.$loginForm.form('get value', x);
                } );


                (async () => {
                    let res;
                    try {
                        res = await me.$http.post('/login', json);
                        me.$loginModal.modal('hide');
                    } catch (err) {
                        console.log(err);
                    }
                })();

                return false;
            },
        });  
        this.$loginForm.form({
            fields: {
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
            },
        });
    },
});
