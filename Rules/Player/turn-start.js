"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.hasLeaderCelebration = exports.hasCivilDisorder = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const CelebrateLeader_1 = require("@civ-clone/core-city-happiness/Rules/CelebrateLeader");
const CivilDisorder_1 = require("@civ-clone/core-city-happiness/Rules/CivilDisorder");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Priorities_1 = require("@civ-clone/core-rule/Priorities");
const TurnStart_1 = require("@civ-clone/core-player/Rules/TurnStart");
// These could be `Registry`s but this is enough for now.
exports.hasCivilDisorder = new Set(), exports.hasLeaderCelebration = new Set();
const getRules = (cityRegistry = CityRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, engine = Engine_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance) => [
    new TurnStart_1.default(new Priorities_1.Low(), new Effect_1.default((player) => cityRegistry.getByPlayer(player).forEach((city) => {
        const isCivilDisorder = ruleRegistry
            .process(CivilDisorder_1.default, city, city.yields())
            .some((result) => result), isLeaderCelebration = ruleRegistry
            .process(CelebrateLeader_1.default, city, city.yields())
            .some((result) => result);
        if (isCivilDisorder) {
            engine.emit('city:civil-disorder', city);
        }
        if (isCivilDisorder && !exports.hasCivilDisorder.has(city)) {
            exports.hasCivilDisorder.add(city);
        }
        if (!isCivilDisorder && exports.hasCivilDisorder.has(city)) {
            engine.emit('city:order-restored', city);
            exports.hasCivilDisorder.delete(city);
        }
        if (isLeaderCelebration) {
            engine.emit('city:leader-celebration', city);
        }
        if (isLeaderCelebration && !exports.hasLeaderCelebration.has(city)) {
            exports.hasLeaderCelebration.add(city);
        }
        if (!isLeaderCelebration && exports.hasLeaderCelebration.has(city)) {
            engine.emit('city:leader-celebration-ended', city);
            exports.hasLeaderCelebration.delete(city);
        }
    }))),
    new TurnStart_1.default(new Priorities_1.Low(), new Effect_1.default((player) => cityRegistry.getByPlayer(player).forEach((city) => {
        if (!exports.hasLeaderCelebration.has(city)) {
            return;
        }
        const cityGrowth = cityGrowthRegistry.getByCity(city);
        cityGrowth.grow();
    }))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=turn-start.js.map