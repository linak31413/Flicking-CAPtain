(function () {
  "use strict";

  var FC = window.FC;
  var CONFIG = FC.CONFIG;

  function el(id) {
    return document.getElementById(id);
  }

  function setText(id, text) {
    var node = el(id);
    if (node) node.textContent = text;
  }

  function stageUnlocked(stageId) {
    return FC.state.data && stageId <= FC.state.data.unlockedStage;
  }

  function showModal(id, open) {
    var modal = el(id);
    if (!modal) return;
    modal.classList.toggle("is-open", open);
    modal.setAttribute("aria-hidden", open ? "false" : "true");
  }

  FC.UI = {
    init: function () {
      el("btnStart").addEventListener("click", function () {
        FC.Audio.playSfx("ui-click");
        FC.UI.showScreen(CONFIG.screen.STAGE_SELECT);
      });
      el("btnShop").addEventListener("click", function () {
        FC.Audio.playSfx("ui-click");
        FC.UI.showScreen(CONFIG.screen.SHOP);
      });
      el("btnSettings").addEventListener("click", function () {
        FC.UI.openSettings();
      });
      el("btnStageBack").addEventListener("click", function () {
        FC.UI.showScreen(CONFIG.screen.MAIN);
      });
      el("btnShopBack").addEventListener("click", function () {
        FC.UI.showScreen(CONFIG.screen.MAIN);
      });
      el("btnStagePrev").addEventListener("click", function () {
        FC.UI.changeStage(-1);
      });
      el("btnStageNext").addEventListener("click", function () {
        FC.UI.changeStage(1);
      });
      el("btnPlayStage").addEventListener("click", function () {
        if (!stageUnlocked(FC.state.selectedStage)) return;
        FC.Game.start(FC.state.selectedStage);
      });
      el("btnPause").addEventListener("click", function () {
        FC.Game.pause();
      });
      el("btnResume").addEventListener("click", function () {
        FC.Game.resume();
      });
      el("btnRestart").addEventListener("click", function () {
        FC.Game.restart();
      });
      el("btnPauseMain").addEventListener("click", function () {
        FC.Game.quitToMain();
      });
      el("btnRetry").addEventListener("click", function () {
        FC.Game.start(FC.state.game ? FC.state.game.stage.id : FC.state.selectedStage);
      });
      el("btnNextStage").addEventListener("click", function () {
        FC.Game.start(Math.min(8, FC.state.selectedStage + 1));
      });
      el("btnResultMain").addEventListener("click", function () {
        FC.UI.showScreen(CONFIG.screen.MAIN);
      });
      el("btnCloseSettings").addEventListener("click", function () {
        FC.UI.closeSettings();
      });
      el("btnResetSave").addEventListener("click", function () {
        if (!window.confirm("저장 데이터를 초기화할까요?")) return;
        FC.state.data = FC.Storage.reset();
        FC.Audio.refresh();
        FC.UI.syncSettings();
        FC.UI.updateAll();
        FC.Shop.render();
        FC.UI.toast("저장 데이터를 초기화했습니다.");
      });

      ["settingBgm", "settingSfx", "settingMuted", "settingVibrate", "settingAim", "settingMotion"].forEach(function (id) {
        el(id).addEventListener("input", FC.UI.readSettings);
        el(id).addEventListener("change", FC.UI.readSettings);
      });

      document.addEventListener("pointerdown", FC.Audio.unlock, { once: true });
      this.initTutorialArt();
      this.syncSettings();
      this.updateAll();
    },
    initTutorialArt: function () {
      var image = el("tutorialHandImage");
      var fallback = el("tutorialGestureFallback");
      if (!image || !fallback) return;

      function showFallback() {
        image.hidden = true;
        fallback.hidden = false;
      }

      function showImage() {
        image.hidden = false;
        fallback.hidden = true;
      }

      image.addEventListener("load", showImage);
      image.addEventListener("error", showFallback);

      if (image.complete) {
        if (image.naturalWidth > 0) showImage();
        else showFallback();
      } else {
        showFallback();
      }
    },
    showScreen: function (screen) {
      FC.state.screen = screen;
      document.querySelectorAll(".screen").forEach(function (node) {
        node.classList.toggle("is-active", node.dataset.screen === screen);
      });
      if (screen === CONFIG.screen.GAME) {
        FC.Audio.playBgm("game");
      } else {
        FC.Audio.playBgm("menu");
      }
      if (screen === CONFIG.screen.STAGE_SELECT) this.renderStage();
      if (screen === CONFIG.screen.SHOP) FC.Shop.render();
      this.updateAll();
      FC.Audio.playSfx("ui-click");
    },
    changeStage: function (delta) {
      var next = FC.state.selectedStage + delta;
      if (next < 1) next = 8;
      if (next > 8) next = 1;
      FC.state.selectedStage = next;
      this.renderStage();
      FC.Audio.playSfx("ui-click");
    },
    renderStage: function () {
      var data = FC.state.data;
      var stage = FC.getStage(FC.state.selectedStage);
      var unlocked = stageUnlocked(stage.id);
      el("stageTableImage").src = stage.tableImage;
      setText("stageStatus", "Stage " + stage.id);
      setText("stageName", stage.name);
      setText("stageDescription", stage.description);
      setText("stageEnvironment", stage.environment);
      setText("stageCpu", "오차 " + Math.round(stage.cpu.angleError * 100) + "% / " + stage.cpu.types.map(function (type) {
        return CONFIG.capTypes[type].name;
      }).join(", "));
      setText("stageRecord", (data.cleared[stage.id - 1] ? "클리어" : "미클리어") + " / 승리 " + data.wins[stage.id - 1] + "회");
      var badge = el("stageLockBadge");
      badge.textContent = unlocked ? (data.cleared[stage.id - 1] ? "클리어" : "해금") : "잠김";
      badge.classList.toggle("is-locked", !unlocked);
      var play = el("btnPlayStage");
      play.disabled = !unlocked;
      play.textContent = unlocked ? "플레이" : "잠김";
    },
    updateCoins: function () {
      if (!FC.state.data) return;
      ["mainCoins", "stageCoins", "shopCoins"].forEach(function (id) {
        setText(id, FC.state.data.coins);
      });
    },
    updateAll: function () {
      this.updateCoins();
      this.updateBuyHints();
      this.renderStage();
      FC.Shop.render();
    },
    updateBuyHints: function () {
      var hint = el("mainShopHint");
      if (!hint || !FC.state.data || !FC.Shop || !FC.Shop.hasPurchasableCap) return;
      hint.hidden = !FC.Shop.hasPurchasableCap(FC.state.data);
    },
    updateHud: function () {
      var game = FC.state.game;
      if (!game) return;
      var wind = FC.Physics.windVector(game.stage, game.elapsed);
      setText("hudStage", game.stage.id);
      setText("hudTurn", game.turn === CONFIG.owners.PLAYER ? "PLAYER" : "CPU");
      setText("hudPlayerCaps", Math.max(0, 3 - game.shotsByOwner.player));
      setText("hudCpuCaps", Math.max(0, 3 - game.shotsByOwner.cpu));
      setText("hudWind", wind.label);
      setText("turnBanner", game.turn === CONFIG.owners.PLAYER ? "PLAYER TURN" : "CPU TURN");
      setText("gameHint", game.message || "");
      this.updateTutorial();
    },
    updateTutorial: function () {
      var prompt = el("tutorialPrompt");
      var game = FC.state.game;
      if (!prompt || !game) return;
      var shouldShow = FC.state.screen === CONFIG.screen.GAME &&
        game.stage.id === 1 &&
        !game.tutorialDismissed &&
        game.status === CONFIG.gameStatus.READY &&
        game.turn === CONFIG.owners.PLAYER &&
        game.currentCap &&
        game.shotsByOwner.player === 0 &&
        !game.aim &&
        !game.paused;
      prompt.hidden = !shouldShow;
    },
    showResult: function (result) {
      FC.state.selectedStage = result.stageId;
      el("resultImage").src = result.outcome === "win" ? CONFIG.images.resultWin : CONFIG.images.resultLose;
      setText("resultStage", "Stage " + result.stageId);
      setText("resultTitle", result.title);
      setText("resultSummary", result.summary);
      var ranks = el("resultRanks");
      ranks.innerHTML = "";
      if (result.ranks.length === 0) {
        var empty = document.createElement("div");
        empty.className = "rank-row";
        empty.innerHTML = "<strong>-</strong><span>유효 병뚜껑 없음</span><span>무승부</span>";
        ranks.appendChild(empty);
      } else {
        result.ranks.forEach(function (rank, index) {
          var row = document.createElement("div");
          row.className = "rank-row";
          row.innerHTML = "<strong>" + (index + 1) + "위</strong><span>" + (rank.owner === CONFIG.owners.PLAYER ? "PLAYER" : "CPU") + " " + CONFIG.capTypes[rank.type].name + "</span><span>" + Math.round(rank.distance) + "</span>";
          ranks.appendChild(row);
        });
      }
      el("btnNextStage").style.display = result.outcome === "win" && result.stageId < 8 ? "" : "none";
      el("resultShopHint").hidden = !result.firstWinReward;
      this.showScreen(CONFIG.screen.RESULT);
    },
    toast: function (message) {
      var toast = el("toast");
      toast.textContent = message;
      toast.classList.add("is-visible");
      window.clearTimeout(FC.state.ui.toastTimer);
      FC.state.ui.toastTimer = window.setTimeout(function () {
        toast.classList.remove("is-visible");
      }, 1800);
    },
    openSettings: function () {
      this.syncSettings();
      showModal("settingsPanel", true);
      FC.Audio.playSfx("ui-click");
    },
    closeSettings: function () {
      showModal("settingsPanel", false);
      FC.Audio.playSfx("ui-click");
    },
    showPause: function (open) {
      showModal("pausePanel", open);
    },
    syncSettings: function () {
      var settings = FC.state.data.settings;
      el("settingBgm").value = settings.bgmVolume;
      el("settingSfx").value = settings.sfxVolume;
      el("settingMuted").checked = settings.muted;
      el("settingVibrate").checked = settings.vibrate;
      el("settingAim").checked = settings.aimAssist;
      el("settingMotion").checked = settings.reduceMotion;
    },
    readSettings: function () {
      var settings = FC.state.data.settings;
      settings.bgmVolume = Number(el("settingBgm").value);
      settings.sfxVolume = Number(el("settingSfx").value);
      settings.muted = el("settingMuted").checked;
      settings.vibrate = el("settingVibrate").checked;
      settings.aimAssist = el("settingAim").checked;
      settings.reduceMotion = el("settingMotion").checked;
      FC.Storage.save(FC.state.data);
      FC.Audio.refresh();
    }
  };
})();
