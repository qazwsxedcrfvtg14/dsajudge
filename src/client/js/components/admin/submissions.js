import Vue from 'vue';
import html from './submissions.pug';
import probUtils from 'js/mixins/probUtils';
import toastr from 'toastr';
import sleep from 'sleep-promise';
import _ from 'lodash';
import queryString from 'query-string';

export default Vue.extend({
    mixins: [probUtils],
    data() {
        return { 
            submissions: [],
            curTabId: 0,
            tabRange: [0, 1, 2, 3, 4],
            filter: {
                result: 'ALL',
                probID: '',
                user: '',
            },
        };
    },
    template: html,
    ready() {
        //this.getSubmissions();
        $('#status-select').dropdown();
        this.timer = setTimeout(this.updateData, 0);
    },
    beforeDestroy(){
        clearTimeout(this.timer);
        this.timer=null;
    },
    methods: {
        async updateData(){
            clearTimeout(this.timer);
            try{
                await this.getSubmissions();
            }catch(e){}
            if(!_.isNil(this.timer))
                this.timer = setTimeout(this.updateData, 2000);
        },
        async getSubmissions() {
            let result;
            const params = { skipPage: this.curTabId };
            const filter = this.filter;
            if (filter.result != 'ALL') params.result = filter.result;
            if (filter.probID) params.probID = filter.probID;
            if (filter.user) params.user = filter.user;
            try {
                result = await this.$http.get('/admin/submission/', { params });
            } catch(e) {
                console.log(e);
            }
            this.submissions = result.data;
        },
        async changeTab(idx) {
            this.curTabId = idx;
            await this.queryChanged();
        },
        async changeUserId(user) {
            this.curTabId = 0;
            this.filter.user = user.meta.id;
            await this.queryChanged();
        },
        async rejudge(id) {
            let result;
            try {
                result = await this.$http.get(`/admin/submission/${id}/rejudge`);
            } catch(e) {
                if (e.body) toastr.error(e.body);
                else console.log(e);
                return;
            }
            toastr.success(result.body);
            this.getSubmissions();
        },
        async queryChanged() {
            const query = {};
            _.assignIn(query, this.filter);
            query.s = this.curTabId;
            this.$route.router.go({
                name: 'admin.submissions',
                query,
            });
        },
        displayName(user) {
            if (_.isNil(user)) return 'null';
            const name = _.get(user, 'meta.name'), id = _.get(user, 'meta.id');
            if (!_.isNil(name)) {
                if (!_.isNil(id)) return `${name} (${id})`;
                return `${name}`;
            }
            if (!_.isNil(id)) return `(${id})`;
            return `[${user.email}]`;
        },
    },
    watch: {
        'filter.result': function() {
            this.queryChanged();
        }
    },
    route: {
        data() {
            const {query} = this.$route;
            _.assignIn(this.filter, query);
            this.changeTab(query.s || 0);
            const tabStart = Math.max(0, this.curTabId - 2);
            this.tabRange = [];
            for (let i = 0; i < 5; i++) this.tabRange.push(tabStart + i);
            this.getSubmissions();
        }
    },
});

