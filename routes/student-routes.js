const express = require("express");
const router = express.Router();
const { Students } = require("../models/student-model");
const { ActivityLog } = require("../models/activity-log-model");
const userBookController = require("../controllers/user-book-controller");
const libController = require("../controllers/library-controller");
const { UserBooks } = require("../models/user-book-model");

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
            if (return_data.length === students.length) {
              res.status(200).send(return_data);
            }
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
          if (foundStudent.checkout_list.length === 0) {
            return res.status(200).send(return_data);
          }
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

  *** IN THE FUTURE - check User days_till_overdue and student_book_limit
*/
router.post("/checkout", (req, res) => {
  const student_id = req.body['student_id'];
  const isbn = req.body['isbn'];
  console.log(isbn);
  const user_id = req.user_id;
  if (!isbn || isbn === undefined) {
    return res.status(400).send({ error: "Invalid ISBN" });
  }
  console.log(`Student: ${student_id} Checking Out: ${isbn}`);
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
              const alreadyCheckedOut = (foundStudent.checkout_list.find((element) => {
                if (element.userbook_id == String(foundUserBook._id))
                  return true;
              }));
              if (alreadyCheckedOut == undefined) {
                foundStudent.total_checkouts += 1;
                foundStudent.checkout_list.push({
                  userbook_id: foundUserBook._id,
                  checkout_date: currDate
                });
                foundStudent.save((err) => {
                  if (err) return res.status(500).send({ error: "Error Updating Student" });
                  foundUserBook.checkout_history.push({
                    student_id: foundStudent._id,
                    checkout_date: currDate,
                    checkin_date: -1
                  });
                  foundUserBook.save((err) => {
                    if (err) return res.status(500).send({ error: "Error Updating UserBook" });
                    const tempActivityLog = new ActivityLog({
                      user_id: user_id,
                      userbook_id: foundUserBook._id,
                      student_id: foundStudent._id,
                      activity_type: "CHECKOUT",
                      activity_date: currDate
                    });
                    tempActivityLog.save((err) => {
                      if (err) return res.status(500).send({ error: "Error Saving ActivityLog" });
                      res.status(200).send({ message: `Checked Out: ${foundBook.title}` });
                    });
                  });
                });
              } else {
                res.status(200).send({ message: "Book Already Checked Out" });
              }
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
router.post("/checkin", (req, res) => {
  const user_id = req.user_id;
  const student_id = req.body['student_id'];
  const userbook_id = req.body['userbook_id'];
  if (!student_id || student_id === undefined) {
    return res.status(400).send({ error: "Invalid student_id" });
  }
  if (!userbook_id || userbook_id === undefined) {
    return res.status(400).send({ error: "Invalid userbook_id" });
  }
  console.log(`Student: ${student_id} Checking In: ${userbook_id}`);
  Students.findOne({ _id: student_id, user_id: user_id }, (err, foundStudent) => {
    if (err) return res.status(500).send({ error: err });
    if (foundStudent) {
      /**
       * First, get the UserBook_id and remove it from the checkout_list from student
       * Then, update checkout_history of given userbook with a checkin date
       * Lastly, push CHECKIN type activity log
       */
      const currDate = Math.floor(Date.now() / 1000);
      const userBookIndex = foundStudent.checkout_list.findIndex((element) => element.userbook_id == userbook_id);
      if (userBookIndex == -1) return res.status(404).send({ error: "Student Does not have this book checked out" });
      const checkoutDate = foundStudent.checkout_list[userBookIndex].checkout_date;
      //foundStudent.checkout_list.splice(userBookIndex, 1);
      // foundStudent.save((err) => {
      //   if (err) res.status(500).send({ error: "Unable to Save Student" });
      // });
      UserBooks.findOne({ _id: userbook_id }, (err, foundUserBook) => {
        if (err) return res.status(500).send({ error: err });
        if (foundUserBook) {
          const historyIndex = foundUserBook.checkout_history.findIndex((element) => {
            return (element.student_id == student_id && element.checkout_date == checkoutDate);
          });
          if (historyIndex == -1) return res.status(404).send({ error: "UserBook Does Not Have this History" });
          foundUserBook.checkout_history[historyIndex].checkin_date = currDate;
          foundUserBook.save((err, newUserBook) => {
            if (err) return res.status(500).send({ error: err });
            foundStudent.checkout_list.splice(userBookIndex, 1);
            foundStudent.total_time_reading += Math.floor((currDate - checkoutDate) / 60);
            userBookController.getPagesFromUserBook({user_id: user_id, userbook_id: userbook_id}, (err, pages) => {
              if (err) return res.status(500).send({ error: err });
              foundStudent.total_pages_read += pages;
              foundStudent.save((err) => {
                if (err) return res.status(500).send({ error: err });
                const tempActivityLog = new ActivityLog({
                  user_id: user_id,
                  userbook_id: foundUserBook._id,
                  student_id: foundStudent._id,
                  activity_type: "CHECKIN",
                  activity_date: currDate
                });
                tempActivityLog.save((err) => {
                  if (err) return res.status(500).send({ error: "Error Saving ActivityLog" });
                  res.status(200).send({ message: "Successful CHECKIN" });
                });
              });
            })
          });
        } else {
          res.status(404).send({ error: "Unable to Find UserBook" });
        }
      });
    } else {
      res.status(404).send({ error: "Unable to Find Student" });
    }
  });
});

/**
 * In: {user_id, student_id, student_info}
 * 
 * This will be a all purpose edit option for students, taking in all updated student info
 * 
 * Out: {student_info}
 */
router.post("/edit/:sid", (req, res) => {
  const user_id = req.user_id;
  const student_id = req.params["sid"];
  if (!student_id || student_id === undefined) {
    return res.status(400).send({ error: "Invalid student_id" });
  }
  const student_info = {...req.body};
  Students.findOne({ _id: student_id, user_id: user_id }, (err, foundStudent) => {
    if (err) return res.status(500).send({ error: err });
    if (foundStudent) {
      foundStudent.classroom_name = (student_info.classroom_name !== undefined)
        ? student_info.classroom_name : foundStudent.classroom_name;
      foundStudent.email =
        student_info.email !== undefined
          ? student_info.email
          : foundStudent.email;
      foundStudent.favorite_genre =
        student_info.favorite_genre !== undefined
          ? student_info.favorite_genre
          : foundStudent.favorite_genre;
      foundStudent.reading_level =
        student_info.reading_level !== undefined
          ? student_info.reading_level
          : foundStudent.reading_level;
      foundStudent.name =
        student_info.name !== undefined ? student_info.name : foundStudent.name;
      foundStudent.number =
        student_info.number !== undefined
          ? student_info.number
          : foundStudent.number;
      foundStudent.save((err, newStudent) => {
        if (err) return res.status(500).send({ error: err });
        res.status(200).send(newStudent);
      });
    } else {
      res.status(404).send({ error: "Unable to Find Student" });
    }
  });
});

router.delete("/:sid", (req, res) => {
  const user_id = req.user_id;
  const student_id = req.params["sid"];
  if (!student_id || student_id === undefined) {
    return res.status(400).send({ error: "Invalid student_id" });
  }
  Students.deleteOne({ _id: student_id, user_id: user_id }, (err, deletedStudent) => {
    if (err) return res.status(500).send({ error: err });
    if (deletedStudent.deletedCount > 0) {
      res.status(410).send({ message: "Sucessfully Deleted" });
    } else {
      res.status(404).send({ error: "No Student Found to Delete" });
    }
  });
});

module.exports = router;