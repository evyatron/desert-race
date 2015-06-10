var scene,
    player,
    roadSprite1,
    roadSprite2,

    timeToSpawnRoadThing = 0,
    timeToSpawnSideThing = 0,
    things = [];

var PLAYER_MOVEMENT_SPEED = 100,
    NORMAL_WORLD_SPEED = 400,
    BOOST_FACTOR = 2,
    OBSTACLE_FACTOR = 0.6,
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
  if (!l10n.isReady) {
    l10n.init({
      'onReady': init
    });
    return;
  }
  
  bindInputActions();
  
  AudioPlayer.init({
    'isEnabled': UserSettings.get(UserSettings.SOUND_ENABLED),
    'baseSrc': 'sounds',
    'effectsVolume': UserSettings.get(UserSettings.EFFECTS_VOLUME),
    'musicVolume': UserSettings.get(UserSettings.MUSIC_VOLUME),
    'sounds': {
      'ENGINE': 'engine.ogg',
      
      'PISTOL_EMPTY': 'shotgun/empty.mp3',
      'PISTOL_FIRE': 'shotgun/fire.mp3',
      'PISTOL_RELOAD': 'shotgun/reload-bullet.mp3',
      'SHOTGUN_EMPTY': 'shotgun/empty.mp3',
      'SHOTGUN_FIRE': 'shotgun/fire.mp3',
      'SHOTGUN_RELOAD': 'shotgun/reload-bullet.mp3',
      'RIFLE_EMPTY': 'shotgun/empty.mp3',
      'RIFLE_FIRE': 'rifle/fire.wav',
      'RIFLE_RELOAD': 'rifle/reload-bullet.wav',
      'ASSAULT_RIFLE_EMPTY': 'shotgun/empty.mp3',
      'ASSAULT_RIFLE_FIRE': 'rifle/fire.wav',
      'ASSAULT_RIFLE_RELOAD': 'rifle/reload-bullet.wav',
      
      'VOLUME_CHANGE': 'shotgun/empty.mp3'
    }
  });
  
  Notification.init();
  
  Menu.init();
  
  scene = new Scene({
    'elParent': document.getElementById('game'),
    'onBeforeUpdate': onBeforeGameLoopUpdate,
    'onAfterUpdate': onAfterGameLoopUpdate,
    'onResize': onSceneResize
  });

  player = new LocalPlayer({
    'worldSpeed': NORMAL_WORLD_SPEED,
    'boostFactor': BOOST_FACTOR,
    'obstacleFactor': OBSTACLE_FACTOR,
    'speed': PLAYER_MOVEMENT_SPEED,
    'position': new Victor(scene.width / 2, scene.height - 125)
  });

  roadSprite1 = new Sprite({
    'width': ROAD_WIDTH,
    'height': scene.height,
    'zIndex': 0,
    'friction': 1,
    'position': new Victor(scene.width / 2, scene.height / 2)
  });
  roadSprite2 = new Sprite({
    'width': ROAD_WIDTH,
    'height': scene.height,
    'zIndex': 0,
    'friction': 1,
    'position': new Victor(scene.width / 2, -scene.height / 2)
  });
  
  InputManager.listenTo(scene);

  scene.addSprite(roadSprite1);
  scene.addSprite(roadSprite2);
  scene.addSprite(player);

  createRoad(function onRoadCreated() {
    //AudioPlayer.loop(AudioPlayer.ENGINE);
    scene.start();
    
    addDefaultLoadout();
  });
}

function addDefaultLoadout() {
  player.inventory.addWeapon(new Pistol());
  player.inventory.addWeapon(new Rifle());
  player.inventory.addWeapon(new Shotgun());
  player.equipHeldWeapon(0);
  
  window.setTimeout(function() {
    player.pickupWeapon(new AssaultRifle());
  }, 500);
  
  
  player.pickupPart(new VehiclePart({
    'type': VEHICLE_PART_TYPES.BODY,
    'src': 'images/parts/default/body.png',
    'obstacleFactor': 0.1
  }));
  player.pickupPart(new Engine({
    'speed': 400,
    'boostFactor': 2
  }));
  player.pickupPart(new VehiclePart({
    'type': VEHICLE_PART_TYPES.WHEELS,
    'src': 'images/parts/default/wheels.png',
    'obstacleFactor': 0.6,
    'boundingBoxWidth': 50,
    'boundingBoxHeight': 80
  }));
  player.pickupPart(new Turret({
    'size': 16,
    'isRound': true,
    'colour': 'rgba(20, 20, 20, 1)',
    'borderColour': 'rgba(40, 40, 40, 1)',
    'borderSize': 2,
    'weaponRotation': 45
  }));
  
  player.pickupPart(new VanityWings({
    'colour': 'rgba(55, 120, 120, 1)',
    'span': 20,
    'size': 6,
    'areWingsEqual': true
  }));
  
  
  
  
  player.pickupPart(new Turret());
  player.pickupPart(new Turret());
  player.pickupPart(new Turret());
  player.pickupPart(new Engine());
  player.pickupPart(new Engine());
  player.pickupPart(new Engine());
}

function bindInputActions() {
  InputManager.bindAction('MoveRight', InputManager.KEYS.D);
  InputManager.bindAction('MoveLeft', InputManager.KEYS.A);
  InputManager.bindAction('MoveUp', InputManager.KEYS.W);
  InputManager.bindAction('MoveDown', InputManager.KEYS.S);
  InputManager.bindAction('Boost', InputManager.KEYS.SHIFT);
  
  InputManager.bindAction('WeaponFire', InputManager.KEYS.LEFT_MOUSE_BUTTON);
  InputManager.bindAction('WeaponReload', InputManager.KEYS.RIGHT_MOUSE_BUTTON);
  InputManager.bindAction('EquipWeapon0', InputManager.KEYS.NUMBER_1);
  InputManager.bindAction('EquipWeapon1', InputManager.KEYS.NUMBER_2);
  InputManager.bindAction('EquipWeapon2', InputManager.KEYS.NUMBER_3);
}

