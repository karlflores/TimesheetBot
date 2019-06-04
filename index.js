require('dotenv').config()
require('./database_util.js')
const Discord = require('discord.js')
const client = new Discord.Client()

// we will use the id of the message as the hask
// this will store a start and end time
var timestraps = {}
var callSignRegExp = new RegExp(/[a-z]-[0-9]{3}/g)
var timeRegExp = new RegExp(/[\d]{1,2}[:]*[\d]{2}/g)
var newLineRegExp = new RegExp(/[\n]/g) 
var codeRegExp = new RegExp(/code[\s]*[18][\s]*[:-]*[\s]*[\d]{1,2}[:]*[\d]{2}[\s]*(am|pm|)/g)
var timeRegExp = new RegExp(/[\d]{1,2}[:]{0,1}[\d]{2}(am|pm){0,1}/g)
var formattingRE = new RegExp(/[a-z][\;\-\:]*[0-9]{3}[\n\s]*(code[\s]*[18][\s]*[:-]*[\s]*[\d]{1,2}[:]*[\d]{2}[\s]*(am|pm|)[\n\s]*){1,2}/gmi)


parseTime = function(time){
	// times will be in the format 00:00 0000 or 0:00am/pm
	time = time.replace(":","")	
	timeT = time.match(timeRegExp)[0]
	//console.log(`time : ${timeT.length}`)	
	// now we have to convert the minutes and hours to ints 
	if(timeT.length === 4){
		hours = parseInt(timeT.substring(0,2))
		mins = parseInt(timeT.substring(2,4))
	}else if(timeT.length === 3){
		hours = parseInt(timeT.substring(0,1))
		mins = parseInt(timeT.substring(1,3))	
	}
	//console.log(hours,mins,timeT.substring(2,4))
	// first we have to convert the time to 24 hour time 
	if(hours === 24) hours = 0;
	if(time.includes("pm") && hours < 12){
		hours = (hours + 12)%24	
	}else if(hours == 12){
		if(time.includes("am")){
			hours = 0;
		}
	}
	// json object to store the time
	return {hours,mins}	
}

// calculate the difference in hours between two times (end - start) 
diffTime = (start,end)=>{
	//console.log(start,end)
	
	var d1 = new Date()
	var d2 = new Date(d1)
	d1.setFullYear(2019,0,1)
	d2.setFullYear(2019,0,1)
		
	// this sets the date 	
	if(end.hours < start.hours){
		d2.setDate(2)
	} else if(end.hours == start.hours && end.mins < start.mins){
		d2.setDate(2)	
	} 
	
	// now we can set the time for each day 
	d1.setMinutes(start.mins)
	d1.setHours(start.hours)
	d2.setMinutes(end.mins)
	d2.setHours(end.hours)
	return parseFloat(d2 - d1)/1000/60/60
	
}

// process the code1/8, and time for a given message  
parseCodes = function(codeMsg){
	// this will be in the form code 1 [delim] time
	// get the time first 
	//console.log(codeMsg)
	time = codeMsg.match(timeRegExp)[0]
	codeMsg = codeMsg.replace(timeRegExp,'')
	code = codeMsg.replace(/[^\w]/g,'')	
	//console.log(time,codeMsg)
	//console.log({code,time: parseTime(time)})
	
	return {code,time}
}

// process the entry
parseEntry = function(msg){

	// first lets get the callsign
	msg = msg.toLowerCase(); 
	var _cid = msg.match(callSignRegExp)[0]
	
	// then lets get start to process to process the codes 
	msg = msg.replace(callSignRegExp,'');
	msg = msg.replace(newLineRegExp,"");
	msg = msg.trimStart().trimEnd();
	msg = msg.replace(/ +(?= )/g,'');
	
	codes = msg.match(codeRegExp)
	//console.log({_id,codes})
	var time = 0;	
	// this means we have both code1 and code8	
	if(codes.length === 2){
		c1 = parseCodes(codes[0])
		c2 = parseCodes(codes[1])
		return {_cid,code1:parseTime(c1.time),code8:parseTime(c2.time)};	
	}
	//console.log(time)
	return {_cid,code1:parseTime(parseCodes(codes[0]).time),code8:undefined};	
}

createPayload = (msg) =>{
	_id = msg.id 
	_username = msg.author.username;
	_uid = msg.author.id
	_timestamp = new Date(msg.createdTimestamp)
	parsedMsg = parseEntry(msg.content)

	payload = {
		_uid,
		_cid:parsedMsg._cid,
		_username,
		_id,
		code1: parsedMsg.code1,
		code8: parsedMsg.code8,
		_timestamp
	}
	console.log(payload)
	return payload
}

