var Inventory = (function Inventory() {
  var TEMPLATE_INVENTORY = '<div class="equipped">' +
                              '<div class="vehicle">' +
                              '</div>' +
                              '<div class="weapons">' +
                                '<ul></ul>' +
                              '</div>' +
                              '<b class="button toggle-built">{{l10n(inventory-show-built)}}</b>' +
                           '</div>' +
                           '<div class="owned">' +
                           '</div>' +
                           '<div class="status">' +
                            '0' +
                           '</div>';

  var TEMPLATE_HELD_WEAPON = '<div title="{{name}}" data-slot="{{index}}" '+
                              'class="held-weapon weapon {{type}} equipped-{{isEquipped}}">' +
                              '<b class="key">{{key}}</b>' +
                             '</div>';
                             
  var TEMPLATE_GRID_ITEM = '<div class="icon" style="background-image: url({{iconSrc}});"></div>';

  var TEMPLATE_PART_SLOT = '<div class="part {{id}}" title="{{name}}" style="z-index: {{order}};"></div>';
  
  var VEHICLE_PART_NAMES = {};
  VEHICLE_PART_NAMES[VEHICLE_PART_TYPES.ENGINE] = 'Engine';
  VEHICLE_PART_NAMES[VEHICLE_PART_TYPES.WHEELS] = 'Wheels';
  VEHICLE_PART_NAMES[VEHICLE_PART_TYPES.BODY] = 'Body';
  VEHICLE_PART_NAMES[VEHICLE_PART_TYPES.FRONT] = 'Front';
  VEHICLE_PART_NAMES[VEHICLE_PART_TYPES.REAR] = 'Rear';
  VEHICLE_PART_NAMES[VEHICLE_PART_TYPES.TURRET] = 'Turret';
  VEHICLE_PART_NAMES[VEHICLE_PART_TYPES.VANITY] = 'Vanity';
  VEHICLE_PART_NAMES[VEHICLE_PART_TYPES.MORALE] = 'Morale';
  
    
  var SLOT_SIZE = 48;
    
  function Inventory(options) {
    this.elContainer;
    this.el;
    this.elWeapons;
    this.elVehicle;
    this.elOwned;
    this.elTabLabels;
    this.elTabContents;
    
    this.currentTabId;
    
    this.numberOfWeaponSlots = 3;
    this.weaponsHeld = []; //new Array(this.numberOfWeaponSlots);

    this.equippedParts = {};
    
    this.items = {};
    this.grid = [];
    
    this.player;
    
    this.init(options);
  }
  
  Inventory.prototype.init = function init(options) {
    this.elContainer = options.elContainer;
    this.player = options.player;
    
    this.dropHeldItem_bound = this.dropHeldItem.bind(this);

    for (var id in VEHICLE_PART_TYPES) {
      this.equippedParts[id] = null;
    }
    
    this.createHTML();
  };

  Inventory.prototype.equipPart = function equipPart(part) {
    console.log('[Inventory] Equip part', part);
    
    var type = part.type;

    this.equippedParts[type] = part;
    
    this.removeItem(part);
    
    var elSlot = this.elVehicle.querySelector('.' + type.toLowerCase());
    if (elSlot) {
      if (part.src) {
        elSlot.style.backgroundImage = 'url(' + part.src + ')';
      }
    }
  };
  
  Inventory.prototype.removeItem = function removeItem(itemToRemove) {
    for (var i = 0, rows = this.grid.length; i < rows; i++) {
      for (var j = 0, cols = this.grid[i].length; j < cols; j++) {
        var item = this.grid[i][j].item;
        if (item && item.id === itemToRemove.id) {
          return this.grid[i][j].removeItem();
        }
      }
    }
    
    return null;
  };
  
  Inventory.prototype.addWeapon = function addWeapon(weapon) {
    if (this.weaponsHeld.length < this.numberOfWeaponSlots) {
      this.weaponsHeld.push(weapon);
      this.updateHeldWeapons();
      return true;
    } else {
      return this.addItem(weapon);
    }
  };
  
  Inventory.prototype.updateHeldWeapons = function updateHeldWeapons() {
    var html = '';
    
    for (var i = 0, len = this.weaponsHeld.length;  i < len; i++) {
      html += TEMPLATE_HELD_WEAPON.format(this.weaponsHeld[i]).format({
        'index': i,
        'key': InputManager.KEY_NAMES[InputManager.getActionKey('EquipWeapon' + i)] || ''
      });
    }
    
    this.elWeapons.innerHTML = html;
  };
  
  Inventory.prototype.addItem = function addItem(item) {
    var freeSlot = this.getNextFreeSlot();
    if (freeSlot) {
      freeSlot.setItem(item);
      return true;
    } else {
      return false;
    }
  };
  
  Inventory.prototype.getNextFreeSlot = function getNextFreeSlot() {
    for (var i = 0, rows = this.grid.length; i < rows; i++) {
      for (var j = 0, cols = this.grid[i].length; j < cols; j++) {
        if (this.grid[i][j].isFree()) {
          return this.grid[i][j];
        }
      }
    }
    
    return null;
  };
  
  Inventory.prototype.showBuiltVehicle = function showBuiltVehicle(e) {
    this.elVehicle.classList.add('show-built');
  };
  
  Inventory.prototype.hideBuiltVehicle = function hideBuiltVehicle(e) {
    this.elVehicle.classList.remove('show-built');
  };
  
  Inventory.prototype.onClickWeapons = function onClickWeapons(e) {
    var elClicked = e.target,
        slot = elClicked.dataset.slot;
    
    if (slot === undefined) {
      return;
    }
    
    this.player.equipWeapon(this.weaponsHeld[slot * 1]);
  };
  
  Inventory.prototype.holdWeapon = function holdWeapon(weapon, index, slot) {
    var weaponHeld = this.weaponsHeld[index],
        autoEquip = weaponHeld && weaponHeld.isEquipped;
    
    if (weaponHeld && weaponHeld.isReloading) {
      return false;
    }
    
    this.weaponsHeld[index] = weapon;
    
    if (slot) {
      slot.removeItem();
      
      if (weaponHeld) {
        slot.setItem(weaponHeld);
      }
    }
    
    if (autoEquip) {
      this.player.equipWeapon(weapon);
    }
    
    return true;
  };
  
  Inventory.prototype.onOwnedMouseDown = function onOwnedMouseDown(e) {
    if (InputManager.isRightClick(e)) {
      return;
    }
    
    if (this.itemBeingMoved) {
      return;
    }
    
    var slot = this.getMouseEventSlot(e);
    
    if (!slot || !slot.item) {
      return;
    }
    
    this.holdItem(slot, null, e);
  };
  
  Inventory.prototype.holdItem = function holdItem(slot, item, e) {
    this.slotTakenFrom = slot;
    this.itemBeingMoved = item || slot.removeItem();
    this.elMovingItem = document.createElement('div');
    this.elMovingItem.id = 'moving-item';
    this.elMovingItem.className = 'inventory-slot';
    this.elMovingItem.innerHTML = '<div class="image" style="background-image: url(' + this.itemBeingMoved.iconSrc + ');"></div>';
    this.elMovingItem.style.transform = 'translate(' + e.pageX + 'px, ' + e.pageY + 'px)';
    document.body.appendChild(this.elMovingItem);
    
    window.addEventListener('mouseup', this.dropHeldItem_bound);
    
    this.timePickedUpToHold = Date.now();
  };
  
  Inventory.prototype.dropHeldItem = function dropHeldItem(e) {
    if (Date.now() - this.timePickedUpToHold < 100) {
      return;
    }
    
    window.removeEventListener('mouseup', this.dropHeldItem_bound);
    
    var targetSlot = this.getMouseEventSlot(e),
        itemToPickupAfterDrop = null;

    if (this.itemBeingMoved) {
      if (targetSlot) {
        itemToPickupAfterDrop = targetSlot.removeItem();
        targetSlot.setItem(this.itemBeingMoved);
      } else {
        if (this.slotTakenFrom && this.slotTakenFrom.isFree()) {
          this.slotTakenFrom.setItem(this.itemBeingMoved);
        } else {
          var nextFreeSlot = this.getNextFreeSlot();
          if (nextFreeSlot) {
            nextFreeSlot.setItem(this.itemBeingMoved);
          }
        }
      }
    }
      
    if (this.elMovingItem) {
      this.elMovingItem.parentNode.removeChild(this.elMovingItem);
    }
    
    this.itemBeingMoved = null;
    this.slotTakenFrom = null;
    this.elMovingItem = null;
    
    if (itemToPickupAfterDrop) {
      this.holdItem(null, itemToPickupAfterDrop, e);
    }
  };
    
  Inventory.prototype.getMouseEventSlot = function getMouseEventSlot(e) {
    var elClicked = e.target,
        data = elClicked && elClicked.dataset || {};

    if (!('row' in data) || !('col' in data)) {
      return null;
    }
    
    return this.grid[parseInt(data.row)][parseInt(data.col)];
  };
  
  Inventory.prototype.onOwnedMouseUp = function onOwnedMouseUp(e) {
    var slot = this.getMouseEventSlot(e);

    if (!slot) {
      return;
    }
    
    if (!this.itemBeingMoved) {
      if (InputManager.isRightClick(e)) {
        if (slot.item instanceof Weapon) {
          var weaponToHold = slot.item,
              equippedWeapon = this.getEquippedWeapon();
              
          this.holdWeapon(weaponToHold, equippedWeapon.index, slot);
        } else if (slot.item instanceof VehiclePart) {
          var partToEquip = slot.removeItem(),
              equippedPart = this.player.parts[partToEquip.type];
          
          if (equippedPart) {
            slot.setItem(equippedPart);
          }
              
          this.player.equipPart(partToEquip);
        }
      }
    }
  };
  
  Inventory.prototype.onOwnedMouseMove = function onOwnedMouseMove(e) {
    var slot = this.getMouseEventSlot(e);
    if (slot) {
      if (slot !== this.currentHoverSlot) {
        if (this.currentHoverSlot) {
          this.currentHoverSlot.el.classList.remove('hover');
          this.currentHoverSlot = null;
        }
        
        slot.el.classList.add('hover');
        
        this.currentHoverSlot = slot;
      }
    } else if (this.currentHoverSlot) {
      this.currentHoverSlot.el.classList.remove('hover');
      this.currentHoverSlot = null;
    }
    
    if (!this.itemBeingMoved) {
      //window.removeEventListener('mouseup', this.moveMovedItem_bound);
      return;
    }
    
    if (this.elMovingItem) {
      this.elMovingItem.style.transform = 'translate(' + e.pageX + 'px, ' + e.pageY + 'px)';
    }
  };
  
  Inventory.prototype.getEquippedWeapon = function getEquippedWeapon() {
    for (var i = 0, len = this.weaponsHeld.length;  i < len; i++) {
      if (this.weaponsHeld[i].isEquipped) {
        return {
          'weapon': this.weaponsHeld[i],
          'index': i
        };
      }
    }
    
    return null;
  };
  
  Inventory.prototype.createItemSlots = function createItemSlots() {
    var htmlEquippedParts = '',
        cols = Math.floor(this.elOwned.offsetWidth / SLOT_SIZE),
        rows = Math.floor(this.elOwned.offsetHeight / SLOT_SIZE);

    for (var i = 0; i < rows; i++) {
      this.grid[i] = [];
      
      for (var j = 0; j < cols; j++) {
        var slot = new InventorySlot(i, j);
        this.grid[i].push(slot);
        this.elOwned.appendChild(slot.el);
      }
    }
    

    for (var id in VEHICLE_PART_TYPES) {
      var name = VEHICLE_PART_NAMES[id] || id,
          partOrder = VEHICLE_PARTS_ORDER.indexOf(id);

      htmlEquippedParts += TEMPLATE_PART_SLOT.format({
        'id': id.toLowerCase(),
        'name': name,
        'order': partOrder
      });
    }
    
    this.elVehicle.innerHTML = htmlEquippedParts;
  };

  Inventory.prototype.createHTML = function createHTML() {
    this.el = document.createElement('div');
    this.el.className = 'inventory';
    this.el.innerHTML = TEMPLATE_INVENTORY.format();
    this.elOwned = this.el.querySelector('.owned');
    this.elWeapons = this.el.querySelector('.equipped .weapons');
    this.elVehicle = this.el.querySelector('.equipped .vehicle');

    this.elShowBuiltVehicle = this.el.querySelector('.toggle-built');

    window.addEventListener('mousemove', this.onOwnedMouseMove.bind(this));
    this.elOwned.addEventListener('mousedown', this.onOwnedMouseDown.bind(this));
    this.elOwned.addEventListener('mouseup', this.onOwnedMouseUp.bind(this));
    addClick(this.elWeapons, this.onClickWeapons.bind(this));
    addHover(this.elShowBuiltVehicle, this.showBuiltVehicle.bind(this), this.hideBuiltVehicle.bind(this));
    
    this.elContainer.appendChild(this.el);
    
    this.createItemSlots();
  };
  
  var InventorySlot = (function InventorySlot() {
    function InventorySlot(row, col) {
      this.el;
      this.elImage;
      this.elType;
      
      this.row = row;
      this.col = col;
      
      this.item = null;
      
      this.init();
    }
    
    InventorySlot.prototype.init = function init() {
      this.el = document.createElement('div');
      this.el.className = 'inventory-slot free';
      this.el.dataset.row = this.row;
      this.el.dataset.col = this.col;
      this.el.style.width = SLOT_SIZE + 'px';
      this.el.style.height = SLOT_SIZE + 'px';
      this.el.innerHTML = '<div class="image"></div>' +
                          '<div class="icon"></div>';
      
      this.elImage = this.el.querySelector('.image');
      this.elType = this.el.querySelector('.type');
    };
    
    InventorySlot.prototype.setItem = function setItem(item) {
      if (this.isFree()) {
        this.item = item;
        
        this.el.classList.remove('free');
        this.el.title = this.item.name || this.item.id;
        this.elImage.style.backgroundImage = 'url(' + item.iconSrc + ')';
        
        return true;
      } else {
        return false;
      }
    };
    
    InventorySlot.prototype.removeItem = function removeItem() {
      if (!this.isFree()) {
        var item = this.item;
        this.item = null;
        
        this.el.classList.add('free');
        this.el.title = '';
        this.elImage.style.backgroundImage = 'none';
        
        return item;
      } else {
        return false;
      }
    };
    
    InventorySlot.prototype.isFree = function isFree() {
      return !this.item;
    };

    return InventorySlot;
  }());
  
  return Inventory;
}());