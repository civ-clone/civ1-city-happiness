import {
  Chieftain,
  Emperor,
  King,
  Prince,
  Warlord,
} from '@civ-clone/civ1-difficulty/Difficulties';
import {
  Democracy,
  Despotism,
  Republic,
} from '@civ-clone/civ1-government/Governments';
import AIClient from '@civ-clone/core-ai-client/AIClient';
import City from '@civ-clone/core-city/City';
import { Grassland } from '@civ-clone/civ1-world/Terrains';
import {
  generateGenerator,
  generateWorld,
} from '@civ-clone/core-world/tests/lib/buildWorld';
import Client from '@civ-clone/core-client/Client';
import ClientRegistry from '@civ-clone/core-client/ClientRegistry';
import GameDifficultyRegistry from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import Player from '@civ-clone/core-player/Player';
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
import setUpCity, {
  setUpCityOptions,
} from '@civ-clone/civ1-city/tests/lib/setUpCity';
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
    cityRegistry = new CityRegistry(),
    clientRegistry = new ClientRegistry(),
    gameDifficultyRegistry = new GameDifficultyRegistry(),
    // The human player's city, as the tests below were written against Warlord's 5 content citizens.
    setUpHumanCity = async (options: setUpCityOptions = {}) => {
      const city = await setUpCity(options);

      if (clientRegistry.getBy('player', city.player()).length === 0) {
        clientRegistry.register(new Client(city.player()));
      }

      return city;
    };

  gameDifficultyRegistry.set(Warlord);

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
    ...cityYield(
      cityGrowthRegistry,
      playerGovernmentRegistry,
      unitRegistry,
      cityRegistry,
      gameDifficultyRegistry,
      clientRegistry
    ),
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
    const city = await setUpHumanCity({
      size: 6,
      ruleRegistry,
      playerWorldRegistry,
      cityGrowthRegistry,
      tileImprovementRegistry,
    });

    expect(reduceYield(city.yields(), Unhappiness)).to.equal(1);
  });

  it('should eradicate Unhappiness by martial law', async (): Promise<void> => {
    const city = await setUpHumanCity({
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
    const city = await setUpHumanCity({
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
    const city = await setUpHumanCity({
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
      const city = await setUpHumanCity({
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
  describe('the difficulty level', (): void => {
    const unhappyAt = async (
      Level: typeof Warlord,
      human: boolean
    ): Promise<number> => {
      gameDifficultyRegistry.set(Level);

      const city = await setUpCity({
        size: 6,
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        tileImprovementRegistry,
      });

      clientRegistry.register(
        human ? new Client(city.player()) : new AIClient(city.player())
      );

      return reduceYield(city.yields(), Unhappiness);
    };

    afterEach((): void => gameDifficultyRegistry.set(Warlord));

    it('should make 0 to 4 of a size 6 human city unhappy, Chieftain to Emperor', async (): Promise<void> => {
      const unhappy: number[] = [];

      for (const Level of [Chieftain, Warlord, Prince, King, Emperor]) {
        unhappy.push(await unhappyAt(Level, true));
      }

      expect(unhappy).eql([0, 1, 2, 3, 4]);
    });

    it('should leave 3 citizens content in a computer player city at every level', async (): Promise<void> => {
      const unhappy: number[] = [];

      for (const Level of [Chieftain, Warlord, Prince, King, Emperor]) {
        unhappy.push(await unhappyAt(Level, false));
      }

      expect(unhappy).eql([3, 3, 3, 3, 3]);
    });

    // Prince under Despotism: E = 2 × (7 - 2) = 10 cities. Each city is size 4, and Prince leaves 4 content, so any
    //  unhappy citizen is the empire's. Its own registries, so the cities' numbers are the order they're founded in.
    const empire = async (
      founders: ('human' | 'computer')[]
    ): Promise<{ human: City[]; unhappy: () => number[] }> => {
      const empireRules = new RuleRegistry(),
        empireCities = new CityRegistry(),
        empireGrowth = new CityGrowthRegistry(),
        empireGovernments = new PlayerGovernmentRegistry(),
        empireWorlds = new PlayerWorldRegistry(),
        empireClients = new ClientRegistry(),
        empireDifficulty = new GameDifficultyRegistry(),
        empireTileImprovements = new TileImprovementRegistry(),
        governments = new AvailableGovernmentRegistry(),
        world = await generateWorld(
          // A city every 5 tiles, so their areas don't overlap.
          generateGenerator(25, 25, Grassland),
          empireRules
        ),
        humanCities: City[] = [];

      governments.register(Despotism);
      empireDifficulty.set(Prince);
      empireRules.register(
        ...playerAdded(governments, empireGovernments, empireRules),
        ...cityCreated(
          empireTileImprovements,
          new CityBuildRegistry(),
          empireGrowth,
          empireCities,
          empireWorlds,
          empireRules
        ),
        ...cityYield(
          empireGrowth,
          empireGovernments,
          new UnitRegistry(),
          empireCities,
          empireDifficulty,
          empireClients
        )
      );

      // After the rules, which give each player a government as it's created.
      const human = new Player(empireRules),
        computer = new Player(empireRules);

      empireClients.register(new Client(human), new AIClient(computer));

      for (const [i, founder] of founders.entries()) {
        const player = founder === 'human' ? human : computer,
          city = await setUpCity({
            size: 4,
            player,
            world,
            tile: world.get(2 + (i % 5) * 5, 2 + Math.floor(i / 5) * 5),
            ruleRegistry: empireRules,
            playerWorldRegistry: empireWorlds,
            cityGrowthRegistry: empireGrowth,
            tileImprovementRegistry: empireTileImprovements,
          });

        empireGovernments.getByPlayer(player).set(new Despotism());

        if (founder === 'human') {
          humanCities.push(city);
        }
      }

      return {
        human: humanCities,
        unhappy: () =>
          humanCities.map((city) => reduceYield(city.yields(), Unhappiness)),
      };
    };

    it("should make one more citizen unhappy in one of the human's cities once there are more than 10, on Prince", async (): Promise<void> => {
      const { human, unhappy } = await empire(new Array(11).fill('human'));

      // Cities 0 to 10: (9 % 10 + 11 - 10) / 10 = 1, and only city 9 reaches it.
      expect(unhappy()).eql([0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]);

      human.pop()!.destroy();

      expect(unhappy()).eql([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    });

    // As Civ1 numbers them, across every civilization's cities (Copilot on #8).
    it("should number the human's cities among everyone's", async (): Promise<void> => {
      const interleaved = (count: number) =>
          new Array(count * 2 - 1)
            .fill(null)
            .map((value, i): 'human' | 'computer' =>
              i % 2 === 0 ? 'human' : 'computer'
            ),
        eleven = await empire(interleaved(11));

      // The human's cities are numbers 0, 2, ... 20, so none is 9 more than a multiple of 10: 11 cities add nobody.
      expect(eleven.unhappy()).eql([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

      const twelve = await empire(interleaved(12));

      // With 12, a number 8 more than a multiple of 10 is enough: cities 8 and 18.
      expect(twelve.unhappy()).eql([0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0]);
    });

    it('should not add the empire-size citizen in a computer player city', async (): Promise<void> => {
      gameDifficultyRegistry.set(Emperor);

      const player = new Player(ruleRegistry),
        cities: City[] = [];

      clientRegistry.register(new AIClient(player));

      for (let i = 0; i < 8; i++) {
        cities.push(
          await setUpCity({
            size: 4,
            player,
            // One world for all of them, a city to a tile.
            world: cities[0]?.tile().map(),
            tile: cities[0]
              ?.tile()
              .map()
              .get(i % 5, Math.floor(i / 5)),
            ruleRegistry,
            playerWorldRegistry,
            cityGrowthRegistry,
            tileImprovementRegistry,
          })
        );
      }

      expect(cities.map((city) => reduceYield(city.yields(), Unhappiness))).eql(
        [1, 1, 1, 1, 1, 1, 1, 1]
      );
    });
  });
});
