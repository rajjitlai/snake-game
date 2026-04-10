var Snake = (function () {

  const INITIAL_TAIL = 4;
  var fixedTail = true;

  var intervalID;

  var tileCount = 20; // Increased for smoother look
  var gridSize;

  const INITIAL_PLAYER = { x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) };

  var velocity = { x:0, y:0 };
  var player = { x: INITIAL_PLAYER.x, y: INITIAL_PLAYER.y };

  var walls = false;

  var fruit = { x:1, y:1 };

  var trail = [];
  var tail = INITIAL_TAIL;

  var reward = 0;
  var points = 0;
  var pointsMax = 0;

  var ActionEnum = { 'none':0, 'up':1, 'down':2, 'left':3, 'right':4 };
  Object.freeze(ActionEnum);
  var lastAction = ActionEnum.none;

  var canv, ctx;
  var scoreEl, highScoreEl, overlayEl;

  function setup () {
    canv = document.getElementById('gc');
    ctx = canv.getContext('2d');
    
    scoreEl = document.getElementById('score-val');
    highScoreEl = document.getElementById('high-score-val');
    overlayEl = document.getElementById('start-overlay');

    // Make it responsive
    resize();
    window.addEventListener('resize', resize);

    game.reset();
  }

  function resize() {
      const size = Math.min(canv.parentElement.clientWidth, canv.parentElement.clientHeight);
      // We keep the internal coordinate system 400x400 but CSS scales it
      // However, for better resolution we could sync them. For now, 400 is fine.
      gridSize = 400 / tileCount;
  }

  function updateUI() {
      if (scoreEl) scoreEl.textContent = points.toString().padStart(2, '0');
      if (highScoreEl) highScoreEl.textContent = pointsMax.toString().padStart(2, '0');
  }

  var game = {

    reset: function () {
      ctx.clearRect(0, 0, canv.width, canv.height);

      tail = INITIAL_TAIL;
      points = 0;
      velocity.x = 0;
      velocity.y = 0;
      player.x = INITIAL_PLAYER.x;
      player.y = INITIAL_PLAYER.y;
      reward = -1;

      lastAction = ActionEnum.none;

      trail = [];
      trail.push({ x: player.x, y: player.y });
      
      if (overlayEl) overlayEl.classList.remove('hidden');
      updateUI();
    },

    action: {
      up: function () {
        if (lastAction != ActionEnum.down){
          velocity.x = 0;
          velocity.y = -1;
          if (overlayEl) overlayEl.classList.add('hidden');
        }
      },
      down: function () {
        if (lastAction != ActionEnum.up){
          velocity.x = 0;
          velocity.y = 1;
          if (overlayEl) overlayEl.classList.add('hidden');
        }
      },
      left: function () {
        if (lastAction != ActionEnum.right){
          velocity.x = -1;
          velocity.y = 0;
          if (overlayEl) overlayEl.classList.add('hidden');
        }
      },
      right: function () {
        if (lastAction != ActionEnum.left){
          velocity.x = 1;
          velocity.y = 0;
          if (overlayEl) overlayEl.classList.add('hidden');
        }
      }
    },

    RandomFruit: function () {
      if(walls){
        fruit.x = 1+Math.floor(Math.random() * (tileCount-2));
        fruit.y = 1+Math.floor(Math.random() * (tileCount-2));
      }
      else {
        fruit.x = Math.floor(Math.random() * tileCount);
        fruit.y = Math.floor(Math.random() * tileCount);
      }
    },

    loop: function () {

      reward = -0.1;

      function DontHitWall () {
        if(player.x < 0) player.x = tileCount-1;
        if(player.x >= tileCount) player.x = 0;
        if(player.y < 0) player.y = tileCount-1;
        if(player.y >= tileCount) player.y = 0;
      }
      function HitWall () {
        if(player.x < 1 || player.x > tileCount-2 || player.y < 1 || player.y > tileCount-2) {
            game.reset();
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(0,0,gridSize,canv.height);
        ctx.fillRect(0,0,canv.width,gridSize);
        ctx.fillRect(canv.width-gridSize,0,gridSize,canv.height);
        ctx.fillRect(0, canv.height-gridSize,canv.width,gridSize);
      }

      var stopped = velocity.x == 0 && velocity.y == 0;

      if (!stopped) {
          player.x += velocity.x;
          player.y += velocity.y;
      }

      if (velocity.x == 0 && velocity.y == -1) lastAction = ActionEnum.up;
      if (velocity.x == 0 && velocity.y == 1) lastAction = ActionEnum.down;
      if (velocity.x == -1 && velocity.y == 0) lastAction = ActionEnum.left;
      if (velocity.x == 1 && velocity.y == 0) lastAction = ActionEnum.right;

      // Clear with slight trail effect
      ctx.fillStyle = 'rgba(10, 10, 12, 0.4)';
      ctx.fillRect(0,0,canv.width,canv.height);

      if(walls) HitWall();
      else DontHitWall();

      if (!stopped){
        trail.push({x:player.x, y:player.y});
        while(trail.length > tail) trail.shift();
      }

      // Draw Snake with Gradient
      for(var i=0; i<trail.length; i++) {
        var isHead = (i === trail.length - 1);
        
        ctx.beginPath();
        var borderRadius = gridSize / 3;
        var x = trail[i].x * gridSize + 1;
        var y = trail[i].y * gridSize + 1;
        var w = gridSize - 2;
        var h = gridSize - 2;

        if (isHead) {
            ctx.fillStyle = '#00f2ff';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00f2ff';
        } else {
            const alpha = 0.3 + (i / trail.length) * 0.7;
            ctx.fillStyle = `rgba(112, 0, 255, ${alpha})`;
            ctx.shadowBlur = 0;
        }

        // Rounded rectangles for snake body
        ctx.roundRect(x, y, w, h, borderRadius);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow

        if (!stopped && !isHead && trail[i].x == player.x && trail[i].y == player.y){
          game.reset();
        }
      }

      // Fruit Collision
      if (player.x == fruit.x && player.y == fruit.y) {
        if(!fixedTail) tail++;
        points++;
        if(points > pointsMax) pointsMax = points;
        reward = 1;
        game.RandomFruit();
        updateUI();
        
        while((function () {
          for(var i=0; i<trail.length; i++) {
            if (trail[i].x == fruit.x && trail[i].y == fruit.y) {
              game.RandomFruit();
              return true;
            }
          }
          return false;
        })());
      }

      // Draw Fruit (Neon Circle)
      ctx.beginPath();
      ctx.arc(fruit.x * gridSize + gridSize/2, fruit.y * gridSize + gridSize/2, gridSize/2 - 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ff0055';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ff0055';
      ctx.fill();
      ctx.shadowBlur = 0;

      return reward;
    }
  }

  function keyPush (evt) {
    switch(evt.keyCode) {
      case 37: //left
      game.action.left();
      evt.preventDefault();
      break;

      case 38: //up
      game.action.up();
      evt.preventDefault();
      break;

      case 39: //right
      game.action.right();
      evt.preventDefault();
      break;

      case 40: //down
      game.action.down();
      evt.preventDefault();
      break;

      case 32: //space
      Snake.pause();
      evt.preventDefault();
      break;

      case 27: //esc
      game.reset();
      evt.preventDefault();
      break;
    }
  }

  return {
    start: function (fps = 12) {
      window.onload = setup;
      intervalID = setInterval(game.loop, 1000 / fps);
    },

    loop: game.loop,
    reset: game.reset,
    stop: function () {
      clearInterval(intervalID);
    },

    setup: {
      keyboard: function (state) {
        if (state) {
          document.addEventListener('keydown', keyPush);
        } else {
          document.removeEventListener('keydown', keyPush);
        }
      },
      wall: function (state) {
        walls = state;
      },
      tileCount: function (size) {
        tileCount = size;
        gridSize = 400 / tileCount;
      },
      fixedTail: function (state) {
        fixedTail = state;
      }
    },

    action: function (act) {
      switch(act) {
        case 'left': game.action.left(); break;
        case 'up': game.action.up(); break;
        case 'right': game.action.right(); break;
        case 'down': game.action.down(); break;
      }
    },

    pause: function () {
      velocity.x = 0;
      velocity.y = 0;
    },

    clearTopScore: function () {
      pointsMax = 0;
      updateUI();
    },

    data: {
      player: player,
      fruit: fruit,
      trail: function () { return trail; }
    },

    info: {
      tileCount: tileCount
    }
  };

})();

Snake.start(10);
Snake.setup.keyboard(true);
Snake.setup.fixedTail(false);
