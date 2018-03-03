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

const default_quota = 5;

userSchema.methods.checkQuota = function(pid){
//	console.log(this);
	const limit=this.submission_limit;
	let filter_res = _.filter(limit,_.conforms({ problem_id : id => id==pid }));
    let res ;
	let today = new Date(Date.now());
//	console.log("today" , today);

	if (filter_res == undefined || filter_res.length == 0){
//		console.log("add new problem record.");		
		res={
			problem_id: pid,
			last_submission: today,
			quota : default_quota,
		};
		this.submission_limit.push(res);
	}else{
		res = filter_res[0];
	}
//	console.log(String(today));
//	console.log("compare ", String(today).substr(0,15), String(res.last_submission).substr(0,15));
	if ( 	String(today).substr(0,15) != String(res.last_submission).substr(0,15)){

//		console.log("charge the quota.");
		res.quota = default_quota;
		res.last_submission = today;
	}

	if (res.quota < 1){
		return false;
	}else{
		res.quota -= 1;
		this.save();
//		console.log("success");
		return true;
	}
};
const User = mongoose.model('User', userSchema);
export default User;

