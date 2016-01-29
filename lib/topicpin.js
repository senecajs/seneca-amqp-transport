'use strict';

module.exports = {
  format: format
};

// Derive a consistent topic name from a given pin object
// Pin keys will be sorted and combined with values
// { type: 'random', role: 'create'} will map to 'seneca.role.create.type.random'
function format(pin) {
  var prefix = 'seneca';
  var delim = '.';
  return prefix + delim + Object.keys(pin).sort().map(function(k){
    return [k,pin[k]].join(delim);
  }).join(delim);
}
