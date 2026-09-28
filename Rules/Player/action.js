"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const Action_1 = require("@civ-clone/core-player/Rules/Action");
const CivilDisorder_1 = require("../../PlayerActions/CivilDisorder");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const cityStatus_1 = require("../../lib/cityStatus");
const getRules = (cityRegistry = CityRegistry_1.instance, pendingEffects = core_pending_effect_1.instance) => [
    new Action_1.default(new Effect_1.default((player) => cityRegistry
        .getByPlayer(player)
        .filter((city) => (0, cityStatus_1.civilDisorder)(city, pendingEffects) !== null)
        .map((city) => new CivilDisorder_1.default(player, city)))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=action.js.map