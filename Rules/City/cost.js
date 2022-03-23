"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const CityImprovements_1 = require("@civ-clone/civ1-city-improvement/CityImprovements");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityImprovementRegistry_1 = require("@civ-clone/core-city-improvement/CityImprovementRegistry");
const CivilDisorder_1 = require("@civ-clone/core-city-happiness/Rules/CivilDisorder");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Yield_1 = require("@civ-clone/core-city/Rules/Yield");
const Cost_1 = require("@civ-clone/core-city/Rules/Cost");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Types_1 = require("@civ-clone/civ1-unit/Types");
const Yields_1 = require("@civ-clone/civ1-city/Yields");
const Priorities_1 = require("@civ-clone/core-rule/Priorities");
const Advances_1 = require("@civ-clone/civ1-science/Advances");
const Yields_2 = require("@civ-clone/civ1-world/Yields");
const Yields_3 = require("@civ-clone/civ1-science/Yields");
const Yields_4 = require("../../Yields");
const getRules = (ruleRegistry = RuleRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, cityImprovementRegistry = CityImprovementRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, unitRegistry = UnitRegistry_1.instance) => [
    new Cost_1.default(new Priorities_1.Low(), new Criterion_1.default((cityYield) => cityYield instanceof Yields_1.Gold ||
        cityYield instanceof Yields_3.Research ||
        cityYield instanceof Yields_2.Production), new Criterion_1.default((cityYield, city, yields = city.yields()) => ruleRegistry
        .get(CivilDisorder_1.CivilDisorder)
        .some((rule) => rule.validate(city, yields))), new Effect_1.default((cityYield) => cityYield.subtract(cityYield, CivilDisorder_1.CivilDisorder.name))),
    new Cost_1.default(new Criterion_1.default((cityYield) => cityYield instanceof Yields_4.Unhappiness), new Criterion_1.default((cityYield, city) => playerGovernmentRegistry
        .getByPlayer(city.player())
        .is(Governments_1.Anarchy, Governments_1.Communism, Governments_1.Despotism, Governments_1.Monarchy)), new Effect_1.default((cityYield, city) => cityYield.subtract(Math.min(4, Math.min(cityYield.value(), unitRegistry
        .getByTile(city.tile())
        .filter((unit) => unit instanceof Types_1.Fortifiable)
        .length)), 'MartialLaw'))),
    ...[
        [CityImprovements_1.Temple, 1],
        [CityImprovements_1.Colosseum, 3],
        [CityImprovements_1.Cathedral, 4],
    ].map(([Improvement, reduction]) => new Yield_1.default(new Priorities_1.Low(), new Criterion_1.default((cityYield) => cityYield instanceof Yields_4.Unhappiness), new Criterion_1.default((cityYield, city) => cityImprovementRegistry
        .getByCity(city)
        .some((cityImprovement) => cityImprovement instanceof Improvement)), new Effect_1.default((cityYield) => cityYield.subtract(Math.min(reduction, cityYield.value()), Improvement.name)))),
    new Cost_1.default(new Priorities_1.Low(), new Criterion_1.default((cityYield) => cityYield instanceof Yields_4.Unhappiness), new Criterion_1.default((cityYield, city) => cityImprovementRegistry
        .getByCity(city)
        .some((cityImprovement) => cityImprovement instanceof CityImprovements_1.Temple)), new Criterion_1.default((cityYield, city) => playerResearchRegistry.getByPlayer(city.player()).completed(Advances_1.Mysticism)), new Effect_1.default((cityYield) => cityYield.subtract(Math.min(1, cityYield.value()), Advances_1.Mysticism.name))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=cost.js.map