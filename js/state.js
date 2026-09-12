(function () {
  "use strict";

  window.FC = window.FC || {};

  window.FC.state = {
    screen: "MAIN",
    selectedStage: 1,
    data: null,
    assets: {
      images: {},
      loaded: false
    },
    dragShopType: null,
    shopPickType: null,
    ui: {
      toastTimer: null
    },
    game: null
  };
})();
