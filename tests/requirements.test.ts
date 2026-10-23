import { Game } from '@civ-clone/core-game/Game';
import { Mysticism } from '@civ-clone/civ1-science/Advances';
import { Requirement } from '@civ-clone/core-requirement/Requirement';
import { Temple } from '@civ-clone/civ1-city-improvement/CityImprovements';
import { expect } from 'chai';
import register from '../registerRules';

// Through `register(game)`, as a game gets them (civ-clone/web-renderer#37): what makes the improvements work better,
//  describing only.
describe('civ1-city-happiness requirements', (): void => {
  it('should say a Temple is enhanced by Mysticism, and make no rule of it', (): void => {
    const game = new Game();

    register(game);

    expect(
      game.requirements
        .for(Temple, 'enhancedBy')
        .map((entry: Requirement) => [entry.id, entry.targets])
    ).eql([['civ1-city-happiness:city/cost/enhanced-by/Temple', [Mysticism]]]);
    expect(
      game.requirements.rulesFor(
        'civ1-city-happiness:city/cost/enhanced-by/Temple'
      )
    ).eql([]);
  });
});
