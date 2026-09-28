"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHandlers = exports.leaderCelebration = exports.civilDisorder = exports.LEADER_CELEBRATION = exports.CIVIL_DISORDER = void 0;
const Engine_1 = require("@civ-clone/core-engine/Engine");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
/**
 * Recorded in the save for a city in civil disorder. It's owed an "order
 * restored" notice, and while it's recorded a second turn of disorder brings a
 * Democracy down.
 */
exports.CIVIL_DISORDER = 'civ1-city-happiness:civil-disorder';
/** Recorded in the save for a city celebrating ("We Love the King Day"). */
exports.LEADER_CELEBRATION = 'civ1-city-happiness:leader-celebration';
const find = (handler, city, pendingEffects) => {
    var _a;
    return (_a = pendingEffects
        .getByTarget(city)
        .find((pendingEffect) => pendingEffect.handler() === handler)) !== null && _a !== void 0 ? _a : null;
};
const civilDisorder = (city, pendingEffects = core_pending_effect_1.instance) => find(exports.CIVIL_DISORDER, city, pendingEffects);
exports.civilDisorder = civilDisorder;
const leaderCelebration = (city, pendingEffects = core_pending_effect_1.instance) => find(exports.LEADER_CELEBRATION, city, pendingEffects);
exports.leaderCelebration = leaderCelebration;
/** Registered with the rules, at import, so a status loaded from a save can still end. */
const registerHandlers = (pendingEffects = core_pending_effect_1.instance, engine = Engine_1.instance) => {
    pendingEffects.handler(exports.CIVIL_DISORDER, (pendingEffect) => engine.emit('city:order-restored', pendingEffect.target()));
    pendingEffects.handler(exports.LEADER_CELEBRATION, (pendingEffect) => engine.emit('city:leader-celebration-ended', pendingEffect.target()));
};
exports.registerHandlers = registerHandlers;
//# sourceMappingURL=cityStatus.js.map