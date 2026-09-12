(function () {
  "use strict";

  var FC = window.FC;
  var lastTime = performance.now();

  function setLoading(done, total) {
    var progress = document.getElementById("loadingProgress");
    var text = document.getElementById("loadingText");
    var ratio = total ? done / total : 0;
    if (progress) progress.style.width = Math.round(ratio * 100) + "%";
    if (text) text.textContent = "Loading assets " + done + " / " + total;
  }

  function loop(now) {
    var dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    FC.Game.update(dt);
    requestAnimationFrame(loop);
  }

  function boot() {
    FC.state.data = FC.Storage.load();
    FC.Audio.init();
    FC.Renderer.init();
    FC.UI.init();
    FC.Shop.init();
    FC.Input.init();
    FC.Sprites.loadAll(setLoading).then(function () {
      var loading = document.getElementById("loadingScreen");
      if (loading) loading.classList.add("is-hidden");
      FC.UI.showScreen(FC.CONFIG.screen.MAIN);
    });
    requestAnimationFrame(loop);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
