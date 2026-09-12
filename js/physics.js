(function () {
  "use strict";

  var FC = window.FC;
  var CONFIG = FC.CONFIG;

  function capType(cap) {
    return CONFIG.capTypes[cap.type];
  }

  function speed(cap) {
    return Math.hypot(cap.vx, cap.vy);
  }

  function normalize(x, y) {
    var len = Math.hypot(x, y);
    if (len < 0.0001) return { x: 1, y: 0, len: 1 };
    return { x: x / len, y: y / len, len: len };
  }

  function windVector(stage, elapsed) {
    var wind = stage.wind || { strength: 0 };
    if (!wind.strength) return { x: 0, y: 0, label: "NONE" };
    var angle = wind.angle || 0;
    if (wind.mode === "sine") {
      angle += Math.sin(elapsed * Math.PI * 2 / (wind.period || 5)) * Math.PI * 0.65;
    }
    return {
      x: Math.cos(angle) * wind.strength,
      y: Math.sin(angle) * wind.strength * 0.24,
      label: Math.round(wind.strength).toString()
    };
  }

  function activeGroup(caps, groupId) {
    return caps.filter(function (cap) {
      return cap.active && cap.groupId && cap.groupId === groupId;
    });
  }

  function markEliminated(cap) {
    cap.active = false;
    cap.eliminated = true;
    cap.vx = 0;
    cap.vy = 0;
  }

  function eliminateGroup(game, cap, event) {
    var members = cap.groupId ? activeGroup(game.caps, cap.groupId) : [cap];
    members.forEach(function (member) {
      markEliminated(member);
    });

    if (event.kind === "hole") {
      FC.Sprites.addEffect("fall", event.x, event.y, Math.max(cap.radius * 3.4, event.r * 2.65));
      members.forEach(function (member) {
        if (member !== cap) FC.Sprites.addFadeCap(member);
      });
    } else {
      members.forEach(function (member) {
        FC.Sprites.addFadeCap(member);
      });
    }
    FC.Audio.playSfx("cap-fall");
  }

  function isOut(game, cap) {
    var inset = CONFIG.physics.boardInsetRatio;
    var minX = game.stage.width * inset;
    var maxX = game.stage.width * (1 - inset);
    var minY = game.stage.length * inset;
    var maxY = game.stage.length * (1 - inset);
    return cap.x < minX || cap.x > maxX || cap.y < minY || cap.y > maxY;
  }

  function hitHole(game, cap) {
    for (var i = 0; i < game.stage.holes.length; i += 1) {
      var hole = game.stage.holes[i];
      if (Math.hypot(cap.x - hole.x, cap.y - hole.y) < hole.r + cap.radius * 0.1) {
        return hole;
      }
    }
    return null;
  }

  function eliminationEvent(game, cap) {
    var hole = hitHole(game, cap);
    if (hole) return { kind: "hole", x: hole.x, y: hole.y, r: hole.r };
    if (isOut(game, cap)) return { kind: "out", x: cap.x, y: cap.y };
    return null;
  }

  function applyFriction(cap, dt) {
    var type = capType(cap);
    if (type.special === "ice") return;
    var current = speed(cap);
    if (current <= 0) return;
    var next = Math.max(0, current - type.friction * dt);
    if (next < CONFIG.physics.stopSpeed) next = 0;
    var scale = next / current;
    cap.vx *= scale;
    cap.vy *= scale;
  }

  function moveGroups(game, dt, wind) {
    var moved = {};
    game.caps.forEach(function (cap) {
      if (!cap.active || !cap.fired || cap.fixed || !cap.groupId || moved[cap.groupId]) return;
      var members = activeGroup(game.caps, cap.groupId);
      if (members.length < 2) return;
      moved[cap.groupId] = true;
      var totalMass = 0;
      var vx = 0;
      var vy = 0;
      var friction = 0;
      members.forEach(function (member) {
        var type = capType(member);
        totalMass += type.mass;
        vx += member.vx * type.mass;
        vy += member.vy * type.mass;
        friction += type.friction * type.mass;
      });
      vx /= totalMass;
      vy /= totalMass;
      friction /= totalMass;
      vx += wind.x * dt;
      vy += wind.y * dt;
      var current = Math.hypot(vx, vy);
      if (current > 0) {
        var next = Math.max(0, current - friction * dt);
        if (next < CONFIG.physics.stopSpeed) next = 0;
        vx *= next / current;
        vy *= next / current;
      }
      members.forEach(function (member) {
        member.vx = vx;
        member.vy = vy;
        member.x += vx * dt;
        member.y += vy * dt;
      });
    });
    return moved;
  }

  function moveCaps(game, dt, wind, movedGroups) {
    game.caps.forEach(function (cap) {
      if (!cap.active || !cap.fired || cap.fixed) return;
      if (cap.groupId && movedGroups[cap.groupId]) return;
      cap.vx += wind.x * dt;
      cap.vy += wind.y * dt;
      applyFriction(cap, dt);
      cap.x += cap.vx * dt;
      cap.y += cap.vy * dt;
    });
  }

  function reflectAgainstFixed(moving, fixed, nx, ny) {
    var dot = moving.vx * nx + moving.vy * ny;
    if (dot >= 0) return;
    var restitution = Math.max(0.28, capType(moving).restitution);
    moving.vx -= (1 + restitution) * dot * nx;
    moving.vy -= (1 + restitution) * dot * ny;
  }

  function setIceFixed(cap) {
    cap.fixed = true;
    cap.vx = 0;
    cap.vy = 0;
    FC.Sprites.addEffect("ice", cap.x, cap.y, cap.radius * 3.5);
    FC.Audio.playSfx("hit-ice");
  }

  function stickCaps(game, a, b) {
    var groupId = a.groupId || b.groupId || "g" + (++game.groupSeed);
    activeGroup(game.caps, a.groupId).forEach(function (cap) {
      cap.groupId = groupId;
    });
    activeGroup(game.caps, b.groupId).forEach(function (cap) {
      cap.groupId = groupId;
    });
    a.groupId = groupId;
    b.groupId = groupId;
    var members = activeGroup(game.caps, groupId);
    if (members.length > 4) {
      b.groupId = null;
      return false;
    }
    var total = 0;
    var vx = 0;
    var vy = 0;
    members.forEach(function (cap) {
      var type = capType(cap);
      total += type.mass;
      vx += cap.vx * type.mass;
      vy += cap.vy * type.mass;
    });
    vx /= total;
    vy /= total;
    members.forEach(function (cap) {
      cap.vx = vx;
      cap.vy = vy;
    });
    FC.Sprites.addEffect("sticky", (a.x + b.x) / 2, (a.y + b.y) / 2, Math.max(a.radius, b.radius) * 3.2);
    FC.Audio.playSfx("hit-sticky");
    return true;
  }

  function normalCollision(a, b, nx, ny, overlap) {
    var typeA = capType(a);
    var typeB = capType(b);
    var invA = a.fixed ? 0 : 1 / typeA.mass;
    var invB = b.fixed ? 0 : 1 / typeB.mass;
    var invTotal = invA + invB || 1;
    if (!a.fixed) {
      a.x -= nx * overlap * (invA / invTotal);
      a.y -= ny * overlap * (invA / invTotal);
    }
    if (!b.fixed) {
      b.x += nx * overlap * (invB / invTotal);
      b.y += ny * overlap * (invB / invTotal);
    }
    var rvx = b.vx - a.vx;
    var rvy = b.vy - a.vy;
    var velAlongNormal = rvx * nx + rvy * ny;
    if (velAlongNormal > 0) return;
    var restitution = Math.min(typeA.restitution, typeB.restitution);
    var impulse = -(1 + restitution) * velAlongNormal / invTotal;
    if (!a.fixed) {
      a.vx -= impulse * invA * nx;
      a.vy -= impulse * invA * ny;
    }
    if (!b.fixed) {
      b.vx += impulse * invB * nx;
      b.vy += impulse * invB * ny;
    }
    FC.Sprites.addEffect("impact", (a.x + b.x) / 2, (a.y + b.y) / 2, Math.max(a.radius, b.radius) * 3);
    FC.Audio.playSfx(typeA.sound || typeB.sound || "hit-plastic");
  }

  function handleCollision(game, a, b) {
    if (!a.active || !b.active || !a.fired || !b.fired) return;
    if (a.groupId && a.groupId === b.groupId) return;
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var n = normalize(dx, dy);
    var minDist = a.radius + b.radius;
    if (n.len >= minDist || n.len <= 0) return;
    var nx = n.x;
    var ny = n.y;
    var overlap = minDist - n.len + 0.1;
    var typeA = capType(a);
    var typeB = capType(b);

    if (a.fixed && typeA.special === "ice") {
      if (typeB.special === "sticky") {
        b.vx = 0;
        b.vy = 0;
      } else {
        reflectAgainstFixed(b, a, nx, ny);
      }
      b.x += nx * overlap;
      b.y += ny * overlap;
      FC.Audio.playSfx(typeB.sound);
      return;
    }
    if (b.fixed && typeB.special === "ice") {
      if (typeA.special === "sticky") {
        a.vx = 0;
        a.vy = 0;
      } else {
        reflectAgainstFixed(a, b, -nx, -ny);
      }
      a.x -= nx * overlap;
      a.y -= ny * overlap;
      FC.Audio.playSfx(typeA.sound);
      return;
    }

    if (typeA.special === "ice" && speed(a) > CONFIG.physics.stopSpeed) {
      setIceFixed(a);
      reflectAgainstFixed(b, a, nx, ny);
      return;
    }
    if (typeB.special === "ice" && speed(b) > CONFIG.physics.stopSpeed) {
      setIceFixed(b);
      reflectAgainstFixed(a, b, -nx, -ny);
      return;
    }

    var stickyA = typeA.special === "sticky";
    var stickyB = typeB.special === "sticky";
    var normalA = typeA.special === "normal";
    var normalB = typeB.special === "normal";
    if ((stickyA && normalB) || (stickyB && normalA)) {
      normalCollision(a, b, nx, ny, overlap);
      stickCaps(game, a, b);
      return;
    }

    normalCollision(a, b, nx, ny, overlap);
  }

  function checkEliminations(game) {
    game.caps.slice().forEach(function (cap) {
      var event;
      if (!cap.active || !cap.fired) return;
      event = eliminationEvent(game, cap);
      if (event) eliminateGroup(game, cap, event);
    });
  }

  function updateOne(game, dt) {
    var wind = windVector(game.stage, game.elapsed);
    var movedGroups = moveGroups(game, dt, wind);
    moveCaps(game, dt, wind, movedGroups);
    checkEliminations(game);
    for (var i = 0; i < game.caps.length; i += 1) {
      for (var j = i + 1; j < game.caps.length; j += 1) {
        handleCollision(game, game.caps[i], game.caps[j]);
      }
    }
    checkEliminations(game);
  }

  FC.Physics = {
    windVector: windVector,
    update: function (game, dt) {
      var remaining = Math.min(dt, CONFIG.physics.maxFrameDt);
      while (remaining > 0) {
        var step = Math.min(CONFIG.physics.substep, remaining);
        updateOne(game, step);
        remaining -= step;
      }
    },
    hasMovingCaps: function (game) {
      return game.caps.some(function (cap) {
        return cap.active && cap.fired && !cap.fixed && speed(cap) > CONFIG.physics.stopSpeed;
      });
    },
    speed: speed
  };
})();
