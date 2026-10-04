import { Game, defaultGame } from '@civ-clone/core-game';
import citizens from './AdditionalData/citizens';

export const register = (game: Game): void =>
  game.additionalData.register(...citizens(game.cityGrowth, game.specialists));

// Imported for this side effect, as `registerRules` is.
register(defaultGame);

export default register;
