const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const studentSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      default: () => { return mongoose.Types.ObjectId() },
    },
    user_id: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    name: { type: String, required: true },
    number: { type: Number, required: true },
    classroom_name: { type: String, default: "Unknown" },
    email: { type: String, default: "Unknown" },
    total_checkouts: { type: Number, default: 0 },
    total_pages_read: { type: Number, default: 0 },
    total_time_reading: { type: Number, default: 0 },
    favorite_genre: { type: String, default: "Unknown" },
    reading_level: { type: String, default: "Unknown" },
    checkout_list: [
      {
        userbook_id: { type: Schema.Types.ObjectId, ref: "UserBooks" },
        checkout_date: { type: Number, default: Math.floor(Date.now() / 1000) },
      },
    ],
  },
  { collection: "Students", timestamps: true }
);

const Students = mongoose.model("Students", studentSchema);

module.exports = { Students };
