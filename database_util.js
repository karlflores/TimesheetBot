// This is only for development work
require('dotenv').config()

const mongo = require('mongodb')
const mongoose = require('mongoose')

// read in the password and username for the database from the env variables 
const password = process.env.DB_PW 
const username = process.env.DB_UN

// for username access. 
var uri = `mongodb+srv://${username}:${password}@timesheets-82gmj.mongodb.net/test?retry\
	Writes=true&w=majority`

// Object storing the collections in our database 
const COLLECTIONS = {
	timesheets: "timesheets",
	users: "users",
}
const DATABASE = "timesheet"

// this is for local mongodb development 
const server = 'mongodb://localhost:27017/timesheet' 

// get all users stored in the database 
getUsers = (callback) => {
	mongo.connect(uri, (err,db) => {
		var dbo = db.db(DATABASE)

		// connect to the right collection and get all messages 
	})
}

findAllFromCollection = (collection, query, callback) => {
	_res = mongo.connect(uri, function(err, db) {
		// error check first 
		if (err) throw err;

		// get the right database 
		var dbo = db.db(DATABASE)
		
		// connect to the right collection and get an array of all messages 
		dbo.collection(collection)
					.find(query)
					.toArray((err,res)=>{

			if(err) throw err;	
			// return the message using the callback function passed 
			callback(res) 
		})	

		db.close();
	});	
	
}

// get all user messages from the database given a uri 
getUserMessages = (msg,_uid,callback) => {
	_res = mongo.connect(uri, function(err, db) {
		// error check first 
		if (err) throw err;

		// get the right database 
		var dbo = db.db(DATABASE)
		
		// connect to the right collection and get an array of all messages 
		dbo.collection(COLLECTIONS.timesheets)
					.find({_uid})
					.toArray((err,res)=>{

			if(err) throw err;
			
			// return the message using the callback function passed 
			callback(msg,res) 

		})	

		db.close();
	});	
}

// function to delete a message using its message id
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

// create and update happen in the same function 
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

			dup = res.length > 0;
			console.log("Considering the following...")
			console.log(res,'\n')
			
			// if there is already a message in the database we can just update 
			// that message with the updated message.
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
				console.log("ADDING ENTRY TO THE DATABASE...")
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
