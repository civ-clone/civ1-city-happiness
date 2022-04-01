"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const CityImprovements_1 = require("@civ-clone/civ1-city-improvement/CityImprovements");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityImprovementRegistry_1 = require("@civ-clone/core-city-improvement/CityImprovementRegistry");
const CivilDisorder_1 = require("@civ-clone/core-city-happiness/Rules/CivilDisorder");
const Yields_1 = require("../../Yields");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Cost_1 = require("@civ-clone/core-city/Rules/Cost");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Types_1 = require("@civ-clone/civ1-unit/Types");
const High_1 = require("@civ-clone/core-rule/Priorities/High");
const Priorities_1 = require("@civ-clone/core-rule/Priorities");
const Advances_1 = require("@civ-clone/civ1-science/Advances");
const Priority_1 = require("@civ-clone/core-rule/Priority");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
const getRules = (ruleRegistry = RuleRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, cityImprovementRegistry = CityImprovementRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, unitRegistry = UnitRegistry_1.instance) => [
    new Cost_1.default(new Priority_1.default(9001), new Criterion_1.default((city, yields) => ruleRegistry
        .get(CivilDisorder_1.CivilDisorder)
        .some((rule) => rule.validate(city, yields))), new Effect_1.default((city, yields) => [Yields_1.Gold, Yields_1.Research, Yields_1.Production].map((YieldType) => new YieldType(-(0, reduceYields_1.reduceYield)(yields, YieldType), CivilDisorder_1.CivilDisorder.name)))),
    // Martial Law
    new Cost_1.default(new Criterion_1.default((city) => playerGovernmentRegistry
        .getByPlayer(city.player())
        .is(Governments_1.Anarchy, Governments_1.Communism, Governments_1.Despotism, Governments_1.Monarchy)), new Effect_1.default((city, yields) => unitRegistry
        .getByTile(city.tile())
        .filter((unit) => unit instanceof Types_1.Fortifiable)
        .slice(0, Math.min(4, (0, reduceYields_1.reduceYield)(yields, Yields_1.Unhappiness)))
        .map((unit) => new Yields_1.Unhappiness(-1, unit.id())))),
    new Cost_1.default(new Priorities_1.Low(), new Criterion_1.default((city) => cityImprovementRegistry
        .getByCity(city)
        .some((cityImprovement) => cityImprovement instanceof CityImprovements_1.Temple)), new Criterion_1.default((city) => !playerResearchRegistry.getByPlayer(city.player()).completed(Advances_1.Mysticism)), new Effect_1.default((city, yields) => new Yields_1.Unhappiness(-Math.min(1, (0, reduceYields_1.reduceYield)(yields, Yields_1.Unhappiness)), CityImprovements_1.Temple.name))),
    new Cost_1.default(new Priorities_1.Low(), new Criterion_1.default((city) => cityImprovementRegistry
        .getByCity(city)
        .some((cityImprovement) => cityImprovement instanceof CityImprovements_1.Temple)), new Criterion_1.default((city) => playerResearchRegistry.getByPlayer(city.player()).completed(Advances_1.Mysticism)), new Effect_1.default((city, yields) => new Yields_1.Unhappiness(-Math.min(2, (0, reduceYields_1.reduceYield)(yields, Yields_1.Unhappiness)), CityImprovements_1.Temple.name))),
    ...[
        [CityImprovements_1.Colosseum, 3],
        [CityImprovements_1.Cathedral, 4],
    ].map(([Improvement, reduction]) => new Cost_1.default(new Priorities_1.Low(), new Criterion_1.default((city, yields) => cityImprovementRegistry
        .getByCity(city)
        .some((cityImprovement) => cityImprovement instanceof Improvement)), new Effect_1.default((city, yields) => new Yields_1.Unhappiness(-Math.min(reduction, (0, reduceYields_1.reduceYield)(yields, Yields_1.Unhappiness)), Improvement.name)))),
    new Cost_1.default(new High_1.default(), new Criterion_1.default((city, yields) => !yields.some((cityYield) => cityYield instanceof Yields_1.Happiness &&
        cityYield
            .values()
            .some(([, provider]) => provider === Yields_1.Luxuries.name))), new Effect_1.default((city, yields) => new Yields_1.Happiness(Math.floor((0, reduceYields_1.reduceYield)(yields, Yields_1.Luxuries) / 2), Yields_1.Luxuries.name))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=cost.js.map