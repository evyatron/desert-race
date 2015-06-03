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

    this.KEYS_DOWN = {};

    this.CODE_TO_KEY = {};

    this.KEYS = {
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

    this.init();
  }

  InputManager.prototype.init = function init() {
    for (var k in this.KEYS) {
      this[k] = false;
      this.CODE_TO_KEY[this.KEYS[k]] = k;
    }
  };
  
  InputManager.prototype.listenTo = function listenTo(scene) {
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    scene.el.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    scene.el.addEventListener('contextmenu', preventFunction);
  };

  InputManager.prototype.on = function on(event, key, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = {};
    }
    if (!this.listeners[event][key]) {
      this.listeners[event][key] = [];
    }

    this.listeners[event][key].push(callback);
  };

  InputManager.prototype.onMouseMove = function onMouseMove(e) {
    this.mousePosition.x = e.pageX;
    this.mousePosition.y = e.pageY;
  };

  InputManager.prototype.onMouseDown = function onMouseDown(e) {
    if (e.button === 0) {
      this.isLeftMouseButtonDown = true;
    } else if (e.button === 1) {
      this.isMiddleMouseButtonDown = true;
    } else if (e.button === 2) {
      this.isRightMouseButtonDown = true;
    }
  };

  InputManager.prototype.onMouseUp = function onMouseUp(e) {
    if (e.button === 0) {
      this.isLeftMouseButtonDown = false;
    } else if (e.button === 1) {
      this.isMiddleMouseButtonDown = false;
    } else if (e.button === 2) {
      this.isRightMouseButtonDown = false;
    }
  };

  InputManager.prototype.onKeyDown = function onKeyDown(e) {
    var key = e.keyCode,
        isFirstPress = !this.KEYS_DOWN[key];
    
    this.KEYS_DOWN[key] = true;

    this[this.CODE_TO_KEY[key]] = true;

    if (isFirstPress) {
      var listeners = this.listeners['pressed'][key];
      if (listeners) {
        for (var i = 0, len = listeners.length; i < len; i++) {
          listeners[i]();
        }
      }
    }
  };

  InputManager.prototype.onKeyUp = function onKeyUp(e) {
    var key = e.keyCode;

    this[this.CODE_TO_KEY[key]] = false;
    delete this.KEYS_DOWN[key];

    var listeners = this.listeners['released'][key];
    if (listeners) {
      for (var i = 0, len = listeners.length; i < len; i++) {
        listeners[i]();
      }
    }
  };

  return new InputManager();
}());