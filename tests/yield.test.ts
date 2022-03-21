import { Democracy, Republic } from '@civ-clone/civ1-government/Governments';
import AvailableGovernmentRegistry from '@civ-clone/core-government/AvailableGovernmentRegistry';
import CityBuildRegistry from '@civ-clone/core-city-build/CityBuildRegistry';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import { Fortifiable } from '@civ-clone/civ1-unit/Types';
import PlayerGovernmentRegistry from '@civ-clone/core-government/PlayerGovernmentRegistry';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { Unhappiness } from '../Yields';
import Unit from '@civ-clone/core-unit/Unit';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';
import Yield from '@civ-clone/core-yield/Yield';
import cityCost from '../Rules/City/cost';
import cityCreated from '@civ-clone/civ1-city/Rules/City/created';
import cityYield from '../Rules/City/yield';
import { expect } from 'chai';
import playerAdded from '@civ-clone/civ1-government/Rules/Player/added';
import setUpCity from '@civ-clone/civ1-city/tests/lib/setUpCity';

describe('city:yield', (): void => {
  const ruleRegistry = new RuleRegistry(),
    availableGovernmentRegistry = new AvailableGovernmentRegistry(),
    tileImprovementRegistry = new TileImprovementRegistry(),
    cityGrowthRegistry = new CityGrowthRegistry(),
    playerGovernmentRegistry = new PlayerGovernmentRegistry(),
    playerWorldRegistry = new PlayerWorldRegistry(),
    unitRegistry = new UnitRegistry(),
    cityBuildRegistry = new CityBuildRegistry(),
    cityRegistry = new CityRegistry();

  ruleRegistry.register(
    ...playerAdded(
      availableGovernmentRegistry,
      playerGovernmentRegistry,
      ruleRegistry
    ),
    ...cityCreated(
      tileImprovementRegistry,
      cityBuildRegistry,
      cityGrowthRegistry,
      cityRegistry,
      playerWorldRegistry,
      ruleRegistry
    ),
    ...cityYield(ruleRegistry, cityGrowthRegistry),
    ...cityCost(playerGovernmentRegistry, unitRegistry)
  );

  availableGovernmentRegistry.register(Republic);

  it('should produce Unhappiness in a city with a size of 6 or more ', async (): Promise<void> => {
    const city = await setUpCity({
        size: 6,
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        tileImprovementRegistry,
      }),
      [unhappiness] = city
        .yields([Unhappiness])
        .filter(
          (cityYield: Yield): boolean => cityYield instanceof Unhappiness
        );

    expect(unhappiness.value()).to.equal(1);
  });

  it('should eradicate Unhappiness by martial law', async (): Promise<void> => {
    const city = await setUpCity({
        size: 6,
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
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

  it('should eradicate Unhappiness by martial law for up to 4 units', async (): Promise<void> => {
    const city = await setUpCity({
        size: 10,
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
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

  it('should cause Unhappiness when a supported Fortifiable, Air, or Naval unit is outside of the city', async (): Promise<void> => {
    const city = await setUpCity({
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        tileImprovementRegistry,
      }),
      player = city.player(),
      tile = city.tile(),
      unitTile = tile.getNeighbour('e'),
      playerGovernment = playerGovernmentRegistry.getByPlayer(player);

    playerGovernment.set(new Republic());

    const [unhappiness] = city
      .yields([Unhappiness])
      .filter((cityYield: Yield): boolean => cityYield instanceof Unhappiness);

    expect(unhappiness.value()).to.equal(0);

    const unit = new Fortifiable(city, player, unitTile, ruleRegistry);

    unitRegistry.register(unit);

    const [republicHappiness] = city
      .yields([Unhappiness])
      .filter((cityYield: Yield): boolean => cityYield instanceof Unhappiness);
    expect(republicHappiness.value()).to.equal(1);

    unit.setTile(city.tile());

    const [updatedRepublicHappiness] = city
      .yields([Unhappiness])
      .filter((cityYield: Yield): boolean => cityYield instanceof Unhappiness);
    expect(updatedRepublicHappiness.value()).to.equal(0);

    playerGovernment.set(new Democracy());

    const [democracyHappiness] = city
      .yields([Unhappiness])
      .filter((cityYield: Yield): boolean => cityYield instanceof Unhappiness);
    expect(democracyHappiness.value()).to.equal(0);

    unit.setTile(unitTile);

    const [updatedDemocracyHappiness] = city
      .yields([Unhappiness])
      .filter((cityYield: Yield): boolean => cityYield instanceof Unhappiness);
    expect(updatedDemocracyHappiness.value()).to.equal(2);
  });
});
