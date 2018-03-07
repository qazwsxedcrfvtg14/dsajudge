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
        getQuota(val){
            return val?val:5;
        },
        getProbId(prob) {
            return prob.problem_id; 
        },
        checkProbId(probId) {
            return id=>probId==id; 
        },
    },
    template: html,
    async ready() {
        this.problems = (await this.$http.get('/problem/')).data; 
    },
});
