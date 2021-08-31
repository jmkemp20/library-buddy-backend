const mongoose = require("mongoose"),
  Schema = mongoose.Schema,
  bcrypt = require("bcrypt"),
  SALT_WORK_FACTOR = 10;

const userSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      default: () => {
        return mongoose.Types.ObjectId();
      },
    },
    first_name: { type: String, default: "Anonymous" },
    last_name: { type: String, default: "" },
    country_code: { type: Number, default: 1 },
    address: { type: String, default: "" },
    phone_number: { type: String, default: "" },
    last_login: { type: Number, default: Math.floor(Date.now() / 1000) },
    user_settings: {
      push_notifications: { type: Boolean, default: false },
      text_notifications: { type: Boolean, default: false },
      email_notifications: { type: Boolean, default: false },
      mailing_list: { type: Boolean, default: false },
      add_book_on_kiosk_scan: { type: Boolean, default: false },
      days_till_overdue: { type: Number, default: -1 },
      student_book_limit: { type: Number, default: -1 },
    },
    teacher_details: {
      grade_level: { type: String, default: "Unknown" },
      school_name: { type: String, default: "Unknown" },
    },
    profileImg: { type: String, default: "profile.jpg" },
    email: { type: String, required: true, index: { unique: true } },
    password: { type: String, required: true },
  },
  { collection: "Users", timestamps: true }
);

userSchema.pre("save", function (next) {
  var user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified("password")) return next();

  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) return next(err);

    // hash the password using our new salt
    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err);
      // override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

const Users = mongoose.model("Users", userSchema);

module.exports = { Users };
