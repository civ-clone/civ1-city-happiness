import { Democracy, Republic } from '@civ-clone/civ1-government/Governments';
import AvailableGovernmentRegistry from '@civ-clone/core-government/AvailableGovernmentRegistry';
import CityBuildRegistry from '@civ-clone/core-city-build/CityBuildRegistry';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CityImprovementRegistry from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import PlayerGovernmentRegistry from '@civ-clone/core-government/PlayerGovernmentRegistry';
import PlayerResearchRegistry from '@civ-clone/core-science/PlayerResearchRegistry';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { Unhappiness } from '../Yields';
import {
  Bomber,
  Caravan,
  Diplomat,
  Transport,
  Trireme,
  Warrior,
} from '@civ-clone/civ1-unit/Units';
import Unit from '@civ-clone/core-unit/Unit';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';
import cityCost from '../Rules/City/cost';
import cityCreated from '@civ-clone/civ1-city/Rules/City/created';
import cityYield from '../Rules/City/yield';
import { expect } from 'chai';
import playerAdded from '@civ-clone/civ1-government/Rules/Player/added';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';
import setUpCity from '@civ-clone/civ1-city/tests/lib/setUpCity';
import unitYield from '@civ-clone/civ1-unit/Rules/Unit/yield';

describe('city:yield', (): void => {
  const ruleRegistry = new RuleRegistry(),
    availableGovernmentRegistry = new AvailableGovernmentRegistry(),
    tileImprovementRegistry = new TileImprovementRegistry(),
    cityGrowthRegistry = new CityGrowthRegistry(),
    cityImprovementRegistry = new CityImprovementRegistry(),
    playerGovernmentRegistry = new PlayerGovernmentRegistry(),
    playerResearchRegistry = new PlayerResearchRegistry(),
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
    ...cityYield(cityGrowthRegistry, playerGovernmentRegistry, unitRegistry),
    // Martial law uses units that can attack.
    ...unitYield(undefined, ruleRegistry),
    ...cityCost(
      ruleRegistry,
      cityGrowthRegistry,
      cityImprovementRegistry,
      playerGovernmentRegistry,
      playerResearchRegistry,
      unitRegistry
    )
  );

  availableGovernmentRegistry.register(Republic);

  it('should produce Unhappiness in a city with a size of 6 or more ', async (): Promise<void> => {
    const city = await setUpCity({
      size: 6,
      ruleRegistry,
      playerWorldRegistry,
      cityGrowthRegistry,
      tileImprovementRegistry,
    });

    expect(reduceYield(city.yields(), Unhappiness)).to.equal(1);
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
      tile = city.tile();

    expect(reduceYield(city.yields(), Unhappiness)).to.equal(1);

    unitRegistry.register(new Warrior(city, player, tile, ruleRegistry));

    expect(reduceYield(city.yields(), Unhappiness)).to.equal(0);
  });

  it('should eradicate Unhappiness by martial law for up to 3 units', async (): Promise<void> => {
    const city = await setUpCity({
        size: 10,
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        tileImprovementRegistry,
      }),
      player = city.player(),
      tile = city.tile();

    expect(reduceYield(city.yields(), Unhappiness)).to.equal(5);

    for (let i = 0; i < 5; i++) {
      unitRegistry.register(new Warrior(city, player, tile, ruleRegistry));
    }

    expect(reduceYield(city.yields(), Unhappiness)).to.equal(2);
  });

  it('should cause Unhappiness when a supported unit with an attack is outside of the city', async (): Promise<void> => {
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

    expect(reduceYield(city.yields(), Unhappiness)).equal(0);

    const unit = new Warrior(city, player, unitTile, ruleRegistry);

    unitRegistry.register(unit);

    expect(reduceYield(city.yields(), Unhappiness)).to.equal(1);

    unit.setTile(city.tile());

    expect(reduceYield(city.yields(), Unhappiness)).to.equal(0);

    playerGovernment.set(new Democracy());

    expect(reduceYield(city.yields(), Unhappiness)).to.equal(0);

    unit.setTile(unitTile);

    expect(reduceYield(city.yields(), Unhappiness)).to.equal(2);
  });

  (
    [
      // Aircraft cause it even at home.
      [Bomber, true, 1, 2],
      [Bomber, false, 1, 2],
      [Trireme, false, 1, 2],
      [Trireme, true, 0, 0],
      // Unarmed units never do.
      [Transport, false, 0, 0],
      [Caravan, false, 0, 0],
      [Diplomat, false, 0, 0],
    ] as [typeof Unit, boolean, number, number][]
  ).forEach(([UnitType, atHome, republic, democracy]): void => {
    it(`should cause ${republic} Unhappiness under the Republic and ${democracy} under Democracy for a ${
      UnitType.name
    } ${
      atHome ? 'in' : 'away from'
    } its home city`, async (): Promise<void> => {
      const city = await setUpCity({
          ruleRegistry,
          playerWorldRegistry,
          cityGrowthRegistry,
          tileImprovementRegistry,
        }),
        player = city.player(),
        playerGovernment = playerGovernmentRegistry.getByPlayer(player);

      unitRegistry.register(
        new UnitType(
          city,
          player,
          atHome ? city.tile() : city.tile().getNeighbour('e'),
          ruleRegistry
        )
      );

      playerGovernment.set(new Republic());

      expect(reduceYield(city.yields(), Unhappiness)).to.equal(republic);

      playerGovernment.set(new Democracy());

      expect(reduceYield(city.yields(), Unhappiness)).to.equal(democracy);
    });
  });
});
