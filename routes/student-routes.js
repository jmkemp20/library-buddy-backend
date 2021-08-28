const express = require("express");
const router = express.Router();
const { Students } = require("../models/student-model");
const userBookController = require("../controllers/user-book-controller");
const libController = require("../controllers/library-controller");
const { restart } = require("nodemon");

router.get("/", (req, res) => {
    console.log(`Getting students with: ${req.user_id}`);
    const user_id = req.user_id;
    Students.find({ user_id: user_id }, (err, students) => {
        if (err)
            return res.status(500).send({ error: "Unable to Find Students" });
        if (students) {
            res.status(200).send(students);
        } else {
            res.status(500).send({ error: "No Students Found" });
        }
    });
});


/* Gets all Books that are checked out by all students */
router.get("/books", (req, res) => {
  const user_id = req.user_id;
  Students.find({ user_id: user_id }, (err, students) => {
    if (err) return res.status(500).send({ error: "Error Finding Students" });
    if (students) {
      const return_data = [];
      for (let i = 0; i < students.length; i++) {
          const user_book_data = [];
          if (students[i].checkout_list.length === 0) {
            return_data.push({
              student_id: students[i]._id,
              student_name: students[i].name,
              checked_out_books: []
            });
          } else {
            for (let y = 0; y < students[i].checkout_list.length; y++) {
              userBookController.getUserBook({ user_id: user_id, userbook_id: students[i].checkout_list[y].userbook_id }, (err, foundUserBook) => {
                if (err) return res.status(500).send({ error: err });
                if (foundUserBook) {
                  user_book_data.push({
                    ...foundUserBook,
                    checkout_date: students[i].checkout_list[y].checkout_date,
                  });
                  if (user_book_data.length === students[i].checkout_list.length) {
                    console.log({
                      student_id: students[i]._id,
                      user_book_info: [...user_book_data],
                    });
                    return_data.push({
                      student_id: students[i]._id,
                      student_name: students[i].name,
                      checked_out_books: [...user_book_data],
                    });
                  }
                  if (return_data.length === students.length) {
                    res.status(200).send(return_data);
                  }
                } else {
                  return res.status(404).send({ error: "Unable to find UserBook" });
                }
              });
            }
          }
      }
    } else {
      return res.status(500).send({ error: "No Students Found" });
    }
  });
});

router.get("/:sid", (req, res) => {
    const student_id = req.params['sid'];
    const user_id = req.user_id;
    if (!student_id || student_id === undefined) {
        return res.status(400).send({ error: "No StudentID Provided" });
    }
    Students.find({ user_id: user_id, _id: student_id }, (err, foundStudent) => {
        if (err) return res.status(500).send({ error: "Error Finding Student" });
        if (foundStudent) {
            res.status(200).send(foundStudent);
        } else {
            res.status(404).send({ error: "Student Not Found" });
        }
    });
});

/* Gets all books checked out by given student */
router.get("/:sid/books", (req, res) => {
    const student_id = req.params["sid"];
    const user_id = req.user_id;
    if (!student_id || student_id === undefined) {
      return res.status(400).send({ error: "No StudentID Provided" });
    }
    Students.findOne(
      { user_id: user_id, _id: student_id },
      (err, foundStudent) => {
        if (err)
          return res.status(500).send({ error: "Error Finding Student" });
        if (foundStudent) {
          const return_data = [];
          for (let i = 0; i < foundStudent.checkout_list.length; i++) {
            userBookController.getUserBook({ user_id: user_id, userbook_id: foundStudent.checkout_list[i].userbook_id }, (err, foundUserBook) => {
              if (err) return res.status(500).send({ error: err });
              return_data.push({
                ...foundUserBook,
                checkout_date: foundStudent.checkout_list[i].checkout_date,
              });
              if (return_data.length === foundStudent.checkout_list.length) {
                return res.status(200).send(return_data);
              }
            });
          }
        } else {
          res.status(404).send({ error: "Student Not Found" });
        }
      }
    );
});

router.post("/add", (req, res) => {
    const user_id = req.user_id;
    const studentName = req.body["name"];
    const studentNumber = req.body["number"];
    const classroomName = req.body["classroom_name"];
    const studentEmail = req.body["email"];
    if (!studentName || studentName === undefined) {
      return res.status(400).send({ error: "Invalid Student Name" });
    }
    if (!studentNumber || studentNumber === undefined) {
      return res.status(400).send({ error: "Invalid Student Number" });
    }
    const tempStudent = new Students({
      user_id: user_id,
      name: studentName,
      number: studentNumber,
    });
    if (classroomName) {
      tempStudent.classroom_name = classroomName;
    }
    if (studentEmail) {
      tempStudent.email = studentEmail;
    }
    tempStudent.save((err) => {
        if (err) return res.status(500).send({ error: err });
        res.status(200).send({ data: tempStudent });
    });
});

/*
  In: {user_id, student_id, isbn}

  Given Student sid and ISBN isbn finds UserBook via ISBN and 
  adds the UserBook _id to the checkout_list of student along with current date 

  Out: {title, author}
*/
router.post("/checkout", (req, res) => {
  const student_id = req.body['student_id'];
  const isbn = req.body['isbn'];
  console.log(isbn);
  const user_id = req.user_id;
  if (!isbn || isbn === undefined) {
    return res.status(400).send({ error: "Invalid ISBN" });
  }
  libController.getBookByISBN(isbn, (err, foundBook) => {
    if (err) return res.status(500).send({ error: err });
    if (foundBook) {
      const query = {
        user_id: user_id,
        library_id: foundBook._id,
      };
      userBookController.getUserBookByLibraryID(query, (err, foundUserBook) => {
        if (err) return res.status(404).send({ error: err });
        if (foundUserBook) {
          Students.findOne({ _id: student_id }, (err, foundStudent) => {
            if (err) return res.status(500).send({ error: "Error Finding Student" });
            const currDate = Math.floor(Date.now() / 1000);
            if (foundStudent) {
              foundStudent.total_checkouts += 1;
              foundStudent.checkout_list.push({
                userbook_id: foundUserBook._id,
                checkout_date: currDate
              });
              foundStudent.save((err) => {
                if (err) return res.status(500).send({ error: "Error Updating Student" });
                console.log("saved Student");
              });
              foundUserBook.checkout_history.push({
                student_id: foundStudent._id,
                checkout_date: currDate
              });
              foundUserBook.save((err) => {
                if (err) return res.status(500).send({ error: "Error Updating UserBook" });
                console.log("saved UserBook")
                res.sendStatus(200);
              });
            } else {
              res.status(404).send({ error: "Unable to Find Student" });
            }
          });
        } else {
          // TODO, add to user library in future?
          res.status(404).send({ error: "Book Not In User Library" });
        }
      });
    } else {
      res.status(404).send({ error: "Book Not In Master Library" });
    }
  });
});

/*
  In: {user_id, student_id, userbook_id}

  Given Student sid and ISBN isbn finds UserBook via ISBN and 
  adds the UserBook _id to the checkout_list of student along with current date 
*/
router.post("/:sid/checkin/:ubid", (req, res) => {
  /*

  */
});

module.exports = router;