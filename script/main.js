var scene,
    player,
    roadSprite1,
    roadSprite2,

    timeToSpawnRoadThing = 0,
    timeToSpawnSideThing = 0,
    things = [];

var speedIncrease = 0;

var PLAYER_NORMAL_SPEED = 400,
    PLAYER_MOVEMENT_SPEED = 100,
    PLAYER_BOOST_SPEED = 800,
    PLAYER_SPEED_OVER_SOMETHING = 250,
    CURRENT_PLAYER_SPEED = PLAYER_NORMAL_SPEED,
    PLAYER_DISTANCE_FROM_BOTTOM = 10,
    OVER_SOMETHING_RATTLE = 100;

var ROAD_WIDTH = 1100,
    ROAD_LEFT = 0,
    ROAD_RIGHT = 0,
    ROAD_GRADIENT_FALLOFF = 0.2,
    ROAD_MARGIN = ROAD_WIDTH * ROAD_GRADIENT_FALLOFF;

var NUMBER_OF_ROCK_IMAGES = 3;

var STATS = {
  roadThingsHit: 0,
  turboTime: 0,
  timeOverThings: 0,
  distance: 0
};

var DEBUG = /DEBUG/.test(window.location.href);

function init() {
  AudioPlayer.init({
    'isEnabled': true,
    'baseSrc': 'sounds',
    'volume': UserSettings.get(UserSettings.VOLUME),
    'sounds': {
      'ENGINE': 'engine.ogg',
      
      'SHOTGUN_EMPTY': 'shotgun/empty.mp3',
      'SHOTGUN_FIRE': 'shotgun/fire.mp3',
      'SHOTGUN_RELOAD': 'shotgun/reload-bullet.mp3',
      
      'VOLUME_CHANGE': 'shotgun/empty.mp3'
    }
  });
  
  Menu.init();
  
  scene = new Scene({
    'elParent': document.getElementById('game'),
    'onBeforeUpdate': onBeforeGameLoopUpdate,
    'onAfterUpdate': onAfterGameLoopUpdate,
    'onResize': onSceneResize
  });

  player = new LocalPlayer({
    'position': new Victor(scene.width / 2, scene.height - 125)
  });

  roadSprite1 = new Sprite({
    'width': ROAD_WIDTH,
    'height': scene.height,
    'zIndex': 0,
    'position': new Victor(scene.width / 2, scene.height / 2)
  });
  roadSprite2 = new Sprite({
    'width': ROAD_WIDTH,
    'height': scene.height,
    'zIndex': 0,
    'position': new Victor(scene.width / 2, -scene.height / 2)
  });
  
  InputManager.listenTo(scene);

  scene.addSprite(roadSprite1);
  scene.addSprite(roadSprite2);
  scene.addSprite(player);
  
  spawnRoadThing();

  createRoad(function onRoadCreated() {
    //AudioPlayer.loop(AudioPlayer.ENGINE);
    scene.start();
  });
}

function onSceneResize(width, height) {
  ROAD_LEFT = (width - ROAD_WIDTH) / 2;
  ROAD_RIGHT = ROAD_LEFT + ROAD_WIDTH;
  createRoad();
}

function onBeforeGameLoopUpdate(dt) {
  if (InputManager.D) {
    player.velocity.x += player.speed;
  }
  if (InputManager.A) {
    player.velocity.x -= player.speed;
  }
  if (InputManager.W) {
    player.velocity.y -= player.speed;
  }
  if (InputManager.S) {
    player.velocity.y += player.speed;
  }

  if (InputManager.isLeftMouseButtonDown) {
    player.fireWeapon();
  }
  if (InputManager.isRightMouseButtonDown) {
    player.reloadWeapon();
  }
}

