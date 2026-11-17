"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHandlers = exports.settleCapturedDisorder = exports.capturedDisorder = exports.imposeCapturedDisorder = exports.leaderCelebration = exports.civilDisorder = exports.LEADER_CELEBRATION = exports.CIVIL_DISORDER = void 0;
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
// Set in a city's `CIVIL_DISORDER` record while the disorder was put on it by its capture and its production hasn't
//  been lost to it yet (civ-clone/web-renderer#1014).
const CAPTURED = 'captured';
/**
 * Puts a city in civil disorder as it's captured: its disorder is recorded, carrying a note that it was captured
 * into it, which a `CivilDisorder` rule holds to until the city's next production is lost
 * (`settleCapturedDisorder`). Kept in the record, so it's saved with it, and dropped with it if the city is captured
 * again or destroyed first.
 */
const imposeCapturedDisorder = (city, pendingEffects = core_pending_effect_1.instance) => {
    const recorded = (0, exports.civilDisorder)(city, pendingEffects);
    if (recorded !== null) {
        recorded.setData({ ...recorded.data(), [CAPTURED]: 'true' });
        return;
    }
    pendingEffects.register(new core_pending_effect_1.PendingEffect(exports.CIVIL_DISORDER, city, { [CAPTURED]: 'true' }));
};
exports.imposeCapturedDisorder = imposeCapturedDisorder;
/** Whether the city's disorder was put on it by its capture, and hasn't yet cost it a turn's production. */
const capturedDisorder = (city, pendingEffects = core_pending_effect_1.instance) => { var _a, _b; return CAPTURED in ((_b = (_a = (0, exports.civilDisorder)(city, pendingEffects)) === null || _a === void 0 ? void 0 : _a.data()) !== null && _b !== void 0 ? _b : {}); };
exports.capturedDisorder = capturedDisorder;
/**
 * Takes the capture's note off the city's disorder, leaving the record: from then on the city's citizens decide
 * whether it stays in disorder, and if it doesn't the record ends with "order restored".
 */
const settleCapturedDisorder = (city, pendingEffects = core_pending_effect_1.instance) => {
    var _a;
    const recorded = (0, exports.civilDisorder)(city, pendingEffects), 
    // A copy, so it can be changed.
    data = (_a = recorded === null || recorded === void 0 ? void 0 : recorded.data()) !== null && _a !== void 0 ? _a : {};
    if (recorded === null || !(CAPTURED in data)) {
        return;
    }
    delete data[CAPTURED];
    recorded.setData(data);
};
exports.settleCapturedDisorder = settleCapturedDisorder;
/** Registered with the rules, at import, so a status loaded from a save can still end. */
const registerHandlers = (pendingEffects = core_pending_effect_1.instance, engine = Engine_1.instance) => {
    (0, cityStatus_1.registerCityStatusHandler)(exports.CIVIL_DISORDER, 'city:order-restored', pendingEffects, engine);
    (0, cityStatus_1.registerCityStatusHandler)(exports.LEADER_CELEBRATION, 'city:leader-celebration-ended', pendingEffects, engine);
};
exports.registerHandlers = registerHandlers;
//# sourceMappingURL=cityStatus.js.map