"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdditionalData = void 0;
const calculateCitizenState_1 = require("../lib/calculateCitizenState");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const Yields_1 = require("../Yields");
const SpecialistRegistry_1 = require("@civ-clone/core-city/SpecialistRegistry");
const AdditionalData_1 = require("@civ-clone/core-data-object/AdditionalData");
const City_1 = require("@civ-clone/core-city/City");
/**
 * The mood of each of a city's working citizens, so a renderer can draw them without knowing the rule
 * (civ-clone/web-renderer#277). `causes` has one entry per `Happiness` or `Unhappiness` yield, in order, with the moods
 * once that yield and the ones before it are applied, for a report that shows what each one changes.
 */
const getAdditionalData = (cityGrowthRegistry = CityGrowthRegistry_1.instance, specialistRegistry = SpecialistRegistry_1.instance) => [
    new AdditionalData_1.default(City_1.default, 'citizens', (city) => {
        const cityGrowth = cityGrowthRegistry.getByCity(city), yields = city.yields(), causes = yields.filter((cityYield) => (cityYield instanceof Yields_1.Happiness ||
            cityYield instanceof Yields_1.Unhappiness) &&
            cityYield.value() !== 0), moods = (yields) => (0, calculateCitizenState_1.calculateCitizenState)(cityGrowth, yields, specialistRegistry).map(calculateCitizenState_1.citizenMood);
        return {
            moods: moods(yields),
            causes: causes.map((cityYield, index) => ({
                yield: cityYield,
                moods: moods(causes.slice(0, index + 1)),
            })),
        };
    }),
];
exports.getAdditionalData = getAdditionalData;
exports.default = exports.getAdditionalData;
//# sourceMappingURL=citizens.js.map