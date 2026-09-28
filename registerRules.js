"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const celebrate_leader_1 = require("./Rules/City/celebrate-leader");
const civil_disorder_1 = require("./Rules/City/civil-disorder");
const cost_1 = require("./Rules/City/cost");
const destroyed_1 = require("./Rules/City/destroyed");
const yield_1 = require("./Rules/City/yield");
const action_1 = require("./Rules/Player/action");
const turn_start_1 = require("./Rules/Player/turn-start");
const core_game_1 = require("@civ-clone/core-game");
const register = (game) => game.rules.register(...(0, celebrate_leader_1.default)(game.cityGrowth, game.specialists), ...(0, yield_1.default)(game.cityGrowth, game.playerGovernments, game.units), ...(0, civil_disorder_1.default)(game.cityGrowth, game.specialists), ...(0, cost_1.default)(game.rules, game.cityGrowth, game.cityImprovements, game.playerGovernments, game.playerResearch, game.units), ...(0, destroyed_1.default)(game.pendingEffects), ...(0, action_1.default)(game.cities, game.pendingEffects), ...(0, turn_start_1.default)(game.cities, game.rules, game.engine, game.cityGrowth, game.playerGovernments, game.pendingEffects, game.turn));
exports.register = register;
// The plugin loader imports each package for this side effect. Until it passes
// a `Game` of its own, dropping it would produce a game with silently absent
// rules — no error, just wrong behaviour.
(0, exports.register)(core_game_1.defaultGame);
exports.default = exports.register;
//# sourceMappingURL=registerRules.js.map