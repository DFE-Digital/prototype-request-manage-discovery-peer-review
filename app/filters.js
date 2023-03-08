const govukPrototypeKit = require('govuk-prototype-kit')
const addFilter = govukPrototypeKit.views.addFilter


const dateFilter = require('nunjucks-date-filter');
var nunjucks = require('nunjucks')
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


addFilter('NumberOrNo', function(str){
    return str === 0 ? "no" : str
})

const renderer = {
    heading(text, level) {
      const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
      var headingclass = "govuk-heading-m"

      if(level === 3){
        headingclass = "govuk-heading-s"
      }
  
      return `
              <h${level} class="`+headingclass+`">
                ${text}
              </h${level}>`;
    },
    link(href, title, text) {
        const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
    
    
        return `<a name="${title}" class="govuk-link" target="_blank" href="${href}">${text}</a>`;
      }
  };
  
  marked.use({ renderer });

addFilter('md', mdFilter);

/**
 * @function mdFilter
 *
 * @description
 * Convert a given markdown string to HTML, stripping enclosing <p> tags by
 * default
 *
 * @param   {String} value             Markdown string
 * @param   {Boolean} [stripPara=true] Strip enclosing <p> tags from resulting
 *                                     HTML.  Defaults to true.
 * @returns {String}                   Resulting HTML string
 */
function mdFilter(value, stripPara) {
    var result;
    stripPara = stripPara !== false;
    try {
      result = marked(value).trim();
      if (stripPara) {
        result = result.replace(/^<p>|<\/p>$/g, '');
      }

      return result;
    } catch (e) {
      console.error('Error processing markdown:', e);
      return value;
    }
  }
  
  module.exports = mdFilter;