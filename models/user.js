<<<<<<< HEAD
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    registryDate: {
        type: String,
        required: true
    },
    uploaded: {
        type: Number,
        required: true
    }
});

=======
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

>>>>>>> 9d9a2d2d98f84a83361c292d3ef41431c7f8a840
module.exports = mongoose.model('User', userSchema);