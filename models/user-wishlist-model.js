const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userWishlistSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      default: () => {
        return mongoose.Types.ObjectId();
      },
    },
    user_id: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    title: { type: String, required: true },
    author: { type: String, default: "Unknown" },
    notes: { type: String, default: "No Notes" },
    severity: { type: String, default: "medium" },
    likes: { type: Number, default: 0 },
    isbn: { type: String, default: "" },
    url: String,
  },
  { collection: "UserWishlist", timestamps: true }
);

const UserWishlist = mongoose.model("UserWishlist", userWishlistSchema);

module.exports = { UserWishlist };
