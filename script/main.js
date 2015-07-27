var scene,
    player,
    
    timeToSpawnRoadThing = 0,
    things = [],
    
    roadTexture;

var PLAYER_MOVEMENT_SPEED = 100,
    NORMAL_WORLD_SPEED = 400,
    BOOST_FACTOR = 2,
    OBSTACLE_FACTOR = 0.6,
    PLAYER_DISTANCE_FROM_BOTTOM = 10,
    OVER_SOMETHING_RATTLE = 70;

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
  Benchmarker.start('Init');
  
  if (!l10n.isReady) {
    l10n.init({
      'onReady': init
    });
    return;
  }
  
  window.addEventListener('contextmenu', preventFunction);

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
      
      'VOLUME_CHANGE': 'shotgun/empty.mp3',
      'INVENTORY_PICKUP': 'ui/inventory-pickup.mp3',
      'INVENTORY_DROP': 'ui/inventory-pickup.mp3',
      'INVENTORY_EQUIP': 'ui/inventory-drop.mp3'
    }
  });
  
  Notification.init();
  
  Menu.init();
  
  scene = new Scene({
    'elParent': document.getElementById('game'),
    'onBeforeUpdate': onPreUpdate,
    'onAfterUpdate': onPostUpdate,
    'onResize': onSceneResize
  });

  player = new LocalPlayer({
    'boostFactor': BOOST_FACTOR,
    'obstacleFactor': OBSTACLE_FACTOR,
    'speed': PLAYER_MOVEMENT_SPEED,
    'position': new Victor(scene.width / 2, scene.height - 125)
  });

  
  InputManager.listenTo(scene);

  scene.addSprite(player);
  
  Benchmarker.end('Init');

  createRoad();
  
  //AudioPlayer.loop(AudioPlayer.ENGINE);
  scene.start();
  
  addDefaultLoadout();
}

