const mongo = require('mongodb')
const mongoose = require('mongoose')
require('dotenv').config()
const password=process.env.DB_PW

const database = 'timesheet'
const uri = `mongodb+srv://karlflores:${password}@timesheets-82gmj.mongodb.net/test?retryWrites=true&w=majority`
class Database {
	constructor(){
		this._connect();
	}
	_connect(){
		mongoose.connect(uri)
		.then(()=>{
			console.log('Database connection successful')
		})
		.catch(err => {
			console.error('Database connection error') 
		})
	}
}


module.exports = new Database() 

