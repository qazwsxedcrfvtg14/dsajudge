import Vue from 'vue';
import template from './newProblem.pug';
import toastr from 'toastr';

export default Vue.extend({
    template,
    data() {
        return { 
            problems: [],
        };
    },
    ready() {
        this.$http.post('/admin/newProblem');
    },
    filters: {
        getPath(x) {
            if (!x) return 'No file selected.';
            return x.split('\\').pop();
        }
    },
    methods: {
        async postNewProblem(ev) {
            console.log(ev);
            const formData = new FormData(ev.target);
            let result;
            try {
                result = await this.$http.post('/admin/newProblem', formData);
            } catch (e) {
                if ('body' in e)
                    toastr.error(e.body);
                else console.log(e);
                return;
            }
            console.log(result.body.id);
        }
    }
});
