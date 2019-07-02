const { parse, stringify } = require('csv');
const { calculateDate, formatTimes } = require('./timeUtils')

const parseOptions = {
    columns: true,
    rtrim: true,
    ltrim: true,
    skip_lines_with_error: true
};

const stringifyOptions = {
    header: true,
    columns: ["Start Date", "End Date", "Start Time", "End Time", "Subject"]
}


function convertToGoogleCalendarCsv(stream, startDate) {
    var output = { senior: [], junior: [] };
    let record, row, day, cohort, week, weekModifier;
    while (record = stream.read()) {
        row = {
            start: {
                timeZone: 'America/Denver'
            },
            end: {
                timeZone: 'America/Denver'
            }
        }
        day = day || +record['Day'];
        week = record['Week'] ? +record['Week'].split(' ')[1] : week; // Expect format like "Week":"Week 01"

        if (week > 6) {
            cohort = 'senior'
            weekModifier = week - 6
        } else {
            cohort = 'junior'
            weekModifier = week
        }

        setStartAndEndDate(row, calculateDate(startDate, weekModifier, day));
        setStartAndEndTime(row, record);
        setSubject(row, record);
        output[cohort].push(row)
    }
    return output;
}
function setStartAndEndDate(row, date) {
    var formattedDate = `${date.getFullYear()}-${date.getMonth() < 9 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}-${date.getDate()}T`
    row.start.dateTime = formattedDate;
    row.end.dateTime = formattedDate;
}

function setStartAndEndTime(row, record) {
    var [start, end] = formatTimes(record)
    row.start.dateTime += start;
    row.end.dateTime += end;
}

function setSubject(row, record) {
    row['summary'] = `${record['Type']}: ${record['Lecture / Activity / Exercise']}`
}


module.exports = {
    makeCsv: function (req, res, next) {
        // this invocation intentionally omits stringifyOptions
        // do not want to prepend the GCAL header row on the CSV yet
        Promise.all(req.sheetData.map(function (sheetData) {
            return new Promise(function (resolve, reject) {
                stringify(sheetData, function (err, data) {
                    if (err) return reject(err);
                    parse(data, parseOptions).on('readable', function () {
                        var convertedData = convertToGoogleCalendarCsv(this, new Date(req.startDate) || new Date('July 15, 2019'));
                        resolve(convertedData)
                    }).on('error', function (e) { next(e) })
                })
            })
        })).then(parsedSheets => {
            req.calendarData = {
                senior: [],
                junior: []
            }

            parsedSheets.forEach(sheetArray => {
                req.calendarData.senior.push(sheetArray.senior)
                req.calendarData.junior.push(sheetArray.junior)
            })

            req.calendarData.senior = req.calendarData.senior.flat()
            req.calendarData.junior = req.calendarData.junior.flat()

            next()
        }).catch(e => console.error(e))
    }
}


