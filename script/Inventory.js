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
                              'class="item weapon {{type}} equipped-{{isEquipped}}">' +
                              '<b class="key">{{key}}</b>' +
                             '</div>';
                             
  var TEMPLATE_GRID_ITEM = '<div title="{{name}}" class="item {{type}}" data-tab-id="{{tabId}}" data-index="{{index}}"></div>';
  
  var TEMPLATE_TAB_LABEL = '<div class="tab-label {{id}}" data-tab-id="{{id}}">{{name}}</div>';
  var TEMPLATE_TAB_CONTENT = '<div class="tab-content {{id}}" data-tab-id="{{id}}"></div>';
  
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
    this.weaponsHeld = [];
    
    this.weapons = [];
    this.parts = {};
    this.equippedParts = {};
    
    this.player;
    
    this.init(options);
  }
  
  Inventory.prototype.init = function init(options) {
    this.elContainer = options.elContainer;
    this.player = options.player;
    
    this.createHTML();
    
    this.showOwnedTab('weapon');
  };
  
  Inventory.prototype.showOwnedTab = function showOwnedTab(id) {
    if (this.currentTabId) {
      if (this.currentTabId === id) {
        return;
      }
      
      var elCurrentTabLabel = this.elTabLabels.querySelector('.active'),
          elCurrentTabContent = this.elTabContents.querySelector('.active');
      
      if (elCurrentTabLabel) {
        elCurrentTabLabel.classList.remove('active');
      }
      if (elCurrentTabContent) {
        elCurrentTabContent.classList.remove('active');
      }
    }
    
    var elTabLabel = this.elTabLabels.querySelector('[data-tab-id = "' +id + '"]'),
        elTabContent = this.elTabContents.querySelector('[data-tab-id = "' +id + '"]');
    
    if (elTabLabel) {
      elTabLabel.classList.add('active');
    }
    if (elTabContent) {
      elTabContent.classList.add('active');
    }
    
    this.currentTabId = id;
  };
  
  Inventory.prototype.addPart = function addPart(part) {
    var type = part.type;
    
    this.parts[type].push(part);

    if (!this.equippedParts[type]) {
      var elSlot = this.elVehicle.querySelector('.' + type.toLowerCase());

      if (elSlot) {
        if (part.src) {
          elSlot.style.backgroundImage = 'url(' + part.src + ')';
        }
      }
    } else {
      this.updateTab(type);
    }
  };
  
  Inventory.prototype.addWeapon = function addWeapon(weapon) {
    this.weapons.push(weapon);
    
    if (this.weaponsHeld.length < this.numberOfWeaponSlots) {
      this.weaponsHeld.push(weapon);
      this.updateHeldWeapons();
    } else {
      this.updateTab('weapon');
    }
  };
  
  Inventory.prototype.updateHeldWeapons = function updateHeldWeapons() {
    var weapons = this.weaponsHeld,
        html = '';
    
    for (var i = 0, len = weapons.length;  i < len; i++) {
      html += TEMPLATE_HELD_WEAPON.format(weapons[i]).format({
        'index': i,
        'key': InputManager.KEY_NAMES[InputManager.getActionKey('EquipWeapon' + i)] || ''
      });
    }
    
    this.elWeapons.innerHTML = html;
  };
  
  Inventory.prototype.updateTab = function updateTab(tabId) {
    var items = this.weapons,
        elTabContent = this.elTabContents.querySelector('[data-tab-id = "' +tabId + '"]'),
        html = '';
    
    for (var i = 0, len = items.length, item;  i < len; i++) {
      item = items[i];
      
      if (this.weaponsHeld.indexOf(item) !== -1) {
        continue;
      }
      
      html += TEMPLATE_GRID_ITEM.format(item).format({
        'tabId': tabId,
        'index': i
      });
    }
    
    elTabContent.innerHTML = html;
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
  
  Inventory.prototype.onClickOwnedTabLabel = function onClickOwnedTabLabel(e) {
    var elClicked = e.target,
        tabId = elClicked.dataset.tabId;
    
    if (tabId) {
      this.showOwnedTab(tabId);
    }
  };
  
  Inventory.prototype.onClickOwned = function onClickOwned(e) {
    var elClicked = e.target,
        data = elClicked.dataset,
        tabId = data.tabId;

    if (tabId === 'weapon') {
      if ('index' in data) {
        this.player.equipWeapon(this.weapons[data.index * 1]);
      }
    }
  };
  
  Inventory.prototype.createItemSlots = function createItemSlots() {
    var htmlOwnedTabs = '<div class="tab-labels">',
        htmlOwnedContents = '<div class="tab-contents">',
        htmlEquippedParts = '';
    
    htmlOwnedTabs += TEMPLATE_TAB_LABEL.format({
      'id': 'weapon',
      'name': 'Weapons'
    });
    htmlOwnedContents += TEMPLATE_TAB_CONTENT.format({
      'id': 'weapon',
      'name': 'Weapons'
    });

    for (var id in VEHICLE_PART_TYPES) {
      var name = VEHICLE_PART_NAMES[id] || id,
          partOrder = VEHICLE_PARTS_ORDER.indexOf(id);
      
      this.parts[id] = [];
      this.equippedParts[id] = null;
      
      htmlOwnedTabs += TEMPLATE_TAB_LABEL.format({
        'id': id,
        'name': name
      });
      htmlOwnedContents += TEMPLATE_TAB_CONTENT.format({
        'id': id,
        'name': name
      });
      
      htmlEquippedParts += TEMPLATE_PART_SLOT.format({
        'id': id.toLowerCase(),
        'name': name,
        'order': partOrder
      });
    }
    
    htmlOwnedTabs += '</div>';
    htmlOwnedContents += '</div>';
    
    this.elOwned.innerHTML = htmlOwnedTabs + htmlOwnedContents;
    this.elVehicle.innerHTML = htmlEquippedParts;
  };

  Inventory.prototype.createHTML = function createHTML() {
    this.el = document.createElement('div');
    this.el.className = 'inventory';
    this.el.innerHTML = TEMPLATE_INVENTORY.format();
    this.elOwned = this.el.querySelector('.owned');
    this.elWeapons = this.el.querySelector('.equipped .weapons');
    this.elVehicle = this.el.querySelector('.equipped .vehicle');
    
    this.createItemSlots();
    
    this.elTabLabels = this.elOwned.querySelector('.tab-labels');
    this.elTabContents = this.elOwned.querySelector('.tab-contents');
    
    this.elShowBuiltVehicle = this.el.querySelector('.toggle-built');

    addClick(this.elWeapons, this.onClickWeapons.bind(this));
    addClick(this.elWeapons, this.onClickOwnedTabLabel.bind(this));
    addClick(this.elTabContents, this.onClickOwned.bind(this));
    
    if (this.elShowBuiltVehicle) {
      addHover(this.elShowBuiltVehicle, this.showBuiltVehicle.bind(this), this.hideBuiltVehicle.bind(this));
    }
    
    this.elContainer.appendChild(this.el);
  };
  
  return Inventory;
}());