function onAfterGameLoopUpdate(dt, context) {
  var i, len, sprite;
  
  var isOverWheels = false;
  if (player.didHit) {
    for (i = 0, len = player.spritesHit.length; i < len; i++) {
      sprite = player.spritesHit[i];
      
      if (sprite.left < player.left + player.wheelsHit || sprite.right > player.right - player.wheelsHit) {
        isOverWheels = true;

        if (!sprite.wasHitByPlayer) {
          STATS.roadThingsHit++;
          sprite.wasHitByPlayer = true;
        }
      }
    }
  }

  if (isOverWheels) {
    if (player.equippedWeapon) {
      player.equippedWeapon.increaseSpread(dt);
    }
    
    STATS.timeOverThings += dt;
    player.position.y += rand(-OVER_SOMETHING_RATTLE, OVER_SOMETHING_RATTLE) * dt;
    player.position.x += rand(-OVER_SOMETHING_RATTLE, OVER_SOMETHING_RATTLE) * dt;
    CURRENT_PLAYER_SPEED = PLAYER_SPEED_OVER_SOMETHING;
  } else {
    if (InputManager.SHIFT) {
      if (player.equippedWeapon) {
        player.equippedWeapon.increaseSpread(dt);
      }
      
      STATS.turboTime += dt;

      if (CURRENT_PLAYER_SPEED >= PLAYER_BOOST_SPEED) {
        CURRENT_PLAYER_SPEED = PLAYER_BOOST_SPEED;
      } else {
        speedIncrease += 30 * dt;
        CURRENT_PLAYER_SPEED += speedIncrease;
      }
    } else {
      if (player.equippedWeapon) {
        player.equippedWeapon.decreaseSpread(dt);
      }
      
      if (CURRENT_PLAYER_SPEED < PLAYER_NORMAL_SPEED) {
        speedIncrease = 0;
        CURRENT_PLAYER_SPEED = PLAYER_NORMAL_SPEED;
      } else if (CURRENT_PLAYER_SPEED > PLAYER_NORMAL_SPEED) {
        speedIncrease += 50 * dt;
        CURRENT_PLAYER_SPEED -= speedIncrease;
      }
    }
  }

  // make sure everything always moves at the correct speed
  roadSprite1.velocity.y = CURRENT_PLAYER_SPEED;
  roadSprite2.velocity.y = CURRENT_PLAYER_SPEED;
  for (i = 0, len = things.length; i < len; i++) {
    things[i].velocity.y = CURRENT_PLAYER_SPEED;
  }

  var playerHDist = ROAD_MARGIN,
      playerVDist = PLAYER_DISTANCE_FROM_BOTTOM;

  // bound player to scene margins
  if (player.left - playerHDist < ROAD_LEFT) {
    player.position.x = ROAD_LEFT + player.halfWidth + playerHDist;
  } else if (player.right + playerHDist > ROAD_RIGHT) {
    player.position.x = ROAD_RIGHT - player.halfWidth - playerHDist;
  }
  if (player.bottom + playerVDist > scene.height) {
    player.position.y = scene.height - player.halfHeight - playerVDist;
  } else if (player.top < playerVDist) {
    player.position.y = player.halfHeight + playerVDist;
  }

  // check if road things have reached the bottom
  for (i = 0, len = things.length; i < len; i++) {
    sprite = things[i];

    if (sprite && sprite.top > scene.height) {
      sprite.destroy();
      things.splice(i, 1);
    }
  }

  // wrap road textures around each other
  if (roadSprite1.top > scene.height) {
    roadSprite1.position.y = roadSprite2.top - roadSprite2.halfHeight;
  }
  if (roadSprite2.top > scene.height) {
    roadSprite2.position.y = roadSprite1.top - roadSprite1.halfHeight;
  }

  // respawn new road thing
  timeToSpawnRoadThing -= dt;
  if (timeToSpawnRoadThing <= 0) {
    spawnRoadThing();
  }

  // respawn new side road thing
  timeToSpawnSideThing -= dt;
  if (timeToSpawnSideThing <= 0) {
    spawnSideThing();
  }

  // update distance
  // CURRENT_PLAYER_SPEED is in pixels per second
  var kmph = CURRENT_PLAYER_SPEED * 3600 / 20000,
      distance = kmph * dt;

  STATS.distance += distance;

  document.getElementById('stats').innerHTML = 
    //'<li>' + STATS.turboTime.toFixed(2) + '<span>s</span> turbo time</li>' +
    //'<li>' + STATS.timeOverThings.toFixed(2) + '<span>s</span> bump time</li>' +
    //'<li>' + STATS.roadThingsHit + ' <span>hit</span></li>' +
    //'<li>' + Math.round(kmph) + '<span>km/h</span></li>' +
    '<li>' + numberWithCommas(Math.round(STATS.distance)) + '<span>m</span></li>';
}

function spawnRoadThing() {
  var width = rand(10, 50),
      height = rand(width, width * 2),
      thing = new Sprite({
        'type': 'roadThing',
        'width': width,
        'height': height,
        'colour': 'rgba(0, 0, 0, .1)',
        'zIndex': 50,
        'doesCollide': true,
        'position': new Victor(rand(ROAD_LEFT + width / 2 + ROAD_MARGIN, ROAD_RIGHT - width / 2 - ROAD_MARGIN), -height)
      });

  things.push(thing);
  scene.addSprite(thing);

  timeToSpawnRoadThing = scene.height / CURRENT_PLAYER_SPEED * randF(0.15, 0.4);
}

