/* helpers */
function initNumber(value, defaultValue) {
  if (defaultValue === undefined) {
    defaultValue = null;
  }
  
  return typeof value === 'number'? value : defaultValue;
}

function randF(from, to) {
  !from && (from = 0);
  !to && (to = 0);

  return Math.random() * (to - from) + from;
}

function rand(from, to) {
  return Math.round(randF(from, to));
}

function lerp(from, to, dt) {
  var value = (1 - dt) * from + dt * to;
  
  if (Math.abs(Math.abs(to) - Math.abs(value)) < 1) {
    value = to;
  }
  
  return value;
}

function avg(array) {
  return sum(array) / array.length;
}

function sum(array) {
  var result = 0,
      len = array.length;

  for (var i = 0; i < len; i++) {
    result += array[i];
  }
  
  return result;
}

var REGEX_NUMBERS = /\B(?=(\d{3})+(?!\d))/g,
    NUMBERS_DELIM = ',';

function numberWithCommas(number) {
  return ('' + number).replace(REGEX_NUMBERS, NUMBERS_DELIM);
}

// A template formatting method
// Replaces {{propertyName}} with properties from the 'args' object
// Supports {{object.property}}
// Use {{(f)valueHere}} to automatically format the value (1000 -> 1,000)
String.prototype.REGEX_FORMAT = /(\{\{([^\}]+)\}\})/g;
String.prototype.format = function format(args, shouldSanitise) {
  !args && (args = {});

  return this.replace(String.prototype.REGEX_FORMAT, function onMatch() {
    var key = arguments[2],
        properties = key.split('.'),
        value = args;

    // support nesting - "I AM {{ship.info.name}}"
    for (var i = 0, len = properties.length; i < len; i++) {
      value = value && value[properties[i]];
    }

    if (value === undefined || value === null) {
      value = arguments[0];
    }

    return value;
  });
};


function preventFunction(e) {
  e.preventDefault();
}