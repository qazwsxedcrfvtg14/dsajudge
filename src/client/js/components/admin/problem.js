import Vue from 'vue';
import template from './problem.pug';
import {errToast, okToast} from '/utils';
import toastr from 'toastr';

export default Vue.extend({
    template,
    data() {
        return { 
            id: 0,
            problem: null,
        };
    },
    ready() {
        this.id = this.$route.params.id;
        this.getProblem();
        $(this.$el).find('.ui.checkbox').checkbox();
    },
    filters: {
        getPath(x) {
            if (!x) return 'No file selected.';
            return x.split('\\').pop();
        }
    },
    methods: {
        async getProblem() {
            let result;
            try {
                result = await this.$http.get(`/admin/problem/${this.id}`);
            } catch(e) {
                return errToast(e);
            }
            this.problem = result.data;
        },
        async updateProblem(ev) {
            const formData = new FormData(ev.target);
            let result;
            try {
                result = await this.$http.put(`/admin/problem/${this.id}`, formData);
            } catch (e) {
                return errToast(e);
            }
            okToast(result);
        },
        async updateProblemSettings(ev) {
            let result;
            try {
                result = await this.$http.put(`/admin/problem/${this.id}/settings`, this.problem);
            } catch (e) {
                console.log(e);
                return errToast(e);
            }
            okToast(result);
            await this.getProblem();
        }
    }
});
