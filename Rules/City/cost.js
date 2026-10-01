"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const CityImprovements_1 = require("@civ-clone/civ1-city-improvement/CityImprovements");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const Yields_1 = require("../../Yields");
const CityImprovementRegistry_1 = require("@civ-clone/core-city-improvement/CityImprovementRegistry");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Cost_1 = require("@civ-clone/core-city/Rules/Cost");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const High_1 = require("@civ-clone/core-rule/Priorities/High");
const Priorities_1 = require("@civ-clone/core-rule/Priorities");
const Advances_1 = require("@civ-clone/civ1-science/Advances");
const Or_1 = require("@civ-clone/core-rule/Criteria/Or");
const Priority_1 = require("@civ-clone/core-rule/Priority");
const martialLaw_1 = require("../../martialLaw");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
const getRules = (ruleRegistry = RuleRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, cityImprovementRegistry = CityImprovementRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, unitRegistry = UnitRegistry_1.instance) => [
    ...[
        [CityImprovements_1.Temple, 1],
        [CityImprovements_1.Temple, 1, Advances_1.Mysticism],
        [CityImprovements_1.Colosseum, 3],
        [CityImprovements_1.Cathedral, 4],
    ].map(([CityImprovementType, value, ...advances]) => new Cost_1.default(new Priorities_1.Low(), new Criterion_1.default((city) => cityImprovementRegistry
        .getByCity(city)
        .some((cityImprovement) => cityImprovement instanceof CityImprovementType)), new Or_1.default(new Criterion_1.default((city) => advances.length === 0), new Criterion_1.default((city) => advances.every((AdvanceType) => playerResearchRegistry
        .getByPlayer(city.player())
        .completed(AdvanceType)))), new Criterion_1.default((city, yields) => (0, reduceYields_1.reduceYield)(yields, Yields_1.Unhappiness) > 0), new Effect_1.default((city, yields) => new Yields_1.CityImprovementContent(Math.min(value, (0, reduceYields_1.reduceYield)(yields, Yields_1.Unhappiness)), cityImprovementRegistry
        .getByCity(city)
        .filter((cityImprovement) => cityImprovement instanceof CityImprovementType)[0])))),
    // Martial law (`martialLaw.ts`) comes after the improvements here and the Wonders in civ1-wonder, which are `Low`, so
    //  it calms what they leave, as v474.05 does. Shakespeare's Theatre (4000) still comes last.
    new Cost_1.default('civ1-city-happiness:city/cost/martial-law', new Priority_1.default(3500), new Criterion_1.default((city) => playerGovernmentRegistry
        .getByPlayer(city.player())
        .is(...martialLaw_1.martialLawGovernments)), new Criterion_1.default((city, yields) => (0, reduceYields_1.reduceYield)(yields, Yields_1.Unhappiness) > 0), new Effect_1.default((city, yields) => unitRegistry
        .getByTile(city.tile())
        .filter((unit) => unit.player() === city.player() && (0, martialLaw_1.keepsMartialLaw)(unit))
        .slice(0, Math.min(martialLaw_1.martialLawUnitLimit, (0, reduceYields_1.reduceYield)(yields, Yields_1.Unhappiness)))
        .map((unit) => new Yields_1.MartialLaw(1, unit)))),
    new Cost_1.default(new High_1.default(), new Effect_1.default((city, yields) => new Yields_1.LuxuryHappiness(Math.floor((0, reduceYields_1.reduceYield)(yields, Yields_1.Luxuries) / 2), Yields_1.Luxuries.name))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=cost.js.map