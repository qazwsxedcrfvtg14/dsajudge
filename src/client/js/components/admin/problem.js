import Vue from 'vue';
import template from './problem.pug';
import {errToast, okToast} from 'js/utils';
import toastr from 'toastr';
import sleep from 'sleep-promise';
import './problem.css';
import marked from 'js/marked_mutated';
import * as monaco from 'monaco-editor';

const renderer = new marked.Renderer();
renderer.heading = (text, level) => {
    const escaped = text.toLowerCase().replace(/[^\w]+/g, '-');
    return `<div></div><h${level} class="ui dividing header">${text}</h${level}>`;
};

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
        },
        marked(x) {
            return marked(x, {renderer});
        },
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
            const this_ = this;
            Vue.nextTick( () => {
                const editor = monaco.editor.create(document.getElementById('editor'), {
                    value: this_.problem.desc, language: 'markdown'
                });
                editor.onDidChangeModelContent(function (e) {
                    this_.problem.desc = editor.getValue();
                });
                $('.ui.dropdown')
                    .dropdown()
                ;
                $('#problem-statement-tab .item')
                    .tab()
                ;
            } );
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
        async updateOnly() {
            let result;
            try {
                result = await this.$http.post(`/admin/problem/${this.id}/updateTests`);
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
        },
        async rejudgeProblem(ev) {
            let result;
            try {
                result = await this.$http.post(`/admin/problem/${this.id}/rejudge`);
            } catch (e) {
                console.log(e);
                return errToast(e);
            }
            okToast(result);
            await this.getProblem();
        },
        async addNewGroup() {
            this.problem.testdata.groups.push({
                count: 0,
                points: 0,
                tests: [],
            });
            Vue.nextTick(() => {
                $('.ui.dropdown')
                    .dropdown()
                ;
            });
        },
        deleteGroup(idx) {
            this.problem.testdata.groups.splice(idx, 1);
        }
    },
    watch: {
        'problem.desc': function() {
            clearTimeout(this.timeout);
            this.timeout = setTimeout(()=>{
                Vue.nextTick(() => {
                    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
                })}
            ,3000);
        },
    },
    computed: {
        totalTestsCount() {
            let cnt = 0;
            for (let grp of this.problem.testdata.groups) cnt += grp.tests.length;
            return cnt;
        },
        totalPoints() {
            let pts = 0;
            for (let grp of this.problem.testdata.groups) pts += grp.points;
            return pts;
        },
    }
});
