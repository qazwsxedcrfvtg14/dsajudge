import Vue from 'vue';
import html from './problem.pug';
import toastr from 'toastr';
import _ from 'lodash';
import probUtils from 'js/mixins/probUtils';

const SIGMA = 3;
const WEIGHT = [];
for (let x = -SIGMA*4; x <= SIGMA*4; x++) {
    WEIGHT[x+SIGMA*4] = Math.exp(-((x/SIGMA)**2)/2);
}
function getFuzzed(dt) {
    const pdf = [], cdf = [];
    for (let i = 0; i<=100; i++) pdf.push(0);
    for (let {_id, count} of dt) {
        for (let _x = -SIGMA*4; _x <= SIGMA*4; _x++) {
            const x = _x + _id;
            if (x < 0 || x > 100) continue;
            pdf[x] += count * WEIGHT[_x + SIGMA*4];
        }
    }
    const sum = _.sum(pdf);
    for (let x of pdf) {
        if (!cdf.length) cdf.push(x/sum);
        else cdf.push(cdf[cdf.length-1] + x/sum);
    }
    return [pdf, cdf];
}

export default Vue.extend({
    mixins: [probUtils],
    data() {
        return { 
            id: null,
            homeworks: [ ],
            problem: null,
            stats: [],
        };
    },
    template: html,
    ready() {
        this.id = this.$route.params.id;
        this.fetchStatistic();
        this.canvas = {
            result: document.getElementById('result-chart'),
            points: document.getElementById('points-chart'),
        };
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
            if (this.problem) {
                this.problem.solutionVisible = this.problem.resource 
                    && this.problem.resource.includes('solution');
            }
            this.drawResultPieChart();
            this.drawPointsDistribution();
        },
        drawResultPieChart() {
            const labels = {
                AC: [0, 150, 0],
                WA: [255, 0, 0],
                TLE: [200, 0, 150],
                CE: [0, 0, 255],
                RE: [220, 100, 0],
                SE: [150, 150, 150],
                JE: [0, 0, 0],
            };
            const [labelNames, color] = _.zip(..._.toPairs(labels));
            const backgroundColor = _.map(color, x => `rgba(${x[0]}, ${x[1]}, ${x[2]}, 0.6)`);
            const hoverBackgroundColor = _.map(color, x => `rgba(${x[0]}, ${x[1]}, ${x[2]}, 0.7)`);
            const buckets = _.fromPairs(_.map(this.stats.resultBuckets, x => [x._id, x.count]));
            const data = _.map(labelNames, x => _.get(buckets, x, 0));
            const myChart = new Chart(this.canvas.result, {
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
        },
        drawPointsDistribution() {
            const [pdf, cdf] = getFuzzed(this.stats.pointsDistribution);
            const labels = _.range(0, 101);
            const myChart = new Chart(this.canvas.points, {
                type: 'line',
                data: {
                    labels, 
                    datasets: [
                        {
                            label: 'Density',
                            data: pdf,
                            pointRadius: 0,
                            borderColor: 'rgba(0, 40, 200, 0.6)',
                            backgroundColor: 'rgba(0, 40, 200, 0.4)',
                            borderJoinStyle: 'round',
                        },
                        {
                            label: 'Cummulative',
                            data: cdf,
                            yAxisID: 'cdfY',
                            pointRadius: 0,
                            borderColor: 'rgba(200, 0, 0, 0.6)',
                            backgroundColor: 'rgba(0, 0, 0, 0)',
                            borderJoinStyle: 'round',
                        }
                    ]
                },
                options: {
                    scales: {
                        xAxes: [
                            {
                                ticks: {
                                    min: 0,
                                    max: 100,
                                    maxTicksLimit: 11,
                                    //stepSize: 10,
                                }
                            },
                        ],
                        yAxes: [
                            {
                                ticks: {
                                    min: 0,
                                    suggestedMax: 5,
                                }
                            },
                            {
                                id: 'cdfY',
                                position: 'right',
                                ticks: {
                                    min: 0,
                                    max: 1,
                                }
                            },
                        ]
                    }
                }
            });
        }
    },
});
