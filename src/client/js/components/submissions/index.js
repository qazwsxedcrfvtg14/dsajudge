import Vue from 'vue';
import html from './index.pug';
import probMixin from 'js/mixins/probUtils';
import {ResultString} from 'js/block/result';
import sleep from 'sleep-promise';

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
    async ready() {
        this.timer = setInterval(this.updateData, 2000);
    },
    beforeDestroy(){
        clearInterval(this.timer);
        this.timer=null;
    },
    methods: {
        async updateData(){
            clearInterval(this.timer);
            await this.getSubmissions();
            if(!_.isNil(this.timer))
                this.timer = setInterval(this.updateData, 2000);
        },
        async getSubmissions() {
            let result;
            try {
                result = await this.$http.get('/submission/', {params: {start: this.curTabId}});
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
    components: {
        'result-string': ResultString,
    },
    route: {
        data() {
            this.curTabId = parseInt(this.$route.query.s || '0');
            this.getSubmissions();
        }
    }
});

