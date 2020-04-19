import Vue from 'vue';
import html from './index.pug';
import './index.css';
import sleep from 'sleep-promise';
import probUtils from 'js/mixins/probUtils';
import * as monaco from 'monaco-editor';

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
      id2: null,
      submission: null,
      submission2: null,
      showResult: false,
      showResult2: false
    };
  },
  template: html,
  ready () {
    this.id = this.$route.params.id;
    this.id2 = this.$route.params.id2;
    this.fetch();
    this.fetchSrc();
  },
  methods: {
    async fetch () {
      await this.getSubmission();

      while (this.submission.status === 'pending' || this.submission.status === 'judging' ||
                this.submission2.status === 'pending' || this.submission2.status === 'judging') {
        await sleep(2000);
        await this.getSubmission();
      }
    },
    async fetchSrc () {
      let result;
      let result2;
      try {
        result = await this.$http.get(`/submission/sourceCode/${this.id}`);
      } catch (e) {
        console.log(e);
      }
      try {
        result2 = await this.$http.get(`/submission/sourceCode/${this.id2}`);
      } catch (e) {
        console.log(e);
      }
      if (this.originalModel) {
        this.originalModel.setValue(result.data);
      } else {
        this.originalModel = monaco.editor.createModel(result.data, 'cpp');
      }
      if (this.modifiedModel) {
        this.modifiedModel.setValue(result2.data);
      } else {
        this.modifiedModel = monaco.editor.createModel(result2.data, 'cpp');
      }
      if (!this.diffEditor) {
        this.diffEditor = monaco.editor.createDiffEditor(document.getElementById('editor'), {
          automaticLayout: true,
          theme: 'vs-dark'
        });
        this.diffEditor.setModel({
          original: this.originalModel,
          modified: this.modifiedModel
        });
      }
    },
    async getSubmission () {
      let _result;
      let _result2;
      try {
        _result = await this.$http.get(`/submission/${this.id}`);
        _result2 = await this.$http.get(`/submission/${this.id2}`);
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
          }
        });
      }
      this.submission = data;
      this.showResult = (this.submission &&
                this.submission.status !== 'pending' &&
                this.submission.result !== 'CE');

      const data2 = _result2.data;
      if (data2._result) {
        const transform = x => {
          if (!x.result) {
            x.result = 'Judging';
            x.points = x.runtime = '?';
          } else {
            x.result = this.probUtils.toHumanString(x.result);
            x.runtime = this.probUtils.toDisplayTime(x.runtime);
          }
        };
        data2._result.subresults.forEach(x => {
          transform(x);
          if (x.subresults) {
            x.subresults.forEach(y => transform(y));
          }
        });
      }
      this.submission2 = data2;
      this.showResult2 = (this.submission2 &&
                this.submission2.status !== 'pending' &&
                this.submission2.result !== 'CE');
    },
    async queryChanged () {
      await this.getSubmission();
      while (this.submission.status === 'pending' || this.submission.status === 'judging' ||
                this.submission2.status === 'pending' || this.submission2.status === 'judging') {
        await sleep(2000);
        await this.getSubmission();
      }
    }
  },
  watch: {
    'id': function () {
      this.fetch();
      this.fetchSrc();
    },
    'id2': function () {
      this.fetch();
      this.fetchSrc();
    }
  },
  route: {
    data () {
      this.id = this.$route.params.id;
      this.id2 = this.$route.params.id2;
    }
  }
});
