import Vue from 'vue';
import html from './index.pug';

export default Vue.extend({
    data() {
        return { 
            problems: [ ],
        };
    },
    template: html,
    ready() {
        (async () => {
            this.problems = (await this.$http.get('/problem/all')).data; 
            //console.log(this.problems.body);
        })();
    },
});
