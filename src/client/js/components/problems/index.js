import Vue from 'vue';
import html from './index.pug';
import './index.css';

export default Vue.extend({
    data() {
        return { 
            problems: [ ],
        };
    },
    template: html,
    ready() {
        (async () => {
            this.problems = (await this.$http.get('/problem/')).data; 
            console.log(this.problems);
        })();
    },
});
