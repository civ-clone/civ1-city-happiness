"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const Types_1 = require("@civ-clone/civ1-unit/Types");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const Yields_1 = require("../../Yields");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Yield_1 = require("@civ-clone/core-city/Rules/Yield");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Priorities_1 = require("@civ-clone/core-rule/Priorities");
const Luxuries_1 = require("@civ-clone/base-city-yield-luxuries/Luxuries");
const Priority_1 = require("@civ-clone/core-rule/Priority");
const getRules = (cityGrowthRegistry = CityGrowthRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, unitRegistry = UnitRegistry_1.instance) => [
    new Yield_1.default(new Priorities_1.High(), new Criterion_1.default((cityYield) => cityYield instanceof Yields_1.Unhappiness), 
    // TODO: factor in difficulty levels
    new Effect_1.default((cityYield, city) => cityYield.add(Math.max(cityGrowthRegistry.getByCity(city).size() - 5, 0), 'Population'))),
    new Yield_1.default(new Priority_1.default(4000), new Criterion_1.default((cityYield) => cityYield instanceof Luxuries_1.default), new Effect_1.default((cityYield, city, yields) => {
        const [happiness] = yields.filter((cityYield) => cityYield instanceof Yields_1.Happiness);
        happiness.add(Math.floor(cityYield.value() / 2), Luxuries_1.default.name);
    })),
    new Yield_1.default(new Criterion_1.default((cityYield) => cityYield instanceof Yields_1.Unhappiness), new Criterion_1.default((cityYield, city) => playerGovernmentRegistry.getByPlayer(city.player()).is(Governments_1.Republic)), new Criterion_1.default((cityYield, city) => unitRegistry
        .getByCity(city)
        .filter((unit) => [Types_1.Air, Types_1.Fortifiable, Types_1.Naval].some((UnitType) => unit instanceof UnitType) && unit.tile() !== city.tile()).length > 0), new Effect_1.default((cityYield, city) => cityYield.add(unitRegistry
        .getByCity(city)
        .filter((unit) => [Types_1.Air, Types_1.Fortifiable, Types_1.Naval].some((UnitType) => unit instanceof UnitType) && unit.tile() !== city.tile()).length, 'MilitaryDiscontent'))),
    new Yield_1.default(new Criterion_1.default((cityYield) => cityYield instanceof Yields_1.Unhappiness), new Criterion_1.default((cityYield, city) => playerGovernmentRegistry.getByPlayer(city.player()).is(Governments_1.Democracy)), new Criterion_1.default((cityYield, city) => unitRegistry
        .getByCity(city)
        .filter((unit) => [Types_1.Air, Types_1.Fortifiable, Types_1.Naval].some((UnitType) => unit instanceof UnitType) && unit.tile() !== city.tile()).length > 0), new Effect_1.default((cityYield, city) => cityYield.add(unitRegistry
        .getByCity(city)
        .filter((unit) => [Types_1.Air, Types_1.Fortifiable, Types_1.Naval].some((UnitType) => unit instanceof UnitType) && unit.tile() !== city.tile()).length * 2, 'MilitaryDiscontent'))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=yield.js.map