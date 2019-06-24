require('dotenv').config()

const fs = require('fs')
const db = require('./database.js')
const re = require('./utils/regexp.js')
const reports = require('./utils/reports.js')
const utils = require('./utils/processingUtils.js')
const callbacks = require('./utils/callbacks.js')
const Discord = require('discord.js')
const client = new Discord.Client()

// loading the help and formatting messages 
var helpMessage = fs.readFileSync('./public/help.csv').toString()
var formatMessage = fs.readFileSync('./public/format.csv').toString()

// function to sync all messages in a discord channel with the database
async function syncAllMessages(msg){
	msg.channel.send("... database update in process ...")
	var limit = 100;
	// get the channel which the message was sent from 
	// need to ensure that we are fetching all messages sent, not just the top 50
	
	// we need to figure out the number of messages sent, then we need
	// to fill up a buffer of messages that we have read.
	userMessages = []
	before = undefined 	
	// we need to build a function that gets all messages, puts them in userMessages,
	// and continues to scan for more messages past a particular point.	
	while(limit != 0){
		if(before === undefined) query = {limit}
		else query = {limit,before}
		await msg.channel.fetchMessages(query).then(messages =>{ 

			if(!messages) return;
			// add all messages to userMessages 	
			messages.array().forEach(m =>{
				userMessages.push(m)
				before = m.id; 
			})

			limit = messages.array().length
			//console.log(limit)
		// after this is finished then we can say we finished updating 
		})
		.catch(err => {
			console.error(err)
		})
	}
	
	const filteredMessages = userMessages.filter(m => (!m.author.bot &&
									m.content.search(re.formattingRE)===0))
		
	await updateAllMessages(filteredMessages)
		.then(()=>{})
		.catch(err => {console.error(err)})	
	
	await updateAllUsers(filteredMessages)
		.then(()=>{})
		.catch(err => {console.error(err)})	
}

// function to update all messages in the database 
async function updateAllMessages(userMessages){
	var i = 0
	console.log(`Updating ${userMessages.length} messages...`)
	
	for(i = 0 ; i < userMessages.length ; i++){
		// we just want to update each message if the contents of the message
		// if the contents of the message is validated 
		console.log("Currently updating ", i, userMessages[i].id) 
		if(userMessages[i].content.search(re.formattingRE) != 0) continue;

		await db.updateTimesheet(utils.createPayload(userMessages[i])).then()
			.catch(err => {console.log(err)})
	}
}

// function to update all users in the database 
async function updateAllUsers(userMessages){
	var i = 0
	console.log(`Updating ${userMessages.length} messages...`)
	var userSet = new Set()	
	var userInfoSet = new Set()
	for(i = 0 ; i < userMessages.length ; i++){
		// we just want to update each message if the contents of the message
		// if the contents of the message is validated 
		console.log("Currently updating ", i, userMessages[i].id) 
		if(userMessages[i].content.search(re.formattingRE) != 0) continue;
		
		// create the message payload 
		msgPayload = utils.createPayload(userMessages[i])
		user = {
			_id: msgPayload._uid,
			_username: msgPayload._username,
			_cid: msgPayload._cid,
			admin: false,
			moderator: false,
		}	
		// get the username, uid and callsign, initially set the admin/mod 
		// flag to false
		// first check if uid is in userSet 
		// TODO - WE NEED TO LOOK AT A BETTER WAY TO DO THIS 
		if(userSet.has(msgPayload._uid)){
			// check if this payload is already in the userInfoSet,
			// if it is, then there is some sort of error in the callsign
			// need to manually recify this in the database 
			if(!userInfoSet.has(user)) console.error("CALLSIGN ERROR: ", 
								user._username, " : ", user._cid)
		}

		userInfoSet.add(user)
		userSet.add(user._id)
		console.log(user._cid, user._username)	
		// now for each user we need to add them to the database of users
		await db.updateUser(user).then().catch(err => {console.log(err)})
	}
}



