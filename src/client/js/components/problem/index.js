import Vue from 'vue';
import html from './index.pug';
import marked from 'marked';
import sleep from 'sleep-promise';
import probUtils from '/mixins/probUtils';
import './index.css';
import randomColor from 'randomcolor';
import store, {getUser} from '/store';

const renderer = new marked.Renderer();
renderer.heading = (text, level) => {
    const escaped = text.toLowerCase().replace(/[^\w]+/g, '-');
    return `<div></div><h${level} class="ui dividing header">${text}</h${level}>`;
};

export default Vue.extend({
    mixins: [probUtils],
    data() {
        return { 
            problem: null,
        };
    },
    template: html,
    async ready() {
        this.problem = (await this.$http.get(`/problem/${this.$route.params.id}`)).data; 
        Vue.nextTick( () => {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
            this.drawBar();
        } );
    },
    methods: {
        drawBar() {
            if (!this.problem) return;
            const wrapper = $('#testgroup-bar-wrapper');
            const tc = this.problem.testdata.groups.length;
            const totp = this.problem.testdata.points;
            const totl = wrapper.width();
            const rc = randomColor({ count: tc, format: 'rgb', luminosity: 'bright', });
            for (let [i, g] of this.problem.testdata.groups.entries()) {
                const div = $('<div>');
                div.text(`#${i} (${g.points})`);
                div.addClass('testgroup-bar');
                div.width(g.points / totp * totl);
                div.css('background-color', 'rgba' + rc[i].substring(3, rc[i].length-1) + ', 0.5)');
                wrapper.append(div);
            }
        },
    },
    filters: {
        marked(x) {
            return marked(x, {renderer});
        },
    },
    store,
    vuex: {
        getters: {
            user: getUser,
        },
    }
});
