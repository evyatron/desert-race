var l10n = (function l10n() {
  function l10n() {
    this.strings = {};
    this.onReady;
    this.isReady = false;
  }
  
  l10n.prototype.init = function init(options) {
    !options && (options = {});
    
    this.onReady = options.onReady;
    
    getJSON('/data/texts.json', this.onGotStrings.bind(this));
  };
  
  l10n.prototype.onGotStrings = function onGotStrings(data) {
    this.strings = data;
    this.isReady = true;
    
    if (this.onReady) {
      this.onReady();
    }
  };
  
  l10n.prototype.get = function get(key) {
    var value = this.strings[key] || this.strings[key.toLowerCase()];
    
    if (value === undefined) {
      console.warn('[l10n] Trying to get invalid key', key);
    }
    
    return value;
  };
  
  return new l10n();
}());