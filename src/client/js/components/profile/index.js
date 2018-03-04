import Vue from 'vue';
import html from './index.pug';
import _ from 'lodash';
import {userLogin, getUser} from 'js/store';
import toastr from 'toastr';

$.fn.form.settings.rules.emptyOrMinLength = function(value, length) {
  return value === "" || value.length >= length;
};

const formValidateObj = {
    'new-sshkey': {
        identifier: 'new-sshkey',
        rules: [
            {
                type: 'emptyOrMinLength[100]',
                prompt: `SSH key too short`,
            },
        ],
    },
    'new-password': {
        identifier: 'new-password',
        rules: [
            {
                type: 'emptyOrMinLength[8]',
                prompt: `Password too short`,
            },
        ],
    },
    "confirm-password": {
        identifier: 'confirm-password',
        rules: [
            {
                type: 'match[new-password]',
                prompt: `New password didn't matched`,
            },
        ],
    },
    "current-password": {
        identifier: 'current-password',
        rules: [
            {
                type: 'empty',
                prompt: `Password can't be empty`,
            },
        ],
    },
};

const formGitValidateObj = {
};


export default Vue.extend({
    data() {
        return {
        };
    },
    template: html,
    methods: {
        init() {
            this.initComponents();
        },
        initComponents() {
            const me = this;

            const $form = $('#profile-form');
            $form.form({
                fields: formValidateObj,
                onSuccess(e, fields) {
                    e.preventDefault();
                    (async () => {
                        let res;
                        try {
                            res = await me.$http.post('/user/changePassword', fields);
                        } catch(err) {
                            if ('body' in err) toastr.error(err.body);
                            else toastr.error(err);
                        }
                        toastr.success(res.body);
                        const result = (await me.$http.get('/user/me')).data;
                        if (result.login) {
                            me.userLogin(result.user);
                        }
                        ['current', 'new', 'confirm'].forEach(x => {
                            $form.form('set value', `${x}-password`, '');
                        });
                    })();
                }
            });
        },
        clickLogin() {
            this.$loginModal.modal('show');
        },
    },
    ready() {
        this.init();
    },
    vuex: {
        getters: {
            user: getUser,
        },
    },
});
