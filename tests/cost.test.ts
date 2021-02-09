import { Happiness } from '../Yields';
import { Luxuries } from '@civ-clone/base-city-yield-luxuries/Luxuries';
import CityBuildRegistry from '@civ-clone/core-city-build/CityBuildRegistry';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import PlayerGovernmentRegistry from '@civ-clone/core-government/PlayerGovernmentRegistry';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import TerrainFeatureRegistry from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';
import Yield from '@civ-clone/core-yield/Yield';
import cost from '../Rules/City/cost';
import created from '@civ-clone/civ1-city/Rules/City/created';
import { expect } from 'chai';
import setUpCity from '@civ-clone/civ1-city/tests/lib/setUpCity';

describe('city:cost', (): void => {
  const ruleRegistry = new RuleRegistry(),
    terrainFeatureRegistry = new TerrainFeatureRegistry(),
    tileImprovementRegistry = new TileImprovementRegistry(),
    cityGrowthRegistry = new CityGrowthRegistry(),
    playerGovernmentRegistry = new PlayerGovernmentRegistry(),
    playerWorldRegistry = new PlayerWorldRegistry(),
    unitRegistry = new UnitRegistry(),
    cityBuildRegistry = new CityBuildRegistry(),
    cityRegistry = new CityRegistry();

  ruleRegistry.register(
    ...created(
      tileImprovementRegistry,
      cityBuildRegistry,
      cityGrowthRegistry,
      cityRegistry,
      playerWorldRegistry,
      ruleRegistry
    ),
    ...cost(playerGovernmentRegistry, unitRegistry)
  );

  it('should not provide Happiness for 1 Luxuries yield', (): void => {
    const city = setUpCity({
        size: 2,
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        terrainFeatureRegistry,
        tileImprovementRegistry,
      }),
      tile = city.tile();

    tile.yields = (): Yield[] => [new Luxuries(1), new Happiness(0)];

    const [happiness] = city
      .yields([Luxuries, Happiness])
      .filter((cityYield: Yield): boolean => cityYield instanceof Happiness);
    expect(happiness.value()).to.equal(0);
  });

  it('should provide 1 Happiness for 2 Luxuries yields', (): void => {
    const city = setUpCity({
        size: 2,
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        terrainFeatureRegistry,
        tileImprovementRegistry,
      }),
      tile = city.tile();

    tile.yields = (): Yield[] => [new Luxuries(2), new Happiness(0)];

    const [happiness] = city
      .yields([Luxuries, Happiness])
      .filter((cityYield: Yield): boolean => cityYield instanceof Happiness);

    expect(happiness.value()).to.equal(1);
  });

  it('should provide 1 Happiness for 3 Luxuries yields', (): void => {
    const city = setUpCity({
        size: 2,
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        terrainFeatureRegistry,
        tileImprovementRegistry,
      }),
      tile = city.tile();

    tile.yields = (): Yield[] => [new Luxuries(3), new Happiness(0)];

    const [happiness] = city
      .yields([Luxuries, Happiness])
      .filter((cityYield: Yield): boolean => cityYield instanceof Happiness);

    expect(happiness.value()).to.equal(1);
  });
});
