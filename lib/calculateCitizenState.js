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
 * The mood of each of a city's working citizens, as v474.05 works it out (OpenCivOne's decompile,
 * `src/Game/CodeObjects/CityWorker.cs`, the city happiness routine and `F0_1d12_6dfe_AdjustHappyUnhappyCitizens`).
 * Specialists are neither happy nor unhappy, and are taken out before any `Happiness` is applied: from the content
 * citizens first, then from the unhappy ones. So the list is shorter than the city's size by one per specialist.
 *
 * Each point of `Happiness` then makes a content citizen happy or, when none is left, an unhappy one content.
 *
 * Rome on 640K a Day (p249) has specialists drawn from the content citizens and then the happy ones, which is what
 * this did until civ-clone/web-renderer#224: Entertainers' luxuries then made the happy citizens that the
 * Entertainers themselves were taken from, so a city that ran out of content citizens could never be calmed by them.
 */
const calculateCitizenState = (cityGrowth, yields = cityGrowth.city().yields(), specialistRegistry = SpecialistRegistry_1.instance) => {
    const city = cityGrowth.city(), state = new Array(cityGrowth.size()).fill(CitizenState.Content);
    let [happiness, unhappiness] = (0, reduceYields_1.reduceYields)(yields, Happiness_1.default, Unhappiness_1.default), specialists = specialistRegistry.getByCity(city).length, currentIndex = state.length - 1;
    // Set the citizens at the end of the list to unhappy for each Unhappiness...
    while (unhappiness > 0 && currentIndex > -1) {
        state[currentIndex--] = CitizenState.Unhappy;
        unhappiness--;
    }
    // ...take the specialists out, the content citizens first...
    [CitizenState.Content, CitizenState.Unhappy].forEach((citizenState) => {
        while (specialists > 0 && state.includes(citizenState)) {
            state.splice(state.lastIndexOf(citizenState), 1);
            specialists--;
        }
    });
    // ...then for each Happiness start at the beginning, making a content citizen happy, or an unhappy one content.
    currentIndex = 0;
    while (happiness > 0 && currentIndex < state.length) {
        if (state[currentIndex] === CitizenState.Happy) {
            currentIndex++;
            continue;
        }
        state[currentIndex] =
            state[currentIndex] === CitizenState.Unhappy
                ? CitizenState.Content
                : CitizenState.Happy;
        happiness--;
    }
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