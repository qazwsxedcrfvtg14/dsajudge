import mongoose from 'mongoose';
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
    roles: [String],
});

const User = mongoose.model('User', userSchema);
export default User;

