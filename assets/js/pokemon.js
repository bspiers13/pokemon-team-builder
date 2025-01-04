export async function fetchPokemonByGeneration(generation) {
    const pokedex = generation + 1;
    const response = await fetch(`https://pokeapi.co/api/v2/pokedex/${pokedex}/`);
    const data = await response.json();
    return data.pokemon_entries;
}

export async function getPokemonIds(pokemonList) {
    // Loop through the list and extract the IDs
    const pokemonIds = pokemonList.map((pokemon) => pokemon.entry_number);
    return pokemonIds;
}

export async function getPokemonNames(pokemonList) {
    // Loop through the list and extract the names
    const pokemonNames = pokemonList.map((pokemon) => pokemon.pokemon_species.name);
    return pokemonNames;
}

export async function getPokemonData(generation) {
    const pokemonData = []; // Array to hold the Pokémon data
    let pokemonList = [];
    
    try {
        
        
        if (generation == 1 || generation == 2) {
            pokemonList = await fetchPokemonByGeneration(generation);
        }
        else {
            for (let gen = 2; gen <= generation; gen++) {
                // Fetch entries for the current generation
                const pokemonEntries = await fetchPokemonByGeneration(gen);
                console.log("Pokedex ",gen,pokemonEntries);
                pokemonList = pokemonList.concat(pokemonEntries); // Accumulate entries
            }
        }
        console.log(pokemonList);

        for (const pokemon of pokemonList) {
            const pokemonId = pokemon.entry_number;
            const pokemonName = pokemon.pokemon_species.name;
            
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}/`);
            const data = await response.json();
            const pokemonPokedexId = data.id;

            // Determine sprite URL based on the generation
            let spriteUrl = null;
            if (generation <= 2) {
                spriteUrl = `https://bluemoonfalls.com/images/sprites/crystal/normal/${pokemonPokedexId}.gif`;
            } else if (generation == 3) {
                spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/emerald/${pokemonPokedexId}.png`;
            }

            // Check if the sprite URL is valid
            try {
                const response = await fetch(spriteUrl, { method: "HEAD" });
                if (!response.ok) {
                    spriteUrl = null; // If invalid, set the sprite URL to null
                }
            } catch (error) {
                console.error(`Error validating sprite URL for ${pokemonName}:`, error);
                spriteUrl = null; // Handle errors gracefully
            }

            // Add Pokémon data to the array
            pokemonData.push({
                id: pokemonId,
                name: pokemonName,
                spriteUrl: spriteUrl,
            });
        }
    } catch (error) {
        console.error("Error fetching Pokémon data:", error);
    }

    return pokemonData;
}

