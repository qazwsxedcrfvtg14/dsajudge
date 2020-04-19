import Vue from 'vue';
import html from './index.pug';
import './index.css';
import sleep from 'sleep-promise';
import probUtils from 'js/mixins/probUtils';
import * as monaco from 'monaco-editor';
import store, { getUser } from 'js/store';

self.MonacoEnvironment = {
  getWorkerUrl: function (moduleId, label) {
    if (label === 'json') {
      return './json.worker.js';
    }
    if (label === 'css') {
      return './css.worker.js';
    }
    if (label === 'html') {
      return './html.worker.js';
    }
    if (label === 'typescript' || label === 'javascript') {
      return './ts.worker.js';
    }
    return './editor.worker.js';
  }
};

export default Vue.extend({
  mixins: [probUtils],
  data () {
    return {
      id: null,
      submission: null,
      showResult: false,
      sourceCode: null
    };
  },
  template: html,
  ready () {
    this.id = this.$route.params.id;
    this.fetch();
    this.fetchSrc();
  },
  methods: {
    async fetch () {
      await this.getSubmission();

      while (this.submission.status === 'pending' || this.submission.status === 'judging') {
        await sleep(2000);
        await this.getSubmission();
      }
    },
    async fetchSrc () {
      let result;
      try {
        result = await this.$http.get(`/submission/sourceCode/${this.id}`);
      } catch (e) {
        console.log(e);
      }
      if (this.editor) {
        this.editor.setValue(result.data);
      } else {
        this.editor = monaco.editor.create(document.getElementById('editor'), {
          value: result.data,
          language: 'cpp',
          theme: 'vs-dark',
          readOnly: true
        });
      }
    },
    async getSubmission () {
      let _result;
      try {
        _result = await this.$http.get(`/submission/${this.id}`);
      } catch (e) {
        console.log(e);
      }
      const data = _result.data;
      if (data._result) {
        const transform = x => {
          if (!x.result) {
            x.result = 'Judging';
            x.points = x.runtime = '?';
          } else {
            x.result = this.probUtils.toHumanString(x.result);
            x.runtime = this.probUtils.toDisplayTime(x.runtime);
          }
        };
        data._result.subresults.forEach(x => {
          transform(x);
          if (x.subresults) {
            x.subresults.forEach(y => transform(y));
          }else {
            x.subresults = [];
          }
        });
      }
      this.submission = data;
      this.showResult = (this.submission &&
                this.submission.status !== 'pending' &&
                this.submission.result !== 'CE');
    }
  },
  watch: {
    id: function () {
      this.fetch();
      this.fetchSrc();
    }
  },
  store,
  vuex: {
    getters: {
      user: getUser
    }
  },
  route: {
    data () {
      this.id = this.$route.params.id;
    }
  }
});
