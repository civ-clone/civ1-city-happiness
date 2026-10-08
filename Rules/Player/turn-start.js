"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const cityStatus_1 = require("../../lib/cityStatus");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const revolution_1 = require("@civ-clone/civ1-government/lib/revolution");
const CelebrateLeader_1 = require("@civ-clone/core-city-happiness/Rules/CelebrateLeader");
const CivilDisorder_1 = require("@civ-clone/core-city-happiness/Rules/CivilDisorder");
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Priorities_1 = require("@civ-clone/core-rule/Priorities");
const TurnStart_1 = require("@civ-clone/core-player/Rules/TurnStart");
const getRules = (cityRegistry = CityRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, engine = Engine_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, pendingEffects = core_pending_effect_1.instance, turn = Turn_1.instance) => {
    (0, cityStatus_1.registerHandlers)(pendingEffects, engine);
    return [
        new TurnStart_1.default(new Priorities_1.Low(), new Effect_1.default((player) => cityRegistry.getByPlayer(player).forEach((city) => {
            // Both rules read the same yields, and working them out isn't cheap
            // (civ-clone/web-renderer#315).
            const yields = city.yields(), isCivilDisorder = ruleRegistry
                .process(CivilDisorder_1.default, city, yields)
                .some((result) => result), isLeaderCelebration = ruleRegistry
                .process(CelebrateLeader_1.default, city, yields)
                .some((result) => result);
            if (isCivilDisorder) {
                engine.emit('city:civil-disorder', city);
            }
            // Kept in `pendingEffects`, which is saved, so a loaded game knows
            // which cities were already in disorder or celebrating
            // (civ-clone/web-renderer#121).
            const disorder = (0, cityStatus_1.civilDisorder)(city, pendingEffects), celebration = (0, cityStatus_1.leaderCelebration)(city, pendingEffects);
            // A Democracy falls when a city is in civil disorder for a second turn
            // running (Rome on 640K a Day, p221-223), and the Anarchy lasts twice
            // as long as usual.
            if (isCivilDisorder && disorder !== null) {
                const playerGovernment = playerGovernmentRegistry.getByPlayer(player);
                if (playerGovernment.is(Governments_1.Democracy) &&
                    (0, revolution_1.pendingRevolution)(playerGovernment, pendingEffects) === null) {
                    (0, revolution_1.revolution)(playerGovernment, pendingEffects, ruleRegistry, turn, 'civil-disorder');
                    engine.emit('player:government:collapsed', player, city);
                }
            }
            if (isCivilDisorder && disorder === null) {
                pendingEffects.register(new core_pending_effect_1.PendingEffect(cityStatus_1.CIVIL_DISORDER, city));
            }
            // Emits `city:order-restored`.
            if (!isCivilDisorder && disorder !== null) {
                pendingEffects.discharge(disorder);
            }
            if (isLeaderCelebration && celebration === null) {
                engine.emit('city:leader-celebration', city);
                pendingEffects.register(new core_pending_effect_1.PendingEffect(cityStatus_1.LEADER_CELEBRATION, city));
            }
            // Emits `city:leader-celebration-ended`.
            if (!isLeaderCelebration && celebration !== null) {
                pendingEffects.discharge(celebration);
            }
        }))),
        new TurnStart_1.default(new Priorities_1.Low(), new Effect_1.default((player) => cityRegistry.getByPlayer(player).forEach((city) => {
            if ((0, cityStatus_1.leaderCelebration)(city, pendingEffects) === null) {
                return;
            }
            const cityGrowth = cityGrowthRegistry.getByCity(city);
            cityGrowth.grow();
        }))),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=turn-start.js.map