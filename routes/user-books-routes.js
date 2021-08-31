const express = require("express");
const router = express.Router();
const multer = require("multer");
const csv = require('csv-parser');
const fs = require('fs');
const libController = require("../controllers/library-controller");
const userBookController = require("../controllers/user-book-controller");
const ISBNConverter = require("simple-isbn").isbn;
const { Users } = require("../models/user-model");
const { Library } = require("../models/library-model");
const { UserBooks } = require("../models/user-book-model");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/files");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "application/vnd.ms-excel" || file.mimetype == "text/csv" || file.mimetype == "application/octet-stream") {
        cb(null, true);
    } else {
        cb(null, false);
        return cb(new Error('Only .csv files allowed!'));
    }
}
}).single("file");

router.get("/", (req, res) => {
  console.log(`Getting UserBooks with UserID: ${req.user_id}`);
  const user_id = req.user_id;
  userBookController.getUserBooks(user_id, (err, foundUserBooks) => {
    if (err) return res.status(500).send({ error: err });
    if (foundUserBooks) {
      const return_data = [];
      if (foundUserBooks.length == 0) {
        res.status(404).send({ error: "No Books In Library!" });
      }
      for (let i = 0; i < foundUserBooks.length; i++) {
        libController.getBookByID(
          foundUserBooks[i].library_id,
          (err, foundBook) => {
            if (err) return res.status(500).send({ error: err });
            return_data.push({
              userBookInfo: foundUserBooks[i],
              libraryInfo: foundBook,
            });
            if (return_data.length === foundUserBooks.length) {
              res.status(200).send(return_data);
            }
          }
        );
      }
    } else {
      return res.status(500).send({ error: "No UserBooks Found" });
    }
  });
});

router.get("/:ubid", (req, res) => {
  const userbook_id = req.params["ubid"];
  const user_id = req.user_id;
  if (!userbook_id || userbook_id === undefined) {
    return res.status(400).send({ error: "No LibraryID Provided" });
  }
  userBookController.getUserBook(
    { user_id: user_id, userbook_id: userbook_id },
    (err, foundUserBook) => {
      if (err) return res.status(500).send({ error: err });
      res.status(200).send(foundUserBook);
    }
  );
});

router.post("/add", (req, res) => {
  const user_id = req.user_id;
  const isbn = req.body["isbn"];
  const title = req.body["title"];
  console.log(isbn);
  if (!isbn || isbn === undefined) {
    return res.status(400).send({ error: "Invalid ISBN" });
  }
  if (!title || title === undefined) {
    return res.status(400).send({ error: "Invalid Title" });
  }
  libController.getBookByISBN(isbn, (err, foundBook) => {
    if (err) return res.status(500).send({ error: err });
    const userBookInfo =
      req.body["userBookInfo"] !== undefined ? req.body["userBookInfo"] : {};
    const libraryInfo =
      req.body["libraryInfo"] !== undefined ? req.body["libraryInfo"] : {};
    if (foundBook) {
      // The book is already in the library but still need to add userbook reference
      const query = {
        user_id: user_id,
        library_id: foundBook._id,
      };
      // Need to check if there already exists a UserBook referencing a LibraryBook
      userBookController.getUserBookByLibraryID(query, (err, foundUserBook) => {
        if (err) return res.status(404).send({ error: err });
        if (foundUserBook) {
          // TODO: Check to see if foundBook fields are still set to defaults - will want to save more info
          foundUserBook.copies += 1;
          foundUserBook.save((err) => {
            if (err)
              return res
                .status(500)
                .send({ error: "Unable to Update User Book" });
            res.status(200).send({
              message: "Updated UserBook Reference to Existing LibraryBook",
            });
          });
        } else {
          const tempUserBook = new UserBooks({
            user_id: user_id,
            library_id: foundBook._id,
          });
          tempUserBook.save((err) => {
            if (err)
              return res.status(500).send({
                error:
                  "Unable to Save UserBook reference to Existing LibraryBook",
              });
            res.status(201).send({
              message: "Created New UserBook Reference to Existing LibraryBook",
            });
          });
        }
      });
    } else {
      // Need to add the book to the library and add userbook ref
      const tempBook = new Library({
        isbn_10: isbn.length === 10 ? isbn : ISBNConverter.toIsbn10(isbn),
        isbn_13: isbn.length === 13 ? isbn : ISBNConverter.toIsbn13(isbn),
        title: title,
        ...libraryInfo,
      });
      tempBook.save((err, savedBook) => {
        if (err)
          return res
            .status(500)
            .send({ error: "Unable to Save Book to Library" });
        const tempUserBook = new UserBooks({
          user_id: user_id,
          library_id: savedBook._id,
          ...userBookInfo,
        });
        tempUserBook.save((err, savedUserBook) => {
          if (err)
            return res
              .status(500)
              .send({ error: "Unable to Save Book to UserBooks" });
          res
            .status(201)
            .send({ message: "Created New UserBook and LibraryBook" });
        });
      });
    }
  });
});

