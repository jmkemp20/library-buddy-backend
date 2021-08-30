const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const activityLogSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      default: () => {
        return mongoose.Types.ObjectId();
      },
    },
    user_id: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    userbook_id: {
      type: Schema.Types.ObjectId,
      ref: "UserBooks",
      required: true,
    },
    student_id: {
      type: Schema.Types.ObjectId,
      ref: "Students",
      required: true,
    },
    activity_type: { type: String, required: true },
    activity_date: { type: Number, required: true },
  },
  { collection: "ActivityLog", timestamps: true }
);

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

module.exports = { ActivityLog };