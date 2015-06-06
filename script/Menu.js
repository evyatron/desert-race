var Menu = (function Menu() {
  function Menu() {
    this.el;
  }
  
  Menu.prototype.init = function init() {
    this.el = document.querySelector('.settings');
    
    this.createKeys();
    this.createSoundEnabled();
    this.createVolume('effects-volume', UserSettings.EFFECTS_VOLUME);
    this.createVolume('music-volume', UserSettings.MUSIC_VOLUME);
  };
  
  Menu.prototype.createKeys = function createKeys() {
    var actions = InputManager.getBoundActions(),
        html = '';
    
    for (var actionId in actions) {
      var actionName = l10n.get('action-' + actionId) || actionId;
      
      html += '<tr>' +
                '<td>' + actionName + '</td>' +
                '<td>' + InputManager.getKeyName(actions[actionId]) + '</td>' +
              '</tr>';
    }
    
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