router.post("/add/:isbn", (req, res) => {
  const user_id = req.user_id;
  const isbn = req.params["isbn"];
  if (!isbn || isbn === undefined) {
    return res.status(400).send({ error: "Invalid ISBN" });
  }
  libController.getBookByISBN(isbn, (err, foundBook) => {
    if (err) return res.status(500).send({ error: err });
    if (foundBook) {
      // first check to see if userbook ref already exits
      // if so, add copy, else, create usebook ref
      const query = {
        user_id: user_id,
        library_id: foundBook._id,
      };
      userBookController.getUserBookByLibraryID(query, (err, foundUserBook) => {
        if (err) return res.status(404).send({ error: err });
        if (foundUserBook) {
          // TODO: Check to see if foundBook fields are still set to defaults - will want to save more info
          foundUserBook.copies += 1;
          foundUserBook.save((err) => {
            if (err)
              return res
                .status(500)
                .send({ error: "Unable to Update User Book" });
            res.status(200).send({
              message: "Updated UserBook Reference to Existing LibraryBook",
            });
          });
        } else {
          const tempUserBook = new UserBooks({
            user_id: user_id,
            library_id: foundBook._id,
          });
          tempUserBook.save((err, savedUserBook) => {
            if (err)
              return res.status(500).send({
                error:
                  "Unable to Save UserBook reference to Existing LibraryBook",
              });
            res.status(201).send({
              message: "Created New UserBook Reference to Existing LibraryBook",
            });
          });
        }
      });
    } else {
      // Need to add the book to the library and add userbook ref
      const tempBook = new Library({
        isbn_10: isbn.length === 10 ? isbn : ISBNConverter.toIsbn10(isbn),
        isbn_13: isbn.length === 13 ? isbn : ISBNConverter.toIsbn13(isbn),
        title: title,
        ...libraryInfo,
      });
      tempBook.save((err, savedBook) => {
        if (err)
          return res
            .status(500)
            .send({ error: "Unable to Save Book to Library" });
        const tempUserBook = new UserBooks({
          user_id: user_id,
          library_id: savedBook._id,
          ...userBookInfo,
        });
        tempUserBook.save((err, savedUserBook) => {
          if (err)
            return res
              .status(500)
              .send({ error: "Unable to Save Book to UserBooks" });
          res
            .status(201)
            .send({ message: "Created New UserBook and LibraryBook" });
        });
      });
    }
  });
});

