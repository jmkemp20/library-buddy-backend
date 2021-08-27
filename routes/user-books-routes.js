const express = require("express");
const router = express.Router();
const libController = require("../controllers/library-controller");
const userBookController = require("../controllers/user-book-controller");
const ISBNConverter = require("simple-isbn").isbn;
const { Users } = require("../models/user-model");
const { Library } = require("../models/library-model");
const { UserBooks } = require("../models/user-book-model");

router.get("/", (req, res) => {
    console.log(`Getting UserBooks with UserID: ${req.user_id}`);
    const user_id = req.user_id;
    userBookController.getUserBooks(user_id, (err, foundUserBooks) => {
      if (err)
        return res.status(500).send({ error: err });
      if (foundUserBooks) {
        const return_data = [];
        for (let i = 0; i < foundUserBooks.length; i++) {
            libController.getBookByID(foundUserBooks[i].library_id, (err, foundBook) => {
                if (err) return res.status(500).send({ error: err });
                return_data.push({
                    userBookInfo: foundUserBooks[i],
                    libraryInfo: foundBook
                });
                if (i === foundUserBooks.length - 1) {
                    res.status(200).send(return_data);
                }
            });
        }
      } else {
        return res.status(500).send({ error: "No UserBooks Found" });
      }
    });
});

router.get("/:bid", (req, res) => {
    const library_id = req.params["bid"];
    const user_id = req.user_id;
    if (!library_id || library_id === undefined) {
      return res.status(400).send({ error: "No LibraryID Provided" });
    }
    userBookController.getUserBookByLibraryID(
      { user_id: user_id, library_id: library_id },
      (err, foundUserBook) => {
        if (err)
          return res.status(500).send({ error: err });

        libController.getBookByID(
        foundUserBook.library_id,
        (err, foundLibraryBook) => {
            if (err) return res.status(500).send({ error: err });
            const returnData = {
                userInfo: foundUserBook.toJSON(),
                libraryInfo: foundLibraryBook.toJSON(),
            };
            res.status(200).send(returnData);
        }
        );
    });
});

router.post("/add", (req, res) => {
    const user_id = req.user_id;
    const isbn = req.body['isbn'];
    const title = req.body['title'];
    if (!isbn || isbn === undefined) {
        return res.status(400).send({ error: "Invalid ISBN" });
    }
    if (!title || title === undefined) {
      return res.status(400).send({ error: "Invalid Title" });
    }
    libController.getBookByISBN(isbn, (err, foundBook) => {
        if (err) return res.status(500).send({ error: err });
        const userBookInfo = (req.body["userBookInfo"] !== undefined) ? req.body["userBookInfo"] : {};
        const libraryInfo = req.body["libraryInfo"] !== undefined
            ? req.body["libraryInfo"]
            : {};
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
                    res
                      .status(200)
                      .send({
                        message:
                          "Updated UserBook Reference to Existing LibraryBook",
                      });
                  });
                } else {
                    const tempUserBook = new UserBooks({
                        user_id: user_id,
                        library_id: foundBook._id,
                        ...userBookInfo,
                    });
                    tempUserBook.save((err, savedUserBook) => {
                    if (err)
                        return res
                          .status(500)
                          .send({
                            error:
                              "Unable to Save UserBook reference to Existing LibraryBook",
                          });
                        res.status(201).send({ message: "Created New UserBook Reference to Existing LibraryBook" });
                    });
                }
            });
        } else {
            // Need to add the book to the library and add userbook ref
            const tempBook = new Library({
                isbn_10: isbn.length === 10 ? isbn : ISBNConverter.toIsbn10(isbn),
                isbn_13: isbn.length === 13 ? isbn : ISBNConverter.toIsbn13(isbn),
                title: title,
                ...libraryInfo
            });
            tempBook.save((err, savedBook) => {
                if (err) return res.status(500).send({ error: "Unable to Save Book to Library" });
                const tempUserBook = new UserBooks({
                    user_id: user_id,
                    library_id: savedBook._id,
                    ...userBookInfo
                });
                tempUserBook.save((err, savedUserBook) => {
                    if (err) return res.status(500).send({ error: "Unable to Save Book to UserBooks" });
                    res.status(201).send({ message: "Created New UserBook and LibraryBook" });
                });
            });
        }
    });
});

module.exports = router;