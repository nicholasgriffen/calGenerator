const millisecondsInDay = 86400000;

function calculateDate(startDate, week, day) {
    var weekModifier = (week - 1) * 7 * millisecondsInDay;
    var dayModifier = (day - 1) * millisecondsInDay;

    var date = new Date(startDate.getTime() + weekModifier + dayModifier)
    return date;
}

function formatTimes(record) {
    var [start, end] = record['Time'].split('-').map(x => x.toUpperCase().trim())
    var startHour = findHour(start)
    var endHour = findHour(end)
    start = validateTimeFormat(setStartAmPm(start, end, startHour, endHour), startHour)
    end = validateTimeFormat(end, endHour)

    return ({
        start, 
        end
    });
}

function findHour(time) {
    return time.includes(':') ? +time.split(':')[0]
        : time.includes('AM') ? +time.split('AM')[0]
            : time.includes('PM') ? +time.split('PM')[0]
                : +time
}

function validateTimeFormat(time, hour) {
    var times = {long: time, short: time}
    var separator = time.includes('AM') ? 'AM' : time.includes('PM') ? 'PM' : ''
    
    if (time.includes('PM') && hour < 12) {
        let militaryHour = hour + 12;
        var hourString = militaryHour < 10 ? `0${militaryHour}` : `${militaryHour}`
    }

    if (time.includes(':')) {
        let tempTimes = times.long.split(':') 
        tempTimes[0] = hourString
        times.long = tempTimes.join(':').split(separator).join(':00')
    } else {
            times.long = times.long.split(separator).join(`${hourString}:00:00`)
            times.short = times.short.split(separator).join(`:00${separator}`)
    }
    return times;
}

function setStartAmPm(start, end, startHour, endHour) {
    if (!(start.includes('AM') || start.includes('PM'))) {
        if (end.includes('PM')) {
            if (endHour === 12 && startHour < 12) {
                start += 'AM';
            } else {
                start += 'PM'
            }
        } else {
            start += 'AM'
        }
    }
    return start;
}
module.exports = {
    calculateDate,
    formatTimes
}
