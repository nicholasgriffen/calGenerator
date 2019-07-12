const { parse, stringify } = require('csv')
const { calculateDate, formatTimes } = require('./timeUtils')

const parseOptions = {
	columns: true,
	rtrim: true,
	ltrim: true,
	skip_lines_with_error: true
}

function convertToGoogleCalendarCsv(stream, startDate) {
	var output = { senior: [], junior: [] }
	let record, row, day, cohort, week, weekModifier
	while (record = stream.read()) {
		row = {
			event: {
				start: {
					dateTime: null, 
					timeZone: 'America/Denver'
				},
				end: {
					dateTime: null,
					timeZone: 'America/Denver'
				}
			},
			csv: {
			}
		}
		day = +record['Day'] || day
		week = record['Week'] ? +record['Week'].split(' ')[1] : week // Expect format like "Week":"Week 01";

		if (week > 6) {
			cohort = 'senior'
			weekModifier = week - 6
		} else {
			cohort = 'junior'
			weekModifier = week
		}

		setStartAndEndDate(row, calculateDate(startDate, weekModifier, day))
		setStartAndEndTime(row, record)
		setSubject(row, record)
		output[cohort].push(row)
	}
	return output
}

function setStartAndEndDate(row, date) {
	var formattedDate = `${date.getFullYear()}-${date.getMonth() < 9 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}-${date.getDate()}T`

	row.csv['Start Date'] = date.toLocaleDateString()
	row.csv['End Date'] = date.toLocaleDateString()

	row.event.start.dateTime = formattedDate
	row.event.end.dateTime = formattedDate
}

function setStartAndEndTime(row, record) {
	var times = formatTimes(record)

	row.csv['Start Time'] = times.start.short
	row.csv['End Time'] = times.end.short

	row.event.start.dateTime += times.start.long
	row.event.end.dateTime += times.end.long
}

function setSubject(row, record) {
	var summary = record['Lecture / Activity / Exercise'].toUpperCase().trim() !== record['Type'].toUpperCase().trim() ?
		`${record['Type']}: ${record['Lecture / Activity / Exercise']}` :
		`${record['Type']}`

	row.event['summary'] = summary
	row.csv['Subject'] = summary
}

function createEventObjectsAndCsvs(success, failure, date, stream) { 
	var convertedData = convertToGoogleCalendarCsv(stream, new Date(date))
	stringify(convertedData.senior.map(row => row.csv), (err, seniorData) => {
		if (err) return failure(err)
		stringify(convertedData.junior.map(row => row.csv), (err, juniorData) => {
			if (err) return failure(err)
			return success({
				csv: {
					senior: seniorData,
					junior: juniorData
				},
				calendar: {
					senior: convertedData.senior.map(row => row.event),
					junior: convertedData.junior.map(row => row.event)
				}
			})
		})
	})
}

module.exports = {
	makeCsv: (req, res, next) => {
		Promise.all(req.sheetData.map(sheetData => {
			return new Promise((resolve, reject) => {
				stringify(sheetData, (err, data) => {
					if (err) return reject(err)
					parse(data, parseOptions).on('readable', function() { 
						createEventObjectsAndCsvs(resolve, reject, req.startDate, this) 
					}).on('error', e => next(e))
				})
			})
		})).then(parsedSheets => {
			req.csv = {
				senior: [],
				junior: []
			}

			req.calendar = {
				senior: [],
				junior: []
			}

			parsedSheets.forEach(sheet => {
				req.calendar.senior.push(sheet.calendar.senior)
				req.calendar.junior.push(sheet.calendar.junior)
				req.csv.junior.push(sheet.csv.junior)
				req.csv.senior.push(sheet.csv.senior)
			})

			req.calendar.senior = req.calendar.senior.flat()
			req.calendar.junior = req.calendar.junior.flat()

			req.csv.senior = req.csv.senior.reduce((acc, val) => acc + val, 'Start Date,End Date,Start Time,End Time,Subject\n')
			req.csv.junior = req.csv.junior.reduce((acc, val) => acc + val, 'Start Date,End Date,Start Time,End Time,Subject\n')

			next()

		}).catch(e => console.error(e))
	}
}


