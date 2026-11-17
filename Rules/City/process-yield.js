"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Priorities_1 = require("@civ-clone/core-rule/Priorities");
const ProcessYield_1 = require("@civ-clone/core-city/Rules/ProcessYield");
const Yields_1 = require("@civ-clone/civ1-city/Yields");
const cityStatus_1 = require("../../lib/cityStatus");
const getRules = (pendingEffects = core_pending_effect_1.instance) => [
    // A city the human captured below a Republic loses one turn's shields to its disorder, as v474.05, which zeroes them
    //  while the flag its capture set is still up (`CITYMGT.C` `city_process`: `if (townbuf[city].status & 1) scratch_i =
    //  0;`), so its `CivilDisorder` rule (`captured`) holds until the production is processed, and no longer. Its food is
    //  stored as usual. Its trade is processed by `civ1-trade-rate`'s `High` `TurnStart`, which comes after
    //  `civ1-player`'s only because it's loaded later: then it's judged by its citizens, as v474.05 judges its taxes,
    //  and were it to come first that turn's research would be lost as well, as it is in any disorder here. Its disorder stays recorded until the citizens are judged at
    //  `Low` `TurnStart`, which keeps it or restores order (civ-clone/web-renderer#1014). At `Low`, after the production is
    //  added to the build (`civ1-city`).
    new ProcessYield_1.default('civ1-city-happiness:city/process-yield/settle-captured-disorder', new Priorities_1.Low(), new Criterion_1.default((cityYield) => cityYield instanceof Yields_1.Production), new Effect_1.default((cityYield, city) => (0, cityStatus_1.settleCapturedDisorder)(city, pendingEffects))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=process-yield.js.map