router.post("/libraryUpload", (req, res) => {
  const user_id = req.user_id;
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).send({ error : err });
    } else if (err) {
      return res.status(500).send({ error : err });
    }
    console.log(`Uploaded: ${req.file.filename}`)
    const results = [];
    fs.createReadStream(`public/files/${req.file.filename}`)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      let count = 0;
      for (let i = 0; i < results.length; i++) {
        const isbn = results[i].isbn13 == '' ? results[i].isbn10 : results[i].isbn13;
        libController.getBookByISBN(isbn, (err, foundBook) => {
          if (foundBook) {
            const query = {
              user_id: user_id,
              library_id: foundBook._id,
            };
            userBookController.getUserBookByLibraryID(query, (err, foundUserBook) => {
              if (err) return res.status(404).send({ error: err });
              if (foundUserBook) {
                // TODO: Check to see if foundBook fields are still set to defaults - will want to save more info
                foundUserBook.copies += 1;
                foundUserBook.save((err) => {
                  if (err)
                    return res
                      .status(500)
                      .send({ error: "Unable to Update User Book" });
                  count++;
                  if (count === results.length - 1) {
                    res.status(200).send({ message: `Added ${results.length} Books!` });
                  }
                });
              } else {
                const tempUserBook = new UserBooks({
                  user_id: user_id,
                  library_id: foundBook._id,
                  tag: results[i].tags,
                  notes: results[i].notes !== "" ? results[i].notes : "No Notes",
                });
                tempUserBook.save((err) => {
                  if (err) return res.status(500).send({ error: "Unable to Save UserBook reference to Existing LibraryBook" });
                  count++;
                  if (count === results.length - 1) {
                    res.status(200).send({ message: `Added ${results.length} Books!` });
                  }
                });
              }
            });
          } else {
            const tempLibraryBook = new Library({
              title: results[i].title !== '' ? results[i].title : "Unknown",
              author: results[i].authors !== '' ? results[i].authors : "Unknown",
              description: results[i].description,
              publisher: results[i].publisher !== '' ? results[i].publisher : "Unknown",
              publish_date: results[i].publish_date !== '' ? results[i].publish_date : "Unknown",
              pages: Number(results[i].pages),
              isbn_10: results[i].isbn10,
              isbn_13: results[i].isbn13,
            });
            tempLibraryBook.save((err, newLibraryBook) => {
              if (err) return res.status(500).send({ error: err });
              const tempUserBook = new UserBooks({
                user_id: user_id,
                library_id: newLibraryBook._id,
                tag: results[i].tags,
                notes: results[i].notes !== "" ? results[i].notes : "No Notes",
              });
              tempUserBook.save((err) => {
                if (err) return res.status(500).send({ error: err });
                count++;
                if (count === results.length - 1) {
                  res.status(200).send({ message: `Added ${results.length} Books!` });
                }
              });
            });
          }
        });
        if (count === results.length - 1) {
          res.status(200).send({ message: `Added ${results.length} Books!` });
        }
      }
    });
  });
});

router.post("/edit/:ubid", (req, res) => {
  const user_id = req.user_id;
  const userbook_id = req.params["ubid"];
  if (!userbook_id || userbook_id === undefined) {
    return res.status(400).send({ error: "Invalid userbook_id" });
  }
  const userbook_info = { ...req.body };
  UserBooks.findOne(
    { _id: userbook_id, user_id: user_id },
    (err, foundUserBook) => {
      if (err) return res.status(500).send({ error: err });
      if (foundUserBook) {
        foundUserBook.rating =
          userbook_info.rating !== undefined
            ? userbook_info.rating
            : foundUserBook.rating;
        foundUserBook.tag =
          userbook_info.tag !== undefined
            ? userbook_info.tag
            : foundUserBook.tag;
        foundUserBook.notes =
          userbook_info.notes !== undefined
            ? userbook_info.notes
            : foundUserBook.notes;
        foundUserBook.condition =
          userbook_info.condition !== undefined
            ? userbook_info.condition
            : foundUserBook.condition;

        foundUserBook.save((err, newUserBook) => {
          if (err) return res.status(500).send({ error: err });
          res.status(200).send(newUserBook);
        });
      } else {
        res.status(404).send({ error: "Unable to Find UserBook" });
      }
    }
  );
});

router.delete("/:ubid", (req, res) => {
  const user_id = req.user_id;
  const userbook_id = req.params["ubid"];
  if (!userbook_id || userbook_id === undefined) {
    return res.status(400).send({ error: "Invalid userbook_id" });
  }
  UserBooks.deleteOne(
    { _id: userbook_id, user_id: user_id },
    (err, deletedUserBook) => {
      if (err) return res.status(500).send({ error: err });
      if (deletedUserBook.deletedCount > 0) {
        res.status(410).send({ message: "Sucessfully Deleted" });
      } else {
        res.status(404).send({ error: "No UserBook Found to Delete" });
      }
    }
  );
});

module.exports = router;
