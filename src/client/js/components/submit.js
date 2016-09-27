import Vue from 'vue';
import html from './submit.pug';
import './submit.css';

export default Vue.extend({
    data() {
        return { 
            filename: null,
            errFile: null,
            errEditor: null,
        };
    },
    template: html,
    ready() {
        this.$tab = $('#upload-tab .item').tab({history: false});
        this.editor = ace.edit('editor');
        this.editor.getSession().setMode('ace/mode/c_cpp');
    },
    filters: {
        getPath(x) {
            if (!x) return 'No file selected.';
            return x.split('\\').pop();
        }
    },
    methods: {
        async clickSubmit() {
            const curTab = this.$tab.filter('.active').attr('data-tab');
            let str;
            if (curTab == 'upload') {
                const files = document.getElementById('source-file').files;
                if (!files || !files.length) {
                    this.errFile = 'A file is required.';
                    return;
                }
                const file = files[0];
                const uploader = new FileReader();
                const promise = new Promise( (resolve, reject) => {
                    uploader.onload = () => resolve(uploader.result);
                    uploader.readAsText(file);
                } );
                str = await promise;
                if (!str.trim()) {
                    this.errFile = "The File is empty.";
                    return;
                }
            } else {
                str = this.editor.getValue();
                if (!str.trim()) {
                    this.errEditor = "You'll surely get a CE if you send nothing!";
                    return;
                }
            }

            const uid = this.$root.user._id;
            const result = await this.$http.post(`/submit/${this.$route.params.id}`, {
                file: str,
            });
            console.log(result.body);
        },
    }
});
