var STATUS_TYPES = {
  'PICKUP_WEAPON': 'weapon',
  'PICKUP_PART': 'part'
};

var Notification = (function Notification() {
  function Notification(options) {
    this.elContainer;
    this.el;
    this.isVisible;
    this.type;
    
    this.timeoutHide;
    this.timeToShow = 3500;
  }
  
  Notification.prototype.init = function init(options) {
    !options && (options = {});
    
    this.elContainer = options.elContainer || document.body;
    this.createHTML();
  };
  
  Notification.prototype.show = function show(type, data) {
    if (!this.el) {
      console.warn('Trying to show status without an element');
      return;
    }
    
    var template = l10n.get('status-' + type);
    
    if (!template) {
      console.warn('No template found for type', type);
      return;
    }
    
    this.el.classList.remove('type-' + this.type);
    
    this.type = type;
    this.el.innerHTML = template.format(data);
    
    this.el.classList.add('type-' + this.type);
    this.el.classList.add('visible');
    
    this.isVisible = true;
    
    window.clearTimeout(this.timeoutHide);
    this.timeoutHide = window.setTimeout(this.hide.bind(this), this.timeToShow);
  };
  
  Notification.prototype.hide = function hide() {
    this.isVisible = false;
    this.el.classList.remove('visible');
  };
  
  Notification.prototype.createHTML = function createHTML() {
    this.el = document.createElement('div');
    this.el.className = 'notification';
    
    this.elContainer.appendChild(this.el);
  };
  
  return new Notification();
}());