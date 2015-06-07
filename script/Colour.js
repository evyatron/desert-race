var Colour = (function Colour() {
  function Colour(options) {
    if (!options) {
      options = 0;
    }
    
    if (typeof options === 'number') {
      options = {
        'red': options,
        'green': options,
        'blue': options,
        'alpha': 1
      };
    }
    
    if (typeof options === 'string') {
      var rgba = options.replace(/\s/g, '').match(/rgba\((\d+)\,(\d+)\,(\d+)\,(\.?\d+)\)/);
      if (rgba) {
        options = {
          'red': rgba[1] * 1,
          'green': rgba[2] * 1,
          'blue': rgba[3] * 1,
          'alpha': rgba[4] * 1
        };
      }
    }

    this.red = options.red;
    this.green = options.green;
    this.blue = options.blue;
    this.alpha = options.alpha;
    
    this.rgba = 'rgba(' + this.red + ',' + this.green + ',' + this.blue + ',' + this.alpha + ')';
  }
  
  Colour.prototype.toString = function toString() {
    return this.rgba;
  };
  
  Colour.prototype.getRGBA = function getRGBA() {
    return this.rgba;
  };
  
  return Colour;
}());