import Vue from 'vue';
import html from './index.pug';
import marked from 'js/marked_mutated';
import sleep from 'sleep-promise';
import probUtils from 'js/mixins/probUtils';
import './index.css';
import store, {getUser} from 'js/store';

const renderer = new marked.Renderer();
renderer.heading = (text, level) => {
  const escaped = text.toLowerCase().replace(/[^\w]+/g, '-');
  return `<div></div><h${level} class="ui inverted dividing header">${text}</h${level}>`;
};

export default Vue.extend({
  mixins: [probUtils],
  data () {
    return {
      problem: null
    };
  },
  template: html,
  ready () {
    this.timer = setTimeout(this.updateData, 0);
  },
  beforeDestroy () {
    clearTimeout(this.timer);
    this.timer = null;
  },
  methods: {
    async updateData () {
      clearTimeout(this.timer);
      try {
        const data = (await this.$http.get(`/problem/${this.$route.params.id}`)).data;
        if (JSON.stringify(data) !== JSON.stringify(this.problem)) {
          this.problem = data;
          Vue.nextTick(() => {
            MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
            this.drawBar();
          });
        }
      } catch (e) {}
      if (!_.isNil(this.timer)) { this.timer = setTimeout(this.updateData, 2000); }
    },
    drawBar () {
      if (!this.problem) return;
      const wrapper = $('#testgroup-bar');
      wrapper.empty();
      const colors = ['red', 'orange', 'yellow', 'olive', 'green', 'teal', 'blue', 'violet', 'purple', 'pink'];
      let count = Math.floor(Math.random() * colors.length);
      const totp = this.problem.testdata.points;
      const percent = [];
      const title = [];
      for (let [i, g] of this.problem.testdata.groups.entries()) {
        const div = $('<div>');
        div.addClass(colors[count]);
        div.addClass('bar');
        count = (count + Math.floor(Math.random() * (colors.length - 1) + 1)) % colors.length;
        const progress = $('<div>');
        progress.addClass('progress');
        title.push(`#${i} (${g.points})`);
        div.append(progress);
        wrapper.append(div);
        percent.push(100 * g.points / totp);
      }

      wrapper.progress({
        showActivity: false,
        text: {
          percent: '{bar}',
          bars: title
        },
        percent: percent
      });
    }
  },
  filters: {
    marked (x) {
      return marked(x, {renderer});
    }
  },
  store,
  vuex: {
    getters: {
      user: getUser
    }
  }
});
