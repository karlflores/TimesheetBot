const mongoose = require('mongoose')

let timesheetSchema = new mongoose.Schema({
	_id: String,
	_cid: String,
	_uid: String,
	code1: Object,
	code8: Object,
	_username: String
})

module.exports = mongoose.model('Timesheet',timesheetSchema)
