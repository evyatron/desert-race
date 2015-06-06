var InputManager = (function InputManager() {
  function InputManager() {
    this.listeners = {
      'pressed': {},
      'released': {}
    };

    this.isLeftMouseButtonDown = false;
    this.isMiddleMouseButtonDown = false;
    this.isRightMouseButtonDown = false;
    this.mousePosition = new Victor();
    
    this.actionKeys = {};
    this.keyToAction = {};
    this.actionsActive = {};

    this.KEYS_DOWN = {};

    this.CODE_TO_KEY = {};

    this.KEYS = {
      LEFT_MOUSE_BUTTON: -1,
      MIDDLE_MOUSE_BUTTON: -2,
      RIGHT_MOUSE_BUTTON: -3,
      
      SHIFT: 16,

      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,

      W: 87,
      D: 68,
      S: 83,
      A: 65,
      
      NUMBER_1: 49,
      NUMBER_2: 50,
      NUMBER_3: 51,
      NUMBER_4: 52,
      NUMBER_5: 53,
      NUMBER_6: 54,
      NUMBER_7: 55,
      NUMBER_8: 56,
      NUMBER_9: 57,
      NUMBER_0: 48
    };
    
    this.KEY_NAMES = {};
    this.KEY_NAMES[this.KEYS.LEFT_MOUSE_BUTTON] = 'Left Mouse Button';
    this.KEY_NAMES[this.KEYS.MIDDLE_MOUSE_BUTTON] = 'Middle Mouse Button';
    this.KEY_NAMES[this.KEYS.RIGHT_MOUSE_BUTTON] = 'Right Mouse Button';
    this.KEY_NAMES[this.KEYS.SHIFT] = 'Shift';
    this.KEY_NAMES[this.KEYS.LEFT] = 'Left';
    this.KEY_NAMES[this.KEYS.UP] = 'Up';
    this.KEY_NAMES[this.KEYS.RIGHT] = 'Right';
    this.KEY_NAMES[this.KEYS.DOWN] = 'Down';
    this.KEY_NAMES[this.KEYS.W] = 'W';
    this.KEY_NAMES[this.KEYS.D] = 'D';
    this.KEY_NAMES[this.KEYS.S] = 'S';
    this.KEY_NAMES[this.KEYS.A] = 'A';
    this.KEY_NAMES[this.KEYS.NUMBER_1] = '1';
    this.KEY_NAMES[this.KEYS.NUMBER_2] = '2';
    this.KEY_NAMES[this.KEYS.NUMBER_3] = '3';
    this.KEY_NAMES[this.KEYS.NUMBER_4] = '4';
    this.KEY_NAMES[this.KEYS.NUMBER_5] = '5';
    this.KEY_NAMES[this.KEYS.NUMBER_6] = '6';
    this.KEY_NAMES[this.KEYS.NUMBER_7] = '7';
    this.KEY_NAMES[this.KEYS.NUMBER_8] = '8';
    this.KEY_NAMES[this.KEYS.NUMBER_9] = '9';
    this.KEY_NAMES[this.KEYS.NUMBER_0] = '0';
    
    this.mouseButtonKeys = [
      this.KEYS.LEFT_MOUSE_BUTTON,
      this.KEYS.MIDDLE_MOUSE_BUTTON,
      this.KEYS.RIGHT_MOUSE_BUTTON
    ];

    this.init();
  }

  InputManager.prototype.init = function init() {
    for (var k in this.KEYS) {
      this[k] = false;
      this.CODE_TO_KEY[this.KEYS[k]] = k;
    }
  };
  
  InputManager.prototype.getActionKey = function getActionKey(actionName) {
    return this.actionKeys[actionName];
  };
  
  InputManager.prototype.bindAction = function bindAction(actionName, key) {
    if (!this.keyToAction[key]) {
      var currentActionKey = this.getActionKey(actionName);
      if (currentActionKey) {
        delete this.keyToAction[currentActionKey];
      }
      
      this.actionKeys[actionName] = key;
      this.keyToAction[key] = actionName;
      
      return true;
    }
    
    return false;
  };
  
  InputManager.prototype.getBoundActions = function getBoundActions() {
    return this.actionKeys;
  };
  
  InputManager.prototype.getKeyName = function getKeyName(key) {
    return this.KEY_NAMES[key];
  };
  
  InputManager.prototype.listenTo = function listenTo(scene) {
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
    
    scene.el.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    
    scene.el.addEventListener('contextmenu', function onContextMenu(e) {
      e.preventDefault();
    });
  };

  InputManager.prototype.on = function on(event, actionName, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = {};
    }
    if (!this.listeners[event][actionName]) {
      this.listeners[event][actionName] = [];
    }

    this.listeners[event][actionName].push(callback);
  };

  InputManager.prototype.onMouseMove = function onMouseMove(e) {
    this.mousePosition.x = e.pageX;
    this.mousePosition.y = e.pageY;
  };

  InputManager.prototype.onMouseDown = function onMouseDown(e) {
    var key = this.mouseButtonKeys[e.button];
    if (typeof key === 'number') {
      this.setKeyStatus(key, true);
    }
  };

  InputManager.prototype.onMouseUp = function onMouseUp(e) {
    var key = this.mouseButtonKeys[e.button];
    if (typeof key === 'number') {
      this.setKeyStatus(key, false);
    }
  };

  InputManager.prototype.onKeyDown = function onKeyDown(e) {
    this.setKeyStatus(e.keyCode, true);
  };

  InputManager.prototype.onKeyUp = function onKeyUp(e) {
    this.setKeyStatus(e.keyCode, false);
  };
  
  InputManager.prototype.setKeyStatus = function setKeyStatus(key, isDown) {
    var isFirstPress = !this.KEYS_DOWN[key],
        actionName = this.keyToAction[key];
    
    this.KEYS_DOWN[key] = isDown;
    this[this.CODE_TO_KEY[key]] = isDown;
    
    if (actionName) {
      this.actionsActive[actionName] = isDown;

      if (isFirstPress || !isDown) {
        var listeners = this.listeners[isDown? 'pressed' : 'released'][actionName];
        
        if (listeners) {
          for (var i = 0, len = listeners.length; i < len; i++) {
            listeners[i]();
          }
        }
      }
    }
  };

  return new InputManager();
}());