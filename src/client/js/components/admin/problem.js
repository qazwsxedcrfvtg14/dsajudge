import Vue from 'vue';
import template from './problems.pug';

export default Vue.extend({
    template,
    data() {
        return { 
            problems: [],
        };
    },
    ready() {
        (async () => {
            this.problems = (await this.$http.get(`/admin/problems`)).data; 
        })();
    },
});
