(function () {
  "use strict";

  var FC = window.FC;
  var CONFIG = FC.CONFIG;

  function priceFor(data, type) {
    var owned = data.caps[type] || 0;
    if (owned >= 3) return null;
    return 2 + owned;
  }

  function slotCount(slots, type, ignoreIndex) {
    return slots.reduce(function (count, slot, index) {
      return count + (index !== ignoreIndex && slot === type ? 1 : 0);
    }, 0);
  }

  function canEquip(data, type, slotIndex) {
    return CONFIG.capTypes[type] && slotCount(data.slots, type, slotIndex) < data.caps[type];
  }

  function hasPurchasableCap(data) {
    return CONFIG.shopTypes.some(function (type) {
      var price = priceFor(data, type);
      return price !== null && data.coins >= price;
    });
  }

  function saveAndRefresh() {
    FC.Storage.save(FC.state.data);
    FC.Shop.render();
    FC.UI.updateCoins();
  }

  FC.Shop = {
    init: function () {
      this.render();
    },
    render: function () {
      var data = FC.state.data;
      if (!data) return;
      var slots = document.getElementById("slotList");
      var shop = document.getElementById("shopList");
      var buyHint = document.getElementById("shopBuyHint");
      if (!slots || !shop) return;
      if (buyHint) buyHint.hidden = !hasPurchasableCap(data);

      slots.innerHTML = "";
      data.slots.forEach(function (type, index) {
        var cap = CONFIG.capTypes[type];
        var slot = document.createElement("button");
        slot.className = "slot";
        slot.type = "button";
        slot.dataset.slotIndex = String(index);
        slot.innerHTML = '<img src="' + cap.image + '" alt=""><span>' + (index + 1) + ". " + cap.name + "</span>";
        slot.addEventListener("click", function () {
          if (!FC.state.shopPickType) return;
          FC.Shop.equip(index, FC.state.shopPickType);
        });
        slot.addEventListener("dragover", function (event) {
          event.preventDefault();
          slot.classList.add("is-target");
        });
        slot.addEventListener("dragleave", function () {
          slot.classList.remove("is-target");
        });
        slot.addEventListener("drop", function (event) {
          event.preventDefault();
          slot.classList.remove("is-target");
          var dropped = event.dataTransfer.getData("text/plain");
          FC.Shop.equip(index, dropped);
        });
        slots.appendChild(slot);
      });

      shop.innerHTML = "";
      CONFIG.shopTypes.forEach(function (type) {
        var cap = CONFIG.capTypes[type];
        var owned = data.caps[type] || 0;
        var price = priceFor(data, type);
        var card = document.createElement("article");
        card.className = "shop-card";
        card.draggable = owned > 0;
        card.dataset.type = type;
        card.innerHTML =
          '<img src="' + cap.image + '" alt="">' +
          "<div><h3>" + cap.name + "</h3><p>" + cap.description + "</p></div>" +
          '<div class="card-actions">' +
          "<span>보유 " + owned + "/3</span>" +
          '<button class="button button-primary" type="button">' + (price === null ? "최대 보유" : price + "코인 구매") + "</button>" +
          "</div>";
        var button = card.querySelector("button");
        button.disabled = price === null || data.coins < price;
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          FC.Shop.buy(type);
        });
        card.addEventListener("click", function () {
          if (owned <= 0) {
            FC.UI.toast("보유한 병뚜껑이 없습니다.");
            return;
          }
          FC.state.shopPickType = type;
          FC.UI.toast(cap.name + " 선택됨");
        });
        card.addEventListener("dragstart", function (event) {
          if (owned <= 0) {
            event.preventDefault();
            return;
          }
          event.dataTransfer.setData("text/plain", type);
        });
        shop.appendChild(card);
      });
    },
    buy: function (type) {
      var data = FC.state.data;
      var price = priceFor(data, type);
      if (price === null) {
        FC.UI.toast("이미 3개를 보유했습니다.");
        return;
      }
      if (data.coins < price) {
        FC.UI.toast("코인이 부족합니다.");
        return;
      }
      data.coins -= price;
      data.caps[type] += 1;
      FC.Audio.playSfx("buy");
      saveAndRefresh();
    },
    equip: function (slotIndex, type) {
      var data = FC.state.data;
      if (!canEquip(data, type, slotIndex)) {
        FC.UI.toast("보유 수량 안에서만 장착할 수 있습니다.");
        return;
      }
      data.slots[slotIndex] = type;
      FC.state.shopPickType = null;
      FC.Audio.playSfx("ui-click");
      saveAndRefresh();
    }
  };
})();
