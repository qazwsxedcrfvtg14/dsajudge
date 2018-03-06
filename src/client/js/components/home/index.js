import Vue from 'vue';
import html from './index.pug';
import store, {userLogin, getUser} from 'js/store';
import toastr from 'toastr';
import marked from 'js/marked_mutated';
import _ from 'lodash';
import './index.css';

export default Vue.extend({
    data() {
        return { 
            homeworks: [ ],
            filename: [ ],
        };
    },
    template: html,
    ready() {
        this.fetchHomeworks();
    },
    store,
    vuex: {
        actions: {
            userLogin,
        },
        getters: {
            user: getUser,
        }
    },
    filters: {
        marked(x) {
            return marked(x);
        },
        getPath(x) {
            if (!x) return 'No file selected.';
            return x.split('\\').pop();
        }
    },
    methods: {
        async clickSubmit(hw_id) {
            const me = this;
            let str;
            const fname=document.getElementById('source-file'+hw_id.toString()).value;
            if(!(/^.*\.pdf$/i.test(fname))){
                toastr.error("Only allow pdf file.");
                return ;
            }
            const files = document.getElementById('source-file'+hw_id.toString()).files;
            if (!files || !files.length) {
                this.errFile = 'A file is required.';
                return;
            }
            const file = files[0];
            const uploader = new FileReader();
            const promise = new Promise( (resolve, reject) => {
                uploader.onload = () => resolve(uploader.result);
                uploader.readAsArrayBuffer(file);
                //uploader.readAsText(file);
            } );
            str = btoa(new Uint8Array(await promise).reduce((data, byte) => data + String.fromCharCode(byte), ''));
            //console.log(str);

            let result;
            try{
                result = await this.$http.post(`/homework/${hw_id}/submit`, {
                    file: str,
                });
            } catch (e){
                if ('body' in e)
                    toastr.error(e.body);
                else console.log(e);
                return;
            }
            if ('body' in result)
                toastr.success(result.body);
            this.filename[hw_id]=null;
            document.getElementById('source-file'+hw_id.toString()).value='';
            result = (await me.$http.get('/user/me')).data;
            if (result.login) {
                me.userLogin(result.user);
            }
        },
        async fetchHomeworks() {
            if (!this.user) {
                this.homeworks = [];
                return;
            }
            this.homeworks = (await this.$http.get('/homework/')).data; 
        },
        async newHomework() {
            let id;
            try {
                id = (await this.$http.put('/admin/homework/')).data.id;
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
        getRankStr(hw) {
            const {rank} = hw;
            if (!rank) return '50%';
            return `${rank}`;
        },
        getRankClass(hw) {
            const {rank, totUsers} = hw;
            if (!rank) return 'rank-under-50';
            const pr = (rank-1) / totUsers;
            if (pr < 1.0 / 24) return 'rank-gold';
            if (pr < 1.0 / 8) return 'rank-silver';
            if (pr < 1.0 / 4) return 'rank-bronze';
        },
        getRankImage(hw) {
            const {rank, totUsers} = hw;
            if (!rank) return '';
            const pr = (rank-1) / totUsers;
            let s;
            if (pr < 1.0 / 24) s = 'gold';
            else if (pr < 1.0 / 8) s = 'silver';
            else if (pr < 1.0 / 4) s = 'bronze';
            return s ? `images/medal_${s}.jpg` : null; 
        },
        getHwId(hw) {
            return hw.homework_id; 
        },
        checkHwId(hwid) {
            return id=>hwid==id; 
        },
    },
    watch: {
        user() {
            this.fetchHomeworks();
        }
    },
});
