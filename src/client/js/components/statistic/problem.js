import Vue from 'vue';
import html from './problem.pug';
import toastr from 'toastr';
import _ from 'lodash';

export default Vue.extend({
    data() {
        return { 
            id: null,
            homeworks: [ ],
            problem: null,
            stats: null,
        };
    },
    template: html,
    ready() {
        this.id = this.$route.params.id;
        this.fetchStatistic();
        this.canvas = document.getElementById('result-chart');


    },
    methods: {
        async fetchStatistic() {
            let result;
            try {
                result = (await this.$http.get(`/statistic/problem/${this.id}`)).data;
            } catch(e) {
                console.log(e);
            }
            _.assignIn(this, result);
            this.drawResultPieChart();
            console.log(this);
        },
        drawResultPieChart() {
            const labels = {
                AC: [0, 255, 0],
                WA: [255, 0, 0],
                TLE: [200, 0, 150],
                CE: [0, 0, 255],
                RE: [220, 100, 0],
                JE: [0, 0, 0],
            };
            const [labelNames, color] = _.zip(..._.toPairs(labels));
            const backgroundColor = _.map(color, x => `rgba(${x[0]}, ${x[1]}, ${x[2]}, 0.5)`);
            const hoverBackgroundColor = _.map(color, x => `rgba(${x[0]}, ${x[1]}, ${x[2]}, 0.7)`);
            const buckets = _.fromPairs(_.map(this.stats.resultBuckets, x => [x._id, x.count]));
            const data = _.map(labelNames, _.partial(_.get, buckets));
            console.log(data, labelNames, this.stats.resultBuckets);
            const myChart = new Chart(this.canvas, {
                type: 'pie',
                data: {
                    labels: labelNames,
                    datasets: [{
                        data,
                        backgroundColor,
                        hoverBackgroundColor,
                    }]
                },
            });
        }
    },
});
