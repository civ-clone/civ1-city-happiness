"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const cityStatus_1 = require("../../lib/cityStatus");
const Destroyed_1 = require("@civ-clone/core-city/Rules/Destroyed");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const getRules = (pendingEffects = core_pending_effect_1.instance) => [
    // Dropped rather than discharged: a razed city isn't owed "order restored",
    // and keeping the effect would keep the city in the save.
    new Destroyed_1.default('civ1-city-happiness:city/destroyed/forget-status', new Effect_1.default((city) => pendingEffects
        .getByTarget(city)
        .filter((pendingEffect) => [cityStatus_1.CIVIL_DISORDER, cityStatus_1.LEADER_CELEBRATION].includes(pendingEffect.handler()))
        .forEach((pendingEffect) => pendingEffects.unregister(pendingEffect)))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=destroyed.js.map