const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const librarySchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      default: () => {
        return mongoose.Types.ObjectId();
      },
    },
    title: { type: String, required: true },
    author: { type: String, default: "Unknown" },
    description: { type: String, default: "Unknown" },
    publisher: { type: String, default: "Unknown" },
    publish_date: { type: String, default: "Unknown" },
    pages: { type: Number, default: -1 },
    price: { type: String, default: "" },
    reading_level: { type: String, default: "Unknown" },
    isbn_10: String,
    isbn_13: String,
  },
  { collection: "Library", timestamps: true }
);

const Library = mongoose.model("Library", librarySchema);

module.exports = { Library };
