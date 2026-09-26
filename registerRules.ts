import cityCelebrateLeader from './Rules/City/celebrate-leader';
import cityCivilDisorder from './Rules/City/civil-disorder';
import cityCost from './Rules/City/cost';
import cityYield from './Rules/City/yield';
import playerAction from './Rules/Player/action';
import playerTurnStart from './Rules/Player/turn-start';
import { Game, defaultGame } from '@civ-clone/core-game';

export const register = (game: Game): void =>
  game.rules.register(
    ...cityCelebrateLeader(game.cityGrowth, game.specialists),
    ...cityYield(game.cityGrowth, game.playerGovernments, game.units),
    ...cityCivilDisorder(game.cityGrowth, game.specialists),
    ...cityCost(
      game.rules,
      game.cityGrowth,
      game.cityImprovements,
      game.playerGovernments,
      game.playerResearch,
      game.units
    ),
    ...playerAction(game.cities),
    ...playerTurnStart(game.cities, game.rules, game.engine, game.cityGrowth)
  );

// The plugin loader imports each package for this side effect. Until it passes
// a `Game` of its own, dropping it would produce a game with silently absent
// rules — no error, just wrong behaviour.
register(defaultGame);

export default register;
