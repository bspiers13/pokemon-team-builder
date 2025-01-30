let generation = null; // Define generation as a global variable
let displayedIds = [];
let party = [];

const pathBase = "https://raw.githubusercontent.com/bspiers13/pokemon-team-builder/refs/heads/main/";

document.addEventListener("DOMContentLoaded", async () => {
  const fetchButton = document.getElementById("fetchPokemonBtn");
  const resultDiv = document.getElementById("pokemon");
  const errorDiv = document.getElementById("error");
  const slots = Array.from(document.querySelectorAll(".slot"));
  const generationInput = document.getElementById("generation");
  const detailsBtn = document.getElementById("detailsBtn");
  const header = document.getElementById("header");
  const moreDetails = document.getElementById("moreDetails");



  const pokedexData = await loadJson(
    "https://raw.githubusercontent.com/bspiers13/pokemon-team-builder/refs/heads/main/assets/json/pokedex_data.json"
  );
  const pokemonData = await loadJson(
    "https://raw.githubusercontent.com/bspiers13/pokemon-team-builder/refs/heads/main/assets/json/pokemon_species_data.json"
  );
  const moveData = await loadJson(
    "https://raw.githubusercontent.com/bspiers13/pokemon-team-builder/refs/heads/main/assets/json/pokemon_moves.json"
  );
  
  console.log("Cyndaquil's move data:", moveData[154]);
  
  //More details button
  detailsBtn.addEventListener("click", () => {
    header.classList.toggle("expanded");
    detailsBtn.classList.toggle("expanded");
    
    detailsBtn.textContent = header.classList.contains("expanded") 
      ? "Less Details" 
      : "More Details";
  });

  const generationDexes = [
    "kanto",
    "original-johto",
    "hoenn",
    "extended-sinnoh",
    "updated-unova",
    ["kalos-central", "kalos-coastal", "kalos-mountain"],
    ["updated-melemele", "updated-akala", "updated-ulaula", "updated-poni"],
    ["galar", "isle-of-armor", "crown-tundra"],
    ["paldea", "kitakami", "blueberry"]
  ];
  const generationLastIds = [151, 251, 386, 493, 649, 721, 809, 905, 1010];

  fetchButton.addEventListener("click", async () => {
    resetDisplay();
    generation = parseInt(generationInput.value); // Set generation globally

    if (isNaN(generation) || generation < 1 || generation > 9) {
      displayError("Please enter a valid generation number (1-9).");
      return;
    }

    displayError("Loading...");

    //Start getting and displaying all pokemon in the given generation
    try {
      //If generation is 6+, go through each pokedex in the game
      if (generation > 5) {
        for (const dex of generationDexes[generation - 1]) {
          await displayPokedex(dex, false);
        }
        //If generation 1-5, there is only 1 regional pokedex
      } else {
        await displayPokedex(generationDexes[generation - 1], false);
      }

      //If generation 1 or 2, all pokemon appear in the regional dex, and there is no national dex
      if (generation > 2) {
        displayNationalDex(false);
      }

      errorDiv.innerHTML = ""; // Remove "Loading..." once all sprites are loaded
    } catch (error) {
      console.error("Error fetching Pokémon:", error);
      displayError("Error fetching Pokémon. Please try again later.");
    }
  });

  slots.forEach((slot) => slot.addEventListener("click", () => clearSlot(slot)));

  function displayError(message) {
    errorDiv.innerHTML = `<p>${message}</p>`;
  }

  //Reset the whole display
  function resetDisplay() {
    resultDiv.innerHTML = "";
    errorDiv.innerHTML = "";
    displayedIds = [];
    party = [];
    updateSlots();
  }

  //Get Json data - used for pokedex data and pokemon species data
  async function loadJson(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Failed to load JSON: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(error);
    }
  }

  //Get and display pokedex using pokedex_data.json
  async function displayPokedex(pokedexName, animated) {
    const pokedexIds = pokedexData[pokedexName];
    const container = createPokedexContainer(
      pokedexName.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    );
    appendSprites(container, pokedexIds, animated);
  }

  //Get and display the nat dex
  async function displayNationalDex(animated) {
    const container = createPokedexContainer("National Dex");
    const lastId = generationLastIds[generation - 1];

    const nationalDexIds = Array.from({ length: lastId }, (_, i) => i + 1);
    appendSprites(container, nationalDexIds, animated);
  }

  //Create new pokedex container - used to separate reg dex and nat dex, and in gens 6+ to separate their ingame pokedexes
  function createPokedexContainer(title) {
    //Create heading
    const heading = document.createElement("div");
    heading.classList.add("pokedexHeading");
    heading.textContent = title;
    resultDiv.appendChild(heading);
    
    //Create accordion arrow for heading
    const accordionArrow = document.createElement("div");
    accordionArrow.classList.add("accordionArrow");
    heading.appendChild(accordionArrow);

    //Create sprite container
    const container = document.createElement("div");
    container.classList.add("pokedexContainer");
    resultDiv.appendChild(container);

    // Add click event listener to the heading
    heading.addEventListener("click", () => {
      //If container is collapsed, uncollapse in this order to allow the heading animation to complete before sprites are sent out
      if (heading.classList.contains("collapsed")) {
        heading.classList.toggle("collapsed");
        accordionArrow.classList.toggle("collapsed");
        setTimeout(() => {
          container.classList.toggle("collapsed");
        }, 100);
      //If container is not collapsed, collapse in this order to allow the sprites animation to complete before heading is rounded
      } else {
        container.classList.toggle("collapsed");
        accordionArrow.classList.toggle("collapsed");
        setTimeout(() => {
          if (container.classList.contains("collapsed")) {
            heading.classList.toggle("collapsed");
          }
        }, 900);
      }
    });

    //Set to collapsed on load and then open then up, doing the animation
    container.classList.toggle("collapsed");
    //Set in this 
    setTimeout(() => {
       container.classList.toggle("collapsed");
    }, 1);

    return container;
  }

  //Create pokemon sprite
  function createSprite(id, animated) {
    const name = Object.keys(pokemonData)[id - 1];

    const spriteDiv = document.createElement("div");
    spriteDiv.classList.add("sprite");
    spriteDiv.id = id;

    const spriteImg = document.createElement("img");
    spriteImg.classList.add("sprite__img");
    spriteImg.src = getSpritePath(id, animated);
    spriteImg.alt = `${name} sprite`;

    if (generation < 6 && !animated) spriteImg.classList.add("pixelated");

    spriteDiv.appendChild(spriteImg);
    spriteDiv.addEventListener("click", () => addToSlots(id));

    return spriteDiv;
  }

  //Add to party slot
  function addToSlots(id) {
    for (const slot of slots) {
      if (slot.children.length === 0) {
        party.push(id);
        updateSlots();
        return;
      }
    }
  }

  //Append sprite to party slot
  function appendSprites(container, pokemonIds, animated) {
    for (const id of pokemonIds) {
      if (!displayedIds.includes(id)) {
        displayedIds.push(id);
        const sprite = createSprite(id, animated);
        container.appendChild(sprite);
      }
    }
  }

  //Clear party slot
  function clearSlot(slot) {
    const index = slots.indexOf(slot);
    if (index > -1) {
      party.splice(index, 1);
      updateSlots();
    }
  }

  //Update party slots whenever there is a change to the party
  function updateSlots() {
    console.log("Party: ", party);
    slots.forEach((slot, index) => {
      const pokemonId = party[index];
      const slotContainer = slot.parentElement;
      const typesDiv = slotContainer.querySelector('.types');

      if (pokemonId === undefined) {
        if (slot.classList.contains("slot--full")) {
          slot.classList.remove("slot--full");
          slot.innerHTML = "";
          slot.id = "";
        }
        typesDiv.innerHTML = ""; // Reset to default state
      } else {
        if (parseInt(slot.id) !== pokemonId) {          
          slot.classList.add("slot--full");
          slot.id = pokemonId;

          const spriteImg = document.createElement("img");
          spriteImg.src = getSpritePath(pokemonId, true);
          spriteImg.classList.add("sprite__img");
          if (generation < 6) spriteImg.classList.add("pixelated");

          slot.innerHTML = "";
          slot.appendChild(spriteImg);

          // Update types display
          const pokemon = pokemonData[Object.keys(pokemonData)[pokemonId - 1]];
          typesDiv.innerHTML = pokemon.types.map(type => 
            `<span class="type-pill type-${type}">${type}</span>`
          ).join('');
        }
      }
    });
  }

  //Get specific sprite for a pokemon depending on which generation sprite to get
  function getSpritePath(id, animated) {
    const formattedId = id.toString().padStart(4, "0");
    const variant = getSpriteVariant(id);

    if (generation > 5) {
      return `${pathBase}assets/img/home-webp/poke_capture_${formattedId}_000_${variant}_n_00000000_f_n.webp`;
    }

    const genPaths = {
      1: animated ? `assets/img/gen-ii/animated/${id}.gif` : `assets/img/gen-ii-webp/${id}.webp`,
      2: animated ? `assets/img/gen-ii/animated/${id}.gif` : `assets/img/gen-ii-webp/${id}.webp`,
      3: `assets/img/gen-iii-webp/${id}.webp`,
      4: `assets/img/gen-iv/platinum-webp/${id}.webp`,
      5: `assets/img/gen-v-webp/${id}.webp`
    };

    // Concatenate pathBase with the selected path
    return pathBase + (genPaths[generation] || "");
  }

  //Get sprite variant - needed for getting home renders
  function getSpriteVariant(id) {
    const exceptions = {
      678: "mo",
      876: "mo",
      905: "fd",
      916: "md",
      957: "fd",
      958: "fd",
      959: "fd",
      1011: "mf",
      1014: "mo",
      1015: "mo",
      1016: "mo",
      1017: "fo",
      1024: "mf"
    };
    if (exceptions[id]) return exceptions[id];

    const { gender_rate, has_gender_differences } = pokemonData[Object.keys(pokemonData)[id - 1]];
    if (gender_rate === -1) return "uk";
    if (gender_rate === 8) return "fo";
    if (gender_rate === 0) return "mo";
    if (has_gender_differences) return gender_rate > 4 ? "fd" : "md";

    return "mf";
  }
  
  function formatLearnMethod(method) {
    const methods = {
      "egg": "Egg",
      "machine": "TM/HM",
      "tutor": "Tutor",
      "level-up": "Level",
      "stadium-surf": "Stadium",
      "light-ball-egg": "Pikachu Egg"
    };
    return methods[method] || method;
  }
  
  // Update the getMovesForPokemon function
  function updateMoveSuggestions(pokemonId) {
    const datalist = document.getElementById("move-suggestions");
    datalist.innerHTML = ""; // Clear previous options

    if (!pokemonId) return;

    const pokemonName = Object.keys(pokemonData)[pokemonId - 1].toLowerCase();
    const moves = moveData[pokemonName] 
      ? Object.values(moveData[pokemonName]).flat()
      : [];

    // Add unique moves to datalist
    moves.filter((v,i,a) => a.findIndex(t => t.move === v.move) === i)
      .forEach(move => {
        const option = document.createElement("option");
        option.value = move.move.replace(/-/g, " ");
        option.title = formatLearnMethod(move.learn_method); // Show method on hover
        datalist.appendChild(option);
      });
  }

  // Update the autocomplete event listeners
  document.querySelectorAll('.move-input').forEach(input => {
    input.addEventListener('focus', () => {
      const slot = input.closest('.moves-container')
        .previousElementSibling
        .previousElementSibling;
      const pokemonId = parseInt(slot.id);
      updateMoveSuggestions(pokemonId);
    });
  });

  //// Update the showSuggestions function to use ID-based data
  //function showSuggestions(input, moves, query) {
  //  console.log("Input value:", query); // Debug 4
  //  console.log("All matching moves:", moves); // Debug 5
  //  const existing = input.parentNode.querySelector('.suggestions');
  //  if (existing) existing.remove();
//
  //  const matches = moves.filter(m => 
  //    m.move.replace(/-/g, ' ').includes(query)
  //  ).slice(0, 5);
//
  //  if (matches.length > 0) {
  //    const dropdown = document.createElement('div');
  //    dropdown.className = 'suggestions';
//
  //    matches.forEach(move => {
  //      const div = document.createElement('div');
  //      div.innerHTML = `
  //        <span>${move.move.replace(/-/g, ' ')}</span>
  //        <span class="learn-method ${move.learn_method}">
  //          ${formatLearnMethod(move.learn_method)}
  //        </span>
  //      `;
  //      div.addEventListener('click', () => {
  //        input.value = move.move.replace(/-/g, ' ');
  //        dropdown.remove();
  //      });
  //      dropdown.appendChild(div);
  //    });
//
  //    input.parentNode.appendChild(dropdown);
  //  }
  //}
});