import { Happiness, Unhappiness } from '../Yields';
import CelebrateLeader from '@civ-clone/core-city-happiness/Rules/CelebrateLeader';
import CityBuildRegistry from '@civ-clone/core-city-build/CityBuildRegistry';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Specialist from '@civ-clone/core-city/Specialist';
import SpecialistRegistry from '@civ-clone/core-city/SpecialistRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Yield from '@civ-clone/core-yield/Yield';
import cityCelebrateLeader from '../Rules/City/celebrate-leader';
import cityCreated from '@civ-clone/civ1-city/Rules/City/created';
import { expect } from 'chai';
import setUpCity, {
  setUpCityOptions,
} from '@civ-clone/civ1-city/tests/lib/setUpCity';
import { Anarchy, Monarchy } from '@civ-clone/civ1-government/Governments';
import AvailableGovernmentRegistry from '@civ-clone/core-government/AvailableGovernmentRegistry';
import City from '@civ-clone/core-city/City';
import Government from '@civ-clone/core-government/Government';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import PlayerGovernmentRegistry from '@civ-clone/core-government/PlayerGovernmentRegistry';

describe('city:celebrate-leader', (): void => {
  const ruleRegistry = new RuleRegistry(),
    tileImprovementRegistry = new TileImprovementRegistry(),
    cityBuildRegistry = new CityBuildRegistry(),
    cityGrowthRegistry = new CityGrowthRegistry(),
    cityRegistry = new CityRegistry(),
    playerWorldRegistry = new PlayerWorldRegistry(),
    availableGovernmentRegistry = new AvailableGovernmentRegistry(),
    playerGovernmentRegistry = new PlayerGovernmentRegistry(),
    // A city whose player has a government, as celebrating depends on it.
    setUpGovernedCity = async (
      options: setUpCityOptions,
      GovernmentType: typeof Government = Monarchy
    ): Promise<City> => {
      const city = await setUpCity(options),
        playerGovernment = new PlayerGovernment(
          city.player(),
          availableGovernmentRegistry,
          options.ruleRegistry
        );

      playerGovernment.set(new GovernmentType());
      playerGovernmentRegistry.register(playerGovernment);

      return city;
    };

  availableGovernmentRegistry.register(Anarchy, Monarchy);

  ruleRegistry.register(
    ...cityCelebrateLeader(
      cityGrowthRegistry,
      undefined,
      playerGovernmentRegistry
    ),
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
    const city = await setUpGovernedCity({
      size: 4,
      ruleRegistry,
      playerWorldRegistry,
      cityGrowthRegistry,
      tileImprovementRegistry,
    });

    city.yields = (): Yield[] => [new Happiness(2)];

    expect(
      ruleRegistry
        .process(CelebrateLeader, city)
        .some((result: boolean): boolean => result)
    ).to.true;
  });

  it('should not trigger leader celebration when half or more citizens are happy if any unhappiness', async (): Promise<void> => {
    const city = await setUpGovernedCity({
      size: 6,
      ruleRegistry,
      playerWorldRegistry,
      cityGrowthRegistry,
      tileImprovementRegistry,
    });

    city.yields = (): Yield[] => [new Happiness(5), new Unhappiness(1)];

    expect(
      ruleRegistry
        .process(CelebrateLeader, city)
        .some((result: boolean): boolean => result)
    ).to.false;
  });

  it('should not trigger leader celebration when city size is < 3', async (): Promise<void> => {
    const city = await setUpGovernedCity({
      size: 2,
      ruleRegistry,
      playerWorldRegistry,
      cityGrowthRegistry,
      tileImprovementRegistry,
    });

    city.yields = (): Yield[] => [new Happiness(3), new Unhappiness(0)];

    expect(
      ruleRegistry
        .process(CelebrateLeader, city)
        .some((result: boolean): boolean => result)
    ).to.false;
  });

  it('should not trigger leader celebration when happiness is less than half the city size', async (): Promise<void> => {
    const city = await setUpGovernedCity({
      size: 3,
      ruleRegistry,
      playerWorldRegistry,
      cityGrowthRegistry,
      tileImprovementRegistry,
    });

    city.yields = (): Yield[] => [new Happiness(1), new Unhappiness(0)];

    expect(
      ruleRegistry
        .process(CelebrateLeader, city)
        .some((result: boolean): boolean => result)
    ).to.false;
  });

  // v474.05 (`CITYMGT.C` `city_process`): the celebration's condition includes `civ_gov[selected_owner] != 0`
  //  (civ-clone/web-renderer#1010).
  it('should not trigger leader celebration under Anarchy', async (): Promise<void> => {
    const city = await setUpGovernedCity(
      {
        size: 4,
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        tileImprovementRegistry,
      },
      Anarchy
    );

    city.yields = (): Yield[] => [new Happiness(4)];

    expect(
      ruleRegistry
        .process(CelebrateLeader, city)
        .some((result: boolean): boolean => result)
    ).to.false;
  });

  it('should count only working citizens once specialists are taken out', async (): Promise<void> => {
    const specialistRegistry = new SpecialistRegistry(),
      rules = new RuleRegistry(),
      city = await setUpGovernedCity({
        size: 3,
        ruleRegistry: rules,
        playerWorldRegistry,
        cityGrowthRegistry,
        tileImprovementRegistry,
      }),
      celebrates = () =>
        rules
          .process(CelebrateLeader, city)
          .some((result: boolean): boolean => result);

    rules.register(
      ...cityCelebrateLeader(
        cityGrowthRegistry,
        specialistRegistry,
        playerGovernmentRegistry
      )
    );

    city.yields = (): Yield[] => [new Happiness(2)];

    // Two happy citizens and one content.
    expect(celebrates()).to.true;

    // The first specialist comes from the content citizen, so two of three are still happy.
    specialistRegistry.register(new Specialist(city));

    expect(celebrates()).to.true;

    // The second comes from a happy citizen, leaving one of three.
    specialistRegistry.register(new Specialist(city));

    expect(celebrates()).to.false;
  });
});
