import '/css/style.css';
import './haha.js';
import $ from 'jquery';
window.$ = window.jQuery = $;

import Vue from 'vue';
import App from './components/problems.js';

new Vue({
    el: 'body',
    data: {
        user: null,
    },
    components: {
        app: App,
    }
});
