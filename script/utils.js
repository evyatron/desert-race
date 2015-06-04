/* helpers */
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

function preventFunction(e) {
  e.preventDefault();
}