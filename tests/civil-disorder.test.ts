import { Happiness, Unhappiness } from '../Yields';
import AvailableGovernmentRegistry from '@civ-clone/core-government/AvailableGovernmentRegistry';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import { Despotism } from '@civ-clone/civ1-government/Governments';
import Effect from '@civ-clone/core-rule/Effect';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Specialist from '@civ-clone/core-city/Specialist';
import SpecialistRegistry from '@civ-clone/core-city/SpecialistRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import YieldRule from '@civ-clone/core-city/Rules/Yield';
import civilDisorder from '../Rules/City/civil-disorder';
import { expect } from 'chai';
import setUpCity from '@civ-clone/civ1-city/tests/lib/setUpCity';

describe('city:civil-disorder', (): void => {
  const tileImprovementRegistry = new TileImprovementRegistry(),
    availableGovernmentRegistry = new AvailableGovernmentRegistry(),
    cityGrowthRegistry = new CityGrowthRegistry(),
    playerWorldRegistry = new PlayerWorldRegistry();

  availableGovernmentRegistry.register(Despotism);

  it('should not be triggered in a city with no Unhappiness', async (): Promise<void> => {
    const ruleRegistry = new RuleRegistry(),
      city = await setUpCity({
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        tileImprovementRegistry,
      });

    ruleRegistry.register(...civilDisorder(cityGrowthRegistry));

    expect(
      ruleRegistry
        .process(CivilDisorder, city)
        .some((result: boolean): boolean => result)
    ).to.false;
  });

  it('should be triggered in a city with Unhappiness and no Happiness', async (): Promise<void> => {
    const ruleRegistry = new RuleRegistry(),
      city = await setUpCity({
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        tileImprovementRegistry,
      });

    ruleRegistry.register(
      new YieldRule(new Effect(() => new Unhappiness(1))),
      ...civilDisorder(cityGrowthRegistry)
    );

    expect(
      ruleRegistry
        .process(CivilDisorder, city)
        .some((result: boolean): boolean => result)
    ).to.true;
  });

  it('should be not triggered in a city with the same amount of Unhappiness and Happiness', async (): Promise<void> => {
    const ruleRegistry = new RuleRegistry(),
      city = await setUpCity({
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        tileImprovementRegistry,
      });

    ruleRegistry.register(
      new YieldRule(new Effect(() => new Unhappiness(1))),
      new YieldRule(new Effect(() => new Happiness(1))),
      ...civilDisorder(cityGrowthRegistry)
    );

    expect(
      ruleRegistry
        .process(CivilDisorder, city)
        .some((result: boolean): boolean => result)
    ).to.false;
  });

  it('should be triggered in a city with more Unhappiness than Happiness', async (): Promise<void> => {
    const ruleRegistry = new RuleRegistry(),
      city = await setUpCity({
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        tileImprovementRegistry,
      });

    ruleRegistry.register(
      new YieldRule(new Effect(() => new Unhappiness(1))),
      new YieldRule(new Effect(() => new Happiness(2))),
      ...civilDisorder(cityGrowthRegistry)
    );

    expect(
      ruleRegistry
        .process(CivilDisorder, city)
        .some((result: boolean): boolean => result)
    );
  });

  // civ-clone/web-renderer#224: in v474.05 specialists come from the content citizens, then the unhappy ones, before
  //  luxuries make anyone happy. Each Entertainer gives 2 luxuries, so 1 Happiness.
  (
    [
      [2, true],
      [3, false],
    ] as [number, boolean][]
  ).forEach(([entertainers, inDisorder]) =>
    it(`should ${
      inDisorder ? '' : 'not '
    }be triggered in a size 8 city with 3 unhappy citizens and ${entertainers} Entertainers`, async (): Promise<void> => {
      const ruleRegistry = new RuleRegistry(),
        specialistRegistry = new SpecialistRegistry(),
        city = await setUpCity({
          size: 8,
          ruleRegistry,
          playerWorldRegistry,
          cityGrowthRegistry,
          tileImprovementRegistry,
        });

      ruleRegistry.register(
        new YieldRule(new Effect(() => new Unhappiness(3))),
        new YieldRule(new Effect(() => new Happiness(entertainers))),
        ...civilDisorder(cityGrowthRegistry, specialistRegistry)
      );

      for (let i = 0; i < entertainers; i++) {
        specialistRegistry.register(new Specialist(city));
      }

      expect(
        ruleRegistry
          .process(CivilDisorder, city)
          .some((result: boolean): boolean => result)
      ).to.equal(inDisorder);
    })
  );

  it('should not be triggered when specialists leave only unhappy citizens and enough Happiness to calm them', async (): Promise<void> => {
    const ruleRegistry = new RuleRegistry(),
      specialistRegistry = new SpecialistRegistry(),
      city = await setUpCity({
        size: 3,
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        tileImprovementRegistry,
      }),
      disorder = () =>
        ruleRegistry
          .process(CivilDisorder, city)
          .some((result: boolean): boolean => result);

    ruleRegistry.register(
      new YieldRule(new Effect(() => new Unhappiness(1))),
      new YieldRule(new Effect(() => new Happiness(2))),
      ...civilDisorder(cityGrowthRegistry, specialistRegistry)
    );

    // Two happy citizens and one unhappy.
    expect(disorder()).to.false;

    // Both specialists come from the content citizens the Happiness would have made happy, leaving the unhappy one,
    //  whom the Happiness then makes content, and then happy.
    specialistRegistry.register(new Specialist(city), new Specialist(city));

    expect(disorder()).to.false;
  });
});
