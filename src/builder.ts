class Pokemon {
  public id: string;
  public attack: number = 0;
  public defense: number = 0;
  constructor(name: string) {
    this.id = name;
  }
}

//Builder
class PokemonBuilder {
  private pokemon: Pokemon;

  constructor(name: string) {
    this.pokemon = new Pokemon(name);
  }

  addAttack(value: number): PokemonBuilder {
    this.pokemon.attack = value;
    return this;
  }

  addDefense(value: number): PokemonBuilder {
    this.pokemon.defense = value;
    return this;
  }

  get(): Pokemon {
    return this.pokemon;
  }
}

//Proxy
const pokemonBuilder: PokemonBuilder = new PokemonBuilder("Charizard");
const pokemon = pokemonBuilder.addAttack(100).addDefense(90).get();

const reactiveCharizard: Pokemon = new Proxy(pokemon, {
  get(target: Pokemon, key: keyof Pokemon) {
    console.log("Tracking", key);
    return target[key];
  },
  set(target, key, value) {
    console.log(`Updating ${key.toString()} to ${value}...`);
    return Reflect.set(target, key, value);
  },
});

reactiveCharizard.attack = 300;

//Iterator pattern

function range(
  start: number,
  end: number = Infinity,
  step: number = 1
): Iterable<number> {
  return {
    [Symbol.iterator]: function* () {
      for (let i = start; i < end; i += step) {
        yield i;
      }
    },
  };
}

for (let i of range(1, 10)) {
  console.log(i);
}
