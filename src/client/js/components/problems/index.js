import Vue from 'vue';
import html from './index.pug';
import './index.css';
import store, {getUser} from 'src/js/store';

export default Vue.extend({
    data() {
        return { 
            problems: [ ],
        };
    },
    store,
    vuex: {
        getters: {
            user: getUser,
        }
    },
    template: html,
    async ready() {
        this.problems = (await this.$http.get('/problem/')).data; 
    },
});
