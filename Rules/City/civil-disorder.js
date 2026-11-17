"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const SpecialistRegistry_1 = require("@civ-clone/core-city/SpecialistRegistry");
const calculateCitizenState_1 = require("../../lib/calculateCitizenState");
const CivilDisorder_1 = require("@civ-clone/core-city-happiness/Rules/CivilDisorder");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const cityStatus_1 = require("../../lib/cityStatus");
const getRules = (cityGrowthRegistry = CityGrowthRegistry_1.instance, specialistRegistry = SpecialistRegistry_1.instance, pendingEffects = core_pending_effect_1.instance) => [
    new CivilDisorder_1.default(new Effect_1.default((city, yields = city.yields()) => {
        const cityGrowth = cityGrowthRegistry.getByCity(city), citizenState = (0, calculateCitizenState_1.calculateCitizenState)(cityGrowth, yields, specialistRegistry), [unhappiness, , happiness] = (0, calculateCitizenState_1.citizenSummary)(citizenState);
        return unhappiness > happiness;
    })),
    // A city the human captured below a Republic is in disorder whatever its citizens think, until its next production
    //  is lost to it (`captured`, `process-yield`; civ-clone/web-renderer#1014).
    new CivilDisorder_1.default('civ1-city-happiness:city/civil-disorder/captured', new Effect_1.default((city) => (0, cityStatus_1.capturedDisorder)(city, pendingEffects))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=civil-disorder.js.map