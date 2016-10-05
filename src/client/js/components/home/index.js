import Vue from 'vue';
import html from './index.pug';
import store, {getUser} from '/store';
import toastr from 'toastr';
import marked from 'marked';

export default Vue.extend({
    data() {
        return { 
            homeworks: [ ],
        };
    },
    template: html,
    ready() {
        (async () => {
            this.homeworks = (await this.$http.get('/homework/')).data; 
            //console.log(JSON.stringify(this.homeworks, null, 4));
        })();
    },
    store,
    vuex: {
        getters: {
            user: getUser,
        }
    },
    filters: {
        marked(x) {
            return marked(x);
        },
    },
    methods: {
        async newHomework() {
            let id;
            try {
                id = (await this.$http.put('/admin/homework/')).data;
            } catch(e) {
                if (e.body) toastr.error(e.body);
                else toastr.error(e);
            }
            this.$route.router.go({
                name: 'admin.homework',
                params: {
                    id,
                }
            });
        },
    },
});
