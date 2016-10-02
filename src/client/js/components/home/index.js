import Vue from 'vue';
import html from './index.pug';
import store, {getUser} from '/store';

export default Vue.extend({
    data() {
        return { 
            homeworks: [ ],
        };
    },
    template: html,
    ready() {
        (async () => {
            this.homeworks = (await this.$http.get('/homework/all')).data; 
            console.log(JSON.stringify(this.homeworks, null, 4));
        })();
    },
    store,
    vuex: {
        getters: {
            user: getUser,
        }
    },
});
