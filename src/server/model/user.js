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
	submission_limit:{
		last_submit: String,
		left: Number,
	},
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

const User = mongoose.model('User', userSchema);
export default User;