function spawnSideThing() {
  var width = rand(10, 100),
      height = width,
      isOnLeftSide = Math.random() > 0.5,
      x = isOnLeftSide? rand(width / 2, ROAD_LEFT - width / 2) : rand(ROAD_RIGHT + width / 2, scene.width - width / 2),
      thing = new Sprite({
        'type': 'sideThing',
        'width': width,
        'height': height,
        'zIndex': 50,
        'image': 'images/rock' + rand(1, NUMBER_OF_ROCK_IMAGES) + '.png',
        'position': new Victor(x, -height)
      });

  things.push(thing);
  scene.addSprite(thing);

  timeToSpawnSideThing = scene.height / CURRENT_PLAYER_SPEED * randF(0.2, 0.7);
}

function createRoad(callback) {
  if (!scene) {
    return;
  }

  var canvas = document.createElement('canvas'),
      context = canvas.getContext('2d'),
      image = new Image(),
      w = roadSprite1.width,
      h = roadSprite1.height,
      spread = 0.8;

  canvas.width = w;
  canvas.height = h;

  // road background
  context.fillStyle = 'rgba(161, 144, 111, 1)';
  context.fillRect(0, 0, w, h);

  // add noise
  context.fillStyle = 'rgba(118, 106, 95, .15)';
  for (var i = 0; i < w; i++) {
    for (var j = 0; j < h; j++) {
      if (Math.random() > spread) {
        context.fillRect(i, j, 1, 1);
      }
    }
  }

  // fade out both sides
  context.globalCompositeOperation = 'destination-in';
  var gradient = context.createLinearGradient(0, 0, w, 0);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(ROAD_GRADIENT_FALLOFF, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(1 - ROAD_GRADIENT_FALLOFF, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, w, h);

  image.src = canvas.toDataURL();

  roadSprite1.image = image;
  roadSprite2.image = image;
  roadSprite1.position = new Victor(scene.width / 2, scene.height / 2);
  roadSprite2.position = new Victor(scene.width / 2, -scene.height / 2);
  
  if (callback) {
    callback();
  }
}

var Sprite = (function Sprite() {
  function Sprite(options) {
    this.id;
    this.type;
    this.scene;
    this.zIndex;

    this.colour;
    this.image;

    this.friction;
    this.speed;
    this.width;
    this.height;
    this.halfWidth;
    this.halfHeight;
    this.position;
    this.velocity;
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

    this.colour = options.colour || 'rgba(255, 0, 0, 1)';

    if (options.image) {
      this.setImage(options.image);
    }

    this.friction = options.friction || 0.8;
    this.width = options.width || 0;
    this.height = options.height || 0;
    this.speed = options.speed || 0;
    this.position = options.position || new Victor(0, 0);
    this.velocity = options.velocity || new Victor(0, 0);
    this.doesCollide = Boolean(options.doesCollide);
    this.destroyWhenOutOfBounds = Boolean(options.destroyWhenOutOfBounds);

    this.halfWidth = this.width / 2;
    this.halfHeight = this.height / 2;
    this.hitBounds.width = this.width;
    this.hitBounds.height = this.height;
  };

  Sprite.prototype.setImage = function setImage(src) {
    this.image = new Image();
    this.image.src = src;
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

    if (this.velocity.x !== 0 || this.velocity.y !== 0) {
      this.position.x = x = x + this.velocity.x * dt;
      this.position.y = y = y + this.velocity.y * dt;

      this.velocity.x *= this.friction;
      this.velocity.y *= this.friction;

      if (Math.abs(this.velocity.x) < 1) {
        this.velocity.x = 0;
      }
      if (Math.abs(this.velocity.y) < 1) {
        this.velocity.y = 0;
      }
    }

    this.top = y - this.halfHeight;
    this.bottom = y + this.halfHeight;
    this.left = x - this.halfWidth;
    this.right = x + this.halfWidth;

    this.hitBounds.top = y - this.halfHeight;
    this.hitBounds.bottom = y + this.halfHeight;
    this.hitBounds.left = x - this.halfWidth;
    this.hitBounds.right = x + this.halfWidth;

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
        x = this.position.x - w / 2,
        y = this.position.y - h / 2;

    if (this.image) {
      context.drawImage(this.image, x, y, w, h);
    } else {
      context.fillStyle = this.colour;
      context.fillRect(x, y, w, h);
    }
  };

  return Sprite;
}());

var Bullet = (function Bullet() {
  function Bullet(options) {
    options.speed = options.speed || 400;
    options.type = 'bullet';
    options.width = 2;
    options.height = 2;
    options.colour = 'black';
    options.friction = 1;
    options.destroyWhenOutOfBounds = true;

    options.velocity = new Victor(options.speed, 0);
    options.velocity.rotateDeg(options.angle || 0);

    Sprite.apply(this, arguments);
  }

  Bullet.prototype = Object.create(Sprite.prototype);
  Bullet.prototype.constructor = Bullet;

  return Bullet;
}());

var Player = (function Player() {
  function Player(options) {
    !options && (options = {});

    this.isLocalPlayer = Boolean(options.isLocalPlayer);
    this.wheelsSize = options.wheelsSize || 8;
    this.wheelsHit = this.wheelsSize * 3;
    this.wheelsColour = options.wheelsColour || 'rgba(128, 128, 128, 1)';
    this.bodyColour = options.bodyColour || 'rgba(0, 0, 0, 1)';

    options.type = 'player';
    options.doesCollide = true;

    Sprite.apply(this, arguments);
  }

  Player.prototype = Object.create(Sprite.prototype);
  Player.prototype.constructor = Player;

  Player.prototype.init = function init() {
    Sprite.prototype.init.apply(this, arguments);
    
    this.createImage();
  };

  Player.prototype.createImage = function createImage() {
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

  return Player;
}());

var LocalPlayer = (function LocalPlayer() {
  function LocalPlayer(options) {
    this.elWeapon = null;
    this.elWeaponMagazine = null;
    this.elWeaponCooldown = null;
    this.weapons = [];
    this.equippedWeapon = null;
    this.currentWeaponAmmo = -1;

    this.onFireWeapon;

    options.id = 'localPlayer';
    options.isLocalPlayer = true;
    options.width = 90;
    options.height = 150;
    options.speed = PLAYER_MOVEMENT_SPEED;
    options.zIndex = 100;
    options.wheelsSize = 8;
    options.wheelsColour = 'rgba(80, 80, 80, 1)';
    options.bodyColour = 'rgba(0, 0, 0, 1)';

    Player.apply(this, arguments);

    this.init(options);
  }

  LocalPlayer.prototype = Object.create(Player.prototype);
  LocalPlayer.prototype.constructor = LocalPlayer;

  LocalPlayer.prototype.init = function init(options) {
    Player.prototype.init.apply(this, arguments);

    this.onFireWeapon = options.onFireWeapon;

    this.elWeapon = document.getElementById('weapon');
    this.elWeaponMagazine = this.elWeapon.querySelector('.magazine');
    this.elWeaponCooldown = this.elWeapon.querySelector('.cooldown b');

    this.weapons.push(new Shotgun());
    //this.weapons.push(new Pistol());
    //this.weapons.push(new Shotgun());
    //this.weapons.push(new Rifle());

    this.equipWeapon(0);
  };

  LocalPlayer.prototype.update = function update(dt) {
    Sprite.prototype.update.apply(this, arguments);

    var weapon = this.equippedWeapon;
    if (weapon) {
      weapon.update(dt);
      
      if (weapon.isReloading) {
        var reloadProgress = Math.min(weapon.reloadTime / weapon.timeToReload * 100, 100);
        this.setBulletFill(weapon.inMagazine, reloadProgress);
      }

      if (weapon.isInCooldown) {
        this.elWeaponCooldown.style.width = Math.min(weapon.cooldownTime / weapon.timeToCooldown * 100, 100) + '%';
      }
      
      if (weapon.inMagazine !== this.currentWeaponAmmo) {
        this.currentWeaponAmmo = weapon.inMagazine;
        this.updateWeaponUI();
      }
    }
  };
  
  LocalPlayer.prototype.equipWeapon = function equipWeapon(index) {
    if (this.equippedWeapon) {
      this.elWeapon.classList.remove(this.equippedWeapon.type);
    }
    
    this.equippedWeapon = this.weapons[index];
    
    this.elWeapon.classList.add(this.equippedWeapon.type);
    
    var html = '';
    for (var i = 0; i < this.equippedWeapon.magazineSize; i++) {
      html += '<li class="bullet" data-full="true" data-i="' + i + '">' +
                '<b class="empty" style="height: 0%;"></b>' +
                '<b class="full" style="height: 100%;"></b>' +
              '</li>';
    }
    this.elWeaponMagazine.innerHTML = html;
  };

  LocalPlayer.prototype.draw = function draw(context) {
    Sprite.prototype.draw.apply(this, arguments);

    var x = this.position.x,
        y = this.position.y,
        mouseX = InputManager.mousePosition.x,
        mouseY = InputManager.mousePosition.y,
        angle = InputManager.mousePosition.clone().subtract(this.position).angle(),
        weapon = this.equippedWeapon,
        drawMouseLine = false;

    if (drawMouseLine) {
      context.strokeStyle = 'rgba(0, 0, 0, .1)';
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(mouseX, mouseY);
      context.stroke();
      context.closePath();
    }

    if (weapon) {
      var weaponSpread = weapon.spreadAngle / 2 * Math.PI / 180,
          x1 = x + 150 * Math.cos(angle - weaponSpread),
          y1 = y + 150 * Math.sin(angle - weaponSpread),
          x2 = x + 150 * Math.cos(angle + weaponSpread),
          y2 = y + 150 * Math.sin(angle + weaponSpread);

      context.fillStyle = 'rgba(255, 0, 0, .15)';
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x1, y1);
      context.lineTo(x2, y2);
      context.fill();
      context.closePath();
    }
  };

  LocalPlayer.prototype.fireWeapon = function fireWeapon() {
    if (!this.equippedWeapon) {
      return;
    }

    this.equippedWeapon.fire(this);
  };

  LocalPlayer.prototype.reloadWeapon = function reloadWeapon() {
    if (!this.equippedWeapon) {
      return;
    }

    this.equippedWeapon.reload();
  };
  
  LocalPlayer.prototype.updateWeaponUI = function updateWeaponUI() {
    if (!this.equippedWeapon) {
      return;
    }

    for (var i = 0, elBullet; i < this.equippedWeapon.magazineSize; i++) {
      this.setBulletFill(i, i < this.equippedWeapon.inMagazine? 100 : 0);
    }
  };
  
  LocalPlayer.prototype.setBulletFill = function setBulletFill(bulletIndex, fill) {
    var elBullet = this.elWeaponMagazine.children[bulletIndex];
    if (!elBullet) {
      return;
    }
    
    var elBulletLoadedEmpty = elBullet.querySelector('.empty'),
        elBulletLoadedFull = elBullet.querySelector('.full');
        
    if (elBulletLoadedEmpty) {
      elBulletLoadedEmpty.style.height = (100 - fill) + '%';
    }
    if (elBulletLoadedFull) {
      elBulletLoadedFull.style.height = fill + '%';
    }
  };

  return LocalPlayer;
}());

var Weapon = (function Weapon() {
  function Weapon(options) {
    !options && (options = {});

    this.type = options.type || 'weapon';
    
    this.minSpreadAngle = 'minSpreadAngle' in options? options.minSpreadAngle : 15;
    this.maxSpreadAngle = 'maxSpreadAngle' in options? options.maxSpreadAngle : 15;
    this.spreadAngle = this.minSpreadAngle;
    this.damagePerBullet = options.damagePerBullet || 1;
    this.bulletsPerShot = options.bulletsPerShot || 1;
    this.ammo = options.ammo || Infinity;
    this.magazineSize = options.magazineSize || 1;
    this.inMagazine = this.magazineSize;
    this.bulletsPerReload = options.bulletsPerReload || this.magazineSize;
    this.timeToReload = options.timeToReload || 1;
    this.timeToCooldown = options.timeToCooldown || 1;
    
    this.soundEmpty = options.soundEmpty;
    this.soundFire = options.soundFire;
    this.soundReload = options.soundReload;

    this.reloadTime = 0;
    this.cooldownTime = 0;
    this.isInCooldown = false;
    this.canFire = true;
    this.isEmpty = this.inMagazine <= 0;
    this.isReloading = false;
    
    this.timeFromAction = 0;
    this.delayBetweenActions = 0.5;
  }

  Weapon.prototype.update = function update(dt) {
    if (this.timeFromAction < this.delayBetweenActions) {
      this.timeFromAction += dt;
    }
    
    if (this.isInCooldown) {
      this.cooldownTime += dt;
  
      if (this.cooldownTime >= this.timeToCooldown) {
        this.cooldownTime = 0;
        this.isInCooldown = false;
  
        if (this.inMagazine > 0) {
          this.canFire = true;
        }
      }
    }
    
    if (this.isReloading) {
      this.reloadTime += dt;
      
      if (this.reloadTime > this.timeToReload) {
        var shotsToLoad = this.bulletsPerReload;
    
        this.ammo -= shotsToLoad;
        
        // If we're at NEGATIVE ammo it means it ran out during the reload
        if (this.ammo < 0) {
          shotsToLoad -= Math.abs(this.ammo);
          this.ammo = 0;
        }
        
        // Finally add the actual bullets to the magazine
        this.inMagazine += shotsToLoad;
        
        this.reloadTick();
      }
    }
  };

  Weapon.prototype.fire = function fire(player) {
    if (this.isReloading) {
      return false;
    }
    
    if (this.timeFromAction < this.delayBetweenActions) {
      return;
    }
    this.timeFromAction = 0;
    
    if (this.inMagazine <= 0) {
      if (this.soundEmpty) {
        AudioPlayer.play(this.soundEmpty);
      }
      return false;
    }
    if (!this.canFire) {
      return false;
    }
    
    if (this.soundFire) {
      AudioPlayer.play(this.soundFire);
    }

    this.inMagazine--;
    this.cooldownTime = 0;
    this.isInCooldown = true;
    this.canFire = false;
    this.createBullet(player);

    if (this.inMagazine <= 0) {
      this.isEmpty = true;
    }

    return true;
  };

  Weapon.prototype.createBullet = function createBullet(player) {
    var playerPosition = player.position,
        mousePosition = InputManager.mousePosition,
        angle = mousePosition.clone().subtract(playerPosition).angleDeg();

    for (var i = 0; i <this.bulletsPerShot; i++) {
      var angleOffset = rand(-this.spreadAngle / 2, this.spreadAngle / 2);
      
      var bullet = new Bullet({
        'angle': angle + angleOffset,
        'position': playerPosition.clone()
      });

      player.scene.addSprite(bullet);
    }
  };

  Weapon.prototype.reload = function reload() {
    if (this.isReloading) {
      return false;
    }
    if (this.timeFromAction < this.delayBetweenActions) {
      return false;
    }
    this.timeFromAction = 0;
    
    this.reloadTick();
  };
  
  Weapon.prototype.reloadTick = function reloadTick() {
    if (!this.ammo || this.inMagazine === this.magazineSize) {
      this.canFire = true;
      this.isReloading = false;
      return false;
    }

    if (this.soundReload) {
      AudioPlayer.play(this.soundReload);
    }
    
    this.reloadTime = 0;
    this.isReloading = true;
  };
  
  Weapon.prototype.increaseSpread = function increaseSpread(dt) {
    this.spreadAngle = lerp(this.spreadAngle, this.maxSpreadAngle, dt * 9);
  };
  
  Weapon.prototype.decreaseSpread = function decreaseSpread(dt) {
    this.spreadAngle = lerp(this.spreadAngle, this.minSpreadAngle, dt * 9);
  };

  return Weapon;
}());

var Shotgun = (function Shotgun() {
  function Shotgun(options) {
    !options && (options = {});

    options.type = 'shotgun';
    options.damagePerBullet = 1;
    options.bulletsPerShot = 10;
    options.minSpreadAngle = 45;
    options.maxSpreadAngle = 90;
    options.magazineSize = 2;
    options.bulletsPerReload = 1;
    options.timeToReload = 0.6;
    options.timeToCooldown = 0.5;
    
    options.soundFire = AudioPlayer.SHOTGUN_FIRE;
    options.soundEmpty = AudioPlayer.SHOTGUN_EMPTY;
    options.soundReload = AudioPlayer.SHOTGUN_RELOAD;

    Weapon.call(this, options);
  }

  Shotgun.prototype = Object.create(Weapon.prototype);
  Shotgun.prototype.constructor = Shotgun;

  return Shotgun;
}());

/* main scene - the actual game */
var Scene = (function Scene() {
  function Scene(options) {
    this.elParent;
    this.el;
    this.context;
    this.width;
    this.height;

    this.lastUpdate;

    this.sprites = [];

    this.onBeforeUpdate;
    this.onAfterUpdate;
    this.onAfterDraw;
    this.onResize;

    this.init(options);
  }

  Scene.prototype.init = function init(options) {
    !options && (options = {});

    this.elParent = options.elParent || document.body;
    this.onBeforeUpdate = options.onBeforeUpdate;
    this.onAfterUpdate = options.onAfterUpdate;
    this.onAfterDraw = options.onAfterDraw;
    this.onResize = options.onResize;

    this.createHTML();

    window.addEventListener('resize', this.resize.bind(this));
    this.resize();
  };

  Scene.prototype.start = function start() {
    this.lastUpdate = Date.now();
    window.requestAnimationFrame(this.tick.bind(this));
  };

  Scene.prototype.addSprite = function addSprite(sprite) {
    if (!sprite) {
      return;
    }

    sprite.setScene(this);

    var didInsert = false;

    for (var i = 0, len = this.sprites.length; i < len; i++) {
      if (this.sprites[i].zIndex > sprite.zIndex) {
        this.sprites.splice(i, 0, sprite);
        didInsert = true;
        break;
      }
    }

    if (!didInsert) {
      this.sprites.push(sprite);
    }
  };

  Scene.prototype.removeSprite = function removeSprite(sprite) {
    for (var i = 0, len = this.sprites.length; i < len; i++) {
      if (this.sprites[i] === sprite) {
        this.sprites.splice(i, 1);
        return i;
      }
    }

    return -1;
  };

  Scene.prototype.tick = function tick() {
    var now = Date.now(),
        dt = Math.min((now - this.lastUpdate), 16) / 1000,
        context = this.context,
        sprites = this.sprites,
        i, len;

    if (this.onBeforeUpdate) {
      this.onBeforeUpdate(dt);
    }

    for (i = 0, len = sprites.length; i < len; i++) {
      if (sprites[i]) {
        sprites[i].update(dt);
      }
    }

    for (i = 0, len = sprites.length; i < len; i++) {
      if (sprites[i]) {
        sprites[i].checkCollisions(sprites);
      }
    }


    context.clearRect(0, 0, this.width, this.height);

    if (this.onAfterUpdate) {
      this.onAfterUpdate(dt, context);
    }

    for (i = 0, len = sprites.length; i < len; i++) {
      if (sprites[i]) {
        sprites[i].draw(context);
      }
    }

    if (this.onAfterDraw) {
      this.onAfterDraw(context);
    }

    this.lastUpdate = now;
    window.requestAnimationFrame(this.tick.bind(this));
  };

  Scene.prototype.resize = function resize() {
    this.el.width = this.width = this.elParent.offsetWidth;
    this.el.height = this.height = this.elParent.offsetHeight;

    if (this.onResize) {
      this.onResize(this.width, this.height);
    }
  };

  Scene.prototype.randomX = function randomX(padMin, padMax) {
    return rand(0 + (padMin || 0), this.width - (padMax || 0));
  };

  Scene.prototype.createHTML = function createHTML() {
    this.el = document.createElement('canvas');
    this.context = this.el.getContext('2d');

    this.elParent.appendChild(this.el);
  };

  return Scene;
}());

var InputManager = (function InputManager() {
  function InputManager() {
    this.listeners = {
      'pressed': {},
      'released': {}
    };

    this.isLeftMouseButtonDown = false;
    this.isMiddleMouseButtonDown = false;
    this.isRightMouseButtonDown = false;
    this.mousePosition = new Victor();

    this.KEYS_DOWN = {};

    this.CODE_TO_KEY = {};

    this.KEYS = {
      SHIFT: 16,

      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,

      W: 87,
      D: 68,
      S: 83,
      A: 65
    };

    this.init();
  }

  InputManager.prototype.init = function init() {

    for (var k in this.KEYS) {
      this[k] = false;
      this.CODE_TO_KEY[this.KEYS[k]] = k;
    }
  };
  
  InputManager.prototype.listenTo = function listenTo(scene) {
    scene.el.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    scene.el.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    scene.el.addEventListener('contextmenu', preventFunction);
  };

  InputManager.prototype.on = function on(event, key, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = {};
    }
    if (!this.listeners[event][key]) {
      this.listeners[event][key] = [];
    }

    this.listeners[event][key].push(callback);
  };

  InputManager.prototype.onMouseMove = function onMouseMove(e) {
    this.mousePosition.x = e.pageX;
    this.mousePosition.y = e.pageY;
  };

  InputManager.prototype.onMouseDown = function onMouseDown(e) {
    if (e.button === 0) {
      this.isLeftMouseButtonDown = true;
    } else if (e.button === 1) {
      this.isMiddleMouseButtonDown = true;
    } else if (e.button === 2) {
      this.isRightMouseButtonDown = true;
    }
  };

  InputManager.prototype.onMouseUp = function onMouseUp(e) {
    if (e.button === 0) {
      this.isLeftMouseButtonDown = false;
    } else if (e.button === 1) {
      this.isMiddleMouseButtonDown = false;
    } else if (e.button === 2) {
      this.isRightMouseButtonDown = false;
    }
  };

  InputManager.prototype.onKeyDown = function onKeyDown(e) {
    var key = e.keyCode,
        isFirstPress = !this.KEYS_DOWN[key];
    
    this.KEYS_DOWN[key] = true;

    this[this.CODE_TO_KEY[key]] = true;

    if (isFirstPress) {
      var listeners = this.listeners['pressed'][key];
      if (listeners) {
        for (var i = 0, len = listeners.length; i < len; i++) {
          listeners[i]();
        }
      }
    }
  };

  InputManager.prototype.onKeyUp = function onKeyUp(e) {
    var key = e.keyCode;

    this[this.CODE_TO_KEY[key]] = false;
    delete this.KEYS_DOWN[key];

    var listeners = this.listeners['released'][key];
    if (listeners) {
      for (var i = 0, len = listeners.length; i < len; i++) {
        listeners[i]();
      }
    }
  };

  return new InputManager();
}());

