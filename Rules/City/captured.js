"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const cityStatus_1 = require("../../lib/cityStatus");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const Governments_1 = require("@civ-clone/civ1-government/Governments");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const Captured_1 = require("@civ-clone/core-city/Rules/Captured");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Priorities_1 = require("@civ-clone/core-rule/Priorities");
const cityStatus_2 = require("@civ-clone/base-city-happiness-status/lib/cityStatus");
const isHuman_1 = require("@civ-clone/civ1-difficulty/isHuman");
const getRules = (pendingEffects = core_pending_effect_1.instance, clientRegistry = ClientRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, turn = Turn_1.instance) => [
    // A captured city, taken by force or incited by a Diplomat, starts out for its captor neither in disorder nor
    //  celebrating, as v474.05 (`CAPTURE.C` `capunit`, which both captures go through): `townbuf[b].status &=
    //  CITY_CAPTURE_MASK;` and `townbuf[b].status &= CITY_TRANSFER_MASK;`, which clear `CITY_DISORDER` (0x01) and
    //  `CITY_CELEBRATING` (0x40) (`CIV.H`). Dropped rather than ended, so the captor isn't told order was restored or the
    //  celebration is over, and its first turn of either counts as a first. At `High`, ahead of the other packages'
    //  `Captured` rules that read the city's status (civ-clone/web-renderer#1010).
    new Captured_1.default('civ1-city-happiness:city/captured/forget-status', new Priorities_1.High(), new Effect_1.default((city) => (0, cityStatus_2.forgetCityStatuses)(city, [cityStatus_1.CIVIL_DISORDER, cityStatus_1.LEADER_CELEBRATION], pendingEffects))),
    // ...except that a city the human captures under any government but a Republic or a Democracy is put in civil
    //  disorder at once, as v474.05 (`CAPTURE.C` `capunit`, further on): `if (a == civnow && civ_gov[civnow] < 4)
    //  townbuf[b].status |= CITY_DISORDER;`. Its next turn's shields are lost (`CITYMGT.C` `city_process`, which reads
    //  the flag before working the city's disorder out again: `if (townbuf[city].status & 1) scratch_i = 0;`), it can't
    //  buy a unit while it lasts (civ1-treasury's `Spend`), and when its citizens are content that turn order is restored,
    //  with its notice. No notice is given now. A computer player's capture leaves the city out of disorder. After
    //  `forget-status`, and at `High` too, so the other packages' `Captured` rules see the city in disorder
    //  (civ-clone/web-renderer#1014).
    new Captured_1.default('civ1-city-happiness:city/captured/disorder', new Priorities_1.High(), new Criterion_1.default((city, capturingPlayer) => (0, isHuman_1.default)(capturingPlayer, clientRegistry) &&
        !playerGovernmentRegistry
            .getByPlayer(capturingPlayer)
            .is(Governments_1.Republic, Governments_1.Democracy)), new Effect_1.default((city) => (0, cityStatus_1.imposeCapturedDisorder)(city, turn.value(), pendingEffects))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=captured.js.map