// login to the server that we want to connect to 
client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}`)
})

// this should only be called if we are editing 
// a timesheet entry --> therefore we should
// check the message with the regexp 
client.on('messageUpdate', (oldMsg,newMsg)=>{
	if(!oldMsg.guild) return; 
	if(!newMsg.guild) return; 
	
	if(oldMsg.content.search(formattingRE) != 0) return;
	if(newMsg.content.search(formattingRE) != 0) return;
	
	// we will only create a payload and update the database if 
	// the contents of the body is a timesheet
	msg = createPayload(newMsg)
	update(msg)	
	oldMsg.reply("Patrol Entry Successfully Edited...")
})

client.on('messageDelete', (msg)=>{
	if(!msg) return;
	
	// we will only delete messages that have the right format
	if(msg.content.search(formattingRE) === 0){
			deleteMessage(msg.id)
	}
	msg.reply("Entry Successfully Deleted...")
})
// calculate the total time on patrol for a specific call sign 
// this is passed to a callback returns the db entries 
calculateTime = (msg, entries) =>{
	let time = 0
	
	// for all entries we want to go through them if they exist 
	// add up all the ones for which there are both code 1 and code 8 
	// entries 
	if(entries.length > 0){
		for(i = 0 ; i < entries.length ; i++){
			// ensure we are only adding those that exist
			if(entries[i].code1 && entries[i].code8){
				time += diffTime(entries[i].code1,entries[i].code8)
			}
		}
		// reply to the message, stating the total number of hours 
		// patrolled
		msg.reply(`${time.toFixed(2)} hours on patrol in total`)
	}else{
		msg.reply(`No patrols completed...`)
	}		
	return time;
}

calculateMonth = (msg, entries) =>{
	let time = 0
	let currDate = new Date() 	
	let currMonth = currDate.getMonth()
	// for all entries we want to go through them if they exist 
	// add up all the ones for which there are both code 1 and code 8 
	// entries 
	if(entries.length > 0){
		for(i = 0 ; i < entries.length ; i++){
			console.log(entries[i])
			// ensure we are only adding those that exist
			if(entries[i].code1 && entries[i].code8 && 
					entries[i]._timestamp.getMonth() === currMonth){
				time += diffTime(entries[i].code1,entries[i].code8)
			}
		}
		// reply to the message, stating the total number of hours 
		// patrolled
		msg.reply(`${time.toFixed(2)} hours on patrol in total`)
	}else{
		msg.reply(`No patrols completed...`)
	}		
	return time;
}

// Here is where we verify the message contents. We need to 
// ensure that the message is in the right format so that 
// our parsing will work 
client.on('message', (msg)=>{
	// if the message does not belong to a user/guild do nothing 
	if (!msg.guild) return;
	uid = msg.author.id
	console.log(uid)
	
	// case fold the message and get rid of any alpha numerics 
	// if the message contains a time entry 
	if (msg.content.search(formattingRE) === 0){
		console.log("Added Entry into DB...")
		// update the db 
		update(createPayload(msg))
	 	// give feedback to say their entry is successful 	
		msg.reply("Patrol Entry Successfully Created...")
	}else if(msg.content === '!time'){
		// find all messages with this id in the db 
		entries = getUserMessages(msg,uid,calculateTime)
	}else if(msg.content === '!month'){
		entries = getUserMessages(msg,uid,calculateMonth)
	}else if(msg.content === '!rank'){
	
	}else if(msg.content === '!callsign'){
			
	}else if(msg.content === '!setCallsign'){
	
	}else if(msg.content === '!help'){
		msg.reply("TimesheetBot Commands Help:\n\n!help - Bring up a list of commands\n!callsign - Your stored callsign\n!setCallsign - Assign your callsign\n!time - Find the number of hours you have been on patrol\n!format - The way you should format the timesheet entries\n!rank - get a ranking of the top 10 officers who have worked the most\n!month - duty hours for the current month")
	}else if(msg.content === '!format'){
		msg.reply("Timesheet Entry Formatting Information\n\n<Callsign>\nCode 1 : <time>\nCode 8: <time>\n\nCode 8 should be an edit to your initial Code 1 entry...\n\nExample:\nX-900\nCode 1 : 02:00\nCode 8: 10:00\n\nTime does not need specific timezone identifiers.\nTimes can also be in the format 11:00pm, 2300 or 23:00")
	}
})

client.on('guildMemberAdd', member => {
	console.log(member)
})

client.login(process.env.BOT_TOKEN)
