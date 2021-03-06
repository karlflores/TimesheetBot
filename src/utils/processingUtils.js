// RegExps to validate and search for fields in the message
const re = require('./regexp.js')

/* Function parses the time in a given format */
parseTime = function(time){
	//console.log(time)	
	// times will be in the format 00:00 0000 or 0:00am/pm
	timeRaw = time.replace(":","")	
	timeT = timeRaw.match(re.timeRE)[0]
	timeOnly = timeT.match(re.timeOnlyRE)[0]	
	console.log("ORIGINAL : ",timeRaw)
	console.log("REGEX : ", timeT)
	console.log("TIMEONLY : ", timeOnly)

	// now we have to convert the minutes and hours to ints 
	var timeObj;	
	// if this is 24 hour time 
	timeObj = convertTime(timeOnly)

	// first we have to convert the time to 24 hour time 
	if(timeObj.hours === 24) timeObj.hours = 0;
	
	// convert 12 hour format to 12 hour format 
	if(timeRaw.includes("pm") && timeObj.hours < 12){
		timeObj.hours = (timeObj.hours + 12)%24	
	}else if(timeObj.hours == 12 && timeRaw.includes("am")){
		timeObj.hours = 0;
	}
	
	console.log(timeObj.hours, timeObj.mins)	
	// the date is irrelevant here, We only care for the time. 
	var dateTimeObj = new Date()
	dateTimeObj.setFullYear(2019,0,1)
	dateTimeObj.setSeconds(0)
	dateTimeObj.setMilliseconds(0)
	dateTimeObj.setHours(timeObj.hours)
	dateTimeObj.setMinutes(timeObj.mins)
	console.log(dateTimeObj)
	return dateTimeObj	
}

convertTime = (time) => {
	console.log(time.length)
	var hours, mins;
	// if the length of time is 3, then we know for sure that 
	if(time.length === 4){
		hours = parseInt(timeT.substring(0,2))
		mins = parseInt(timeT.substring(2,4))
	}else if(time.length === 3){
		hours = parseInt(timeT.substring(0,1))
		mins = parseInt(timeT.substring(1,3))		
	}
	return {hours,mins}
}

// calculate the difference in hours between two times (end - start) 
diffTime = (start,end)=>{
	// this sets the date based on the current time 
	// if the end time is < start time then we know that
	// the the end time occured after midnight thus increment the day 
	if(end < start) end.setDate(end.getDate()+1); 
	
	// now we can just return the time for each day
	return parseFloat(end - start)/1000/60/60
	
}

// process the code1/8, and time for a given message  
parseCodeTimes = function(codeMsg){
	// this will be in the form code 1 [delim] time
	// get the time first 
	//console.log(codeMsg)
	time = codeMsg.match(re.timeRE)[0]
	codeMsg = codeMsg.replace(re.timeRE,'')
	// here we are replacing every thing left except the time 
	// with the empty string
	code = codeMsg.replace(/[^\w]/g,'')		
	return {code,time}
}

// process the entry
parseEntry = function(msg){
	if(!msg) console.log("wtf")
	// first lets get the callsign
	msg = msg.toLowerCase(); 
	var _cid = msg.match(re.callSignRE)[0]
	
	// then lets get start to process to process the codes 
	msg = msg.replace(re.callSignRE,'');
	msg = msg.replace(re.newLineRE,"");
	msg = msg.trimStart().trimEnd();
	// replace multispaces with nothing
	msg = msg.replace(/ +(?= )/g,'');
	
	// get the codes + times from the message 
	var codeTimes = msg.match(re.codeRE)
	var time = 0;	
	
	// Return an entry based on how many codes it found
	// make sure that if it found two codes, it found a code 8 and a code 1
	// this means we have both code1 and code8	
	if(codeTimes.length === 2){
		c1 = parseCodeTimes(codeTimes[0])
		c2 = parseCodeTimes(codeTimes[1])
		console.log(c1,c2)
		if(c1.code.search(/code1/g) === -1 
				&& c2.code.search(/code8/g) === -1) return null
		return {_cid,code1:parseTime(c1.time),code8:parseTime(c2.time)};	
	}
	//console.log(time)
	c1 = parseCodeTimes(codeTimes[0])
	console.log(c1)
	if(c1.code != 'code1') return null
	return {_cid,code1:parseTime(c1.time),code8:undefined};	
}

createPayload = (msg) => {
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
	//console.log(payload)
	return payload
}

module.exports = {
	parseTime,
	parseCodeTimes,
	parseEntry,
	createPayload,
	diffTime
}
