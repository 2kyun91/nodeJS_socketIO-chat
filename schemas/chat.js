const mongoose = require('mongoose');

const {Schema} = mongoose;
const {Types : {ObjectId}} = Schema;
const chatSchema = new Schema({
    room : {
        type : ObjectId,
        required : true,
        ref : 'Room', // Room 스키마와 연결하여 Room 컬렉션의 ObjectId가 들어간다.
    },
    user : {
        type : String,
        required : true,
    },
    chat : String,
    gif : String,
    createdAt : {
        type : Date,
        default : Date.now,
    },
});

module.exports = mongoose.model('chat', chatSchema);