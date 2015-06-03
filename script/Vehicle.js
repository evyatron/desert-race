var Vehicle = (function Vehicle() {
  function Vehicle(options) {
    !options && (options = {});

    this.wheelsSize = options.wheelsSize || 8;
    this.wheelsHit = this.wheelsSize * 3;
    this.wheelsColour = options.wheelsColour || 'rgba(128, 128, 128, 1)';
    this.bodyColour = options.bodyColour || 'rgba(0, 0, 0, 1)';
    
    this.needsToCreateImage = true;
    this.parts = {};

    options.type = 'vehicle';
    options.doesCollide = true;

    Sprite.apply(this, arguments);
  }

  Vehicle.prototype = Object.create(Sprite.prototype);
  Vehicle.prototype.constructor = Vehicle;

  Vehicle.prototype.init = function init() {
    Sprite.prototype.init.apply(this, arguments);
    
    // init empty loadout
    for (var id in VEHICLE_PART_TYPES) {
      this.parts[id] = null;
    }
    
    this.createImage();
  };
  
  Vehicle.prototype.draw = function draw() {
    if (this.needsToCreateImage) {
      this.createImage();
    }
    
    Sprite.prototype.draw.apply(this, arguments);
  };
  
  Vehicle.prototype.equipPart = function equipPart(part) {
    var type = part.type,
        currentPart = this.parts[type];
    
    this.parts[type] = part;
    this.needsToCreateImage = true;
    
    return currentPart;
  };
  
  Vehicle.prototype.equipParts = function equipParts(parts) {
    var previousParts = [];
    
    for (var i = 0, len = parts.length; i < len; i++) {
      var previousPart = this.equipPart(parts[i]);
      if (previousPart) {
        previousParts.push(previousPart);
      }
    }

    return previousParts;
  };

  Vehicle.prototype.createImage = function createImage() {
    for (var type in this.parts) {
      var part = this.parts[type];
      if (part) {
        if (!part.ready) {
          this.needsToCreateImage = true;
          return;
        }
      }
    }
    
    this.image = new Image();

    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        w = this.width,
        h = this.height,
        bodyMargin = this.wheelsSize,
        wheelHeight = 20,
        gotParts = false;

    canvas.width = w;
    canvas.height = h;
    
    for (var i = 0, len = VEHICLE_PARTS_ORDER.length; i < len; i++) {
      var type = VEHICLE_PARTS_ORDER[i],
          part = this.parts[type];
          
      if (part) {
        context.drawImage(part.image, 0, 0);
        gotParts = true;
      }
    }
    
    if (!gotParts) {
      context.fillStyle = this.wheelsColour;
      context.fillRect(0, bodyMargin * 5, bodyMargin * 2, wheelHeight);
      context.fillRect(0, h - bodyMargin * 2 - wheelHeight, bodyMargin * 2, wheelHeight);
  
      context.fillRect(w - bodyMargin * 2, bodyMargin * 5, bodyMargin * 2, wheelHeight);
      context.fillRect(w - bodyMargin * 2, h - bodyMargin * 2 - wheelHeight, bodyMargin * 2, wheelHeight);
  
      context.fillStyle = this.bodyColour;
      context.fillRect(bodyMargin * 2, bodyMargin, w - bodyMargin * 4, bodyMargin * 1.5);
      context.fillRect(bodyMargin, bodyMargin * 2.5, w - bodyMargin * 2, h - bodyMargin * 2);
    }

    this.image.src = canvas.toDataURL();
    this.needsToCreateImage = false;
  };

  return Vehicle;
}());

var VEHICLE_PART_TYPES = {
  'ENGINE': 'ENGINE',
  'WHEELS': 'WHEELS',
  'BODY': 'BODY',
  'FRONT': 'FRONT',
  'REAR': 'REAR',
  'TURRET': 'TURRET',
  'VANITY': 'VANITY',
  'MORALE': 'MORALE'
};
var VEHICLE_PARTS_ORDER = [
  VEHICLE_PART_TYPES.ENGINE,
  VEHICLE_PART_TYPES.WHEELS,
  VEHICLE_PART_TYPES.BODY,
  VEHICLE_PART_TYPES.FRONT,
  VEHICLE_PART_TYPES.REAR,
  VEHICLE_PART_TYPES.TURRET,
  VEHICLE_PART_TYPES.VANITY,
  VEHICLE_PART_TYPES.MORALE
];

var VehiclePart = (function VehiclePart() {
  function VehiclePart(options) {
    !options && (options = {});

    this.type;
    this.src = '';
    this.image = null;
    
    this.ready = false;
    
    this.init(options);
  }

  VehiclePart.prototype.init = function init(options) {
    this.type = options.type;
    this.src = options.src;
    this.onReady = options.onReady;
    
    this.image = new Image();
    
    this.image.onload = function onImageLoad() {
      this.ready = true;
    }.bind(this);
    
    this.image.src = this.src;
  };
  
  VehiclePart.prototype.update = function update(dt) {
  };

  return VehiclePart;
}());