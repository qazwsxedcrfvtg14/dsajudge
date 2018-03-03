import mongoose from 'mongoose';
import _ from 'lodash';
const Schema = mongoose.Schema;

const userSchema = Schema({
    email: {
        type: String,
        index: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    meta: {
        name: String,
        id: String,
    },
	submission_limit:[{
		problem_id:Number,
		last_submission:Date,
		quota:Number,
	}],
    roles: [String],
});

userSchema.methods.hasRole = function(role) {
    const roles = this.roles;
    if (!roles) return false;
    return _.includes(roles, role);
};

userSchema.methods.isAdmin = function() {
    return this.hasRole('admin');
};
userSchema.methods.checkQuota = function(problem_id){
	const limit=this.submission_limit;
	let filter_res = _.filter(limit,_.conforms({problem_id : id => id==problem_id }));
    if (filter_res == undefined || filter_res.length == 0){
		return false;
	}
	let res = filter_res[0];
	if (Date.now().toDateString() != res.last_submission.toDateString()){
		res.quota = 5;
		res.last_submission = Date.now();
	}
	if (res.quota == 0){
		return false;
	}else{
		res.quota -= 1;
		return true;
	}
};
const User = mongoose.model('User', userSchema);
export default User;

