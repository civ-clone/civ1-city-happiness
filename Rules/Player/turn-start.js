"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const CelebrateLeader_1 = require("@civ-clone/core-city-happiness/Rules/CelebrateLeader");
const CivilDisorder_1 = require("@civ-clone/core-city-happiness/Rules/CivilDisorder");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Priorities_1 = require("@civ-clone/core-rule/Priorities");
const TurnStart_1 = require("@civ-clone/core-player/Rules/TurnStart");
const getRules = (cityRegistry = CityRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, engine = Engine_1.instance) => [
    new TurnStart_1.default(new Priorities_1.Low(), new Effect_1.default((player) => cityRegistry.getByPlayer(player).forEach((city) => {
        if (ruleRegistry
            .get(CivilDisorder_1.default)
            .some((rule) => rule.validate(city, city.yields()))) {
            engine.emit('city:civil-disorder', city);
        }
        if (ruleRegistry
            .get(CelebrateLeader_1.default)
            .some((rule) => rule.validate(city, city.yields()))) {
            engine.emit('city:leader-celebration', city);
        }
    }))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=turn-start.js.map