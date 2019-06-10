// This is only for development work
require('dotenv').config()

const mongo = require('mongodb')

// read in the password and username for the database from the env variables 
const password = process.env.DB_PW 
const username = process.env.DB_UN

// for username access. 
const uri = `mongodb+srv://${username}:${password}@timesheets-82gmj.mongodb.net/test?retryWrites=true&w=majority`
const connectOptions = { useNewUrlParser: true } 
// Object storing the collections in our database 
const COLLECTION = {
	timesheets: "timesheet",
	users: "users",
}
const DATABASE = "TimesheetBot"

// this is for local mongodb development 
const server = 'mongodb://localhost:27017/timesheet' 

// function to find all from a collection 
findAllFromCollection = (collection, query, callback) => {
	_res = mongo.connect(uri, connectOptions, function(err, db) {
		// error check first 
		if (err) throw err;

		// get the right database 
		var dbo = db.db(DATABASE)
		
		// connect to the right collection and get an array of all messages 
		dbo.collection(collection).find(query).toArray((err,res)=>{
			if(err) throw err;	
			// return the message using the callback function passed 
			console.log(`${res.length} elements found`)
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
	_res = mongo.connect(uri, connectOptions, function(err, db) {
		var dbo = db.db(DATABASE)
		if (err) throw err;
		dbo.collection(COLLECTION.timesheets).deleteOne({_id},(err,obj)=>{
			if(err) throw err;
			console.log(`Entry (${_id}) Deleted...`)
			db.close();
		})	
	});	
}

// function to delete a message using its message id
deleteUser = function(_id){
	_res = mongo.connect(uri, connectOptions, function(err, db) {
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
async function updateUser(payload){

	// lets parse the payload first 
	query = {_id:payload._id};	

	await mongo.connect(uri, connectOptions).then(async db => {
		var dbo = db.db(DATABASE)
		// acquire the lock 	
		// we could try insert first and if there is an error, we 
		await dbo.collection(COLLECTION.users).insertOne(payload)
		.then(res => {
			console.log(`Added ${payload._id} entry into database`);
		})
		.catch(async err =>{
			// if it is a duplicate key, we just need to update the entry	
			if(err === undefined) throw err;
			// if it is a duplicate entry, then we know all we have to do
			// is update it 
			if(err.code === 11000){
				// got here...
				console.log("Trying to add user that already exists")
			}
		})
	})
	.catch(err => {
		if(err) throw err		
	})
}
// create and update happen in the same function 
async function updateTimesheet(payload){

	// lets parse the payload first 
	query = {_id:payload._id};	

	await mongo.connect(uri, connectOptions).then(async db => {
		var dbo = db.db(DATABASE)
		// acquire the lock 	
		// we could try insert first and if there is an error, we 
		// then could try update. 
		await dbo.collection(COLLECTION.timesheets).insertOne(payload)
		.then(res => {
			console.log(`Added ${payload._id} entry`);
		})
		.catch(async err =>{
			// if it is a duplicate key, we just need to update the entry	
			if(err === undefined) throw err;
			// if it is a duplicate entry, then we know all we have to do
			// is update it 
			if(err.code === 11000){
				// got here...
				await dbo.collection(COLLECTION.timesheets)
						.updateOne(query,{$set:updated})
				.then(res => {
					console.log(`Updated ${payload._id} entry`);	
				})
				.catch(err=>{
					if(err) throw err	
				})
			}
		})
	})
	.catch(err => {
		if(err) throw err		
	})
}

module.exports = {
	updateUser,
	updateTimesheet,
	getUserMessages,
	deleteMessage
}
