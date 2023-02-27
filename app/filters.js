const govukPrototypeKit = require('govuk-prototype-kit')
const addFilter = govukPrototypeKit.views.addFilter

const dateFilter = require('nunjucks-date-filter');

const { marked } = require('marked')
const markdown = require('nunjucks-markdown');

addFilter('split', function(str, seperator) {
    return str.split(seperator);
});


addFilter('date', dateFilter);

