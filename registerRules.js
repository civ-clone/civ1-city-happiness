"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const celebrate_leader_1 = require("./Rules/City/celebrate-leader");
const yield_1 = require("./Rules/City/yield");
const civil_disorder_1 = require("./Rules/City/civil-disorder");
const cost_1 = require("./Rules/City/cost");
const turn_start_1 = require("./Rules/Player/turn-start");
RuleRegistry_1.instance.register(...(0, celebrate_leader_1.default)(), ...(0, yield_1.default)(), ...(0, civil_disorder_1.default)(), ...(0, cost_1.default)(), ...(0, turn_start_1.default)());
//# sourceMappingURL=registerRules.js.map