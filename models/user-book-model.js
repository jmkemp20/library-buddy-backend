const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userBookSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      default: () => {
        return mongoose.Types.ObjectId();
      },
    },
    user_id: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    library_id: {
      type: Schema.Types.ObjectId,
      ref: "UserBooks",
      required: true,
    },
    rating: { type: Number, default: -1 },
    tag: { type: String, default: "" },
    notes: { type: String, default: "No Notes" },
    copies: { type: Number, default: 1 },
    condition: { type: String, default: "good" },
    checkout_history: [
      {
        student_id: { type: Schema.Types.ObjectId, ref: "Students" },
        checkout_date: Number,
        checkin_date: Number,
      },
    ],
  },
  { collection: "UserBooks", timestamps: true }
);

const UserBooks = mongoose.model("UserBooks", userBookSchema);

module.exports = { UserBooks };
