const { Library } = require("../models/library-model");
const isbnValidator = require("../utils/ISBNValidate");

exports.getBookByID = (library_id, callback) => {
    if (!library_id || library_id === undefined) {
      return callback("Invalid Book ID");
    }
    Library.findOne({ _id: library_id }, (err, foundBook) => {
      if (err) return callback(err);
      if (foundBook) {
        callback(null, foundBook);
      } else {
        callback("Unable to Find Book", false);
      }
    });
}

exports.getBookByISBN = (book_isbn, callback) => {
    if (!book_isbn || book_isbn === undefined) {
      return callback("Invalid Book ISBN");
    }
    if (!isbnValidator.isValidISBN(book_isbn)) {
        return callback("Invalid Book ISBN");
    }
    const query = book_isbn.length === 10 ? { isbn_10: book_isbn } : { isbn_13: book_isbn };
    Library.findOne(query, (err, foundBook) => {
        if (err) return callback(err);
        if (foundBook) {
            callback(null, foundBook);
        } else {
            return callback(null, false);
        }
    });
}