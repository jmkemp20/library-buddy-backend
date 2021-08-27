const express = require("express");
const router = express.Router();
const { Students } = require("../models/student-model");

router.get("/", (req, res) => {
    console.log(`Getting students with: ${req.user_id}`);
    const user_id = req.user_id;
    Students.find({ user_id: user_id }, (err, students) => {
        if (err)
            return res.status(500).send({ error: "Unable to Find Students" });
        if (students) {
            res.status(200).send({ message: "students" });
        } else {
            res.status(500).send({ error: "No Students Found" });
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

router.get("/:sid/books", (req, res) => {
    const student_id = req.params["sid"];
    const user_id = req.user_id;
    if (!student_id || student_id === undefined) {
      return res.status(400).send({ error: "No StudentID Provided" });
    }
    Students.find(
      { user_id: user_id, _id: student_id },
      (err, foundStudent) => {
        if (err)
          return res.status(500).send({ error: "Error Finding Student" });
        if (foundStudent) {
          res.status(200).send(foundStudent.checkout_list);
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
})

module.exports = router;