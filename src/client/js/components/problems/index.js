import Vue from 'vue';
import html from './index.pug';
import './index.css';
import sleep from 'sleep-promise';
import store, {userLogin, getUser} from 'js/store';

export default Vue.extend({
    data() {
        return { 
            problems: [ ],
        };
    },
    store,
    vuex: {
        actions: {
            userLogin,
        },
        getters: {
            user: getUser,
        }
    },
    methods:{
        getQuota(res){
            if(!res)return 5;
            if(String(new Date(Date.now())).substr(0,15) != String(new Date(res.last_submission)).substr(0,15)) return 5;
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
        (async () => {
            while (true) {
                if(_.isNil(document.getElementById("problems-page-checker")))
                    break;
                this.problems = (await this.$http.get('/problem/')).data; 
                const result = (await this.$http.get('/user/me')).data;
                if (result.login) {
                    this.userLogin(result.user);
                }
                await sleep(3000);
            }
        })();
    },
});
