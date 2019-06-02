const TimesheetModel = require('./timesheets')
const mongoose = require('mongoose') 

let msg = new TimesheetModel({
  _uid: '2110368456711822333',
  _cid: 'l-820',
  _username: 'karl_',
  _id: '5843328403836272464',
  code1: { hours: 2, mins: 0 },
  code8: { hours: 10, mins: 1 }
})

msg.save()
.then(doc => {
	console.log("asss")
	console.log(doc)
})
.catch(err => {
	console.log("err")
	console.error(err)
})

console.log(msg)
