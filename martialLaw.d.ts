import { MartialLawTable } from '@civ-clone/base-government-martial-law/lib/martialLaw';
import Government from '@civ-clone/core-government/Government';
import Unit from '@civ-clone/core-unit/Unit';
export declare const martialLawGovernments: (typeof Government)[];
export declare const martialLawUnitLimit = 3;
/** Each unit makes one unhappy citizen content, under each of `martialLawGovernments`. */
export declare const martialLawTable: MartialLawTable;
export declare const keepsMartialLaw: (unit: Unit) => boolean;
