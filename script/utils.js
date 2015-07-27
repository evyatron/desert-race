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

function lerp(from, to, dt, limit) {
  !limit && (limit = 1);
  
  var value = (1 - dt) * from + dt * to;
  
  if (Math.abs(Math.abs(to) - Math.abs(value)) < limit) {
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

function isDescendant(el, elParent) {
  while (el) {
    if (el === elParent) {
      return true;
    }
    el = el.parentNode;
  }
  
  return false;
}

function getJSON(url, callback) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'json';
  request.onload = function onRequestLoad() {
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

var Benchmarker = (function Benchmarker() {
  function Benchmarker() {
    this.timings = [];
    this.active = {};
  }
  
  Benchmarker.prototype.start = function start(id) {
    this.active[id] = {
      'id': id,
      'startTime': Date.now(),
      'endTime': 0,
      'duration': 0
    };
  };
  
  Benchmarker.prototype.end = function end(id) {
    if (!this.active[id]) {
      console.warn('[Benchmarker] Trying to finish timer on a missing benchmark', id);
      return;
    }
    
    this.active[id].endTime = Date.now();
    this.active[id].duration = this.active[id].endTime - this.active[id].startTime;
    
    this.active[id].startTimeFormatted = this.formatTime(this.active[id].startTime);
    this.active[id].endTimeFormatted = this.formatTime(this.active[id].endTime);
    
    console.info('[Benchmarker]', id, ':', this.active[id].duration, 'ms');
    
    this.timings.push(this.active[id]);
    
    delete this.active[id];
  };
  
  Benchmarker.prototype.printAll = function printAll() {
    var timings = this.timings.slice(0);
    
    console.table(timings, ['id', 'duration', 'startTimeFormatted', 'endTimeFormatted']);
  };
  
  Benchmarker.prototype.formatTime = function formatTime(time) {
    var date = new Date(time),
        milliseconds = date.getMilliseconds(),
        seconds = date.getSeconds(),
        minutes = date.getMinutes(),
        hours = date.getHours(),
        time = '';
    
    (hours < 10) && (hours = '0' + hours);
    (minutes < 10) && (minutes = '0' + minutes);
    (seconds < 10) && (seconds = '0' + seconds);
    (milliseconds < 10) && (milliseconds = '00' + milliseconds);
    (milliseconds < 100) && (milliseconds = '0' + milliseconds);
    
    return hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
  };
  
  return new Benchmarker();
}());

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