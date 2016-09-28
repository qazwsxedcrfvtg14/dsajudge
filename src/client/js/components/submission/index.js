import Vue from 'vue';
import html from './index.pug';
import sleep from 'sleep-promise';

export default Vue.extend({
    data() {
        return { 
            id: null,
            submission: null,
        };
    },
    template: html,
    ready() {
        this.id = this.$route.params.id;
        this.fetch();
    },
    methods: {
        async fetch() {
            await this.getSubmission();
            while (this.submission.result === 'pending' || this.submission.result === 'judging') {
                await sleep(1000);
                await this.getSubmission();
                console.log('tick');
            }
            
        },
        async getSubmission() {
            let result;
            try {
                result = await this.$http.get(`/submission/${this.id}`);
            } catch(e) {
                console.log(e);
            }
            console.log(JSON.stringify(result.data, null, 2));
            this.submission = result.data;
        }
    },
    filters: {
        getResult(sub) {
            if (sub.status !== 'finished') {
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

