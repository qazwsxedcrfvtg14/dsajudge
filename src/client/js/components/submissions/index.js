import Vue from 'vue';
import html from './index.pug';

export default Vue.extend({
    data() {
        return { 
            submissions: [],
        };
    },
    template: html,
    ready() {
        this.getSubmissions();
    },
    methods: {
        async getSubmissions() {
            let result;
            try {
                result = await this.$http.get('/submission/all');
            } catch(e) {
                console.log(e);
            }
            this.submissions = result.data;
        }
    },
    filters: {
        getResult(sub) {
            if (sub.status != 'finished') {
                return sub.status;
            }
            return sub.results.result;
        },
        getPoints(sub) {
            if (sub.status != 'finished') return '-';
            return sub.results.points;
        }
    },
});

