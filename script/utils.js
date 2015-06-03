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
  return (1 - dt) * from + dt * to;
}

var REGEX_NUMBERS = /\B(?=(\d{3})+(?!\d))/g,
    NUMBERS_DELIM = ',';

function numberWithCommas(number) {
  return ('' + number).replace(REGEX_NUMBERS, NUMBERS_DELIM);
}

function preventFunction(e) {
  e.preventDefault();
}