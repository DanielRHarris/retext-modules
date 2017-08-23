'use strict';

const nlcstToString = require('nlcst-to-string');
const search = require('nlcst-search');
const position = require('unist-util-position');

module.exports = loadModules;

function loadModules(modules) {
  let patterns = [];
  let searchList = [];

  modules.forEach((moduleItem) => {

    for (var pattern in moduleItem.patterns) {
      //Add module name to pattern
      moduleItem.patterns[pattern].moduleName = moduleItem.moduleName;
      moduleItem.patterns[pattern].match = pattern;

      //Add defaults to patterns
      if (!moduleItem.patterns[pattern].hasOwnProperty('type')) {
        moduleItem.patterns[pattern].type = moduleItem.defaults.type;
      }
      if (!moduleItem.patterns[pattern].hasOwnProperty('caseSensitive')) {
        moduleItem.patterns[pattern].caseSensitive = moduleItem.defaults.caseSensitive;
      }
      if (!moduleItem.patterns[pattern].hasOwnProperty('message')) {
        moduleItem.patterns[pattern].message = moduleItem.defaults.message;
      }

      //Add pattern to pattern set
      patterns.push(moduleItem.patterns[pattern]);

      //Add pattern string to search list
      searchList.push(pattern);
    }

  });

  return transformer;

  function transformer(tree, file) {
    search(tree, searchList, finder, {allowApostrophes: true, allowDashes: true});

    function finder(match, index, parent, phrase) {
      var matchString = nlcstToString(match);
      var message;

      //Iterate through patterns
      patterns.forEach((pattern) => {

        if (pattern.match === phrase) { //If a pattern matches the matched phrase
          const reason = pattern.message.replace('{match}', matchString);

          if (pattern.caseSensitive && matchString === phrase) {
            message = file.warn(reason, {
              start: position.start(match[0]),
              end: position.end(match[match.length - 1])
            });
          } else if (!pattern.caseSensitive) {
            message = file.warn(reason, {
              start: position.start(match[0]),
              end: position.end(match[match.length - 1])
            });
          } else {
            return;
          }

          message.ruleId = phrase.replace(/\s+/g, '-').toLowerCase();
          message.source = pattern.moduleName;
          message.type = pattern.type;
        }
      });

    }
  }
}