import _ from 'lodash';
import Vue from 'vue';
import VueResource from 'vue-resource';
import VueRouter from 'vue-router';
import Vuex from 'vuex';
import moment from 'moment-timezone';
Vue.use(VueResource);
Vue.use(VueRouter);

import router from './router';

import App from './components/root';
router.start(App, '#App');
