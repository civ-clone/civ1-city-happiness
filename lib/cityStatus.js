"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHandlers = exports.leaderCelebration = exports.civilDisorder = exports.LEADER_CELEBRATION = exports.CIVIL_DISORDER = void 0;
const Engine_1 = require("@civ-clone/core-engine/Engine");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const cityStatus_1 = require("@civ-clone/base-city-happiness-status/lib/cityStatus");
/**
 * Recorded in the save for a city in civil disorder. It's owed an "order
 * restored" notice, and while it's recorded a second turn of disorder brings a
 * Democracy down.
 */
exports.CIVIL_DISORDER = 'civ1-city-happiness:civil-disorder';
/** Recorded in the save for a city celebrating ("We Love the King Day"). */
exports.LEADER_CELEBRATION = 'civ1-city-happiness:leader-celebration';
const civilDisorder = (city, pendingEffects = core_pending_effect_1.instance) => (0, cityStatus_1.cityStatus)(exports.CIVIL_DISORDER, city, pendingEffects);
exports.civilDisorder = civilDisorder;
const leaderCelebration = (city, pendingEffects = core_pending_effect_1.instance) => (0, cityStatus_1.cityStatus)(exports.LEADER_CELEBRATION, city, pendingEffects);
exports.leaderCelebration = leaderCelebration;
/** Registered with the rules, at import, so a status loaded from a save can still end. */
const registerHandlers = (pendingEffects = core_pending_effect_1.instance, engine = Engine_1.instance) => {
    (0, cityStatus_1.registerCityStatusHandler)(exports.CIVIL_DISORDER, 'city:order-restored', pendingEffects, engine);
    (0, cityStatus_1.registerCityStatusHandler)(exports.LEADER_CELEBRATION, 'city:leader-celebration-ended', pendingEffects, engine);
};
exports.registerHandlers = registerHandlers;
//# sourceMappingURL=cityStatus.js.map