// login to the server that we want to connect to 
client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}`)
})

// this should only be called if we are editing 
// a timesheet entry --> therefore we should
// check the message with the regexp 
client.on('messageUpdate', async (oldMsg,newMsg)=>{
	if(!oldMsg.guild) return; 
	if(!newMsg.guild) return; 
	
	if(oldMsg.content.search(re.formattingRE) != 0) return;
	if(newMsg.content.search(re.formattingRE) != 0) return;
	
	// we will only create a payload and update the database if 
	// the contents of the body is a timesheet
	msg = utils.createPayload(newMsg)
	//db.wrap(db.queue(db.updateTimesheet(utils.createPayload(msg))))	
	await db.updateTimesheet(utils.createPayload(newMsg))
	oldMsg.reply("Patrol Entry Successfully Edited...")
	//console.log("Update Message: \n",msg)
})

// If a user deleted a message that relates to a timeStamp then we need to delete that
// from the database 
client.on('messageDelete', (msg)=>{
	if(!msg) return;
	
	// we will only delete messages that have the right format
	if(msg.content.search(re.formattingRE) === 0){
			db.deleteMessage(msg.id)
	}
	if(!msg.author.bot) msg.reply("Entry Successfully Deleted...")
})

// Here is where we verify the message contents. We need to 
// ensure that the message is in the right format so that 
// our parsing will work 
client.on('message', async msg => {
	// if the message does not belong to a user/guild do nothing 
	if (!msg.guild) return;
	
	// if the message is a bot message, ignore it 
	if (msg.author.bot) return;
	
	uid = msg.author.id
	console.log(`${uid} sent message`)
	
	// case fold the message and get rid of any alpha numerics 
	// if the message contains a time entry 
	if (msg.content.search(re.formattingRE) === 0){
		// update the db 
		//db.wrap(db.queue(db.updateTimesheet(utils.createPayload(msg))))
		await db.updateTimesheet(utils.createPayload(msg))
	 	// give feedback to say their entry is successful 	
		msg.reply("Patrol Entry Successfully Created...")
	}else if(msg.content === '!time'){
		// find all messages with this id in the db 
		entries = db.getUserMessages(uid,
							callbacks.calculateTime(msg))
	}else if(msg.content === '!month'){
		let currDate = new Date() 	
		let currMonth = currDate.getMonth()

		entries = db.getUserMessages(uid,
							callbacks.calculateMonth(currMonth)(msg))
	}else if(msg.content === '!rankings'){
	
	}else if(msg.content === '!callsign'){
		// print your callsign		
	}else if(msg.content === '!help'){
		msg.channel.send(helpMessage)
	}else if(msg.content === '!format'){
		msg.channel.send(formatMessage)
	}else if (msg.content === '!sync'){
		console.log('got here')

		// only let admins sync the database 
		db.findUser(msg.author.id, user =>{
			if(user.admin){
				syncAllMessages(msg).then(() => {	
						msg.channel.send("... database update completed ...")	
						//console.log("fetched...")
				})
				.catch(err => {console.error(err)})
			}
			console.log(`User ${msg.author.id} tried to sync without admin access`)
		})

	}else if (msg.content === '!addAllUsers'){
		// go through every message sent and add all users to the database
		db.findUser(msg.author.id, user =>{
			if(user.admin){
				console.log("adding all users...")
			}
			console.log(`User ${msg.author.id} tried to sync without admin access`)
		})
	}else if(msg.content.search(/\!report/gmi) === 0){
		// send a xlsx report of all the hours completed in the server 
		db.findUser(msg.author.id, user =>{
			if(user.admin){	
				var commands = msg.content.split(" ");
				if(commands.length == 2){
					// create a csv file of each user and their hours 
					command = commands[1];
					if(command === 'fortnight'){		 
						msg.author.send('Fortnight report sending: ')
						query = reports.fortnightPred()						
					}else if(command === 'week'){
						msg.author.send('Week report sending: ')
						query = reports.weekPred()
					}else if(command === 'year'){
						msg.author.send('Year report sending: ')
						query = reports.yearPred()
					}else if(command === 'all'){
						msg.author.send('Complete report sending: ')
						// get all messages from timestamp 0
						query = {'_timestamp' : {$gt: new Date(0)}}
					}else{
						// default to month 
						msg.author.send('Month report sending: ')
						query = reports.monthPred()
					}	
					msg.author.send('Month report sending: ')
					reports.timeReport(msg.author)(query)	
					return 
				}
				// default behaviour is monthly stats 
				reports.timeReport(msg.author)(reports.monthPred())
			}
		})
	}
})

// when you add a memeber to the database, add them to the database, -- admin can set their callsign 

client.on('guildMemberAdd', member => {
	console.log(member)
})

client.login(process.env.BOT_TOKEN)
