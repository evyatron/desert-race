var Inventory = (function Inventory() {
  var TEMPLATE_INVENTORY = '<div class="equipped">' +
                              '<div class="vehicle">' +
                              '</div>' +
                              '<div class="weapons">' +
                                '<ul></ul>' +
                              '</div>' +
                           '</div>' +
                           '<div class="owned">' +
                           '</div>';

  var TEMPLATE_HELD_WEAPON = '<div title="{{name}}" data-slot="{{index}}" '+
                              'class="item weapon {{type}} equipped-{{isEquipped}}">' +
                              '<b class="key">{{key}}</b>' +
                             '</div>';
                             
  var TEMPLATE_GRID_ITEM = '<div title="{{name}}" class="item {{type}}" data-tab-id="{{tabId}}" data-index="{{index}}"></div>';
  
  var TEMPLATE_TAB_LABEL = '<div class="tab-label {{id}}" data-tab-id="{{id}}">{{name}}</div>';
  var TEMPLATE_TAB_CONTENT = '<div class="tab-content {{id}}" data-tab-id="{{id}}"></div>';
  
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
    this.elEquipped;
    this.elOwned;
    this.elWeapons;
    this.elTabLabels;
    this.elTabContents;
    
    this.currentTabId;
    
    this.numberOfWeaponSlots = 3;
    this.weaponsHeld = [];
    
    this.weapons = [];
    this.parts = [];
    
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
  
  Inventory.prototype.createTabs = function createTabs() {
    var htmlTabs = '<div class="tab-labels">',
        htmlContents = '<div class="tab-contents">';
    
    htmlTabs += TEMPLATE_TAB_LABEL.format({
      'id': 'weapon',
      'name': 'Weapons'
    });
    htmlContents += TEMPLATE_TAB_CONTENT.format({
      'id': 'weapon',
      'name': 'Weapons'
    });

    for (var id in VEHICLE_PART_TYPES) {
      htmlTabs += TEMPLATE_TAB_LABEL.format({
        'id': id,
        'name': VEHICLE_PART_NAMES[id] || id
      });
      htmlContents += TEMPLATE_TAB_CONTENT.format({
        'id': id,
        'name': VEHICLE_PART_NAMES[id] || id
      });
    }
    
    htmlTabs += '</div>';
    htmlContents += '</div>';
    
    this.elOwned.innerHTML = htmlTabs + htmlContents;
  };
  
  Inventory.prototype.onClickWeapons = function onClickWeapons(e) {
    var elClicked = e.target,
        slot = elClicked.dataset.slot;
    
    if (slot === undefined) {
      return;
    }
    
    this.player.equipWeapon(this.weaponsHeld[slot * 1]);
  };
  
  Inventory.prototype.onClickTabLabel = function onClickTabLabel(e) {
    var elClicked = e.target,
        tabId = elClicked.dataset.tabId;
    
    if (tabId) {
      this.showOwnedTab(tabId);
    }
  };
  
  Inventory.prototype.onClickTabContent = function onClickTabContent(e) {
    var elClicked = e.target,
        tabId = elClicked.dataset.tabId,
        index = elClicked.dataset.index * 1;

    if (tabId === 'weapon') {
      this.player.equipWeapon(this.weapons[index]);
    }
  };
  
  Inventory.prototype.createHTML = function createHTML() {
    this.el = document.createElement('div');
    this.el.className = 'inventory';
    this.el.innerHTML = TEMPLATE_INVENTORY;
    
    this.elEquipped = this.el.querySelector('.equipped');
    this.elOwned = this.el.querySelector('.owned');
    this.elWeapons = this.el.querySelector('.weapons');
    
    this.createTabs();
    
    this.elTabLabels = this.elOwned.querySelector('.tab-labels');
    this.elTabContents = this.elOwned.querySelector('.tab-contents');
    
    this.elWeapons.addEventListener('click', this.onClickWeapons.bind(this));
    this.elTabLabels.addEventListener('click', this.onClickTabLabel.bind(this));
    this.elTabContents.addEventListener('click', this.onClickTabContent.bind(this));
    
    this.elContainer.appendChild(this.el);
  };
  
  return Inventory;
}());