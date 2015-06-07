/* helpers */
function initNumber(value, defaultValue) {
  if (defaultValue === undefined) {
    defaultValue = null;
  }
  
  return typeof value === 'number'? value : defaultValue;
}

function initBool(value, defaultValue) {
  if (defaultValue === undefined) {
    defaultValue = false;
  }
  
  return typeof value === 'boolean'? value : defaultValue;
}

function randF(from, to) {
  !from && (from = 0);
  !to && (to = 0);

  return Math.random() * (to - from) + from;
}

function rand(from, to) {
  return from === undefined && to === undefined?
          Math.random() > 0.5 :
          Math.round(randF(from, to));
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

function getJSON(url, callback) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'json';
  request.onload = function() {
    callback(request.response);
  };
  request.send();
}

function addClick(elOrSelector, callback) {
  var el = typeof elOrSelector === 'string'? document.querySelector(elOrSelector) : elOrSelector;
  
  if (el) {
    el.addEventListener('click', callback);
  } else {
    console.warn('Invalid element to attach click to', elOrSelector);
  }
}

function addHover(elOrSelector, callbackOver, callbackOut) {
  var el = typeof elOrSelector === 'string'? document.querySelector(elOrSelector) : elOrSelector;
  
  if (el) {
    el.addEventListener('mouseover', callbackOver);
    if (callbackOut) {
      el.addEventListener('mouseout', callbackOut);
    }
  } else {
    console.warn('Invalid element to attach hover to', elOrSelector);
  }
}


var REGEX_NUMBERS = /\B(?=(\d{3})+(?!\d))/g,
    NUMBERS_DELIM = ',';

function numberWithCommas(number) {
  return ('' + number).replace(REGEX_NUMBERS, NUMBERS_DELIM);
}

// A template formatting method
// Replaces {{propertyName}} with properties from the 'args' object
// Supports {{object.property}}
// Use {{l10n(key-name)}} to automatically get from l10n object
String.prototype.REGEX_FORMAT = /(\{\{([^\}]+)\}\})/g;
String.prototype.REGEX_FORMAT_L10N = /l10n\(([^\)]*)\)/;
String.prototype.format = function format(args, shouldSanitise) {
  !args && (args = {});

  return this.replace(String.prototype.REGEX_FORMAT, function onMatch() {
    var key = arguments[2],
        properties = key.split('.'),
        value = args,
        l10nMatch = key.match(String.prototype.REGEX_FORMAT_L10N);
    
    if (l10nMatch) {
      value = l10n.get(l10nMatch[1]);
    } else {
      // support nesting - "I AM {{ship.info.name}}"
      for (var i = 0, len = properties.length; i < len; i++) {
        value = value && value[properties[i]];
      }
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