const { Schema } = require("mongoose")
const mongoose = require("mongoose")

const userSchema = new Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, required: false, unique: false },
  password: { type: String, required: true },
  favorites: [{ type: Schema.Types.ObjectId, ref: "place" }],
  reviews: [{ type: Schema.Types.ObjectId, ref: "review" }],
  posts: [{ type: Schema.Types.ObjectId, ref: "place" }],
});

const user = mongoose.model('user', userSchema)

module.exports = user
