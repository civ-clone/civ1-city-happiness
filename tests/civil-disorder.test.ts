import { Happiness, Unhappiness } from '../Yields';
import AvailableGovernmentRegistry from '@civ-clone/core-government/AvailableGovernmentRegistry';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import { Despotism } from '@civ-clone/civ1-government/Governments';
import Effect from '@civ-clone/core-rule/Effect';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
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

    ruleRegistry.register(...civilDisorder());

    expect(
      ruleRegistry
        .get(CivilDisorder)
        .some((rule: CivilDisorder): boolean => rule.validate(city))
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
      ...civilDisorder()
    );

    expect(
      ruleRegistry
        .get(CivilDisorder)
        .some((rule: CivilDisorder): boolean => rule.validate(city))
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
      ...civilDisorder()
    );

    expect(
      ruleRegistry
        .get(CivilDisorder)
        .some((rule: CivilDisorder): boolean => rule.validate(city))
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
      ...civilDisorder()
    );

    expect(
      ruleRegistry
        .get(CivilDisorder)
        .some((rule: CivilDisorder): boolean => rule.validate(city))
    );
  });
});
