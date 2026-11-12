"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const SpecialistRegistry_1 = require("@civ-clone/core-city/SpecialistRegistry");
const calculateCitizenState_1 = require("../../lib/calculateCitizenState");
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const CelebrateLeader_1 = require("@civ-clone/core-city-happiness/Rules/CelebrateLeader");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const getRules = (cityGrowthRegistry = CityGrowthRegistry_1.instance, specialistRegistry = SpecialistRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance) => [
    new CelebrateLeader_1.default(new Criterion_1.default((city) => cityGrowthRegistry.getByCity(city).size() > 2), 
    // No celebration under Anarchy. v474.05 (`CITYMGT.C` `city_process`): `if (town_unhappy_counts == 0 &&
    //  townbuf[city].size > 2 && (townbuf[city].size + 1) / 2 <= town_happy_ones_num && civ_gov[selected_owner] != 0)`,
    //  where `civ_gov` 0 is Anarchy (`GAME.C` `government_names`) (civ-clone/web-renderer#1010).
    new Criterion_1.default((city) => !playerGovernmentRegistry.getByPlayer(city.player()).is(Governments_1.Anarchy)), new Effect_1.default((city, yields = city.yields()) => {
        const cityGrowth = cityGrowthRegistry.getByCity(city), citizenState = (0, calculateCitizenState_1.calculateCitizenState)(cityGrowth, yields, specialistRegistry), [unhappiness, , happiness] = (0, calculateCitizenState_1.citizenSummary)(citizenState);
        return (unhappiness === 0 && Math.floor(happiness) >= cityGrowth.size() / 2);
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=celebrate-leader.js.map