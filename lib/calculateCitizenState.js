"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.citizenSummary = exports.calculateCitizenState = void 0;
const SpecialistRegistry_1 = require("@civ-clone/core-city/SpecialistRegistry");
const Happiness_1 = require("@civ-clone/base-city-yield-happiness/Happiness");
const Unhappiness_1 = require("@civ-clone/base-city-yield-unhappiness/Unhappiness");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
var CitizenState;
(function (CitizenState) {
    CitizenState[CitizenState["Unhappy"] = 0] = "Unhappy";
    CitizenState[CitizenState["Content"] = 1] = "Content";
    CitizenState[CitizenState["Happy"] = 2] = "Happy";
})(CitizenState || (CitizenState = {}));
/**
 * The mood of each of a city's working citizens. Its specialists are neither: they are drawn from the content citizens
 * first and then from the happy ones (p249, Wilson, J.L & Emrich A. (1992). Sid Meier's Civilization, or Rome on 640K a
 * Day. Rocklin, CA: Prima Publishing), so the list is shorter than the city's size by one per specialist.
 */
const calculateCitizenState = (cityGrowth, yields = cityGrowth.city().yields(), specialistRegistry = SpecialistRegistry_1.instance) => {
    const city = cityGrowth.city(), state = new Array(cityGrowth.size()).fill(CitizenState.Content);
    let [happiness, unhappiness] = (0, reduceYields_1.reduceYields)(yields, Happiness_1.default, Unhappiness_1.default), currentIndex = state.length - 1;
    // Set the citizens at the end of the list to unhappy for each Unhappiness...
    while (unhappiness > 0 && currentIndex > -1) {
        state[currentIndex--] = CitizenState.Unhappy;
        unhappiness--;
    }
    // ...then for each Happiness start at the beginning, setting each Content citizen
    currentIndex = 0;
    while (happiness > 0 && currentIndex < state.length) {
        if (state[currentIndex] === CitizenState.Unhappy) {
            state[currentIndex] = CitizenState.Content;
            happiness--;
        }
        if (state[currentIndex] === CitizenState.Content) {
            state[currentIndex++] = CitizenState.Happy;
            happiness--;
        }
        if (state[currentIndex] === CitizenState.Happy) {
            currentIndex++;
        }
    }
    let specialists = specialistRegistry.getByCity(city).length;
    [CitizenState.Content, CitizenState.Happy, CitizenState.Unhappy].forEach((citizenState) => {
        while (specialists > 0 && state.includes(citizenState)) {
            state.splice(state.lastIndexOf(citizenState), 1);
            specialists--;
        }
    });
    return state;
};
exports.calculateCitizenState = calculateCitizenState;
const citizenSummary = (state) => state.reduce(([unhappy, content, happy], citizenState) => [
    unhappy + (citizenState === CitizenState.Unhappy ? 1 : 0),
    content + (citizenState === CitizenState.Content ? 1 : 0),
    happy + (citizenState === CitizenState.Happy ? 1 : 0),
], [0, 0, 0]);
exports.citizenSummary = citizenSummary;
exports.default = exports.calculateCitizenState;
//# sourceMappingURL=calculateCitizenState.js.map