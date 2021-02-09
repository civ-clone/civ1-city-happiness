import { Happiness, Unhappiness } from '../Yields';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CityBuildRegistry from '@civ-clone/core-city-build/CityBuildRegistry';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import TerrainFeatureRegistry from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Yield from '@civ-clone/core-yield/Yield';
import civilDisorder from '../Rules/City/civil-disorder';
import created from '@civ-clone/civ1-city/Rules/City/created';
import { expect } from 'chai';
import setUpCity from '@civ-clone/civ1-city/tests/lib/setUpCity';

describe('city:civil-disorder', (): void => {
  const ruleRegistry = new RuleRegistry(),
    terrainFeatureRegistry = new TerrainFeatureRegistry(),
    tileImprovementRegistry = new TileImprovementRegistry(),
    cityBuildRegistry = new CityBuildRegistry(),
    cityGrowthRegistry = new CityGrowthRegistry(),
    cityRegistry = new CityRegistry(),
    playerWorldRegistry = new PlayerWorldRegistry();

  ruleRegistry.register(
    ...created(
      tileImprovementRegistry,
      cityBuildRegistry,
      cityGrowthRegistry,
      cityRegistry,
      playerWorldRegistry,
      ruleRegistry
    ),
    ...civilDisorder()
  );

  it('should be triggered in a city with Unhappiness and no Happiness', (): void => {
    const city = setUpCity({
      ruleRegistry,
      playerWorldRegistry,
      cityGrowthRegistry,
      terrainFeatureRegistry,
      tileImprovementRegistry,
    });

    city.yields = (): Yield[] => [new Unhappiness(1)];

    expect(
      ruleRegistry
        .get(CivilDisorder)
        .some((rule: CivilDisorder): boolean => rule.validate(city))
    ).to.true;
  });

  it('should be triggered in a city with more Unhappiness than Happiness', (): void => {
    const city = setUpCity({
      ruleRegistry,
      playerWorldRegistry,
      cityGrowthRegistry,
      terrainFeatureRegistry,
      tileImprovementRegistry,
    });

    city.yields = (): Yield[] => [new Unhappiness(2), new Happiness(1)];

    expect(
      ruleRegistry
        .get(CivilDisorder)
        .some((rule: CivilDisorder): boolean => rule.validate(city))
    );
  });

  it('should be not triggered in a city with the same amount of Unhappiness and Happiness', (): void => {
    const city = setUpCity({
      ruleRegistry,
      playerWorldRegistry,
      cityGrowthRegistry,
      terrainFeatureRegistry,
      tileImprovementRegistry,
    });

    city.yields = (): Yield[] => [new Unhappiness(1), new Happiness(1)];

    expect(
      ruleRegistry
        .get(CivilDisorder)
        .some((rule: CivilDisorder): boolean => rule.validate(city))
    ).to.false;
  });

  it('should not be triggered in a city with no Unhappiness', (): void => {
    const city = setUpCity({
      ruleRegistry,
      playerWorldRegistry,
      cityGrowthRegistry,
      terrainFeatureRegistry,
      tileImprovementRegistry,
    });

    expect(
      ruleRegistry
        .get(CivilDisorder)
        .some((rule: CivilDisorder): boolean => rule.validate(city))
    ).to.false;
  });

  // TODO: check effects of civil disorder
  // it('should halt production when in civil disorder', (): void => {
  //   const city = setUpCity({
  //     playerWorldRegistry,
  //     cityGrowthRegistry,
  //     terrainFeatureRegistry,
  //     tileImprovementRegistry,
  //     ruleRegistry,
  //   });
  //
  //   tile.yields = (): Yield[] => [
  //     new Production(2),
  //   ];
  //
  //   const yields = city.yields(),
  //     [production] = yields.filter((cityYield: Yield): boolean => cityYield instanceof Production);
  //
  //   expect(production.value()).to.equal(0);
  // });
  //
  // it('should not halt production when not in civil disorder', (): void => {
  //   const city = setUpCity({
  //       size: 5,
  //       playerWorldRegistry,
  //       cityGrowthRegistry,
  //       terrainFeatureRegistry,
  //       tileImprovementRegistry,
  //       ruleRegistry,
  //     }),
  //   });
  //
  //   tile.yields = (): Yield[] => [
  //     new Production(2),
  //   ];
  //
  //   const yields = city.yields(),
  //     [production] = yields.filter((cityYield: Yield): boolean => cityYield instanceof Production)
  //   ;
  //
  //   assert.strictEqual(production.value(), 7);
  // });
});
