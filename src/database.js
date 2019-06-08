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
	timesheets: "timesheet",
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
	_res = mongo.connect(uri, function(err, db) {
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
async function updateTimesheet(payload){

	// lets parse the payload first 
	query = {_id:payload._id};	
	updated = {_uid:payload._uid,
			_cid:payload._cid,
			code1:payload.code1,
			code8:payload.code8,
			_username:payload._username}	

	mongo.connect(uri).then(async db => {
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

// create and update happen in the same function 
async function updateTimesheet_old(payload){

	// lets parse the payload first 
	query = {_id:payload._id};	
	updated = {_uid:payload._uid,
			_cid:payload._cid,
			code1:payload.code1,
			code8:payload.code8,
			_username:payload._username}	

	await mongo.connect(uri, async function(err, db){
		var dbo = db.db(DATABASE)
		if (err) throw err;
		// acquire the lock 
		
		// check is there is an entry in the db already		
		await dbo.collection(COLLECTION.timesheets).find(query)
										.toArray(async function(err,res){
			if(err) throw err;
			// if there is already a message in the database we can just update 
			// that message with the updated message.
			if(res.length > 0){
				res.forEach(m=>console.log(m))
				console.log(res)
				// if there is an existing collection we just need to update the 
				// values of this entry 
				await dbo.collection(COLLECTION.timesheets)
							.updateOne(query,{$set:updated},async function(err,res){

					if(err) throw err;			
					console.log(`Updated ${payload._id} entry`);
					// release the lock when finished
				});

			}else{					
				// if there is nothing, we just need to add this message to the 
				// timesheet 
				await dbo.collection(COLLECTION.timesheets)
							.insertOne(payload, async function(err,res){

					if(err) throw err;							
					console.log(`Added ${payload._id} entry`);
				});
			}
			db.close();
		});
	});
}

// use promise chaining to handle this 
function queue(fn){
	var lastPromise = Promise.resolve();
	return (req) => {
		var returnedPromise = lastPromise.then(() => fn(req));
		lastPromise = returnedPromise.catch(()=>{});
		return returnedPromise;
	}
}

// function to wrap the promesies
function wrap(fn) {
  return function(req, res, next) {
    fn(req).then(returnVal => res).catch(err => console.log(err));
  };
}

module.exports = {
	wrap,
	queue,
	updateTimesheet,
	getUserMessages,
	deleteMessage
}
