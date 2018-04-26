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
        getQuota(res,prob){
            if(!res&&!prob)return null;
            if(!res)return prob.quota;
            if(String(new Date(Date.now())).substr(0,15) != String(new Date(res.last_submission)).substr(0,15)) return prob.quota;
            return prob.quota-res.quota;
        },
        getProbId(prob) {
            return prob.problem_id; 
        },
        checkProbId(pid) {
            return { problem_id : id => id==pid }; 
        },
        async updateData(){
            clearTimeout(this.timer);
            try{
                this.problems = (await this.$http.get('/problem/')).data; 
                const result = (await this.$http.get('/user/me')).data;
                if (result.login) {
                    this.userLogin(result.user);
                }
            }catch(e){}
            if(!_.isNil(this.timer))
                this.timer = setTimeout(this.updateData, 2000);
        },
    },
    template: html,
    beforeDestroy(){
        clearTimeout(this.timer);
        this.timer=null;
    },
    ready() {
        this.timer = setTimeout(this.updateData, 0);
    },
});
