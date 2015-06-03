var Vehicle = (function Vehicle() {
  function Vehicle(options) {
    !options && (options = {});

    this.wheelsSize = options.wheelsSize || 8;
    this.wheelsHit = this.wheelsSize * 3;
    this.wheelsColour = options.wheelsColour || 'rgba(128, 128, 128, 1)';
    this.bodyColour = options.bodyColour || 'rgba(0, 0, 0, 1)';

    options.type = 'vehicle';
    options.doesCollide = true;

    Sprite.apply(this, arguments);
  }

  Vehicle.prototype = Object.create(Sprite.prototype);
  Vehicle.prototype.constructor = Vehicle;

  Vehicle.prototype.init = function init() {
    Sprite.prototype.init.apply(this, arguments);
    
    this.createImage();
  };

  Vehicle.prototype.createImage = function createImage() {
    this.image = new Image();

    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        w = this.width,
        h = this.height,
        bodyMargin = this.wheelsSize,
        wheelHeight = 20;

    canvas.width = w;
    canvas.height = h;

    context.fillStyle = this.wheelsColour;
    context.fillRect(0, bodyMargin * 5, bodyMargin * 2, wheelHeight);
    context.fillRect(0, h - bodyMargin * 2 - wheelHeight, bodyMargin * 2, wheelHeight);

    context.fillRect(w - bodyMargin * 2, bodyMargin * 5, bodyMargin * 2, wheelHeight);
    context.fillRect(w - bodyMargin * 2, h - bodyMargin * 2 - wheelHeight, bodyMargin * 2, wheelHeight);

    context.fillStyle = this.bodyColour;
    context.fillRect(bodyMargin * 2, bodyMargin, w - bodyMargin * 4, bodyMargin * 1.5);
    context.fillRect(bodyMargin, bodyMargin * 2.5, w - bodyMargin * 2, h - bodyMargin * 2);

    this.image.src = canvas.toDataURL();
  };

  return Vehicle;
}());