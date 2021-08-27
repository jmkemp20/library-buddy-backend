const { UserBooks } = require("../models/user-book-model");

exports.getUserBooks = (user_id, callback) => {
  UserBooks.find({ user_id: user_id }, (err, foundUserBooks) => {
    if (err) return callback(err);
    if (foundUserBooks) {
      callback(null, foundUserBooks);
    } else {
      callback(null, false);
    }
  });
};

exports.getUserBookByLibraryID = ({ user_id, library_id }, callback) => {
    const query = {
        user_id: user_id,
        library_id: library_id,
    };
    UserBooks.findOne(query, (err, foundUserBook) => {
        if (err) return callback(err);
        if (foundUserBook){
            callback(null, foundUserBook);
        } else {
            callback("Unable to Find UserBook via LibraryID", false);
        }
    });
};