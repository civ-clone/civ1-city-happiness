"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityImprovementRegistry_1 = require("@civ-clone/core-city-improvement/CityImprovementRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const cityStatus_1 = require("../../lib/cityStatus");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const revolution_1 = require("@civ-clone/civ1-government/lib/revolution");
const cityStatus_2 = require("@civ-clone/base-city-happiness-status/lib/cityStatus");
const CelebrateLeader_1 = require("@civ-clone/core-city-happiness/Rules/CelebrateLeader");
const CivilDisorder_1 = require("@civ-clone/core-city-happiness/Rules/CivilDisorder");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Yields_1 = require("@civ-clone/civ1-city/Yields");
const Priorities_1 = require("@civ-clone/core-rule/Priorities");
const TurnStart_1 = require("@civ-clone/core-player/Rules/TurnStart");
const growthLimit_1 = require("@civ-clone/civ1-city-improvement/lib/growthLimit");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
const getRules = (cityRegistry = CityRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, engine = Engine_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, pendingEffects = core_pending_effect_1.instance, turn = Turn_1.instance, cityImprovementRegistry = CityImprovementRegistry_1.instance) => {
    (0, cityStatus_1.registerHandlers)(pendingEffects, engine);
    // The cities celebrating for a second turn running (or more), with the yields they were judged on and whether the
    //  player was a Republic or Democracy when the city's turn came: only the first rule still knows whether a city was
    //  celebrating before this turn's check, so it hands them to the growth rule.
    const celebratingAgain = new WeakMap();
    return [
        new TurnStart_1.default(new Priorities_1.Low(), new Effect_1.default((player) => {
            // Asked once a city is celebrating again, and then once, until a city's disorder brings a Democracy down.
            let republicOrDemocracy;
            cityRegistry.getByPlayer(player).forEach((city) => {
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
                        republicOrDemocracy = undefined;
                        engine.emit('player:government:collapsed', player, city);
                    }
                }
                // v474.05 works through a player's cities one at a time, and a Democracy falls inside the city whose
                //  disorder brings it down (`set_government(selected_owner, 0);`, `CITYMGT.C` 1740), so the cities before it
                //  have already grown under the Democracy, and those after it see Anarchy. The government is asked here, as
                //  each city's turn comes, for the growth rule (civ-clone/web-renderer#1013).
                if (isLeaderCelebration && celebration !== null) {
                    celebratingAgain.set(city, {
                        republicOrDemocracy: (republicOrDemocracy !== null && republicOrDemocracy !== void 0 ? republicOrDemocracy : (republicOrDemocracy = playerGovernmentRegistry
                            .getByPlayer(player)
                            .is(Governments_1.Republic, Governments_1.Democracy))),
                        yields,
                    });
                }
                else {
                    celebratingAgain.delete(city);
                }
                // Records disorder that has started, and ends disorder that has
                // stopped, which emits `city:order-restored`.
                (0, cityStatus_2.updateCityStatus)(cityStatus_1.CIVIL_DISORDER, city, isCivilDisorder, disorder, pendingEffects);
                // v474.05 ends a celebration only while the city isn't in civil disorder (`CITYMGT.C` `city_process`):
                //    scratch_i = town_happy_ones_num - town_unhappy_counts;                                    (1697)
                //    if (scratch_i < 0) { ... "Civil Disorder in" ... }                                          (1698)
                //    ...
                //    if (town_unhappy_counts == 0 && townbuf[city].size > 2 && ... && civ_gov[selected_owner] != 0) {
                //      ...                                                           (1765, starts it or grows the city)
                //    } else if (scratch_i >= 0 && (townbuf[city].status & CITY_CELEBRATING)) {                (1788)
                //      if ((human_set & (1 << selected_owner)) && civ_gov[selected_owner] != 0) {               (1789)
                //        ... "celebration canceled" ... }
                //      townbuf[city].status &= ~CITY_CELEBRATING;                                             (1799)
                //    }
                //  So a celebrating city in disorder keeps its celebration, with no notice, under any government (Anarchy
                //  too); its squares keep the celebration's yields (`celebration-yield`); and when order returns with the
                //  celebration's conditions met it carries on, with no new notice, and a Republic or Democracy grows it at
                //  once (civ-clone/web-renderer#1013).
                if (isCivilDisorder && !isLeaderCelebration) {
                    return;
                }
                // A city can't celebrate under Anarchy (`celebrate-leader`), and v474.05 ends a celebration then without a
                //  word: its "celebration canceled" notice needs `civ_gov[selected_owner] != 0` (1789), so the record is
                //  dropped rather than ended (civ-clone/web-renderer#1010).
                if (!isLeaderCelebration &&
                    celebration !== null &&
                    playerGovernmentRegistry.getByPlayer(player).is(Governments_1.Anarchy)) {
                    (0, cityStatus_2.forgetCityStatuses)(city, [cityStatus_1.LEADER_CELEBRATION], pendingEffects);
                    return;
                }
                // The same for a celebration, emitting `city:leader-celebration` as
                // it starts and `city:leader-celebration-ended` as it ends.
                (0, cityStatus_2.updateCityStatus)(cityStatus_1.LEADER_CELEBRATION, city, isLeaderCelebration, celebration, pendingEffects, () => engine.emit('city:leader-celebration', city));
            });
        })),
        // A city celebrating "We Love the King Day" for a second turn running grows by one under a Republic or a Democracy,
        //  while it has food to spare (its Settlers' included) and the Aqueduct doesn't hold it back. v474.05
        //  (`CITYMGT.C` `city_process`, where the first celebrating turn only sets the flag):
        //    if (!(townbuf[city].status & CITY_CELEBRATING)) { ... townbuf[city].status |= CITY_CELEBRATING; }
        //    else if (civ_gov[selected_owner] >= 4 && townbuf[city].size * 2 + colonist_homed * sett_food_j <
        //      town_res_sums[0] && (townbuf[city].size < 10 || (townbuf[city].buildings & HAS_AQUEDUCT)))
        //      townbuf[city].size++;
        //  The size cap here is unconditional; growth from the food store has the same one, under `rule_options & 4`
        //  (`CITYMGT.C` 321-322), which is always set (`rule_options = 15;`, `NEWGAME.C` 65). `civ_gov` 4 and 5 are the Republic and Democracy (`GAME.C` `government_names`). The food store is left as it is:
        //  this growth isn't paid for from it (civ-clone/web-renderer#1010).
        new TurnStart_1.default('civ1-city-happiness:player/turn-start/celebration-growth', new Priorities_1.Low(), new Effect_1.default((player) => cityRegistry.getByPlayer(player).forEach((city) => {
            const celebrating = celebratingAgain.get(city);
            // Taken once, so an entry the status rule didn't set this turn can't grow the city again.
            celebratingAgain.delete(city);
            // The government as it was when the status rule came to the city, not as it is now: the status rule can
            //  bring a Democracy down part-way through the player's cities. (Not a `Criterion` either: every rule's
            //  criteria are checked before any rule runs.)
            if (celebrating === undefined || !celebrating.republicOrDemocracy) {
                return;
            }
            const { yields } = celebrating;
            const cityGrowth = cityGrowthRegistry.getByCity(city);
            // The city's food net of what its citizens and Settlers eat.
            if ((0, reduceYields_1.reduceYield)(yields, Yields_1.Food) <= 0 ||
                (0, growthLimit_1.growthLimit)(cityGrowth, cityImprovementRegistry) !== null) {
                return;
            }
            const storedFood = cityGrowth.progress().value();
            // Grown through `CityGrowth`, so the new citizen is put to work, as joining Settlers are; its `Grow` rules
            //  also empty the store (or, with a Granary, half-fill it), so it's put back.
            cityGrowth.grow(CelebrateLeader_1.default);
            cityGrowth.progress().set(storedFood, 'celebration-growth');
        }))),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=turn-start.js.map