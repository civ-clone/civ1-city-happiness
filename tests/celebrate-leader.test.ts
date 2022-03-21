import { Happiness, Unhappiness } from '../Yields';
import CelebrateLeader from '@civ-clone/core-city-happiness/Rules/CelebrateLeader';
import CityBuildRegistry from '@civ-clone/core-city-build/CityBuildRegistry';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Yield from '@civ-clone/core-yield/Yield';
import cityCelebrateLeader from '../Rules/City/celebrate-leader';
import cityCreated from '@civ-clone/civ1-city/Rules/City/created';
import { expect } from 'chai';
import setUpCity from '@civ-clone/civ1-city/tests/lib/setUpCity';

describe('city:celebrate-leader', (): void => {
  const ruleRegistry = new RuleRegistry(),
    tileImprovementRegistry = new TileImprovementRegistry(),
    cityBuildRegistry = new CityBuildRegistry(),
    cityGrowthRegistry = new CityGrowthRegistry(),
    cityRegistry = new CityRegistry(),
    playerWorldRegistry = new PlayerWorldRegistry();

  ruleRegistry.register(
    ...cityCelebrateLeader(cityGrowthRegistry),
    ...cityCreated(
      tileImprovementRegistry,
      cityBuildRegistry,
      cityGrowthRegistry,
      cityRegistry,
      playerWorldRegistry,
      ruleRegistry
    )
  );

  it('should trigger leader celebration when half or more citizens are happy and there is no unhappiness and the city size is greater than 2', async (): Promise<void> => {
    const city = await setUpCity({
      size: 4,
      ruleRegistry,
      playerWorldRegistry,
      cityGrowthRegistry,
      tileImprovementRegistry,
    });

    city.yields = (): Yield[] => [new Happiness(2)];

    expect(
      ruleRegistry
        .get(CelebrateLeader)
        .some((rule: CelebrateLeader): boolean => rule.validate(city))
    ).to.true;
  });

  it('should not trigger leader celebration when half or more citizens are happy if any unhappiness', async (): Promise<void> => {
    const city = await setUpCity({
      size: 6,
      ruleRegistry,
      playerWorldRegistry,
      cityGrowthRegistry,
      tileImprovementRegistry,
    });

    city.yields = (): Yield[] => [new Happiness(5), new Unhappiness(1)];

    expect(
      ruleRegistry
        .get(CelebrateLeader)
        .some((rule: CelebrateLeader): boolean => rule.validate(city))
    ).to.false;
  });

  it('should not trigger leader celebration when city size is < 3', async (): Promise<void> => {
    const city = await setUpCity({
      size: 2,
      ruleRegistry,
      playerWorldRegistry,
      cityGrowthRegistry,
      tileImprovementRegistry,
    });

    city.yields = (): Yield[] => [new Happiness(3), new Unhappiness(0)];

    expect(
      ruleRegistry
        .get(CelebrateLeader)
        .some((rule: CelebrateLeader): boolean => rule.validate(city))
    ).to.false;
  });

  it('should not trigger leader celebration when happiness is less than half the city size', async (): Promise<void> => {
    const city = await setUpCity({
      size: 3,
      ruleRegistry,
      playerWorldRegistry,
      cityGrowthRegistry,
      tileImprovementRegistry,
    });

    city.yields = (): Yield[] => [new Happiness(1), new Unhappiness(0)];

    expect(
      ruleRegistry
        .get(CelebrateLeader)
        .some((rule: CelebrateLeader): boolean => rule.validate(city))
    ).to.false;
  });
});
