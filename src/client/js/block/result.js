import Vue from 'vue';
import './result.css';
import probUtils from '/mixins/probUtils';

export const ResultString = Vue.extend({
    mixins: [probUtils],
    props: ['status', 'result'],
    template: `<span :class="[result]"> {{probUtils.getResultString({status:status, result:result})}} </span>`,
});
