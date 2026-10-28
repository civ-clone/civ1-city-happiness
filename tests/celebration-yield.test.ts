import {
  DESPOTISM_PENALTY,
  TRADE_BONUS,
} from '@civ-clone/civ1-world/lib/governmentTileYield';
import {
  Despotism,
  Monarchy,
  Republic,
} from '@civ-clone/civ1-government/Governments';
import { Food, Trade } from '@civ-clone/civ1-world/Yields';
import {
  PendingEffect,
  PendingEffectRegistry,
} from '@civ-clone/core-pending-effect';
import AvailableGovernmentRegistry from '@civ-clone/core-government/AvailableGovernmentRegistry';
import City from '@civ-clone/core-city/City';
import CityYield from '@civ-clone/core-city/Rules/Yield';
import Government from '@civ-clone/core-government/Government';
import { LEADER_CELEBRATION } from '../lib/cityStatus';
import Player from '@civ-clone/core-player/Player';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import PlayerGovernmentRegistry from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { Pollution } from '@civ-clone/civ1-world/TileImprovements';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Yield from '@civ-clone/core-yield/Yield';
import celebrationYield from '../Rules/City/celebration-yield';
import { expect } from 'chai';

// civ-clone/web-renderer#401: a square's own yields are worked out for a city that isn't celebrating (civ1-world's tile
//  modifiers); a celebrating city adds the difference v474.05's steps give it.
describe('city:yield:celebration', (): void => {
  const setUp = (
    GovernmentType: typeof Government,
    tileYields: Yield[],
    { celebrating = true, polluted = false } = {}
  ): Yield[] => {
    const ruleRegistry = new RuleRegistry(),
      pendingEffects = new PendingEffectRegistry(),
      playerGovernmentRegistry = new PlayerGovernmentRegistry(),
      player = new Player(ruleRegistry),
      playerGovernment = new PlayerGovernment(
        player,
        new AvailableGovernmentRegistry(),
        ruleRegistry
      ),
      tile = {
        id: () => 'tile',
        yields: () => tileYields,
      },
      city = {
        player: () => player,
        tilesWorked: () => ({ entries: () => [tile] }),
      } as unknown as City,
      // Only `getByTile` is read, and only for `instanceof Pollution`.
      tileImprovementRegistry = {
        getByTile: () => (polluted ? [Object.create(Pollution.prototype)] : []),
      } as unknown as TileImprovementRegistry;

    playerGovernmentRegistry.register(playerGovernment);
    playerGovernment.set(new GovernmentType());

    if (celebrating) {
      pendingEffects.register(new PendingEffect(LEADER_CELEBRATION, city));
    }

    ruleRegistry.register(
      ...celebrationYield(
        pendingEffects,
        playerGovernmentRegistry,
        tileImprovementRegistry
      )
    );

    return ruleRegistry.process(CityYield, city, []).flat() as Yield[];
  };

  const total = (yields: Yield[], YieldType: typeof Yield): number =>
    yields
      .filter((cityYield) => cityYield instanceof YieldType)
      .reduce((sum, cityYield) => sum + cityYield.value(), 0);

  it('gives back the Despotism penalty to a celebrating city', (): void => {
    // Irrigated Grassland: 3 food, 2 under Despotism.
    const yields = setUp(Despotism, [
      new Food(2, 'Grassland'),
      new Food(1, 'Irrigation'),
      new Food(-1, DESPOTISM_PENALTY),
    ]);

    expect(total(yields, Food)).to.equal(1);
  });

  it('adds nothing for a city that is not celebrating', (): void => {
    const yields = setUp(
      Despotism,
      [
        new Food(2, 'Grassland'),
        new Food(1, 'Irrigation'),
        new Food(-1, DESPOTISM_PENALTY),
      ],
      { celebrating: false }
    );

    expect(yields).to.be.empty;
  });

  it('gives a celebrating Monarchy city +1 trade on a square with trade', (): void => {
    const yields = setUp(Monarchy, [
      new Food(1, 'Ocean'),
      new Trade(2, 'Ocean'),
    ]);

    expect(total(yields, Trade)).to.equal(1);
    expect(total(yields, Food)).to.equal(0);
  });

  it('gives a celebrating Monarchy city nothing on a square with no trade', (): void => {
    const yields = setUp(Monarchy, [new Food(2, 'Grassland')]);

    expect(yields).to.be.empty;
  });

  it('gives a celebrating Republic city no second trade bonus', (): void => {
    const yields = setUp(Republic, [
      new Trade(2, 'Ocean'),
      new Trade(1, TRADE_BONUS),
    ]);

    expect(yields).to.be.empty;
  });

  it('halves the celebrating value for a polluted square, as pollution comes last', (): void => {
    // Irrigated Grassland, polluted: 3 → 2 (Despotism) → 1; celebrating, 3 → 2.
    const yields = setUp(
      Despotism,
      [
        new Food(2, 'Grassland'),
        new Food(1, 'Irrigation'),
        new Food(-1, DESPOTISM_PENALTY),
        new Food(-1, Pollution.name),
      ],
      { polluted: true }
    );

    expect(total(yields, Food)).to.equal(1);
  });

  it('works out a polluted Monarchy square the same way', (): void => {
    // Ocean, polluted: 2 trade → 1; celebrating, 3 → 2.
    const yields = setUp(
      Monarchy,
      [new Trade(2, 'Ocean'), new Trade(-1, Pollution.name)],
      { polluted: true }
    );

    expect(total(yields, Trade)).to.equal(1);
  });
});
