var Colour = (function Colour() {
  function Colour(options) {
    if (!options) {
      options = 0;
    }
    
    if (options === Colour.RANDOM) {
      options = {
        'red': rand(0, 255),
        'green': rand(0, 255),
        'blue': rand(0, 255),
        'alpha': 1
      };
    } else if (typeof options === 'number') {
      options = {
        'red': options,
        'green': options,
        'blue': options,
        'alpha': 1
      };
    } else if (typeof options === 'string') {
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
    
    this.rgba = '';
    this.hex = '';
    
    this.updateValues();
  }
  
  Colour.RANDOM = 'random';
  
  Colour.prototype.toString = function toString() {
    return this.rgba;
  };
  
  Colour.prototype.getRGBA = function getRGBA() {
    return this.rgba;
  };
  
  
  Colour.prototype.updateValues = function updateValues() {
    this.red = Math.round(Math.max(Math.min(this.red, 255), 0));
    this.green = Math.round(Math.max(Math.min(this.green, 255), 0));
    this.blue = Math.round(Math.max(Math.min(this.blue, 255), 0));
    this.alpha = Math.max(Math.min(this.alpha, 1), 0);
    
    this.rgba = 'rgba(' + this.red + ',' + this.green + ',' + this.blue + ',' + this.alpha + ')';
  };
  
  Colour.prototype.brighten = function brighten(val) {
    val = 1 + Math.max(Math.min(val, 1), 0);
    
    this.red *= val;
    this.green *= val;
    this.blue *= val;
    
    this.updateValues();
    
    return this;
  };
  
  return Colour;
}());