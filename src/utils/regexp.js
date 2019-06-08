var callSignRE = new RegExp(/[a-z]-[0-9]{3}/g)
var newLineRE = new RegExp(/[\n]/g) 
var codeRE = new RegExp(/code[\s]*[18][\s]*[:-]*[\s]*[\d]{1,2}[:]*[\d]{2}[\s]*(am|pm|)/g)
var timeRE = new RegExp(/[\d]{1,2}[:]{0,1}[\d]{2}(am|pm){0,1}/g)
var formattingRE = new RegExp(/[a-z][\-\:]*[0-9]{3}[\n\s]*(code[\s]*[18][\s]*[:-]*[\s]*[\d]{1,2}[:]*[\d]{2}[\s]*(am|pm|)[\n\s]*){1,2}/gmi)

module.exports = {
	callSignRE,
	newLineRE,
	codeRE,
	timeRE,
	formattingRE
}