function addDefaultLoadout() {
  Benchmarker.start('Default Loadout');
  
  player.inventory.addWeapon(new Pistol());
  player.inventory.addWeapon(new Rifle());
  player.inventory.addWeapon(new Shotgun());
  player.equipHeldWeapon(0);
  
  window.setTimeout(function pickupDemoWeapon() {
    player.pickupWeapon(new AssaultRifle());
  }, 500);
  
  var defaultBody = new Body({
    
  });
  
  player.pickupPart(defaultBody);
  player.pickupPart(new Engine({
    'speed': 400,
    'boostFactor': 2
  }));
  player.pickupPart(new Wheels({
    'obstacleFactor': 0.6
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
  player.pickupPart(new VanityWings());
  player.pickupPart(new VanityWings());
  player.pickupPart(new VanityWings());
  
  Benchmarker.end('Default Loadout');
}

function bindInputActions() {
  InputManager.bindAction('MoveRight', [InputManager.KEYS.D, InputManager.KEYS.RIGHT]);
  InputManager.bindAction('MoveLeft', [InputManager.KEYS.A, InputManager.KEYS.LEFT]);
  InputManager.bindAction('MoveUp', [InputManager.KEYS.W, InputManager.KEYS.UP]);
  InputManager.bindAction('MoveDown', [InputManager.KEYS.S, InputManager.KEYS.DOWN]);
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

function onPreUpdate(dt) {
  if (InputManager.actionsActive.Boost) {
    STATS.turboTime += dt;
    if (player.currentWorldSpeed !== player.worldSpeed * player.boostFactor) {
      player.currentWorldSpeed = lerp(player.currentWorldSpeed, player.worldSpeed * player.boostFactor, dt * 3);
    }
  } else {
    if (player.currentWorldSpeed !== player.worldSpeed) {
      player.currentWorldSpeed = lerp(player.currentWorldSpeed, player.worldSpeed, dt * 3);
    }
  }
  
  player.velocity.y = -player.currentWorldSpeed;
  
  if (InputManager.actionsActive.MoveRight) {
    player.velocity.x += player.speed;
  }
  if (InputManager.actionsActive.MoveLeft) {
    player.velocity.x -= player.speed;
  }
  
  // Add obstacle hit modifiers
  if (player.didHit) {
    player.velocity.y *= player.obstacleFactor;
    player.velocity.x *= player.obstacleFactor;
  }
  
  // Weapon control - LMB to fire, RMB to reload
  if (!player.inventory.isHoldingItem()) {
    if (InputManager.actionsActive.WeaponFire) {
      player.fireWeapon();
    }
    if (InputManager.actionsActive.WeaponReload) {
      player.reloadWeapon();
    }
  }
}

function onPostUpdate(dt, context) {
  var i, len, sprite;
  
  if (player.didHit) {
    if (player.equippedWeapon) {
      player.equippedWeapon.increaseSpread(dt);
    }
    
    if (OVER_SOMETHING_RATTLE) {
      player.rattleOffset.y = rand(-OVER_SOMETHING_RATTLE, OVER_SOMETHING_RATTLE) * dt;
      player.rattleOffset.x = rand(-OVER_SOMETHING_RATTLE, OVER_SOMETHING_RATTLE) * dt;
    }
  } else {
    player.rattleOffset.y = 0;
    player.rattleOffset.x = 0;
    
    if (player.equippedWeapon) {
      player.equippedWeapon.decreaseSpread(dt);
    }
  }

  // check if road things have reached the bottom
  for (i = 0, len = things.length; i < len; i++) {
    sprite = things[i];

    if (sprite && sprite.top > scene.height) {
      sprite.destroy();
      things.splice(i, 1);
    }
  }

  // respawn new road thing
  timeToSpawnRoadThing -= dt;
  if (timeToSpawnRoadThing <= 0) {
    spawnRoadThing();
  }
  
  // Move road texture to repeat
  if (roadTexture) {
    scene.context.save();
    scene.context.translate(scene.offset.x, scene.offset.y);
    scene.context.fillStyle = roadTexture;
    scene.context.fillRect(-scene.offset.x, -scene.offset.y, scene.width, scene.height);
    scene.context.restore();
  }

  // update distance
  var kmph = -player.velocity.y * 3600 / 20000,
      distance = kmph * dt;

  STATS.distance += distance;

  document.getElementById('stats').innerHTML = 
    //'<li>' + STATS.turboTime.toFixed(2) + '<span>s</span> turbo time</li>' +
    //'<li>' + STATS.timeOverThings.toFixed(2) + '<span>s</span> bump time</li>' +
    //'<li>' + STATS.roadThingsHit + ' <span>hit</span></li>' +
    //'<li>' + Math.round(kmph) + '<span>km/h</span></li>' +
    '<li>' + numberWithCommas(Math.round(STATS.distance)) + '<span>m</span></li>' +
    '<li>' + Math.round(kmph) + ' <span>kmph</span></li>';
}

function spawnRoadThing() {
  var width = rand(10, 50),
      height = rand(width, width * 2),
      x = rand(0, scene.width) - scene.offset.x,
      y = -scene.offset.y,
      thing = new Sprite({
        'type': 'roadThing',
        'width': width,
        'height': height,
        'zIndex': 50,
        'doesCollide': true,
        'destroyWhenOutOfBounds': true,
        'image': 'images/rock' + rand(1, NUMBER_OF_ROCK_IMAGES) + '.png',
        'position': new Victor(x, y)
      });

  things.push(thing);
  scene.addSprite(thing);

  timeToSpawnRoadThing = scene.height / player.currentWorldSpeed * randF(0, 0.1);
}

function createRoad() {
  if (!scene) {
    return;
  }
  
  Benchmarker.start('Create Road');
  
  var canvas = document.createElement('canvas'),
      context = canvas.getContext('2d'),
      image = new Image(),
      spread = 0.8,
      w = scene.width / 4,
      h = scene.height / 4,
      imageData = context.getImageData(0, 0, w, h),
      data = imageData.data;

  canvas.width = w;
  canvas.height = h;
  
  // road background
  context.fillStyle = 'rgba(161, 144, 111, 1)';
  context.fillRect(0, 0, w, h);

  // Fill with noise
  for (var i = 0, len = data.length; i < len; i += 4) {
    if (Math.random() > spread) {
      data[i] = 118;
      data[i + 1] = 106;
      data[i + 2] = 95;
      data[i + 3] = rand(25, 50);
    }
  }
  
  context.putImageData(imageData, 0, 0);
  
  image.src = canvas.toDataURL();
  
  roadTexture = scene.context.createPattern(image, 'repeat');
  
  Benchmarker.end('Create Road');
}

/* main scene - the actual game */
var Scene = (function Scene() {
  function Scene(options) {
    this.elParent;
    this.el;
    this.context;
    this.width;
    this.height;
    this.offset;

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
    this.offset = options.offset || new Victor();

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