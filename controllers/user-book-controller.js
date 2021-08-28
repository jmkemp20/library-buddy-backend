const { UserBooks } = require("../models/user-book-model");
const libController = require("../controllers/library-controller");

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

exports.getUserBook = ({ user_id, userbook_id }, callback) => {
    const query = {
        _id: userbook_id,
        user_id: user_id
    };
    UserBooks.findOne(query, (err, foundUserBook) => {
        if (err) return callback(err);
        if (foundUserBook){
          libController.getBookByID(
            foundUserBook.library_id,
            (err, foundLibraryBook) => {
                if (err) return callback(err);
                const returnData = {
                    userInfo: foundUserBook.toJSON(),
                    libraryInfo: foundLibraryBook.toJSON(),
                };
               callback(null, returnData);
            }
          );
        } else {
            callback("Unable to Find UserBook via LibraryID", false);
        }
    });
};

exports.getUserBookByLibraryID = ({ user_id, library_id }, callback) => {
  const query = {
    user_id: user_id,
    library_id: library_id
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