// lets first just output a csv file containing all info
const db = require('../database.js')
const utils = require('./processingUtils.js')
const fs = require('fs')
// define some predicates that will deal with the times 

monthPred = () => {
    // get the current date 
    currDate = new Date() 
    // get the prev Month 
    prev = currDate.setMonth(currDate.getMonth() - 1);
    return {'_timestamp': {$gt: new Date(prev)}}
}

weekPred = () => {
    // get the current date 
    currDate = new Date() 
    // get the prev Month 
    prev = currDate.setDate(currDate.getDate() - 7);
    return {'_timestamp': {$gt: new Date(prev)}}
}


yearPred = () => {
    // get the current date 
    currDate = new Date() 
    // get the prev Month 
    prev = currDate.setYear(currDate.getYear() - 1);
    return {'_timestamp': {$gt: new Date(prev)}}
}

// find all messages from the last two weeks 
fortnightPred = () => {
    // get the current date 
    currDate = new Date() 
    // get the prev Month 
    prev = currDate.setDate(currDate.getDate() - 14);
    return {'_timestamp': {$gt: new Date(prev)}}
}

// do a simple time report 
timeReport = sendTitle => author => pred => {
    // get all the message in the database 
    db.getMessagesQuery(pred, arr => {

        // get the officer dict and do whats necessary 
        getOfficerDict( dict => {
            for(i = 0 ; i < arr.length ; i++){
                res = arr[i]
                time = utils.diffTime(res.code1, res.code8);
                // for each user we want to look at the id and then add the time to the user dict
                dict[res._uid].time += time
                dict[res._uid].patrols++
            }

            // convert dict to a list and sort
            writeObjs = dictToList(dict)
            // once we have a dict of all the users time, the we can just generate the report 
            var str = 'Callsign, Patrols, Time (Hours)\n'
            for(i = 0 ; i < writeObjs.length ; i++){
                str += `${writeObjs[i].cid},${writeObjs[i].patrols},${writeObjs[i].time}\n`
            }

            fs.writeFileSync('./public/report.csv',str);

            // send the file of all duty times 
            author.send(capitalize(sendTitle) + " report: ", {files: ['./public/report.csv']})
        
        
        })
    })
}
capitalize = string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// convert the officer dict that stores the compiled hours, patrols to a sorted list 
// for printing
dictToList = dict => {
    // 
    res = [] 

    for(key in dict){
        res.push(dict[key])
    }

    // return a sorted version of res based on the time key 
    res.sort((a,b) => b.time - a.time)
    return res
}

getOfficerDict = callback => {
    // we are going to get all the officers from the database, 
    // then we are going to store all of them in a dict
    officerDict = {} 
    db.getAllUsers(arr => {
        if(!arr) console.error("NO USERS FOUND...")
        
        // else lets construct the dict 
        for(i = 0 ; i < arr.length ; i++){
            res = arr[i]
            // for each of the users lets add their id to the dict 
            officerDict[res._id] = {time: 0, cid: res._cid, patrols: 0}
        }
        callback(officerDict)
    })
}

module.exports = {
    fortnightPred,
    monthPred,
    yearPred,
    weekPred,
    timeReport
}