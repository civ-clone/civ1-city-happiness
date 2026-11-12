"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const cityStatus_1 = require("../../lib/cityStatus");
const Captured_1 = require("@civ-clone/core-city/Rules/Captured");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Priorities_1 = require("@civ-clone/core-rule/Priorities");
const cityStatus_2 = require("@civ-clone/base-city-happiness-status/lib/cityStatus");
const getRules = (pendingEffects = core_pending_effect_1.instance) => [
    // A captured city, taken by force or incited by a Diplomat, starts out for its captor neither in disorder nor
    //  celebrating, as v474.05 (`CAPTURE.C` `capunit`, which both captures go through): `townbuf[b].status &=
    //  CITY_CAPTURE_MASK;` and `townbuf[b].status &= CITY_TRANSFER_MASK;`, which clear `CITY_DISORDER` (0x01) and
    //  `CITY_CELEBRATING` (0x40) (`CIV.H`). Dropped rather than ended, so the captor isn't told order was restored or the
    //  celebration is over, and its first turn of either counts as a first. First, so no other rule for the capture
    //  sees the last owner's status (civ-clone/web-renderer#1010).
    new Captured_1.default('civ1-city-happiness:city/captured/forget-status', new Priorities_1.High(), new Effect_1.default((city) => (0, cityStatus_2.forgetCityStatuses)(city, [cityStatus_1.CIVIL_DISORDER, cityStatus_1.LEADER_CELEBRATION], pendingEffects))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=captured.js.map