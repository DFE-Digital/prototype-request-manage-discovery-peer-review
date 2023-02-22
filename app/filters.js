const govukPrototypeKit = require('govuk-prototype-kit')
const addFilter = govukPrototypeKit.views.addFilter

const dateFilter = require('nunjucks-date-filter');

addFilter('split', function(str, seperator) {
    return str.split(seperator);
});


addFilter('date', dateFilter);