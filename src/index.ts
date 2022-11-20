import { RecordHandler, loader } from "./loader";

//observer

type Listener<EventType> = (event: EventType) => void;

function createObserver<EventType>(): {
  subscribe: (listener: Listener<EventType>) => () => void;
  publish: (event: EventType) => void;
} {
  let listeners: Set<Listener<EventType>> = new Set([]);
  return {
    subscribe(listener: Listener<EventType>): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    publish(event: EventType): void {
      listeners.forEach((listener) => listener(event));
    },
  };
}

interface BeforeSetEvent<T> {
  value: T;
  newValue: T;
}

interface AfterSetEvent<T> {
  value: T;
}

interface Pokemon {
  id: string;
  attack: number;
  defense: number;
}

export interface BaseRecord {
  id: string;
}

interface Database<T extends BaseRecord> {
  get: (id: string) => T | undefined;
  set: (newValue: T) => void;
  onBeforeAdd: (listener: Listener<BeforeSetEvent<T>>) => void;
  onAfterAdd: (listener: Listener<AfterSetEvent<T>>) => void;
  visit: (visitor: (item: T) => void) => void;
  selectBest: (scoreStrategy: (item: T) => number) => T | undefined;
}
//Factory pattern
function createDB<T extends BaseRecord>() {
  class InMemoryDatabase implements Database<T> {
    static instance: Database<T>;
    private db: Record<string, T> = {};

    private beforeAddListeners = createObserver<BeforeSetEvent<T>>();
    private afterAddListeners = createObserver<AfterSetEvent<T>>();

    private constructor() {}

    public get(id: string): T | undefined {
      return this.db[id];
    }

    public set(newValue: T): void {
      this.beforeAddListeners.publish({
        newValue,
        value: this.db[newValue.id],
      });
      this.db[newValue.id] = newValue;
      this.afterAddListeners.publish({
        value: newValue,
      });
    }

    public onBeforeAdd(listener: Listener<BeforeSetEvent<T>>) {
      return this.beforeAddListeners.subscribe(listener);
    }

    public onAfterAdd(listener: Listener<AfterSetEvent<T>>) {
      return this.afterAddListeners.subscribe(listener);
    }

    //visitor
    public visit(visitor: (item: T) => void): void {
      Object.values(this.db).forEach(visitor);
    }

    public static getInstance(): Database<T> {
      if (!InMemoryDatabase.instance) {
        InMemoryDatabase.instance = new InMemoryDatabase();
      }

      return InMemoryDatabase.instance;
    }
    //strategy
    selectBest(scoreStrategy: (item: T) => number): T | undefined {
      const found: {
        max: number;
        item: T | undefined;
      } = {
        max: 0,
        item: undefined,
      };

      Object.values(this.db).reduce((acc, next) => {
        const score = scoreStrategy(next);
        if (score > acc.max) {
          acc.max = score;
          acc.item = next;
        }
        return acc;
      }, found);

      return found.item;
    }
  }

  return InMemoryDatabase;
}

const pokemonDB = createDB<Pokemon>();
const unsubscribe = pokemonDB
  .getInstance()
  .onAfterAdd((event) => console.log("Added:" + event.value.id));

pokemonDB.getInstance().set({ id: "Bulba", attack: 100, defense: 120 });
pokemonDB.getInstance().set({ id: "Pika", attack: 200, defense: 100 });
pokemonDB.getInstance().visit((item) => console.log(item.id));

const strongestPokemon = pokemonDB
  .getInstance()
  .selectBest((pokemon) => pokemon.attack + pokemon.defense);

//Adapter pattern;

class PokemonDBAdapter implements RecordHandler<Pokemon> {
  addRecord(record: Pokemon): void {
    pokemonDB.getInstance().set(record);
  }
}

loader("./data.json", new PokemonDBAdapter());

console.log("Strongest:" + strongestPokemon?.id);
