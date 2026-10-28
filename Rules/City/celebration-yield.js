"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const governmentTileYield_1 = require("@civ-clone/civ1-world/lib/governmentTileYield");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const Yield_1 = require("@civ-clone/core-city/Rules/Yield");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const TileImprovements_1 = require("@civ-clone/civ1-world/TileImprovements");
const Priority_1 = require("@civ-clone/core-rule/Priority");
const cityStatus_1 = require("../../lib/cityStatus");
// The providers of what the government and pollution did to a square, which a celebrating city works out again.
const governmentSteps = [governmentTileYield_1.DESPOTISM_PENALTY, governmentTileYield_1.TRADE_BONUS, TileImprovements_1.Pollution.name];
const getRules = (pendingEffects = core_pending_effect_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance) => [
    // A celebrating city's squares escape the Anarchy and Despotism penalty, and under Monarchy and Communism get The
    //  Republic's trade bonus (v474.05 `CityWorker.cs` L4102-4134, civ-clone/web-renderer#401). A square's own yields
    //  are worked out for a city that isn't celebrating, as they're kept per player, so this adds the difference: what
    //  the square yields before the government's steps, through them again as a celebrating city, then pollution. After
    //  the worked squares, and before trade routes and corruption, which count it.
    new Yield_1.default('civ1-city-happiness:city/yield/celebration', new Priority_1.default(1), new Criterion_1.default((city) => (0, cityStatus_1.leaderCelebration)(city, pendingEffects) !== null), new Effect_1.default((city) => {
        let government;
        try {
            government = playerGovernmentRegistry.getByPlayer(city.player());
        }
        catch (e) {
            return [];
        }
        return city
            .tilesWorked()
            .entries()
            .flatMap((tile) => {
            const tileYields = tile.yields(city.player()), polluted = tileImprovementRegistry
                .getByTile(tile)
                .some((improvement) => improvement instanceof TileImprovements_1.Pollution);
            return governmentTileYield_1.governmentTileYieldTypes.flatMap((YieldType) => {
                const ofType = tileYields.filter((tileYield) => tileYield instanceof YieldType), current = ofType.reduce((total, tileYield) => total + tileYield.value(), 0), before = ofType
                    .flatMap((tileYield) => tileYield.values())
                    .filter(([, provider]) => !governmentSteps.includes(provider))
                    .reduce((total, [value]) => total + value, 0), celebrating = (0, governmentTileYield_1.governmentTileYield)(YieldType, before, government, true), value = polluted ? Math.ceil(celebrating / 2) : celebrating;
                if (value === current) {
                    return [];
                }
                return [
                    new YieldType(value - current, `${tile.id()}: celebration`),
                ];
            });
        });
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=celebration-yield.js.map