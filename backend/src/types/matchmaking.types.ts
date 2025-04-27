import { Type } from "class-transformer";
import {
  Position,
  MatchPlayerData as BaseMatchPlayerData,
  SpellCastInfo as BaseSpellCastInfo,
  MoveInfo as BaseMoveInfo,
  UserTurn as BaseUserTurn,
} from "../../../common/types/matchmaking.types";
import { ActionPack } from "../../../common/stater";

export class TransformedMatchPlayerData implements BaseMatchPlayerData {
  playerId: string;
  health: number;
  wizardId: number;
  spells?: any[];
  mapStructure?: any;

  @Type(() => Position)
  playerPosition?: Position;
}

export class TransformedSpellCastInfo implements BaseSpellCastInfo {
  spellId: number;
  targetId: string;

  @Type(() => Position)
  targetPosition: Position;
}

export class TransformedMoveInfo implements BaseMoveInfo {
  @Type(() => Position)
  to: Position;
}

// Old type for server side state management
export class TransformedUserTurn implements BaseUserTurn {
  playerId: string;

  @Type(() => TransformedSpellCastInfo)
  spellCastInfo: TransformedSpellCastInfo[];

  @Type(() => TransformedMoveInfo)
  moveInfo: TransformedMoveInfo | null;
}

export class TransformedUserTurnV2 {
  playerId: string;

  @Type(() => ActionPack)
  actions: ActionPack;
}
