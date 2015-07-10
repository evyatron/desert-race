var Sprite = (function Sprite() {
  function Sprite(options) {
    this.id;
    this.type;
    this.scene;
    this.zIndex;

    this.colour;
    this.image;
    this.isStationary;

    this.friction;
    this.speed;
    this.width;
    this.height;
    this.halfWidth;
    this.halfHeight;
    this.position;
    this.drawPosition;
    this.velocity;
    this.acceleration;
    
    this.hitBounds = {
      'width': 0,
      'height': 0,
      'right': 0,
      'bottom': 0
    };
    this.doesCollide;
    this.destroyWhenOutOfBounds;

    this.spritesHit = [];
    this.didHit = false;

    Sprite.prototype.init.apply(this, arguments);
  }
  
  Sprite.prototype.init = function init(options) {
    !options && (options = {});

    this.id = options.id || (Date.now() + '_' + Math.round(Math.random() * 100000));
    this.type = options.type || 'sprite';
    this.zIndex = options.zIndex || 0;

    this.colour = 'colour' in options? options.colour : 'rgba(255, 0, 0, 1)';

    if (options.image) {
      this.setImage(options.image);
    }

    this.friction = options.friction || 0.8;
    this.width = options.width || 0;
    this.height = options.height || 0;
    this.speed = options.speed || 0;
    this.position = options.position || new Victor(0, 0);
    this.drawPosition = this.position.clone();
    this.velocity = options.velocity || new Victor(0, 0);
    this.acceleration = new Victor(0, 0);
    this.doesCollide = Boolean(options.doesCollide);
    this.destroyWhenOutOfBounds = Boolean(options.destroyWhenOutOfBounds);
    this.isStationary =  Boolean(options.isStationary);

    this.halfWidth = this.width / 2;
    this.halfHeight = this.height / 2;
    this.setBoundingBox(this.width, this.height);
  };

  Sprite.prototype.setImage = function setImage(src) {
    this.image = new Image();
    this.image.src = src;
  };

  Sprite.prototype.setBoundingBox = function setBoundingBox(width, height) {
    this.hitBounds.width = width;
    this.hitBounds.height = height;
  };

  Sprite.prototype.destroy = function destroy() {
    if (this.scene) {
      this.scene.removeSprite(this);
    }
  };

  Sprite.prototype.setScene = function setScene(scene) {
    this.scene = scene;
  };

  Sprite.prototype.update = function update(dt) {
    this.spritesHit = [];
    this.didHit = false;

    var x = this.position.x,
        y = this.position.y;

    if (Math.abs(this.velocity.x) < 1) {
      this.velocity.x = 0;
    }
    if (Math.abs(this.velocity.y) < 1) {
      this.velocity.y = 0;
    }
    
    this.acceleration.x = this.velocity.x * dt;
    this.acceleration.y = this.velocity.y * dt;

    if (this.acceleration.x !== 0 || this.acceleration.y !== 0) {
      this.position.x = x = x + this.acceleration.x;
      this.position.y = y = y +  this.acceleration.y;

      this.velocity.x *= this.friction;
      this.velocity.y *= this.friction;
    }
    
    if (this.id === 'localPlayer') {
      this.scene.offset.y -= this.acceleration.y;
      this.scene.offset.x -= this.acceleration.x;
    }
    
    this.drawPosition.x = x + this.scene.offset.x;
    this.drawPosition.y = y + this.scene.offset.y;

    this.top = this.drawPosition.y - this.halfHeight;
    this.bottom = this.drawPosition.y + this.halfHeight;
    this.left = this.drawPosition.x - this.halfWidth;
    this.right = this.drawPosition.x + this.halfWidth;

    var halfWidth = this.hitBounds.width / 2,
        halfHeight = this.hitBounds.height / 2;
        
    this.hitBounds.top = this.drawPosition.y - halfHeight;
    this.hitBounds.bottom = this.drawPosition.y + halfHeight;
    this.hitBounds.left = this.drawPosition.x - halfWidth;
    this.hitBounds.right = this.drawPosition.x + halfWidth;

    if (this.destroyWhenOutOfBounds) {
      if (this.right < 0 || this.left > this.scene.width ||
          this.bottom < 0 || this.top > this.scene.height) {
        this.destroy();
      }
    }
  };

  Sprite.prototype.checkCollisions = function checkCollisions(sprites) {
    var hitBounds = this.hitBounds;

    for (var i = 0, len = sprites.length, sprite; i < len; i++) {
      sprite = sprites[i];

      if (sprite.id === this.id) {
        continue;
      }
      if (!this.doesCollide || !sprite.doesCollide) {
        continue;
      }

      var spriteHitBounds = sprite.hitBounds;

      if (!(spriteHitBounds.left > hitBounds.right || 
           spriteHitBounds.right < hitBounds.left || 
           spriteHitBounds.top > hitBounds.bottom ||
           spriteHitBounds.bottom < hitBounds.top)) {
        this.didHit = true;
        this.spritesHit.push(sprite);
      }
    }

    return this.didHit;
  };
  
  Sprite.prototype.draw = function draw(context) {
    var w = this.width,
        h = this.height,
        x = this.drawPosition.x - w / 2,
        y = this.drawPosition.y - h / 2;

    if (this.image) {
      context.drawImage(this.image, x, y, w, h);
    } else if (this.colour) {
      context.fillStyle = this.colour;
      context.fillRect(x, y, w, h);
    }
    
    if (DEBUG) {
      var hitBounds = this.hitBounds;
      context.fillStyle = 'rgba(255, 0, 0, .2)';
      context.fillRect(hitBounds.left, hitBounds.top, hitBounds.width, hitBounds.height);
    }
  };

  return Sprite;
}());