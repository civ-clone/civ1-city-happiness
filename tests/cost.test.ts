import { Happiness, Luxuries } from '../Yields';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import Effect from '@civ-clone/core-rule/Effect';
import PlayerGovernmentRegistry from '@civ-clone/core-government/PlayerGovernmentRegistry';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';
import Yield from '@civ-clone/core-yield/Yield';
import YieldRule from '@civ-clone/core-city/Rules/Yield';
import cityYield from '../Rules/City/yield';
import { expect } from 'chai';
import setUpCity from '@civ-clone/civ1-city/tests/lib/setUpCity';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';
import cost from '../Rules/City/cost';
import CityImprovementRegistry from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import PlayerResearchRegistry from '@civ-clone/core-science/PlayerResearchRegistry';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';

describe('city:cost', (): void => {
  const tileImprovementRegistry = new TileImprovementRegistry(),
    cityGrowthRegistry = new CityGrowthRegistry(),
    cityImprovementRegistry = new CityImprovementRegistry(),
    playerGovernmentRegistry = new PlayerGovernmentRegistry(),
    playerResearchRegistry = new PlayerResearchRegistry(),
    playerWorldRegistry = new PlayerWorldRegistry(),
    unitRegistry = new UnitRegistry();

  (
    [
      [1, 0],
      [2, 1],
      [3, 1],
    ] as [number, number][]
  ).forEach(([luxuries, happiness]) =>
    it(`should provide ${happiness} Happiness for ${luxuries} Luxuries yield`, async (): Promise<void> => {
      const ruleRegistry = new RuleRegistry(),
        city = await setUpCity({
          size: 2,
          ruleRegistry,
          playerWorldRegistry,
          cityGrowthRegistry,
          tileImprovementRegistry,
        });

      playerGovernmentRegistry.register(new PlayerGovernment(city.player()));

      ruleRegistry.register(
        ...cityYield(
          cityGrowthRegistry,
          playerGovernmentRegistry,
          unitRegistry
        ),
        ...cost(
          ruleRegistry,
          cityGrowthRegistry,
          cityImprovementRegistry,
          playerGovernmentRegistry,
          playerResearchRegistry,
          unitRegistry
        ),
        new YieldRule(new Effect(() => new Luxuries(luxuries)))
      );

      expect(reduceYield(city.yields(), Happiness)).equal(happiness);
    })
  );
});
