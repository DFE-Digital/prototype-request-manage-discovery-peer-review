const govukPrototypeKit = require('govuk-prototype-kit')
const addFilter = govukPrototypeKit.views.addFilter

const dateFilter = require('nunjucks-date-filter');

const { marked } = require('marked')
const markdown = require('nunjucks-markdown');

var passport = require('passport');
var WindowsStrategy = require('passport-windowsauth');

addFilter('split', function(str, seperator) {
    return str.split(seperator);
});


addFilter('date', dateFilter);

addFilter('BoolToYesNo', function(str){
    return str ? 'Yes' : 'No'
})

addFilter('BoolToYesBlank', function(str){
    return str ? 'Yes' : '-'
})


addFilter('user', function(){
   return require("os").userInfo().username
})

