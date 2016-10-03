import Vue from 'vue';
import html from './index.pug';
import probMixin from '/mixins/probUtils';

export default Vue.extend({
    mixins: [probMixin],
    data() {
        return { 
            submissions: [],
            curTabId: 0,
            tabRange: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        };
    },
    template: html,
    ready() {
        console.log(this);
        this.getSubmissions();
    },
    methods: {
        async getSubmissions() {
            let result;
            try {
                result = await this.$http.get('/submission/all', {params: {start: this.curTabId}});
            } catch(e) {
                console.log(e);
            }
            this.submissions = result.data;
        },
        async changeTab(idx) {
            this.curTabId = idx;
            const tabStart = Math.max(0, idx - 4);
            this.tabRange = [];
            for (let i = 0; i < 10; i++) this.tabRange.push(tabStart + i);
            await this.getSubmissions();
        },
    },
});