function onSceneResize(width, height) {
  ROAD_LEFT = (width - ROAD_WIDTH) / 2;
  ROAD_RIGHT = ROAD_LEFT + ROAD_WIDTH;
  createRoad();
}

function onBeforeGameLoopUpdate(dt) {
  /*
    Move world around instead of the player itself
    
  var velocityX = 0,
      velocityY = 0;
      
  if (InputManager.actionsActive.MoveRight) {
    velocityX += player.speed;
  }
  if (InputManager.actionsActive.MoveLeft) {
    velocityX -= player.speed;
  }
  if (InputManager.actionsActive.MoveUp) {
    velocityY -= player.speed;
  }
  if (InputManager.actionsActive.MoveDown) {
    velocityY += player.speed;
  }
  
  for (var i = 0, len = things.length; i < len; i++) {
    things[i].velocity.x = -velocityX;
  }
  roadSprite1.velocity.x = -velocityX;
  roadSprite2.velocity.x = -velocityX;
  */
  
  if (InputManager.actionsActive.MoveRight) {
    player.velocity.x += player.speed;
  }
  if (InputManager.actionsActive.MoveLeft) {
    player.velocity.x -= player.speed;
  }
  if (InputManager.actionsActive.MoveUp) {
    player.velocity.y -= player.speed;
  }
  if (InputManager.actionsActive.MoveDown) {
    player.velocity.y += player.speed;
  }

  if (InputManager.actionsActive.WeaponFire) {
    player.fireWeapon();
  }
  if (InputManager.actionsActive.WeaponReload) {
    player.reloadWeapon();
  }
}

function onAfterGameLoopUpdate(dt, context) {
  var worldSpeed = player.currentWorldSpeed,
      i, len, sprite;
  
  if (player.didHit) {
    if (player.equippedWeapon) {
      player.equippedWeapon.increaseSpread(dt);
    }
    
    STATS.timeOverThings += dt;
    
    player.position.y += rand(-OVER_SOMETHING_RATTLE, OVER_SOMETHING_RATTLE) * dt;
    player.position.x += rand(-OVER_SOMETHING_RATTLE, OVER_SOMETHING_RATTLE) * dt;
    
    worldSpeed = player.worldSpeed * player.obstacleFactor;
  } else {
    if (InputManager.actionsActive.Boost) {
      if (player.equippedWeapon) {
        player.equippedWeapon.increaseSpread(dt);
      }
      
      worldSpeed = lerp(worldSpeed, player.worldSpeed * player.boostFactor, dt * 3);
      
      STATS.turboTime += dt;
    } else {
      if (player.equippedWeapon) {
        player.equippedWeapon.decreaseSpread(dt);
      }
      
      worldSpeed = lerp(worldSpeed, player.worldSpeed, dt * 3);
    }
  }

  // make sure everything always moves at the correct speed
  if (worldSpeed !== player.currentWorldSpeed) {
    player.currentWorldSpeed = worldSpeed;

    roadSprite1.velocity.y = worldSpeed;
    roadSprite2.velocity.y = worldSpeed;
    for (i = 0, len = things.length; i < len; i++) {
      things[i].velocity.y = worldSpeed;
    }
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
  // currentWorldSpeed is in pixels per second
  var kmph = player.currentWorldSpeed * 3600 / 20000,
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
      speed = Math.max(player.currentWorldSpeed || player.worldSpeed, player.worldSpeed / 2),
      thing = new Sprite({
        'type': 'roadThing',
        'width': width,
        'height': height,
        'colour': 'rgba(0, 0, 0, .1)',
        'zIndex': 50,
        'friction': 1,
        'doesCollide': true,
        'velocity': new Victor(0, speed),
        'position': new Victor(rand(ROAD_LEFT + width / 2 + ROAD_MARGIN, ROAD_RIGHT - width / 2 - ROAD_MARGIN), -height)
      });

  things.push(thing);
  scene.addSprite(thing);

  timeToSpawnRoadThing = scene.height / speed * randF(0.15, 0.4);
}

function spawnSideThing() {
  var width = rand(10, 100),
      height = width,
      speed = Math.max(player.currentWorldSpeed || player.worldSpeed, player.worldSpeed / 2),
      isOnLeftSide = Math.random() > 0.5,
      x = isOnLeftSide? rand(width / 2, ROAD_LEFT - width / 2) : rand(ROAD_RIGHT + width / 2, scene.width - width / 2),
      thing = new Sprite({
        'type': 'sideThing',
        'width': width,
        'height': height,
        'zIndex': 50,
        'friction': 1,
        'image': 'images/rock' + rand(1, NUMBER_OF_ROCK_IMAGES) + '.png',
        'velocity': new Victor(0, speed),
        'position': new Victor(x, -height)
      });

  things.push(thing);
  scene.addSprite(thing);

  timeToSpawnSideThing = scene.height / speed * randF(0.2, 0.7);
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
  for (var i = 0; i < w; i++) {
    for (var j = 0; j < h; j++) {
      if (Math.random() > spread) {
        context.fillStyle = 'rgba(118, 106, 95, ' + randF(0.1, 0.2)  + ')';
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

init();