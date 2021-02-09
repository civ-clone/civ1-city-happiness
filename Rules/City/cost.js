"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const Yields_1 = require("../../Yields");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Cost_1 = require("@civ-clone/core-city/Rules/Cost");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Types_1 = require("@civ-clone/civ1-unit/Types");
const Luxuries_1 = require("@civ-clone/base-city-yield-luxuries/Luxuries");
const getRules = (playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, unitRegistry = UnitRegistry_1.instance) => [
    new Cost_1.default(new Criterion_1.default((cityYield) => cityYield instanceof Luxuries_1.default), new Effect_1.default((cityYield, city, yields) => {
        const [happiness] = yields.filter((cityYield) => cityYield instanceof Yields_1.Happiness);
        happiness.add(Math.floor(cityYield.value() / 2), 'luxuries');
    })),
    new Cost_1.default(new Criterion_1.default((cityYield) => cityYield instanceof Yields_1.Unhappiness), new Criterion_1.default((cityYield, city) => playerGovernmentRegistry
        .getByPlayer(city.player())
        .is(Governments_1.Anarchy, Governments_1.Despotism, Governments_1.Monarchy)), new Effect_1.default((cityYield, city) => cityYield.subtract(Math.min(4, Math.min(cityYield.value(), unitRegistry
        .getByTile(city.tile())
        .filter((unit) => unit instanceof Types_1.Fortifiable)
        .length)), 'martial-law'))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=cost.js.map