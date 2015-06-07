var Vehicle = (function Vehicle() {
  function Vehicle(options) {
    !options && (options = {});

    this.wheelsSize = options.wheelsSize || 8;
    this.wheelsHit = this.wheelsSize * 3;
    this.wheelsColour = options.wheelsColour || 'rgba(128, 128, 128, 1)';
    this.bodyColour = options.bodyColour || 'rgba(0, 0, 0, 1)';
    
    this.worldSpeed = 0;
    this.boostFactor = 1;
    this.obstacleFactor = 1;
    this.weaponRotation = 0;
    
    this.parts = {};

    options.colour = '';
    options.type = 'vehicle';
    options.doesCollide = true;

    Sprite.apply(this, arguments);
  }

  Vehicle.prototype = Object.create(Sprite.prototype);
  Vehicle.prototype.constructor = Vehicle;

  Vehicle.prototype.init = function init() {
    Sprite.prototype.init.apply(this, arguments);
    
    for (var id in VEHICLE_PART_TYPES) {
      this.parts[id] = null;
    }
  };
  
  Vehicle.prototype.draw = function draw(context) {
    var x = this.position.x - this.width / 2,
        y = this.position.y - this.height / 2;
    
    for (var i = 0, len = VEHICLE_PARTS_ORDER.length, part; i < len; i++) {
      part = this.parts[VEHICLE_PARTS_ORDER[i]];

      if (part && part.image) {
        context.drawImage(part.image, x, y);
      }
    }
  };
  
  Vehicle.prototype.equipPart = function equipPart(part) {
    var type = part.type,
        currentPart = this.parts[type];
    
    this.parts[type] = part;
    
    this.updateStats();
    
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

  Vehicle.prototype.updateStats = function updateStats() {
    var worldSpeeds = [],
        boostFactors = [],
        obstacleFactors = [],
        boundingBoxWidth = 0,
        boundingBoxHeight = 0,
        weaponRotation = 0;
    
    for (var type in this.parts) {
      var part = this.parts[type];
      
      if (part) {
        if (typeof part.speed === 'number') {
          worldSpeeds.push(part.speed);
        }
        
        if (typeof part.boostFactor === 'number') {
          boostFactors.push(part.boostFactor);
        }
        if (typeof part.obstacleFactor === 'number') {
          obstacleFactors.push(part.obstacleFactor);
        }
        
        if (typeof part.weaponRotation === 'number') {
          weaponRotation = Math.max(weaponRotation, part.weaponRotation);
        }
        
        if (typeof part.boundingBoxWidth === 'number') {
          boundingBoxWidth = Math.max(boundingBoxWidth, part.boundingBoxWidth);
        }
        if (typeof part.boundingBoxHeight === 'number') {
          boundingBoxHeight = Math.max(boundingBoxHeight, part.boundingBoxHeight);
        }
      }
    }
    
    this.worldSpeed = Math.max.apply(Math, worldSpeeds);
    this.boostFactor = sum(boostFactors);
    this.obstacleFactor = sum(obstacleFactors);
    this.weaponRotation = Math.max(Math.min(weaponRotation, 180), 0) * Math.PI / 180;
    this.setBoundingBox(boundingBoxWidth, boundingBoxHeight);
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
  VEHICLE_PART_TYPES.WHEELS,
  VEHICLE_PART_TYPES.ENGINE,
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
    
    this.speed = null;
    this.boostFactor = null;
    this.obstacleFactor = null;
    this.weaponRotation = null;
    this.boundingBoxWidth = null;
    this.boundingBoxHeight = null;

    this.ready = true;
    
    this.init(options);
  }

  VehiclePart.prototype.init = function init(options) {
    this.type = options.type;
    this.src = options.src;
    this.onReady = options.onReady;
    
    this.speed = initNumber(options.speed);
    this.boostFactor = initNumber(options.boostFactor);
    this.obstacleFactor = initNumber(options.obstacleFactor);
    this.weaponRotation = initNumber(options.weaponRotation);
    this.boundingBoxWidth = initNumber(options.boundingBoxWidth);
    this.boundingBoxHeight = initNumber(options.boundingBoxHeight);
    
    if (options.src) {
      this.setImage(options.src);
    }
  };
  
  VehiclePart.prototype.update = function update(dt) {
  };
  
  VehiclePart.prototype.setImage = function setImage(src) {
    this.ready = false;
    this.image = new Image();
    
    this.image.onload = function onImageLoad() {
      this.ready = true;
    }.bind(this);
    
    this.image.src = this.src;
  };

  return VehiclePart;
}());