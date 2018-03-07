import Vue from 'vue';
import html from './index.pug';
import './index.css';
import store, {getUser} from 'js/store';

export default Vue.extend({
    data() {
        return { 
            problems: [ ],
        };
    },
    store,
    vuex: {
        getters: {
            user: getUser,
        }
    },
    methods:{
        getQuota(res){
            if(!res)return 5;
            if(String(new Date(Date.now())).substr(0,15) != String(res.last_submission).substr(0,15)) return 5;
            return res.quota;
        },
        getProbId(prob) {
            return prob.problem_id; 
        },
        checkProbId(pid) {
            return { problem_id : id => id==pid }; 
        },
    },
    template: html,
    async ready() {
        this.problems = (await this.$http.get('/problem/')).data; 
    },
});
