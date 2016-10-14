import Vue from 'vue';
import html from './homework.pug';
import toastr from 'toastr';
import _ from 'lodash';

const SIGMA = 3;
function getFuzzed(dt) {
    const pdf = [], cdf = [];
    for (let i = 0; i<=100; i++) pdf.push(0);
    for (let {_id, count} of dt) {
        for (let _x = -SIGMA*4; _x <= SIGMA*4; _x++) {
            const x = Math.round(_x + _id);
            if (x < 0 || x > 100) continue;
            pdf[x] += count * Math.exp(-(((x - _id)/SIGMA) ** 2) / 2);
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
        this.canvas = {
            points: document.getElementById('points-chart'),
        };
    },
    methods: {
        async fetchStatistic() {
            let result;
            try {
                result = (await this.$http.get(`/statistic/homework/${this.id}`)).data;
            } catch(e) {
                console.log(e);
            }
            _.assignIn(this, result);
            this.drawPointsDistribution();
        },
        drawPointsDistribution() {
            let {totalPoints} = this.hw;
            totalPoints += 1e-10;
            const normalize = (x) => x * 100.0 / totalPoints;
            const [pdf, cdf] = getFuzzed(this.stats.pointsDistribution.map(
                x => _.set(x, '_id', normalize(x._id))));
            const labels = _.map(_.range(0, 101), x => (x * totalPoints / 100).toFixed(0));
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
                                    //max: 100,
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
