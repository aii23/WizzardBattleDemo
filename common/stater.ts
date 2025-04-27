import { allSpells } from "./spells";
import { MapStructure, Position, Spell } from "./types/matchmaking.types";
import { allWizards } from "./wizards";

interface ICommittable {
  getCommit: () => string; // In general hash of included fields
}

export class Action implements ICommittable {
  spellId: number;
  position: Position;
  target: string;

  constructor(spellId: number, position: Position, target: string) {
    this.spellId = spellId;
    this.position = position;
    this.target = target;
  }

  getCommit() {
    // TODO: Implement
    return "ActionCommit";
  }
}

export class ActionPack implements ICommittable {
  private _actions: Action[] = [];

  constructor(actions: Action[] = []) {
    this._actions = actions;
  }

  // Getter for actions array
  get actions(): Action[] {
    return this._actions;
  }

  // Array-like methods
  get length(): number {
    return this._actions.length;
  }

  push(...items: Action[]): number {
    return this._actions.push(...items);
  }

  pop(): Action | undefined {
    return this._actions.pop();
  }

  [Symbol.iterator](): Iterator<Action> {
    return this._actions[Symbol.iterator]();
  }

  // Array access
  get(index: number): Action {
    return this._actions[index];
  }

  // ICommittable implementation
  getCommit() {
    // TODO: Implement
    return "ActionPackCommit";
  }
}

export class UserState implements ICommittable {
  map: MapStructure; // All information about the map
  health: number; // How much health do wizard have
  skillsInfo: Spell[]; // Information about skills and its cooldowns
  position: Position;

  constructor(
    map: MapStructure,
    health: number,
    skillsInfo: Spell[],
    position: Position
  ) {
    this.map = map;
    this.health = health;
    this.skillsInfo = skillsInfo;
    this.position = position;
  }

  getCommit() {
    // TODO: Implement
    return "UserStateCommit";
  }
}

class StateCommitData implements ICommittable {
  stateHash: string;
  actionHash: string;
  gameId: string;
  turn: number;

  constructor(
    stateHash: string,
    actionHash: string,
    gameId: string,
    turn: number
  ) {
    this.stateHash = stateHash;
    this.actionHash = actionHash;
    this.gameId = gameId;
    this.turn = turn;
  }

  getCommit() {
    // TODO: Implement
    return "StateCommitDataCommit";
  }
}

class StateCommit {
  data: StateCommitData;
  signature: string;

  constructor(data: StateCommitData, signature: string) {
    this.data = data;
    this.signature = signature;
  }
}

class Signer {
  private privateKey: string;

  constructor(privateKey: string) {
    this.privateKey = privateKey;
  }

  sign(message: string) {
    // TODO: Implement
    return "signed";
  }
}

// Stater is a class that is used to store the state of the user. Each user has its own Stater instance.
// It applies actions to update the state, create state commits and store state history for final reveal
export class Stater extends Signer {
  private stateHistory: UserState[] = [];
  private gameId: string;
  private playerId: string;
  private turn: number;
  private wizardId: number;

  constructor(
    initialState: UserState,
    gameId: string,
    wizardId: number,
    playerId: string
  ) {
    const pk = "SomePrivateKey"; // TODO: Get session private key
    super(pk);
    this.stateHistory = [initialState];
    this.gameId = gameId;
    this.turn = 0;
    this.wizardId = wizardId;
    this.playerId = playerId;
  }

  applyActions(actions: ActionPack) {
    console.log("actions", actions as ActionPack);
    let newState = structuredClone(
      this.stateHistory[this.stateHistory.length - 1]
    );

    newState = new UserState(
      newState.map,
      newState.health,
      newState.skillsInfo,
      newState.position
    );

    newState.position = new Position(newState.position.x, newState.position.y);

    console.log("actions", actions);
    for (const action of actions.actions) {
      // Apply action to the state
      const spell = allSpells.find((s) => s.id === action.spellId);
      if (spell) {
        console.log("newState", newState);
        spell.effect2(newState, action.position);
      }
    }
    this.stateHistory.push(newState);

    return {
      commit: this.getCurrentCommit(actions),
      publicState: this.getPublicState(),
    };
  }

  getCurrentState() {
    return this.stateHistory[this.stateHistory.length - 1];
  }

  getCurrentPosition() {
    return this.getCurrentState().position;
  }

  getCurrentCommit(lastAppliedActions: ActionPack) {
    const stateCommit =
      this.stateHistory[this.stateHistory.length - 1].getCommit();
    const actionsCommit = lastAppliedActions.getCommit();
    const commitData = new StateCommitData(
      stateCommit,
      actionsCommit,
      this.gameId,
      this.turn
    );
    const signature = this.sign(commitData.getCommit());
    return new StateCommit(commitData, signature);
  }

  getStateHistory() {
    return this.stateHistory;
  }

  getPublicState() {
    let wizard = allWizards.find((w) => w.id === this.wizardId);
    if (!wizard) {
      throw new Error("Wizard not found");
    }

    const currentState = this.stateHistory[this.stateHistory.length - 1];
    const result = {};
    for (const field of wizard.publicFields) {
      result[field] = currentState[field];
    }

    result["playerId"] = this.playerId;
    return result;
  }
}
