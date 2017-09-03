import _ from 'lodash';
import Vue from 'vue';
import VueResource from 'vue-resource';
import VueRouter from 'vue-router';
import Vuex from 'vuex';
Vue.use({
    install(Vue, option) {
        Vue.prototype._ = _;
    }
});

Vue.use(VueResource);

import filters from './filters';
import router from './router';

import App from './components/root';
router.start(App, '#App');
