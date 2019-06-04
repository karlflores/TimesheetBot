utils = require('./processingUtils.js')
// calculate the total time on patrol for a specific call sign 
// this is used as a callback function using the return of db entries 
calculateTime = msg => entries =>{
	let time = 0	
	// for all entries we want to go through them if they exist 
	// add up all the ones for which there are both code 1 and code 8 
	// entries 
	if(entries.length > 0){
		for(i = 0 ; i < entries.length ; i++){
			// ensure we are only adding those that exist
			if(entries[i].code1 && entries[i].code8){
				time += utils.diffTime(entries[i].code1,entries[i].code8)
			}
		}
		// reply to the message, stating the total number of hours 
		// patrolled
		msg.reply(`${time.toFixed(2)} hours on patrol.`)
	}else{
		msg.reply(`No patrols completed...`)
	}		
	return time;
}

// Calculate the number of hours for the current month
// this uses a curried version that requires a month to be 
// passed first. This month will be bound and a resulting 
// function with that month is then returned 
calculateMonth = month => msg => entries => {
	let time = 0
	// for all entries we want to go through them if they exist 
	// add up all the ones for which there are both code 1 and code 8 
	// entries 
	if(entries.length > 0){
		for(i = 0 ; i < entries.length ; i++){
			console.log(entries[i])
			// ensure we are only adding those that exist
			if(entries[i].code1 && entries[i].code8 && 
					entries[i]._timestamp.getMonth() === month){

				// add up the times yeet.
				time += utils.diffTime(entries[i].code1,entries[i].code8)
			}
		}
		// reply to the message, stating the total number of hours 
		// patrolled
		msg.reply(`${time.toFixed(2)} hours on patrol this month.`)
	}else{
		msg.reply(`No patrols completed...`)
	}		
	return time;
}

module.exports = {
	calculateMonth,
	calculateTime,
}
