var Weapon = (function Weapon() {
  function Weapon(options) {
    !options && (options = {});

    this.id = options.id || ('weapon_' + Date.now() + '_' + rand(0, 10000));
    this.name = options.name || '';
    this.type = options.type || 'weapon';
    
    this.minSpreadAngle = 'minSpreadAngle' in options? options.minSpreadAngle : 15;
    this.maxSpreadAngle = 'maxSpreadAngle' in options? options.maxSpreadAngle : 15;
    this.spreadAngle = this.minSpreadAngle;
    this.bulletSpeed = options.bulletSpeed || 300;
    this.damagePerBullet = options.damagePerBullet || 1;
    this.bulletsPerShot = options.bulletsPerShot || 1;
    this.ammo = options.ammo || Infinity;
    this.magazineSize = options.magazineSize || 1;
    this.inMagazine = this.magazineSize;
    this.bulletsPerReload = options.bulletsPerReload || this.magazineSize;
    this.timeToReload = options.timeToReload || 1;
    this.timeToCooldown = options.timeToCooldown || 1;
    this.recoil = options.recoil || 0;
    this.recoilSpeed = options.recoilSpeed || 1;
    
    this.soundEmpty = options.soundEmpty;
    this.soundFire = options.soundFire;
    this.soundReload = options.soundReload;
    
    this.iconSrc = options.iconSrc || '';

    this.reloadTime = 0;
    this.cooldownTime = 0;23
    this.isInCooldown = false;
    this.canFire = true;
    this.isEmpty = this.inMagazine <= 0;
    this.isReloading = false;
    
    this.isEquipped = false;
    
    this.timeFromAction = 0;
  }

  Weapon.prototype.update = function update(dt) {
    if (this.timeFromAction < this.timeToCooldown) {
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
        this.inMagazine = Math.min(this.inMagazine + shotsToLoad, this.magazineSize);
        
        this.reloadTick();
      }
    }
  };

  Weapon.prototype.fire = function fire(player) {
    if (this.isReloading) {
      return false;
    }
    
    if (this.timeFromAction < this.timeToCooldown) {
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
        angleDeg = player.weaponAimAngle * 180 / Math.PI,
        spread = this.spreadAngle / 2 * (1 + player.weaponRecoil);

    for (var i = 0; i < this.bulletsPerShot; i++) {
      var bullet = new Bullet({
        'angle': angleDeg + rand(-spread, spread),
        'speed': this.bulletSpeed,
        'position': playerPosition.clone()
      });

      player.scene.addSprite(bullet);
    }
  };

  Weapon.prototype.reload = function reload() {
    if (this.isReloading) {
      return false;
    }
    if (this.timeFromAction < this.timeToCooldown) {
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

  Weapon.prototype.setEquipped = function setEquipped(isEquipped) {
    this.isEquipped = isEquipped;
  };

  return Weapon;
}());

var Shotgun = (function Shotgun() {
  function Shotgun(options) {
    !options && (options = {});

    options.name = 'Shotgun';
    options.type = 'shotgun';
    options.bulletSpeed = 400;
    options.damagePerBullet = 3;
    options.bulletsPerShot = 10;
    options.minSpreadAngle = 45;
    options.maxSpreadAngle = 90;
    options.magazineSize = 2;
    options.bulletsPerReload = 1;
    options.timeToReload = 0.6;
    options.timeToCooldown = 0.5;
    options.recoil = 1;
    options.recoilSpeed = 1;
    
    options.soundFire = AudioPlayer.SHOTGUN_FIRE;
    options.soundEmpty = AudioPlayer.SHOTGUN_EMPTY;
    options.soundReload = AudioPlayer.SHOTGUN_RELOAD;
    
    options.iconSrc = '/images/shotgun/bullet-full.png';

    Weapon.call(this, options);
  }

  Shotgun.prototype = Object.create(Weapon.prototype);
  Shotgun.prototype.constructor = Shotgun;

  return Shotgun;
}());

var Rifle = (function Rifle() {
  function Rifle(options) {
    !options && (options = {});

    options.name = 'Rifle';
    options.type = 'rifle';
    options.bulletSpeed = 800;
    options.damagePerBullet = 20;
    options.bulletsPerShot = 1;
    options.minSpreadAngle = 3;
    options.maxSpreadAngle = 60;
    options.magazineSize = 1;
    options.bulletsPerReload = 1;
    options.timeToReload = 2;
    options.timeToCooldown = 0.5;
    options.recoil = 3;
    options.recoilSpeed = 3;
    
    options.soundFire = AudioPlayer.RIFLE_FIRE;
    options.soundEmpty = AudioPlayer.RIFLE_EMPTY;
    options.soundReload = AudioPlayer.RIFLE_RELOAD;
    
    options.iconSrc = '/images/rifle/bullet-full.png';

    Weapon.call(this, options);
  }

  Rifle.prototype = Object.create(Weapon.prototype);
  Rifle.prototype.constructor = Rifle;

  return Rifle;
}());

var Pistol = (function Pistol() {
  function Pistol(options) {
    !options && (options = {});

    options.name = 'Pistol';
    options.type = 'pistol';
    options.bulletSpeed = 500;
    options.damagePerBullet = 4;
    options.bulletsPerShot = 1;
    options.minSpreadAngle = 15;
    options.maxSpreadAngle = 70;
    options.magazineSize = 6;
    options.bulletsPerReload = 1;
    options.timeToReload = 0.35;
    options.timeToCooldown = 0.45;
    options.recoil = 0.9;
    options.recoilSpeed = 1;
    
    options.soundFire = AudioPlayer.PISTOL_FIRE;
    options.soundEmpty = AudioPlayer.PISTOL_EMPTY;
    options.soundReload = AudioPlayer.PISTOL_RELOAD;
    
    options.iconSrc = '/images/pistol/bullet-full.png';

    Weapon.call(this, options);
  }

  Pistol.prototype = Object.create(Weapon.prototype);
  Pistol.prototype.constructor = Pistol;

  return Pistol;
}());

var AssaultRifle = (function AssaultRifle() {
  function AssaultRifle(options) {
    !options && (options = {});

    options.name = 'Assault Rifle';
    options.type = 'assault';
    options.bulletSpeed = 500;
    options.damagePerBullet = 1;
    options.bulletsPerShot = 1;
    options.minSpreadAngle = 25;
    options.maxSpreadAngle = 70;
    options.magazineSize = 30;
    options.bulletsPerReload = 30;
    options.timeToReload = 4;
    options.timeToCooldown = 0.08;
    options.recoil = 0.6;
    
    options.soundFire = AudioPlayer.ASSAULT_RIFLE_FIRE;
    options.soundEmpty = AudioPlayer.ASSAULT_RIFLE_EMPTY;
    options.soundReload = AudioPlayer.ASSAULT_RIFLE_RELOAD;
    
    options.iconSrc = '/images/rifle/bullet-full.png';

    Weapon.call(this, options);
  }

  AssaultRifle.prototype = Object.create(Weapon.prototype);
  AssaultRifle.prototype.constructor = AssaultRifle;

  return AssaultRifle;
}());

var Bullet = (function Bullet() {
  function Bullet(options) {
    options.type = 'bullet';
    options.width = options.width || 2;
    options.height = options.height || 2;
    options.colour = options.colour || 'black';
    options.friction = 1;
    options.destroyWhenOutOfBounds = true;

    options.velocity = new Victor(options.speed, 0);
    options.velocity.rotateDeg(options.angle || 0);
    
    options.zIndex = 500;

    Sprite.apply(this, arguments);
  }

  Bullet.prototype = Object.create(Sprite.prototype);
  Bullet.prototype.constructor = Bullet;

  return Bullet;
}());