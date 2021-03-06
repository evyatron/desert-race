var LocalPlayer = (function LocalPlayer() {
  function LocalPlayer(options) {
    this.isLocalPlayer = true;
    
    this.elWeapon = null;
    this.elWeaponMagazine = null;
    this.elWeaponCooldown = null;
    this.equippedWeapon = null;
    this.currentWeaponAmmo = -1;
    this.wasWeaponInCooldown = false;
    this.weaponAimAngle = 0;
    this.weaponRecoil = 0;
    
    this.weaponEquippedIndex;

    this.onFireWeapon;

    options.id = 'localPlayer';
    options.width = 128;
    options.height = 128;
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
    
    this.inventory = new Inventory({
      'elContainer': document.querySelector('.inventory-wrapper .content'),
      'player': this
    });
    
    InputManager.on('pressed', 'EquipWeapon0', this.equipHeldWeapon.bind(this, 0));
    InputManager.on('pressed', 'EquipWeapon1', this.equipHeldWeapon.bind(this, 1));
    InputManager.on('pressed', 'EquipWeapon2', this.equipHeldWeapon.bind(this, 2));
    InputManager.on('mousewheel', 'up', this.equipPreviousWeapon.bind(this));
    InputManager.on('mousewheel', 'down', this.equipNextWeapon.bind(this));
  };

  LocalPlayer.prototype.update = function update(dt) {
    Vehicle.prototype.update.apply(this, arguments);

    // Save current weapon aim angle
    this.weaponAimAngle = this.getWeaponAngle();

    var weapon = this.equippedWeapon;
    if (weapon) {
      weapon.update(dt);
      
      if (this.weaponRecoil) {
        this.weaponRecoil -= (weapon.recoilSpeed * dt)
        if (this.weaponRecoil < 0.01) {
          this.weaponRecoil = 0;
        }
      }
      
      if (weapon.isReloading) {
        var reloadProgress = Math.min(weapon.reloadTime / weapon.timeToReload * 100, 100);
        this.setBulletFill(weapon.inMagazine, weapon.bulletsPerReload, reloadProgress);
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
  
  LocalPlayer.prototype.pickupWeapon = function pickupWeapon(weapon) {
    if (this.inventory.addWeapon(weapon)) {
      Notification.show(STATUS_TYPES.PICKUP_WEAPON, weapon);
      
      if (!this.equippedWeapon) {
        this.equipWeapon(weapon);
      }
    } else {
      Notification.show(STATUS_TYPES.INVENTORY_FULL, weapon);
    }
  };
  
  LocalPlayer.prototype.equipHeldWeapon = function equipHeldWeapon(index) {
    if (this.weaponEquippedIndex !== index) {
      if (this.equipWeapon(this.inventory.weaponsHeld[index])) {
        this.weaponEquippedIndex = index;
      }
    }
  };
  
  LocalPlayer.prototype.equipPreviousWeapon = function equipPreviousWeapon() {
    var index = this.weaponEquippedIndex - 1;
    if (index < 0) {
      index = this.inventory.weaponsHeld.length - 1;
    }
    
    this.equipHeldWeapon(index);
  };
  
  LocalPlayer.prototype.equipNextWeapon = function equipNextWeapon() {
    var index = this.weaponEquippedIndex + 1;
    if (index > this.inventory.weaponsHeld.length - 1) {
      index = 0;
    }
    
    this.equipHeldWeapon(index);
  };
  
  LocalPlayer.prototype.equipWeapon = function equipWeapon(weapon) {
    if (this.equippedWeapon) {
      if (this.equippedWeapon.isReloading || this.equippedWeapon.isInCooldown) {
        return false;
      }
      
      this.elWeapon.classList.remove(this.equippedWeapon.type);
      this.equippedWeapon.setEquipped(false);
    }
    
    this.equippedWeapon = weapon;
    
    this.equippedWeapon.setEquipped(true);
    
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
    
    this.inventory.updateHeldWeapons();
    
    return true;
  };

  LocalPlayer.prototype.pickupPart = function pickupPart(part) {
    if (this.inventory.addItem(part)) {
      Notification.show(STATUS_TYPES.PICKUP_PART, part);
      
      if (!this.parts[part.type]) {
        this.equipPart(part);
      }
    } else {
      Notification.show(STATUS_TYPES.INVENTORY_FULL, part);
    }
  };
  
  LocalPlayer.prototype.equipPart = function equipPart(part) {
    Vehicle.prototype.equipPart.call(this, part);
    
    this.inventory.equipPart(part);
  };
    
  LocalPlayer.prototype.draw = function draw(context) {
    Vehicle.prototype.draw.apply(this, arguments);

    var x = this.drawPosition.x,
        y = this.drawPosition.y,
        weapon = this.equippedWeapon;

    if (DEBUG) {
      context.strokeStyle = 'rgba(0, 0, 0, .1)';
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(InputManager.mousePosition.x, InputManager.mousePosition.y);
      context.stroke();
      context.closePath();
    }

    if (weapon) {
      var weaponAngle = this.weaponAimAngle,
          weaponSpread = weapon.spreadAngle / 2 * (1 + this.weaponRecoil) * Math.PI / 180,
          x1 = x + 150 * Math.cos(weaponAngle - weaponSpread),
          y1 = y + 150 * Math.sin(weaponAngle - weaponSpread),
          x2 = x + 150 * Math.cos(weaponAngle + weaponSpread),
          y2 = y + 150 * Math.sin(weaponAngle + weaponSpread);

      context.fillStyle = 'rgba(200, 200, 200, .1)';
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x1, y1);
      context.lineTo(x2, y2);
      context.fill();
      context.closePath();
    }
  };
  
  LocalPlayer.prototype.getWeaponAngle = function getWeaponAngle() {
    var angle = InputManager.mousePosition.clone().subtract(this.drawPosition).angle(),
        maxAngle = this.weaponRotation;
    
    var centre = 90 * Math.PI / 180,
        isLeft = angle < -centre || angle > centre;
    
    if (centre + angle > maxAngle || centre + angle < -maxAngle) {
      angle = (isLeft? -1 : 1) * maxAngle - centre;
    }
    
    return angle;
  };

  LocalPlayer.prototype.fireWeapon = function fireWeapon() {
    if (this.equippedWeapon) {
      if (this.equippedWeapon.fire(this)) {
        this.weaponRecoil = this.equippedWeapon.recoil;
      }
    }
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
    for (var i = bulletIndex, len = bulletIndex + numberOfBullets; i < len; i++) {
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
      } else {
        break;
      }
    }
  };

  return LocalPlayer;
}());