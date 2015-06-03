var LocalPlayer = (function LocalPlayer() {
  function LocalPlayer(options) {
    this.isLocalPlayer = true;
    
    this.elWeapon = null;
    this.elWeaponMagazine = null;
    this.elWeaponCooldown = null;
    this.weapons = [];
    this.equippedWeapon = null;
    this.currentWeaponAmmo = -1;
    this.wasWeaponInCooldown = false;

    this.onFireWeapon;

    options.id = 'localPlayer';
    options.isLocalPlayer = true;
    options.width = 90;
    options.height = 150;
    options.speed = options.speed;
    options.zIndex = 100;
    options.wheelsSize = 8;
    options.wheelsColour = 'rgba(80, 80, 80, 1)';
    options.bodyColour = 'rgba(0, 0, 0, 1)';

    Vehicle.apply(this, arguments);

    this.init(options);
  }

  LocalPlayer.prototype = Object.create(Vehicle.prototype);
  LocalPlayer.prototype.constructor = LocalPlayer;

  LocalPlayer.prototype.init = function init(options) {
    Vehicle.prototype.init.apply(this, arguments);

    this.onFireWeapon = options.onFireWeapon;

    this.elWeapon = document.getElementById('weapon');
    this.elWeaponMagazine = this.elWeapon.querySelector('.magazine');
    this.elWeaponCooldown = this.elWeapon.querySelector('.cooldown b');

    this.weapons.push(new Pistol());
    this.weapons.push(new Rifle());
    this.weapons.push(new Shotgun());
    
    InputManager.on('pressed', InputManager.KEYS.NUMBER_1, this.equipWeapon.bind(this, 0));
    InputManager.on('pressed', InputManager.KEYS.NUMBER_2, this.equipWeapon.bind(this, 1));
    InputManager.on('pressed', InputManager.KEYS.NUMBER_3, this.equipWeapon.bind(this, 2));

    this.equipWeapon(0);
  };

  LocalPlayer.prototype.update = function update(dt) {
    Sprite.prototype.update.apply(this, arguments);

    var weapon = this.equippedWeapon;
    if (weapon) {
      weapon.update(dt);
      
      if (weapon.isReloading) {
        var reloadProgress = Math.min(weapon.reloadTime / weapon.timeToReload * 100, 100),
            numberOfBullets = Math.min(weapon.inMagazine + weapon.bulletsPerReload, weapon.magazineSize);

        this.setBulletFill(weapon.inMagazine, numberOfBullets, reloadProgress);
      }

      if (weapon.isInCooldown) {
        this.wasWeaponInCooldown = true;
        this.elWeaponCooldown.style.width = Math.min(weapon.cooldownTime / weapon.timeToCooldown * 100, 100) + '%';
      } else if (this.wasWeaponInCooldown) {
        this.wasWeaponInCooldown = false;
        this.elWeaponCooldown.style.width = '100%';
      }
      
      if (weapon.inMagazine !== this.currentWeaponAmmo) {
        this.currentWeaponAmmo = weapon.inMagazine;
        this.updateWeaponUI();
      }
    }
  };
  
  LocalPlayer.prototype.equipWeapon = function equipWeapon(index) {
    if (this.equippedWeapon) {
      if (this.equippedWeapon.isReloading || this.equippedWeapon.isInCooldown) {
        return false;
      }
      
      this.elWeapon.classList.remove(this.equippedWeapon.type);
    }
    
    this.equippedWeapon = this.weapons[index];
    
    this.elWeapon.classList.add(this.equippedWeapon.type);
    
    var html = '';
    for (var i = 0; i < this.equippedWeapon.magazineSize; i++) {
      var isFull = i < this.equippedWeapon.inMagazine;
      
      html += '<li class="bullet" data-full="true" data-i="' + i + '">' +
                '<b class="empty" style="height: ' + (isFull? 0 : 100) + '%;"></b>' +
                '<b class="full" style="height: ' + (isFull? 100 : 0) + '%;"></b>' +
              '</li>';
    }
    this.elWeaponMagazine.innerHTML = html;
    
    return true;
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

    for (var i = 0; i < this.equippedWeapon.magazineSize; i++) {
      this.setBulletFill(i, 1, i < this.equippedWeapon.inMagazine? 100 : 0);
    }
  };
  
  LocalPlayer.prototype.setBulletFill = function setBulletFill(bulletIndex, numberOfBullets, fill) {
    for (var i = bulletIndex; i < bulletIndex + numberOfBullets; i++) {
      var elBullet = this.elWeaponMagazine.children[i];
      if (elBullet) {
        var elBulletLoadedEmpty = elBullet.querySelector('.empty'),
            elBulletLoadedFull = elBullet.querySelector('.full');
            
        if (elBulletLoadedEmpty) {
          elBulletLoadedEmpty.style.height = (100 - fill) + '%';
        }
        if (elBulletLoadedFull) {
          elBulletLoadedFull.style.height = fill + '%';
        }
      }
    }
  };

  return LocalPlayer;
}());