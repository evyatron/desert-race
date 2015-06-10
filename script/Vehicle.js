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
        if (part.type === VEHICLE_PART_TYPES.WHEELS) {
          context.drawImage(part.image, x + randF(-.4, .4), y + randF(-.4, .4));
        } else {
          context.drawImage(part.image, x, y);
        }
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
    var worldSpeeds = [0],
        boostFactors = [0],
        obstacleFactors = [0],
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

    this.id = '';
    this.type;
    this.src = '';
    this.image = null;
    
    this.obstacleFactor = null;
    this.boundingBoxWidth = null;
    this.boundingBoxHeight = null;
    
    this.width = 128;
    this.height = 128;

    this.ready = true;
    
    this.init(options);
  }

  VehiclePart.prototype.init = function init(options) {
    !options && (options = {});
    
    this.type = options.type;
    this.id = options.id || (this.type + '_' + Date.now() + '_' + rand(0, 10000));
    
    this.obstacleFactor = initNumber(options.obstacleFactor);
    this.boundingBoxWidth = initNumber(options.boundingBoxWidth);
    this.boundingBoxHeight = initNumber(options.boundingBoxHeight);
    
    this.width = initNumber(options.width, 128);
    this.height = initNumber(options.height, 128);
    
    this.setImage(options.src);
  };

  VehiclePart.prototype.setImage = function setImage(src) {
    if (!src) {
      this.ready = true;
      return;
    }
    
    this.ready = false;
    this.image = new Image();
    
    this.image.onload = function onImageLoad() {
      this.width = this.image.width;
      this.height = this.image.height;
      this.ready = true;
    }.bind(this);
    
    this.image.src = this.src = this.iconSrc = src;
  };

  return VehiclePart;
}());

var Turret = (function Turret() {
  function Turret(options) {
    !options && (options = {});
    
    options.type = VEHICLE_PART_TYPES.TURRET;
    
    // Design
    this.size = 0;
    this.isRound = false;
    this.colour = null;
    this.borderColour = '';
    this.borderSize = 0;
    
    // Gameplay
    this.weaponRotation = 0;
    
    VehiclePart.call(this, options);
  }

  Turret.prototype = Object.create(VehiclePart.prototype);
  Turret.prototype.constructor = Turret;
  
  Turret.prototype.init = function init(options) {
    this.weaponRotation = initNumber(options.weaponRotation, rand(0, 90));
    
    this.size = options.size || rand(8, 22);
    this.isRound = initBool(options.isRound, this.weaponRotation > 45);
    this.colour = new Colour(options.colour || rand(0, 100));
    this.borderColour = new Colour(options.borderColour || rand(0, 50));
    this.borderSize = initNumber(options.borderSize, rand(0, this.size / 2));
    
    VehiclePart.prototype.init.call(this, options);
  };

  Turret.prototype.setImage = function setImage() {
    var elCanvas = document.createElement('canvas'),
        context = elCanvas.getContext('2d'),
        w = this.width,
        h = this.height,
        midX = w / 2,
        midY = h / 2,
        size = this.size,
        halfSize = size / 2;
    
    elCanvas.width = this.width;
    elCanvas.height = this.height;
    
    context.fillStyle = this.colour;

    context.beginPath();
    
    if (this.isRound) {
      context.arc(midX, midY, size / 2, 0, Math.PI * 2);
      context.fill();
    } else {
      context.fillRect(midX - halfSize, midY - halfSize, size, size);
    }
    
    if (this.borderSize) {
      context.lineWidth = this.borderSize;
      context.strokeStyle = this.borderColour;
      
      if (this.isRound) {
        context.stroke();
      } else {
        context.strokeRect(midX - halfSize, midY - halfSize, size, size);
      }
    }

    var src = elCanvas.toDataURL();
    VehiclePart.prototype.setImage.call(this, src);
  };

  return Turret;
}());

