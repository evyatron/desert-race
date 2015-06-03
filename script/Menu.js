var Menu = (function Menu() {
  function Menu() {
    this.el;
  }
  
  Menu.prototype.init = function init() {
    this.el = document.querySelector('#menu');
    
    this.createSoundEnabled();
    this.createVolume('effects-volume', UserSettings.EFFECTS_VOLUME);
    this.createVolume('music-volume', UserSettings.MUSIC_VOLUME);
    this.createKeys();
  };
  
  Menu.prototype.createKeys = function createKeys() {
    var html = '';
    
    function createKey(title, key) {
      html += '<tr>' +
                '<td>' + title + '</td>' +
                '<td>' + key + '</td>' +
              '</tr>';
    }
    
    createKey('Move Up', 'W');
    createKey('Move Down', 'S');
    createKey('Move Left', 'A');
    createKey('Move Right', 'D');
    createKey('Boost', 'Shift');
    createKey('Fire', 'Left Mouse Button');
    createKey('Reload', 'Right Mouse Button');
    createKey('1', 'Equip Rifle');
    createKey('2', 'Equip Shotgun');
    
    this.el.querySelector('#keys tbody').innerHTML = html;
  };
  
  Menu.prototype.createSoundEnabled = function createSoundEnabled() {
    var elSoundEnabled = this.el.querySelector('#enable-sound');
    if (elSoundEnabled) {
      var isEnabled = UserSettings.get(UserSettings.SOUND_ENABLED);
      if (isEnabled === null) {
        isEnabled = true;
      }
      
      elSoundEnabled.checked = isEnabled;
      
      elSoundEnabled.addEventListener('change', this.onSoundEnableChange.bind(this));
    }
  };
  
  Menu.prototype.onSoundEnableChange = function onSoundEnableChange(e) {
    var elSoundEnabled = e.target,
        isEnabled = elSoundEnabled.checked;
    
    AudioPlayer.setEnabled(isEnabled);
    UserSettings.set(UserSettings.SOUND_ENABLED, isEnabled);
  };
  
  Menu.prototype.createVolume = function createVolume(id, key) {
    var elVolume = this.el.querySelector('#' + id);
    if (elVolume) {
      elVolume.dataset.settingsKey = key;
      
      var volume = UserSettings.get(key);
      if (volume !== null) {
        elVolume.value = volume;
      }
      
      elVolume.addEventListener('change', this.onVolumeChange.bind(this));
    }
  };
  
  Menu.prototype.onVolumeChange = function onVolumeChange(e) {
    var elVolume = e.target,
        volume = elVolume.value * 1,
        settingsKey = elVolume.dataset.settingsKey;
    
    if (settingsKey === UserSettings.EFFECTS_VOLUME) {
      AudioPlayer.setEffectsVolume(volume);
      AudioPlayer.play(AudioPlayer.VOLUME_CHANGE);
    } else if (settingsKey === UserSettings.MUSIC_VOLUME) {
      AudioPlayer.setMusicVolume(volume);
    }
    
    UserSettings.set(settingsKey, volume);
  };
  
  return new Menu();
}());