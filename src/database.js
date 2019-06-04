// This is only for development work
require('dotenv').config()

const mongo = require('mongodb')

// read in the password and username for the database from the env variables 
const password = process.env.DB_PW 
const username = process.env.DB_UN

// for username access. 
var uri = `mongodb+srv://${username}:${password}@timesheets-82gmj.mongodb.net/test?retryWrites=true&w=majority`

// Object storing the collections in our database 
const COLLECTION = {
	timesheets: "timesheetEntriesDev",
	users: "users",
}
const DATABASE = "TimesheetBot"

// this is for local mongodb development 
const server = 'mongodb://localhost:27017/timesheet' 

// function to find all from a collection 
findAllFromCollection = (collection, query, callback) => {
	_res = mongo.connect(uri, function(err, db) {
		// error check first 
		if (err) throw err;

		// get the right database 
		var dbo = db.db(DATABASE)
		
		// connect to the right collection and get an array of all messages 
		dbo.collection(collection).find(query).toArray((err,res)=>{
			if(err) throw err;	
			// return the message using the callback function passed 
			console.log(res)
			callback(res) 
		})	
		db.close();
	});		
}

// get all user messages from the database given a uri 
getUserMessages = (_uid,callback) => {
	findAllFromCollection(COLLECTION.timesheets, {_uid}, callback);
}

getAllUsers = (_uid,callback) => {
	findAllFromCollection(COLLECTION.users, {_uid}, callback);
}

// function to delete a message using its message id
deleteMessage = function(_id){
	_res = mongo.connect(uri, function(err, db) {
		var dbo = db.db(DATABASE)
		if (err) throw err;
		dbo.collection(COLLECTION.timesheets).deleteOne({_id},(err,obj)=>{
			if(err) throw err;
			console.log(`One Entry (${_id}) Deleted...`)
			db.close();
		})	
	});	
}

// function to delete a message using its message id
deleteUser = function(_id){
	_res = mongo.connect(uri, function(err, db) {
		var dbo = db.db(DATABASE)
		if (err) throw err;
		dbo.collection(COLLECTION.user).deleteOne({_id},(err,obj)=>{
			if(err) throw err;
			console.log(`One Entry (${_id}) Deleted...`)
			db.close();
		})	
	});	
}

// create and update happen in the same function 
updateTimesheet = function(payload){

	// lets parse the payload first 
	query = {_id:payload._id};	
	updated = {_uid:payload._uid,
			_cid:payload._cid,
			code1:payload.code1,
			code8:payload.code8,
			_username:payload._username}	
		
	console.log("USING MESSAGE WITH ID: ", query)		
		
	mongo.connect(uri, function(err, db) {
		var dbo = db.db(DATABASE)
		if (err) throw err;

		// check is there is an entry in the db already
		dbo.collection(COLLECTION.timesheets).find(query).toArray((err,res)=>{
			if(err) throw err;

			dup = res.length > 0;
			console.log("Considering the following...")
			console.log(res,'\n')
			
			// if there is already a message in the database we can just update 
			// that message with the updated message.
			if(dup === true){
				// if there is an existing collection we just need to update the 
				// values of this entry 
				dbo.collection(COLLECTION.timesheets)
							.updateOne(query,{$set:updated}, (err,res)=>{

					if(err) throw err;	
					
					console.log(`Updating ${payload._username} entry`);
				});

			}else{					
				// if there is nothing, we just need to add this message to the 
				// timesheet 
				console.log("ADDING ENTRY TO THE DATABASE...")
				dbo.collection(COLLECTION.timesheets)
							.insertOne(payload, (err,res)=>{

					if(err) throw err;							
					console.log(`Adding ${payload._username} entry`);

				});
			}
			db.close();
		});
	});
}

module.exports = {
	updateTimesheet,
	getUserMessages,
	deleteMessage
}
