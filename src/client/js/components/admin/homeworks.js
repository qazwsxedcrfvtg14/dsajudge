import Vue from 'vue';
import template from '../home/index.pug';

export default Vue.extend({
    data() {
        return { 
            homeworks: [ ],
        };
    },
    template: html,
    ready() {
        this.fetchHomeworks();
    },
    store,
    vuex: {
        getters: {
            user: getUser,
        }
    },
    filters: {
        marked(x) {
            return marked(x);
        },
    },
    methods: {
        async fetchHomeworks() {
            if (!this.user) {
                this.homeworks = [];
                return;
            }
            this.homeworks = (await this.$http.get('/homework/')).data; 
        },
        async newHomework() {
            let id;
            try {
                id = (await this.$http.put('/admin/homework/')).data.id;
            } catch(e) {
                if (e.body) toastr.error(e.body);
                else toastr.error(e);
            }
            this.$route.router.go({
                name: 'admin.homework',
                params: {
                    id,
                }
            });
        },
        getRankStr(hw) {
            const {rank} = hw;
            if (!rank) return '50%';
            return `${rank}`;
        },
        getRankClass(hw) {
            const {rank, totUsers} = hw;
            if (!rank) return 'rank-under-50';
            const pr = (rank-1) / totUsers;
            if (pr < 1.0 / 24) return 'rank-gold';
            if (pr < 1.0 / 8) return 'rank-silver';
            if (pr < 1.0 / 4) return 'rank-bronze';
        },
        getRankImage(hw) {
            const {rank, totUsers} = hw;
            if (!rank) return '';
            const pr = (rank-1) / totUsers;
            let s;
            if (pr < 1.0 / 24) s = 'gold';
            else if (pr < 1.0 / 8) s = 'silver';
            else if (pr < 1.0 / 4) s = 'bronze';
            return s ? `static/images/medal_${s}.jpg` : null; 
        },
    },
    watch: {
        user() {
            this.fetchHomeworks();
        }
    },
});
