const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const postSchema = new Schema({
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: false
    },
    uploadDate: {
        type: String,
        required: true
    },
    username: {
        type:String,
        required: true
    },
    avatarUrl: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Post', postSchema);