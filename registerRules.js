"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const celebrate_leader_1 = require("./Rules/City/celebrate-leader");
const yield_1 = require("./Rules/City/yield");
const civil_disorder_1 = require("./Rules/City/civil-disorder");
const cost_1 = require("./Rules/City/cost");
const turn_start_1 = require("./Rules/Player/turn-start");
RuleRegistry_1.instance.register(...celebrate_leader_1.default(), ...yield_1.default(), ...civil_disorder_1.default(), ...cost_1.default(), ...turn_start_1.default());
//# sourceMappingURL=registerRules.js.map