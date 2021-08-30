const express = require("express");
const router = express.Router();
const { ActivityLog } = require("../models/activity-log-model");
const { Students } = require("../models/student-model");
const { Users } = require("../models/user-model");
const userBookController = require("../controllers/user-book-controller");

router.get("/", (req, res) => {
    console.log(`Getting Activity with: ${req.user_id}`);
    const user_id = req.user_id;
    ActivityLog.find({ user_id: user_id }, (err, activity) => {
        if (err)
            return res.status(500).send({ error: "Unable to Find Activity" });
        if (activity) {
            const return_data = [];
            if (activity.length == 0) {
                res.status(200).send(return_data);
            }
            for (let i = 0; i < activity.length; i++) {
                userBookController.getUserBook({user_id: user_id, userbook_id: activity[i].userbook_id}, (err, userBookInfo) => {
                    if (err) return res.status(500).send({error: err});
                    Students.findOne({ _id:  activity[i].student_id }, (err, student) => {
                        if (err) return res.status(500).send({error: err});
                        temp_data = {
                            ...activity[i].toJSON(),
                            ...userBookInfo,
                            ...student.toJSON()
                        }
                        return_data.push(temp_data);
                        if (return_data.length === activity.length) {
                            res.status(200).send(return_data);
                        }
                    });
                });
            }
        } else {
            res.status(500).send({ error: "No Activity Found" });
        }
    });
});

router.get("/recent", (req, res) => {
    console.log(`Getting Activity with: ${req.user_id}`);
    const user_id = req.user_id;
    Users.findOne({ _id: user_id }, (err, user) => {
        if (err) return res.status(500).send({ error: err });
        const query = {
            user_id: user_id,
            activity_date: {$gt: user.last_login},
        };
        ActivityLog.find(query, (err, activity) => {
            if (err)
                return res.status(500).send({ error: "Unable to Find Activity" });
            if (activity) {
                const return_data = [];
                if (activity.length == 0) {
                    res.status(200).send(return_data);
                }
                for (let i = 0; i < activity.length; i++) {
                    userBookController.getUserBook({user_id: user_id, userbook_id: activity[i].userbook_id}, (err, userBookInfo) => {
                        if (err) return res.status(500).send({error: err});
                        Students.findOne({ _id:  activity[i].student_id }, (err, student) => {
                            if (err) return res.status(500).send({error: err});
                            temp_data = {
                                ...activity[i].toJSON(),
                                ...userBookInfo,
                                ...student.toJSON()
                            }
                            return_data.push(temp_data);
                            if (return_data.length === activity.length) {
                                res.status(200).send(return_data);
                            }
                        });
                    });
                }
            } else {
                res.status(500).send({ error: "No Activity Found" });
            }
        });
    });
});

router.delete("/:alid", (req, res) => {
  const user_id = req.user_id;
  const activitylog_id = req.params["alid"];
  if (!activitylog_id || activitylog_id === undefined) {
    return res.status(400).send({ error: "Invalid userbook_id" });
  }
  ActivityLog.deleteOne({ _id: activitylog_id, user_id: user_id }, (err, deletedActivityLog) => {
      if (err) return res.status(500).send({ error: err });
      if (deletedActivityLog.deletedCount > 0) {
        res.status(410).send({ error: "Successfully Deleted" });
      } else {
          res.status(404).send({ error: "No ActivityLog Found to Delete" });
      }
  });

});

module.exports = router;
