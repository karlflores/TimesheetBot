const mongo = require('mongodb')
const mongoose = require('mongoose')

const server = 'mongodb://localhost:27017/timesheet' 
const url = 'mongodb://localhost:27017/timesheet'

const test1 = {
  _uid: '2110368456711822333',
  _cid: 'l-820',
  _username: 'karl_',
  _id: '5843328403836272491964',
  code1: { hours: 2, mins: 10 },
  code8: { hours: 10, mins: 1 }
}

const test2 = {
  _uid: '211236845671186422',
  _cid: 'l-820',
  _username: 'karl_',
  _id: '5843231519910543336',
  code1: { hours: 0, mins: 0 },
  code8: { hours: 3, mins: 0 }
}

const test3 = {
  _uid: '211036845671186434',
  _cid: 'l-810',
  _username: 'karl_',
  _id: '584312840383627264',
  code1: { hours: 3, mins: 0 },
  code8: { hours: 10, mins: 1 }
}

getUserMessages = (msg,_uid,callback) => {
	_res = mongo.connect('mongodb://localhost:27017/timesheet', function(err, db) {
		var dbo = db.db("timesheet")
		if (err) throw err;
		dbo.collection("timesheets").find({_uid}).toArray((err,res)=>{
			if(err) throw err;
			console.log(res)
			callback(msg,res) 
		})	
		db.close();
	});	
}

deleteMessage = function(_id){
	_res = mongo.connect('mongodb://localhost:27017/timesheet', function(err, db) {
		var dbo = db.db("timesheet")
		if (err) throw err;
		dbo.collection("timesheets").deleteOne({_id},(err,obj)=>{
			if(err) throw err;
			console.log(`One Entry (${_id}) Deleted...`)
			db.close();
		})	
	});	
}

update = function(payload){

	// lets parse the payload first 
	query = {_id:payload._id};	
	updated = {_uid:payload._uid,
			_cid:payload._cid,
			code1:payload.code1,
			code8:payload.code8,
			_username:payload._username}	
	console.log(query)		
	
	mongo.connect('mongodb://localhost:27017/timesheet', function(err, db) {
		var dbo = db.db("timesheet")
		if (err) throw err;

		// check is there is an entry in the db already
		dbo.collection("timesheets").find(query).toArray((err,res)=>{
			if(err) throw err;
			dup = false;
			dup = res.length > 0;
			console.log(dup,res.length)
			console.log(res)
			if(dup === true){
				// if there is an existing collection we just need to update the 
				// values of this entry 
				dbo.collection("timesheets").updateOne(query,{$set:updated}, (err,res)=>{
					if(err) throw err;	
					console.log(`Updating ${payload._username} entry`);
				});

			}else{					
				// if there is nothing, we just need to add this message to the 
				// timesheet 
				console.log("ADDING ELEMENT")
				dbo.collection("timesheets").insertOne(payload, (err,res)=>{
					if(err) throw err;							
					console.log(`Adding ${payload._username} entry`);
				});

			}
			db.close();
		});
	});
}

//update(test1)
//update(test2)
//update(test3)
//getUserMessages("l-810")
module.export = {
		update:update,
	getUserMessages:getUserMessages,
	deleteMessage:deleteMessage
}
