import Vue from 'vue';
import html from '/vue/problems.pug';

console.log(html, 12345);

export default Vue.extend({
    data() {
        return { 
            problems: [
                {
                    id: 1,
                    name: 'zzz',
                },
                {
                    id: 2,
                    name: 'qqq',
                }
            ]
        };
    },
    template: html,
});
