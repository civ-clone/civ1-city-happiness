import {
  Cathedral,
  Colosseum,
  Temple,
} from '@civ-clone/civ1-city-improvement/CityImprovements';
import { Happiness, Luxuries } from '../Yields';
import Advance from '@civ-clone/core-science/Advance';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import CityImprovementRegistry from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import Effect from '@civ-clone/core-rule/Effect';
import { Mysticism } from '@civ-clone/civ1-science/Advances';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import PlayerGovernmentRegistry from '@civ-clone/core-government/PlayerGovernmentRegistry';
import PlayerResearchRegistry from '@civ-clone/core-science/PlayerResearchRegistry';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Unhappiness from '@civ-clone/base-city-yield-unhappiness/Unhappiness';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';
import YieldRule from '@civ-clone/core-city/Rules/Yield';
import cityYield from '../Rules/City/yield';
import cost from '../Rules/City/cost';
import { expect } from 'chai';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';
import setUpCity from '@civ-clone/civ1-city/tests/lib/setUpCity';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import AdvanceRegistry from '@civ-clone/core-science/AdvanceRegistry';

describe('city:cost', (): void => {
  const tileImprovementRegistry = new TileImprovementRegistry(),
    cityGrowthRegistry = new CityGrowthRegistry(),
    cityImprovementRegistry = new CityImprovementRegistry(),
    playerGovernmentRegistry = new PlayerGovernmentRegistry(),
    playerResearchRegistry = new PlayerResearchRegistry(),
    playerWorldRegistry = new PlayerWorldRegistry(),
    unitRegistry = new UnitRegistry(),
    advanceRegistry = new AdvanceRegistry();

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

  (
    [
      [Temple, 1],
      [Temple, 2, Mysticism],
      [Colosseum, 3],
      [Cathedral, 4],
    ] as [typeof CityImprovement, number, ...typeof Advance[]][]
  ).forEach(([CityImprovementType, expectedReduction, ...advances]) =>
    it(`should reduce Unhappiness by ${expectedReduction} when city contains ${CityImprovementType.name}`, async (): Promise<void> => {
      const ruleRegistry = new RuleRegistry(),
        city = await setUpCity({
          size: 2,
          ruleRegistry,
          playerWorldRegistry,
          cityGrowthRegistry,
          tileImprovementRegistry,
        }),
        playerResearch = new PlayerResearch(
          city.player(),
          advanceRegistry,
          ruleRegistry
        );

      playerResearchRegistry.register(playerResearch);

      advances.forEach((AdvanceType) => playerResearch.addAdvance(AdvanceType));

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
        new YieldRule(new Effect(() => new Unhappiness(8)))
      );

      expect(reduceYield(city.yields(), Unhappiness)).equal(8);

      cityImprovementRegistry.register(
        new CityImprovementType(city, ruleRegistry)
      );

      expect(reduceYield(city.yields(), Unhappiness)).equal(
        8 - expectedReduction
      );
    })
  );
});