var AudioPlayer = (function AudioPlayer() {
  function AudioPlayer() {
    this.audioContext = null;
    
    this.baseSrc = '';
    this.SOUNDS = {};
    
    this.isEnabled = true;
  }
  
  AudioPlayer.prototype.init = function init(options) {
    !options && (options = {});
    
    this.baseSrc = options.baseSrc || '';
    this.isEnabled = Boolean(options.isEnabled);
    this.volume = 'volume' in options? options.volume : 0.5;
    
    for (var id in options.sounds) {
      this.SOUNDS[id] = {
        'id': id,
        'src': options.sounds[id]
      };
      this[id] = id;
    }
    
    this.audioContext = new AudioContext();
    
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    
    this.setVolume(this.volume);
  };
  
  AudioPlayer.prototype.setEnabled = function setEnabled(isEnabled) {
    this.isEnabled = isEnabled;
  };
  
  AudioPlayer.prototype.setVolume = function setVolume(volume) {
    this.gainNode.gain.value = volume;
  };

  AudioPlayer.prototype.play = function play(id, shouldLoop) {
    if (!this.isEnabled) {
      return;
    }
    
    var sound = this.SOUNDS[id];
    
    if (!sound) {
      console.warn('Trying to play a missing sound', id);
      return false;
    }
    
    if (!sound.buffer) {
      this.load(id, this.play.bind(this, id, shouldLoop));
      return;
    }
    
    var soundSource = this.audioContext.createBufferSource();
    soundSource.buffer = sound.buffer;
    soundSource.connect(this.gainNode);
    soundSource.loop = Boolean(shouldLoop);
    soundSource.start(0);
    
    this.SOUNDS[id].source = soundSource;
    
    //var obj = new Audio(this.baseSrc + '/' + sound.src);
    //obj.loop = Boolean(shouldLoop);
    //obj.autoplay = true;
    
    return sound.source;
  };
  
  AudioPlayer.prototype.loop = function loop(id) {
    this.play(id, true);
  };
  
  AudioPlayer.prototype.load = function load(id, callback) {
    var sound = this.SOUNDS[id],
        request = new XMLHttpRequest();

    request.open('GET', this.baseSrc + '/' + sound.src, true);
    request.responseType = 'arraybuffer';

    request.onload = function() {
      var audioData = request.response;
      
      this.audioContext.decodeAudioData(audioData, function onAudioDecode(buffer) {
        this.SOUNDS[id].buffer = buffer;
        
        callback();
      }.bind(this));
    }.bind(this);
    
    request.send();
  };
  
  return new AudioPlayer();
}());

