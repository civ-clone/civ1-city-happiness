import CityBuildRegistry from '@civ-clone/core-city-build/CityBuildRegistry';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import PlayerGovernmentRegistry from '@civ-clone/core-government/PlayerGovernmentRegistry';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import TerrainFeatureRegistry from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { Unhappiness } from '../Yields';
import Unit from '@civ-clone/core-unit/Unit';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';
import Yield from '@civ-clone/core-yield/Yield';
import added from '@civ-clone/civ1-government/Rules/Player/added';
import cityYield from '../Rules/City/yield';
import cost from '../Rules/City/cost';
import created from '@civ-clone/civ1-city/Rules/City/created';
import { expect } from 'chai';
import setUpCity from '@civ-clone/civ1-city/tests/lib/setUpCity';
import { Fortifiable } from '@civ-clone/civ1-unit/Types';

describe('city:yield', (): void => {
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
    ...added(playerGovernmentRegistry, ruleRegistry),
    ...created(
      tileImprovementRegistry,
      cityBuildRegistry,
      cityGrowthRegistry,
      cityRegistry,
      playerWorldRegistry,
      ruleRegistry
    ),
    ...cityYield(ruleRegistry, cityGrowthRegistry),
    ...cost(playerGovernmentRegistry, unitRegistry)
  );

  it('should produce Unhappiness in a city with a size of 6 or more ', (): void => {
    const city = setUpCity({
        size: 6,
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        terrainFeatureRegistry,
        tileImprovementRegistry,
      }),
      [unhappiness] = city
        .yields([Unhappiness])
        .filter(
          (cityYield: Yield): boolean => cityYield instanceof Unhappiness
        );

    expect(unhappiness.value()).to.equal(1);
  });

  it('should eradicate Unhappiness by martial law', (): void => {
    const city = setUpCity({
        size: 6,
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        terrainFeatureRegistry,
        tileImprovementRegistry,
      }),
      player = city.player(),
      tile = city.tile(),
      [unhappiness] = city
        .yields([Unhappiness])
        .filter(
          (cityYield: Yield): boolean => cityYield instanceof Unhappiness
        );

    expect(unhappiness.value()).to.equal(1);

    unitRegistry.register(new Fortifiable(city, player, tile, ruleRegistry));

    const [updatedUnhappiness] = city
      .yields([Unhappiness])
      .filter((cityYield: Yield): boolean => cityYield instanceof Unhappiness);

    expect(updatedUnhappiness.value()).to.equal(0);
  });

  it('should eradicate Unhappiness by martial law for up to 4 units', (): void => {
    const city = setUpCity({
        size: 10,
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        terrainFeatureRegistry,
        tileImprovementRegistry,
      }),
      player = city.player(),
      tile = city.tile(),
      [unhappiness] = city
        .yields([Unhappiness])
        .filter(
          (cityYield: Yield): boolean => cityYield instanceof Unhappiness
        );

    expect(unhappiness.value()).to.equal(5);

    for (let i = 0; i < 5; i++) {
      unitRegistry.register(new Fortifiable(city, player, tile, ruleRegistry));
    }

    const [updatedUnhappiness] = city
      .yields([Unhappiness])
      .filter((cityYield: Yield): boolean => cityYield instanceof Unhappiness);
    expect(updatedUnhappiness.value()).to.equal(1);
  });
});
