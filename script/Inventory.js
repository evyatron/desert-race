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

  var TEMPLATE_WEAPON = '<div title="{{name}}" data-slot="{{index}}" '+
                              'class="weapon {{type}} equipped-{{isEquipped}}">' +
                        '</div>';
  
  function Inventory(options) {
    this.elContainer;
    this.el;
    this.elEquipped;
    this.elOwned;
    this.elWeapons;
    
    this.player;
    
    this.init(options);
  }
  
  Inventory.prototype.init = function init(options) {
    this.elContainer = options.elContainer;
    this.player = options.player;
    
    this.createHTML();
    this.updateWeapons();
  };
  
  Inventory.prototype.updateWeapons = function updateWeapons() {
    var weapons = this.player.weapons,
        html = '';
    
    for (var i = 0, len = weapons.length;  i < len; i++) {
      html += TEMPLATE_WEAPON.format(weapons[i]).format({
        'index': i
      });
    }
    
    this.elWeapons.innerHTML = html;
  };
  
  Inventory.prototype.onClickWeapons = function onClickWeapons(e) {
    var elClicked = e.target,
        slot = elClicked.dataset.slot;
    
    if (slot === undefined) {
      return;
    }
    
    this.player.equipWeapon(slot * 1);
  };
  
  Inventory.prototype.createHTML = function createHTML() {
    this.el = document.createElement('div');
    this.el.className = 'inventory';
    this.el.innerHTML = TEMPLATE_INVENTORY;
    
    this.elEquipped = this.el.querySelector('.equipped');
    this.elOwned = this.el.querySelector('.owned');
    this.elWeapons = this.el.querySelector('.weapons');
    
    this.elWeapons.addEventListener('click', this.onClickWeapons.bind(this));
    
    this.elContainer.appendChild(this.el);
  };
  
  return Inventory;
}());