var Menu = (function Menu() {
  function Menu() {
    this.el;
  }
  
  Menu.prototype.init = function init() {
    this.el = document.querySelector('#menu');
    
    this.createVolume();
    this.createKeys();
  };
  
  Menu.prototype.createKeys = function createKeys() {
    var html = '';
    
    function createKey(title, key) {
      html += '<tr>' +
                '<td>' + title + '</td>' +
                '<td>' + key + '</td>' +
              '</tr>';
    }
    
    createKey('Move Up', 'W');
    createKey('Move Down', 'S');
    createKey('Move Left', 'A');
    createKey('Move Right', 'D');
    createKey('Boost', 'Shift');
    createKey('Fire', 'Left Mouse Button');
    createKey('Reload', 'Right Mouse Button');
    
    this.el.querySelector('#keys tbody').innerHTML = html;
  };
  
  Menu.prototype.createVolume = function createVolume() {
    var elVolume = this.el.querySelector('#volume');
    if (elVolume) {
      var volume = UserSettings.get(UserSettings.VOLUME);
      if (volume !== null) {
        elVolume.value = volume;
      }
      
      elVolume.addEventListener('change', this.onVolumeChange.bind(this));
    }
  };
  
  Menu.prototype.onVolumeChange = function onVolumeChange(e) {
    var elVolume = e.target,
        volume = elVolume.value * 1;
    
    AudioPlayer.setVolume(volume);
    AudioPlayer.play(AudioPlayer.VOLUME_CHANGE);
    UserSettings.set(UserSettings.VOLUME, volume);
  };
  
  return new Menu();
}());

var UserSettings = (function UserSettings() {
  function UserSettings() {
    this.VOLUME = 'volume';
    
    this.init();
  }
  
  UserSettings.prototype.init = function init() {
    
  };
  
  UserSettings.prototype.set = function set(key, value) {
    var oldValue = this.get(key);
    
    localStorage[key] = value;
    
    return oldValue;
  };
  
  UserSettings.prototype.get = function get(key) {
    return key in localStorage? localStorage[key] : null; 
  };
  
  UserSettings.prototype.remove = function remove(key) {
    var value = this.get(key);
    
    delete localStorage[key];
    
    return value;
  };
  
  return new UserSettings();
}());

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

init();