var Engine = (function Engine() {
  function Engine(options) {
    !options && (options = {});
    
    options.type = VEHICLE_PART_TYPES.ENGINE;
    
    // Design
    this.colour = null;
    this.isFront = false;
    this.exhaustWidth = 0;
    this.exhaustHeight = 0;
    this.exhaustDistance = 0;
    this.engineWidth = 0;
    this.engineHeight = 0;
    this.pipeWidth = 0;
    
    // Gameplay
    this.speed = 0;
    this.boostFactor = 0;
    
    VehiclePart.call(this, options);
  }

  Engine.prototype = Object.create(VehiclePart.prototype);
  Engine.prototype.constructor = Engine;
  
  Engine.prototype.init = function init(options) {
    var body = {
          'top': 36,
          'left': 42,
          'right': 86,
          'bottom': 116,
          'width': 44,
          'height': 80
        };
        
    this.colour = new Colour(options.colour || rand(50, 100));
    this.isFront = initBool(options.isFront, false);
    this.exhaustWidth = initNumber(options.exhaustWidth, rand(3, 10));
    this.exhaustHeight = initNumber(options.exhaustHeight, rand(this.exhaustWidth, this.exhaustWidth * 2));
    this.exhaustDistance = initNumber(options.exhaustDistance, rand(0, 10));
    this.engineWidth = body.width * randF(0.4, 0.8);
    this.engineHeight = this.engineWidth * randF(0.5, 1.2);
    this.pipeWidth = rand(1, 3);
    
    this.speed = initNumber(options.speed, rand(200, 1000));
    this.boostFactor = initNumber(options.boostFactor, randF(1.2, 3));

    VehiclePart.prototype.init.call(this, options);
  };

  Engine.prototype.setImage = function setImage() {
    var elCanvas = document.createElement('canvas'),
        context = elCanvas.getContext('2d'),
        w = this.width,
        h = this.height,
        midX = w / 2,
        midY = h / 2,
        body = {
          'top': 36,
          'left': 42,
          'right': 86,
          'bottom': 116,
          'width': 44,
          'height': 80
        },
        x = midX + body.width / 2 - this.exhaustWidth / 2 - this.exhaustDistance,
        posY = this.isFront? body.top + body.height / 3 : body.top + body.height * 2 / 3,
        width = this.engineWidth,
        height = this.engineHeight,
        left = body.left + body.width / 2 - width / 2,
        top = posY - height / 2,
        pipeColour = new Colour(this.colour).brighten(0.5),
        pipeWidth = this.pipeWidth,
        pipeLeft = left + width - pipeWidth,
        pipeTop = top + height;

    elCanvas.width = this.width;
    elCanvas.height = this.height;
    

    context.fillStyle = this.colour;
    
    // Engine
    context.fillRect(left, top, width, height - 1);
    
    context.fillRect(midY - width / 4, this.isFront? body.bottom - height / 3 - 5 : body.top,
                     width / 2, height / 3);
    
    // Exhaust
    context.fillRect(x - this.exhaustWidth / 2,
                     body.bottom - this.exhaustHeight / 2,
                     this.exhaustWidth, this.exhaustHeight - 1);
    context.fillRect(x - this.exhaustWidth / 2 + 1,
                     body.bottom - this.exhaustHeight / 2 + this.exhaustHeight - 1,
                     this.exhaustWidth - 2, 1);
    
    // Pipes
    context.fillStyle = pipeColour;
    
    if (this.isFront) {
      context.fillRect(midY - pipeWidth / 2, top + height,
                       pipeWidth, body.bottom - height / 3 - (top + height));
    } else {
      context.fillRect(pipeLeft, pipeTop,
                       pipeWidth, body.bottom - this.exhaustHeight / 2 - pipeTop);
      context.fillRect(midY - pipeWidth / 2, body.top + height / 3 - 3,
                       pipeWidth, top - body.top + height / 3);
    }
    
    
    var src = elCanvas.toDataURL();
    VehiclePart.prototype.setImage.call(this, src);
  };

  return Engine;
}());

var Vanity = (function Vanity() {
  function Vanity(options) {
    !options && (options = {});
    
    options.type = VEHICLE_PART_TYPES.VANITY;
    
    VehiclePart.call(this, options);
  }

  Vanity.prototype = Object.create(VehiclePart.prototype);
  Vanity.prototype.constructor = Vanity;

  return Vanity;
}());

var VanityWings = (function VanityWings() {
  function VanityWings(options) {
    !options && (options = {});

    this.colour = '';
    this.span = 0;
    this.size = 0;
    this.offset = 0;
    
    Vanity.call(this, options);
  }

  VanityWings.prototype = Object.create(Vanity.prototype);
  VanityWings.prototype.constructor = VanityWings;

  VanityWings.prototype.init = function init(options) {
    var body = {
      'top': 36,
      'left': 42,
      'right': 86,
      'bottom': 116,
      'width': 44,
      'height': 80
    };
    
    this.colour = new Colour(options.colour || rand(50, 100));
    this.span = initNumber(options.span, rand(10, (this.width - body.width) / 2));
    this.size = initNumber(options.size, rand(4, 12));
    this.offset = initNumber(options.offset, 0);
    
    // Make sure it doesn't go outside the image
    this.span = Math.min(this.span, (this.width - body.width) / 2);

    Vanity.prototype.init.call(this, options);
  };
  
  VanityWings.prototype.setImage = function setImage() {
    var elCanvas = document.createElement('canvas'),
        context = elCanvas.getContext('2d'),
        w = this.width,
        h = this.height,
        midX = w / 2,
        midY = h / 2,
        body = {
          'top': 36,
          'left': 42,
          'right': 86,
          'bottom': 116,
          'width': 44,
          'height': 80
        },
        bodyMidY = body.top + body.height / 2 + this.offset,
        height = this.size;

    elCanvas.width = this.width;
    elCanvas.height = this.height;
    
    context.fillStyle = this.colour;
    
    context.beginPath();
    context.moveTo(body.right, bodyMidY + height);
    context.lineTo(body.right + this.span, bodyMidY + height);
    context.lineTo(body.right, bodyMidY - height);
    context.fill();
    
    context.beginPath();
    context.moveTo(body.left, bodyMidY + height);
    context.lineTo(body.left - this.span, bodyMidY + height);
    context.lineTo(body.left, bodyMidY - height);
    context.fill();

    var src = elCanvas.toDataURL();
    VehiclePart.prototype.setImage.call(this, src);
  };
  
  return VanityWings;
}());