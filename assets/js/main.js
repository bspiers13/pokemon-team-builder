let generation = null; // Define generation as a global variable
let displayedIds = [];
let party = [];

// Gen 1–5 Pokémon that later gained the Fairy type
const historicalTypes = {
  35:  { beforeGen: 6, types: ["normal"] },             // Clefairy
  36:  { beforeGen: 6, types: ["normal"] },             // Clefable
  39:  { beforeGen: 6, types: ["normal"] },             // Jigglypuff
  40:  { beforeGen: 6, types: ["normal"] },             // Wigglytuff
  122: { beforeGen: 6, types: ["psychic"] },            // Mr. Mime
  173: { beforeGen: 6, types: ["normal"] },             // Cleffa
  174: { beforeGen: 6, types: ["normal"] },             // Igglybuff
  175: { beforeGen: 6, types: ["normal"] },             // Togepi
  176: { beforeGen: 6, types: ["normal", "flying"] },   // Togetic
  183: { beforeGen: 6, types: ["water"] },              // Marill
  184: { beforeGen: 6, types: ["water"] },              // Azumarill
  209: { beforeGen: 6, types: ["normal"] },             // Snubbull
  210: { beforeGen: 6, types: ["normal"] },             // Granbull
  280: { beforeGen: 6, types: ["psychic"] },            // Ralts
  281: { beforeGen: 6, types: ["psychic"] },            // Kirlia
  282: { beforeGen: 6, types: ["psychic"] },            // Gardevoir
  303: { beforeGen: 6, types: ["steel"] },              // Mawile
  439: { beforeGen: 6, types: ["psychic"] },            // Mime Jr.
};

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
  const effectivenessDiv = document.getElementById("effectiveness");
  const weaknessesDiv = document.getElementById("weaknesses");

  const pokedexData = await loadJson(
    "https://raw.githubusercontent.com/bspiers13/pokemon-team-builder/refs/heads/main/assets/json/pokedex_data.json"
  );
  const pokemonData = await loadJson(
    "https://raw.githubusercontent.com/bspiers13/pokemon-team-builder/refs/heads/main/assets/json/pokemon_species_data.json"
  );
  const moveData = await loadJson("assets/json/pokemon_moves.json");
  const typeEffectivenessData = await loadJson("assets/json/type_interactions.json");

  console.log("Cyndaquil's move data:", moveData[154]);

  //More details button
  detailsBtn.addEventListener("click", () => {
    header.classList.toggle("expanded");
    effectivenessDiv.classList.toggle("expanded");
    weaknessesDiv.classList.toggle("expanded");
    detailsBtn.classList.toggle("expanded");
    moreDetails.classList.toggle("expanded");

    detailsBtn.textContent = header.classList.contains("expanded")
      ? "Less Details"
      : "More Details";

    // Add these to ensure weaknesses are calculated when expanding
    calculateMoveEffectiveness();
    calculateWeaknesses();
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

    // Clear all move inputs and reset their colors
    document.querySelectorAll(".move-input").forEach((input) => {
      input.value = ""; // Clear move name
      updateMoveInputColor(input); // Reset background color
    });
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
        }, 500);
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

  //Clear party slot, shift movesets down, and update move colors
  function clearSlot(slot) {
    const index = slots.indexOf(slot);
    if (index > -1) {
      party.splice(index, 1); // Remove Pokémon from party

      const moveContainers = document.querySelectorAll(".moves-container");

      // Shift movesets down
      for (let i = index; i < party.length; i++) {
        const currentMoves = moveContainers[i + 1].querySelectorAll(".move-input");
        const targetMoves = moveContainers[i].querySelectorAll(".move-input");
        const targetPokemonId = party[i];

        currentMoves.forEach((moveInput, j) => {
          // Transfer both value and data attributes
          targetMoves[j].value = moveInput.value;
          targetMoves[j].dataset.type = moveInput.dataset.type;
          targetMoves[j].dataset.learnMethod = moveInput.dataset.learnMethod;
          targetMoves[j].dataset.power = moveInput.dataset.power;

          updateMoveSuggestions(targetPokemonId);
          updateMoveInputColor(targetMoves[j]);
        });
      }

      // Clear last slot's moves
      const lastMoves = moveContainers[party.length]?.querySelectorAll(".move-input");
      if (lastMoves) {
        lastMoves.forEach((moveInput) => {
          moveInput.value = "";
          updateMoveInputColor(moveInput);
        });
      }

      updateSlots();
    }
  }

  //Function to update move input background color based on move type
  function updateMoveInputColor(input) {
    const value = input.value.trim().toLowerCase();
    const datalist = document.getElementById("move-suggestions");

    //Find matching option
    const option = [...datalist.options].find((opt) => opt.value.toLowerCase() === value);

    if (option) {
      input.style.backgroundColor = `var(--type-${option.dataset.type})`;
    } else {
      input.style.backgroundColor = "#323537"; //Reset to default color
    }
  }

  function updateSlots() {
    console.log("Party: ", party);
    slots.forEach((slot, index) => {
      const pokemonId = party[index];
      const headerContent = slot.parentElement;
      const typesDiv = headerContent.querySelector(".types");

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

          // Update types display with historical check
          const pokemon = pokemonData[Object.keys(pokemonData)[pokemonId - 1]];
          let displayTypes = [...pokemon.types];

          // Check for historical type adjustments
          if (generation < 6 && historicalTypes[pokemonId]) {
            displayTypes = historicalTypes[pokemonId].types;
          }

          typesDiv.innerHTML = displayTypes
            .map((type) => `<span class="type-pill type-${type}">${type}</span>`)
            .join("");
        }
      }
    });

    calculateMoveEffectiveness();
    calculateWeaknesses();
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
      egg: "Egg",
      machine: "TM/HM",
      tutor: "Tutor",
      "level-up": "Level",
      "stadium-surf": "Stadium",
      "light-ball-egg": "Pikachu Egg"
    };
    return methods[method] || method;
  }

  const generationToGames = {
    1: ["red-blue", "yellow"],
    2: ["gold-silver", "crystal"],
    3: ["ruby-sapphire", "emerald", "firered-leafgreen", "colosseum"],
    4: ["diamond-pearl", "platinum", "heartgold-soulsilver", "xd"],
    5: ["black-white", "black-2-white-2"],
    6: ["x-y", "omega-ruby-alpha-sapphire"],
    7: ["sun-moon", "ultra-sun-ultra-moon", "lets-go-pikachu-lets-go-eevee"],
    8: ["sword-shield", "brilliant-diamond-and-shining-pearl"],
    9: ["scarlet-violet"]
  };

  // Update the getMovesForPokemon function
  function updateMoveSuggestions(pokemonId) {
    const datalist = document.getElementById("move-suggestions");

    if (!pokemonId || !generation) return;

    const games = generationToGames[generation];
    const pokemonName = Object.keys(pokemonData)[pokemonId - 1].toLowerCase();

    // Get moves from all games in the current generation
    const moves = games.flatMap((game) => {
      return moveData[pokemonName]?.[game] || [];
    });

    // Historical type adjustments for moves
    const historicalMoveTypes = {
      "charm": { beforeGen: 6, type: "normal" },
      "moonlight": { beforeGen: 6, type: "normal" },
      "sweet-kiss": { beforeGen: 6, type: "normal" },
    };

    // Filter and adjust moves
    const filteredMoves = moves.filter(move => {
      // Remove Fairy-type moves for generations before 6
      if (generation < 6 && move.type === "Fairy") return false;
      return true;
    }).map(move => {
      // Adjust types for moves that changed in later generations
      if (generation < 6 && historicalMoveTypes[move.move]) {
        return {
          ...move,
          type: historicalMoveTypes[move.move].type
        };
      }
      return move;
    });

    // Filter unique moves (keeping last occurrence)
    const uniqueMoves = filteredMoves.reduce((acc, move) => {
      acc[move.move] = move; // Overwrite with last occurrence
      return acc;
    }, {});

    datalist.innerHTML = "";
    // Add moves to datalist
    Object.values(uniqueMoves).forEach((move) => {
      const option = document.createElement("option");
      option.value = move.move.replace(/-/g, " ");
      option.dataset.type = move.type;
      option.dataset.learnMethod = move.learn_method;
      option.dataset.power = move.power;
      datalist.appendChild(option);
    });
  }

  document.querySelectorAll(".move-input").forEach((input) => {
    input.addEventListener("focusin", () => {
      const slot = input.closest(".moves-container").previousElementSibling.previousElementSibling;
      const pokemonId = parseInt(slot.id);
      updateMoveSuggestions(pokemonId);
    });
  });

  // Update the autocomplete event listeners
  document.querySelectorAll(".move-input").forEach((input) => {
    input.addEventListener("input", (e) => {
      const value = e.target.value.trim().toLowerCase();
      const datalist = document.getElementById("move-suggestions");

      // Find matching option
      const option = [...datalist.options].find((opt) => opt.value.toLowerCase() === value);

      if (option) {
        // Store move type directly in move-input element
        e.target.dataset.type = option.dataset.type;
        e.target.dataset.learnMethod = option.dataset.learnMethod;
        e.target.dataset.power = option.dataset.power;

        // Set background color from type
        e.target.style.backgroundColor = `var(--type-${option.dataset.type})`;
      } else {
        // Reset if move is invalid
        e.target.dataset.type = "";
        e.target.dataset.learnMethod = "";
        e.target.dataset.power = "";
        e.target.style.backgroundColor = "#323537";
      }

      calculateMoveEffectiveness();
    });
  });

  function calculateMoveEffectiveness() {
    const moveEffectiveness = {};
    console.groupCollapsed("[DEBUG] Calculating move effectiveness");

    party.forEach((pokemonId, slotIndex) => {
      const pokemonKey = Object.keys(pokemonData)[pokemonId - 1];
      const pokemon = pokemonData[pokemonKey];
      let displayTypes = [...pokemon.types];

      if (generation < 6 && historicalTypes[pokemonId]) {
        displayTypes = historicalTypes[pokemonId].types;
      }

      const pokemonTypes = displayTypes.map(type => type.toLowerCase());
      console.log(`Processing Pokémon #${pokemonId} (${pokemonKey}) with types:`, pokemonTypes);

      const slot = slots[slotIndex];
      const moveContainer = slot.nextElementSibling.nextElementSibling;
      if (!moveContainer) {
        console.warn(`No move container found for slot ${slotIndex}`);
        return;
      }

      const moveInputs = moveContainer.querySelectorAll(".move-input");
      console.log(`Found ${moveInputs.length} move inputs for slot ${slotIndex}`);

      moveInputs.forEach((input, moveIndex) => {
        const moveName = input.value.trim().toLowerCase();
        const moveType = input.dataset.type ? input.dataset.type.toLowerCase() : "";
        const movePower = input.dataset.power;

        // Skip Dark/Steel moves in Gen 1
        if (generation === 1 && (moveType === "dark" || moveType === "steel")) {
          console.log(`Skipping ${moveType} move in Gen 1`);
          return;
        }

        if (!moveName || !moveType || movePower === "null") {
          console.log(`Slot ${slotIndex} move ${moveIndex + 1}: empty or invalid`);
          return;
        }

        const typeData = typeEffectivenessData[moveType];
        if (!typeData) {
          console.warn(`No effectiveness data for move type: ${moveType}`);
          return;
        }

        const isStab = pokemonTypes.includes(moveType);
        console.log(`Move ${moveIndex + 1}: ${moveName} (${moveType}), STAB: ${isStab}`);

        typeData.strong.forEach(targetType => {
          if (generation === 1 && (targetType.toLowerCase() === "dark" || targetType.toLowerCase() === "steel")) return;

          console.log(`- Super effective against: ${targetType}`);
          if (!moveEffectiveness[targetType]) {
            moveEffectiveness[targetType] = { count: 0, hasStab: false };
          }
          moveEffectiveness[targetType].count++;
          if (isStab) {
            moveEffectiveness[targetType].hasStab = true;
          }
        });
      });
    });

    console.log("Final effectiveness calculation:", moveEffectiveness);
    console.groupEnd();
    displayMoveEffectiveness(moveEffectiveness);
  }

  function displayMoveEffectiveness(moveEffectiveness) {
    if (!effectivenessDiv) return;

    const container = document.createElement("div");
    container.classList.add("type-container");

    const allTypes = Object.keys(typeEffectivenessData).filter(type => {
      const lowerType = type.toLowerCase();
      // Filter out types based on generation
      if (generation === 1 && (lowerType === "dark" || lowerType === "steel")) return false;
      if (generation < 6 && lowerType === "fairy") return false;
      return !['stellar', 'unknown'].includes(lowerType);
    });

    allTypes.forEach(targetType => {
      const effectivenessData = moveEffectiveness[targetType];
      const pill = document.createElement("span");
      pill.classList.add("type-pill", `type-${targetType}`);

      if (!effectivenessData) {
        pill.classList.add("greyed-out");
        pill.textContent = `${targetType} (0)`;
      } else {
        if (effectivenessData.hasStab) {
          pill.classList.add("stab-effective");
        }
        pill.textContent = `${targetType} (${effectivenessData.count})`;
      }
      container.appendChild(pill);
    });

    effectivenessDiv.innerHTML = "";
    if (container.childElementCount > 0) {
      const heading = document.createElement("h3");
      heading.textContent = "Super Effective Move Coverage";
      effectivenessDiv.appendChild(heading);
      effectivenessDiv.appendChild(container);
      effectivenessDiv.style.display = "block";
    } else {
      effectivenessDiv.style.display = "none";
    }
  }

  function calculateWeaknesses() {
    const weaknesses = {};
    console.groupCollapsed("[DEBUG] Calculating weaknesses");

    party.forEach((pokemonId) => {
      const pokemonKey = Object.keys(pokemonData)[pokemonId - 1];
      const pokemon = pokemonData[pokemonKey];
      let displayTypes = [...pokemon.types];

      if (generation < 6 && historicalTypes[pokemonId]) {
        displayTypes = historicalTypes[pokemonId].types;
      }

      const defendingTypes = displayTypes.map(type => type.toLowerCase());
      console.log(`Processing weaknesses for #${pokemonId} (${pokemonKey}) with types:`, defendingTypes);

      Object.entries(typeEffectivenessData).forEach(([attackingType, effectiveness]) => {
        const lowerAttack = attackingType.toLowerCase();
        // Filter out types based on generation
        if ((generation < 6 && lowerAttack === "fairy") ||
            (generation === 1 && (lowerAttack === "dark" || lowerAttack === "steel"))) {
          return;
        }

        let multiplier = 1;
        defendingTypes.forEach(defendingType => {
          //if ((attackingType === "ground" && defendingType === "electric") || (attackingType === "dark" && defendingType === "psychic")) {
          //  multiplier *= 2;
          //  return;
          //}
          //if (effectiveness.immune.includes(defendingType)) {
          //  multiplier = 0;
          //  return;
          //}
          if (effectiveness.strong.includes(defendingType)) multiplier *= 2;
          if (effectiveness.weak.includes(defendingType)) multiplier *= 0.5;
        });

        if (multiplier > 1) {
          weaknesses[attackingType] = weaknesses[attackingType] || { count: 0, multipliers: [] };
          weaknesses[attackingType].count++;
          weaknesses[attackingType].multipliers.push(multiplier);
        }
      });
    });

    console.log("Final weaknesses:", weaknesses);
    console.groupEnd();
    displayWeaknesses(weaknesses);
  }

  function displayWeaknesses(weaknesses) {
    const weaknessesDiv = document.getElementById("weaknesses");
    weaknessesDiv.innerHTML = "";
    const container = document.createElement("div");
    container.classList.add("type-container");

    Object.entries(weaknesses).forEach(([type, data]) => {
      // Final safeguard for Gen 1
      if (generation === 1 && (type.toLowerCase() === "dark" || type.toLowerCase() === "steel")) return;

      const pill = document.createElement("span");
      pill.classList.add("type-pill", `type-${type}`);
      const has4x = data.multipliers.some(m => m >= 4);
      pill.textContent = `${type} (${data.count})`;
      if (has4x) pill.classList.add("super-effective");
      container.appendChild(pill);
    });

    if (container.children.length > 0) {
      const heading = document.createElement("h3");
      heading.textContent = "Party Weaknesses";
      weaknessesDiv.appendChild(heading);
      weaknessesDiv.appendChild(container);

      weaknessesDiv.classList.remove("empty");
    } else {
      weaknessesDiv.classList.add("empty");
    }
  }

});
