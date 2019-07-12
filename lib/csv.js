const { parse, stringify } = require('csv')
const CalendarEvent = require('./CalendarEvent')
const Sprint = require('./Sprint')

const parseOptions = {
	columns: true,
	rtrim: true,
	ltrim: true,
	skip_lines_with_error: true
}

const headerRow = 'Start Date,End Date,Start Time,End Time,Subject\n'

function parseStreamIntoEvents(stream, startDate) {
    var output = { senior: [], junior: [] }
    var sprint = {endDate: }
	let record, day, cohort, week, weekModifier
    
	while (record = stream.read()) {
        
		day = +record['Day'] || day
		week = record['Week'] ? +record['Week'].split(' ')[1] : week // Expect format like "Week":"Week 01";
        
		if (week > 6) {
			cohort = 'senior'
			weekModifier = week - 6
		} else {
			cohort = 'junior'
			weekModifier = week
        
        }
        
		if (record['Sprint'] && sprint) {
            new Sprint(record['Sprint'])
		}

		output[cohort].push(new CalendarEvent(day, weekModifier, startDate, record))
	}
	return output
}


function createEventObjectsAndCsvs(success, failure, date, stream) { 
	var convertedData = parseStreamIntoEvents(stream, new Date(date))
	stringify(convertedData.senior.map(event => event.csv), (err, seniorData) => {
		if (err) return failure(err)
		stringify(convertedData.junior.map(event => event.csv), (err, juniorData) => {
			if (err) return failure(err)
			return success({
				csv: {
					senior: seniorData,
					junior: juniorData
				},
				api: {
					senior: convertedData.senior.map(event => event.api),
					junior: convertedData.junior.map(event => event.api)
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
				req.calendar.senior.push(sheet.api.senior)
				req.calendar.junior.push(sheet.api.junior)
				req.csv.junior.push(sheet.csv.junior)
				req.csv.senior.push(sheet.csv.senior)
			})

			req.calendar.senior = req.calendar.senior.flat()
			req.calendar.junior = req.calendar.junior.flat()

			req.csv.senior = req.csv.senior.reduce((acc, val) => acc + val, headerRow)
			req.csv.junior = req.csv.junior.reduce((acc, val) => acc + val, headerRow)

			next()

		}).catch(e => console.error(e))
	}
}


