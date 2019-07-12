
const { calculateDate, formatTimes } = require('../lib/timeUtils')

function Sprint(day, weekModifier, startDate, name) {
	this.api = {
		start: {
			timeZone: 'America/Denver'
		},
		end: {
			timeZone: 'America/Denver'
		}
	}
    
	this.csv = {
	}

	this.name = name
	this.startDate = startDate 
	
	setStartDate(this, calculateDate(startDate, weekModifier, day))
	setEndDate(this, calculateDate(startDate, weekModifier, day))
	setSubject(this, name)
}

Sprint.prototype.updateEndDate = function(endWeek, endDay) {
	setEndDate(this, calculateDate(this.startDate, endWeek, endDay))
}

function setStartDate(event, date) {
	event.csv['Start Date'] = date.toLocaleDateString()
	event.api.start.date = `${date.getFullYear()}-${date.getMonth() < 9 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}-${date.getDate()}`
}

function setEndDate(event, date) {
	event.csv['End Date'] = date.toLocaleDateString()
	event.api.end.date = `${date.getFullYear()}-${date.getMonth() < 9 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}-${date.getDate()}`

}

function setSubject(event, subject) {
	event.api['summary'] = `Big Picture: ${subject}`
	event.csv['Subject'] = `Big Picture: ${subject}`
}

module.exports = Sprint