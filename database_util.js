const mongo = require('mongodb')
const mongoose = require('mongoose')
require('dotenv').config()

const password = process.env.DB_PW 

var uri = `mongodb+srv://karlflores:${password}@timesheets-82gmj.mongodb.net/test?retryWrites=true&w=majority`
const COLLECTIONS = {
	timesheets: "timesheets",
	users: "users",
}
const DATABASE = "timesheet"
const server = 'mongodb://localhost:27017/timesheet' 
//uri = 'mongodb://localhost:27017/timesheet'

getUserMessages = (msg,_uid,callback) => {
	_res = mongo.connect(uri, function(err, db) {
		var dbo = db.db(DATABASE)
		if (err) throw err;
		dbo.collection(COLLECTIONS.timesheets)
					.find({_uid})
					.toArray((err,res)=>{

			if(err) throw err;
			console.log(res)
			callback(msg,res) 

		})	

		db.close();
	});	
}

deleteMessage = function(_id){
	_res = mongo.connect(uri, function(err, db) {
		var dbo = db.db(DATABASE)
		if (err) throw err;
		dbo.collection(COLLECTIONS.timesheets).deleteOne({_id},(err,obj)=>{
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
	
	mongo.connect(uri, function(err, db) {
		var dbo = db.db(DATABASE)
		if (err) throw err;

		// check is there is an entry in the db already
		dbo.collection(COLLECTIONS.timesheets).find(query).toArray((err,res)=>{
			if(err) throw err;
			dup = false;
			dup = res.length > 0;
			console.log(dup,res.length)
			console.log(res)
			if(dup === true){
				// if there is an existing collection we just need to update the 
				// values of this entry 
				dbo.collection(COLLECTIONS.timesheets)
							.updateOne(query,{$set:updated}, (err,res)=>{

					if(err) throw err;	
					console.log(`Updating ${payload._username} entry`);

				});

			}else{					
				// if there is nothing, we just need to add this message to the 
				// timesheet 
				console.log("ADDING ELEMENT")
				dbo.collection(COLLECTIONS.timesheets)
							.insertOne(payload, (err,res)=>{

					if(err) throw err;							
					console.log(`Adding ${payload._username} entry`);

				});

			}
			db.close();
		});
	});
}

module.export = {
	update:update,
	getUserMessages:getUserMessages,
	deleteMessage:deleteMessage
}
