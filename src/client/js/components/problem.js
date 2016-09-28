import Vue from 'vue';
import html from './problem.pug';
import marked from 'marked';
import sleep from 'sleep-promise';

const renderer = new marked.Renderer();
renderer.heading = (text, level) => {
    const escaped = text.toLowerCase().replace(/[^\w]+/g, '-');
    return `<div></div><h${level} class="ui dividing header">${text}</h${level}>`;
};

export default Vue.extend({
    data() {
        return { 
            problem: null,
        };
    },
    template: html,
    ready() {
        (async () => {
            this.problem = (await this.$http.get(`/problem/${this.$route.params.id}`)).data; 
            await sleep(500);
            MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
        })();
    },
    filters: {
        marked(x) {
            return marked(x, {renderer});
        },
    }
});
