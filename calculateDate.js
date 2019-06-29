
// expect Week 
// expect Day 
// expect Start Date 
// add 7 for every week except week 1
// add 1 for every day except day 1
const millisecondsInDay = 86400000;

function calculateDate(startDate, week, day) {
    var weekModifier = (week - 1) * 7 * millisecondsInDay;
    var dayModifier = (day - 1) * millisecondsInDay;

    var date = new Date(startDate.getTime() + weekModifier + dayModifier)

    return date;
}

module.exports = calculateDate