import Vue from 'vue';
import template from './homework.pug';
import {errToast, okToast} from 'js/utils';
import toastr from 'toastr';
import sleep from 'sleep-promise';
import './homework.css';
import moment from 'moment';
import _ from 'lodash';


export default Vue.extend({
    template,
    data() {
        return { 
            id: 0,
            hw: null,
            probs: [],
            choosedID: null,
        };
    },
    ready() {
        this.id = this.$route.params.id;
        this.getHomework();
        this.getProblems();

    },
    methods: {
        async getHomework() {
            let result;
            try {
                result = (await this.$http.get(`/admin/homework/${this.id}`));
            } catch(e) {
                return errToast(e);
            }
            this.hw = result.data;
            if (this.hw.due) 
                this.hw.due = moment(this.hw.due).tz('Asia/Taipei').format('YYYY/MM/DD HH:mm:ss');
        },
        async getProblems() {
            let result;
            try {
                result = await this.$http.get(`/admin/problem/`, {params: {name: 1}});
            } catch(e) {
                return errToast(e);
            }
            this.probs = result.data;

            await sleep(500);
            $('#prob-select').dropdown();
        },
        addProblem() {
            if (_.isNull(this.choosedID)) return;
            this.hw.problems.push({
                problem: this.choosedID,
                weight: 1.0,
            });
        },
        removeProblem(idx) {
            this.hw.problems.splice(idx, 1);
        },
        async sendUpdate() {
            let result;
            try {
                result = await this.$http.put(`/admin/homework/${this.id}`, this.hw);
            } catch (e) {
                console.log(e);
                return errToast(e);
            }
            okToast(result);
            await this.getHomework();
        },
        async addNewGroup() {
            this.problem.testdata.groups.push({
                count: 0,
                points: 0,
                tests: [],
            });
            await sleep(500);
            $('.ui.inverted.dropdown')
                .dropdown()
            ;
        },
    },
    computed: {
        probMap() {
            return _.fromPairs(this.probs.map(x => [x._id, x.name]));
        }
    }
});
