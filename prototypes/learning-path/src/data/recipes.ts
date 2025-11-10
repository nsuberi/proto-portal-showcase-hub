import { Cuisine, CuisineCluster, Ingredient, Step } from "../types";

function makeIngredient(id: number, name: string, cost: number, desc: string, amount: number, unit: string, sources: string[] = ["Trader Joes", "HMart"]): Ingredient {
  return {
    id,
    name,
    cost_dollars: cost,
    known_sources: sources,
    description: desc,
    amount,
    units_of_measurement: unit,
  };
}

function makeStep(id: number, stage: number, tools: string[], minutes: number, depends: number[], ingredients: { id: number; amount: number; }[], description: string): Step {
  return {
    id,
    stage,
    tools_required: tools,
    time_required_min: minutes,
    depends_on_steps: depends,
    ingredients_required: ingredients,
    description,
  };
}

const adjectives = [
  "Classic", "Herbed", "Spiced", "Rustic", "Zesty",
  "Savory", "Golden", "Smoky", "Aromatic", "Bright",
  "Velvety", "Citrus", "Roasted", "Toasted", "Hearty",
  "Crisp", "Umami", "Garden", "Fire-Kissed", "Sun-Dried"
];

const units = ["grams", "ml", "tbsp", "tsp", "unit"];

function pickSequence<T>(arr: T[], startSeed: number, count: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    out.push(arr[(startSeed + i) % arr.length]);
  }
  return out;
}

type CuisineSpec = {
  origin: string;
  nameRoots: string[];
  ingredientPool: string[];
  tools: string[];
};

type StepTemplate = {
  keys: string[]; // key ingredients that should appear
  build: (lookupId: (name: string) => number, seed: number) => Step[];
};

const TEMPLATES: Record<string, StepTemplate> = {
  // Middle Eastern
  "Shakshuka": {
    keys: ["tomatoes", "bell pepper", "onion", "eggs", "cumin", "paprika", "olive oil"],
    build: (id, seed) => [
      makeStep(1, 1, ["skillet"], 8 + (seed % 3), [], [{ id: id("olive oil"), amount: 1 }, { id: id("onion"), amount: 1 }], "Heat oil; sauté onions until translucent."),
      makeStep(2, 2, ["skillet"], 5 + (seed % 2), [1], [{ id: id("bell pepper"), amount: 1 }], "Add bell pepper; cook until softened."),
      makeStep(3, 3, ["skillet"], 10 + (seed % 4), [2], [{ id: id("tomatoes"), amount: 300 }, { id: id("cumin"), amount: 1 }, { id: id("paprika"), amount: 1 }], "Stir in tomatoes and spices; simmer to thicken."),
      makeStep(4, 4, ["skillet", "lid"], 6 + (seed % 3), [3], [{ id: id("eggs"), amount: 4 }], "Create wells; crack eggs; cover and poach until whites set."),
    ],
  },
  "Mezze Platter": {
    keys: ["tahini", "chickpeas", "cucumber", "olive oil", "lemon", "parsley"],
    build: (id, seed) => [
      makeStep(1, 1, ["bowl"], 5, [], [{ id: id("chickpeas"), amount: 200 }, { id: id("tahini"), amount: 2 }, { id: id("lemon"), amount: 1 }], "Mash chickpeas with tahini and lemon to make a quick hummus."),
      makeStep(2, 2, ["knife"], 4, [1], [{ id: id("cucumber"), amount: 1 }, { id: id("parsley"), amount: 1 }], "Slice cucumber; chop parsley."),
      makeStep(3, 3, ["plate"], 2, [2], [{ id: id("olive oil"), amount: 1 }], "Arrange hummus, cucumber, herbs; drizzle with olive oil."),
    ],
  },
  "Lentil Pilaf": {
    keys: ["bulgur", "onion", "garlic", "cumin", "olive oil"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 6, [], [{ id: id("olive oil"), amount: 1 }, { id: id("onion"), amount: 1 }], "Sauté onion in oil until soft."),
      makeStep(2, 2, ["pot"], 2, [1], [{ id: id("garlic"), amount: 1 }, { id: id("cumin"), amount: 1 }], "Add garlic and cumin; toast briefly."),
      makeStep(3, 3, ["pot", "lid"], 15 + (seed % 5), [2], [{ id: id("bulgur"), amount: 200 }], "Stir in bulgur and water; cover and steam until tender."),
      makeStep(4, 4, ["fork"], 1, [3], [], "Fluff pilaf and serve."),
    ],
  },
  "Spiced Lamb": {
    keys: ["lamb", "cumin", "paprika", "garlic", "olive oil"],
    build: (id, seed) => [
      makeStep(1, 1, ["bowl"], 5, [], [{ id: id("lamb"), amount: 300 }, { id: id("cumin"), amount: 1 }, { id: id("paprika"), amount: 1 }, { id: id("garlic"), amount: 1 }], "Marinate lamb with spices and garlic."),
      makeStep(2, 2, ["pan"], 8 + (seed % 4), [1], [], "Sear lamb in hot pan until browned outside and juicy inside."),
      makeStep(3, 3, ["plate"], 2, [2], [], "Rest briefly and slice to serve."),
    ],
  },
  "Herb Salad": {
    keys: ["parsley", "mint", "cucumber", "lemon", "olive oil"],
    build: (id, seed) => [
      makeStep(1, 1, ["knife"], 5, [], [{ id: id("parsley"), amount: 1 }, { id: id("mint"), amount: 1 }], "Roughly chop parsley and mint."),
      makeStep(2, 2, ["knife"], 3, [1], [{ id: id("cucumber"), amount: 1 }], "Dice cucumber."),
      makeStep(3, 3, ["bowl"], 2, [2], [{ id: id("lemon"), amount: 1 }, { id: id("olive oil"), amount: 1 }], "Toss with lemon juice and olive oil; season to taste."),
    ],
  },
  "Tahini Bowl": {
    keys: ["tahini", "chickpeas", "lemon", "cucumber", "olive oil"],
    build: (id, seed) => [
      makeStep(1, 1, ["bowl"], 3, [], [{ id: id("tahini"), amount: 2 }, { id: id("lemon"), amount: 1 }], "Whisk tahini with lemon and a splash of water into a sauce."),
      makeStep(2, 2, ["pan"], 4, [1], [{ id: id("chickpeas"), amount: 150 }], "Warm chickpeas briefly in a pan."),
      makeStep(3, 3, ["bowl"], 2, [2], [{ id: id("cucumber"), amount: 1 }, { id: id("olive oil"), amount: 1 }], "Assemble bowl with chickpeas, cucumber, and tahini sauce; drizzle oil."),
    ],
  },
  "Za'atar Flatbread": {
    keys: ["za'atar", "olive oil"],
    build: (id, seed) => [
      makeStep(1, 1, ["bowl"], 2, [], [{ id: id("za'atar"), amount: 1 }, { id: id("olive oil"), amount: 1 }], "Mix za'atar with olive oil to make a spread."),
      makeStep(2, 2, ["sheet pan"], 8, [1], [], "Spread over flatbread and bake until aromatic."),
      makeStep(3, 3, ["knife"], 1, [2], [], "Slice and serve warm."),
    ],
  },
  "Sumac Chicken": {
    keys: ["chicken", "sumac", "onion", "olive oil", "lemon"],
    build: (id, seed) => [
      makeStep(1, 1, ["bowl"], 10, [], [{ id: id("chicken"), amount: 400 }, { id: id("sumac"), amount: 1 }, { id: id("lemon"), amount: 1 }], "Marinate chicken with sumac and lemon."),
      makeStep(2, 2, ["sheet pan"], 25 + (seed % 10), [1], [{ id: id("onion"), amount: 1 }], "Roast with sliced onions until cooked through."),
    ],
  },
  "Harissa Veg": {
    keys: ["harissa", "tomatoes", "coriander", "olive oil"],
    build: (id, seed) => [
      makeStep(1, 1, ["bowl"], 3, [], [{ id: id("harissa"), amount: 1 }, { id: id("olive oil"), amount: 1 }], "Make a harissa oil."),
      makeStep(2, 2, ["sheet pan"], 18 + (seed % 6), [1], [{ id: id("tomatoes"), amount: 300 }], "Toss vegetables with harissa oil and roast."),
      makeStep(3, 3, ["plate"], 1, [2], [{ id: id("coriander"), amount: 1 }], "Finish with fresh coriander."),
    ],
  },
  "Couscous": {
    keys: ["couscous", "olive oil", "lemon"],
    build: (id, seed) => [
      makeStep(1, 1, ["bowl"], 1, [], [{ id: id("couscous"), amount: 200 }], "Place couscous in a bowl."),
      makeStep(2, 2, ["kettle", "bowl", "lid"], 5, [1], [], "Pour boiling water; cover and steam 5 minutes."),
      makeStep(3, 3, ["fork"], 1, [2], [{ id: id("olive oil"), amount: 1 }, { id: id("lemon"), amount: 1 }], "Fluff and dress with olive oil and lemon."),
    ],
  },

  // Indian
  "Chana Masala": {
    keys: ["chickpeas", "onion", "tomatoes", "garam masala", "cumin", "coriander", "ginger", "garlic"],
    build: (id, seed) => [
      makeStep(1, 1, ["kadai"], 6, [], [{ id: id("ghee"), amount: 1 }, { id: id("onion"), amount: 1 }], "Sauté onion in ghee until golden."),
      makeStep(2, 2, ["kadai"], 3, [1], [{ id: id("garlic"), amount: 1 }, { id: id("ginger"), amount: 1 }], "Add ginger-garlic; fry until aromatic."),
      makeStep(3, 3, ["kadai"], 8, [2], [{ id: id("tomatoes"), amount: 300 }, { id: id("cumin"), amount: 1 }, { id: id("coriander"), amount: 1 }, { id: id("garam masala"), amount: 1 }], "Cook tomatoes and spices to a thick masala."),
      makeStep(4, 4, ["kadai"], 5, [3], [{ id: id("chickpeas"), amount: 200 }], "Add chickpeas and simmer; finish with cilantro."),
    ],
  },
  "Paneer Tikka": {
    keys: ["paneer", "yogurt", "garam masala", "ginger", "garlic"],
    build: (id, seed) => [
      makeStep(1, 1, ["bowl"], 10, [], [{ id: id("yogurt"), amount: 2 }, { id: id("garlic"), amount: 1 }, { id: id("ginger"), amount: 1 }, { id: id("garam masala"), amount: 1 }], "Make spiced yogurt marinade."),
      makeStep(2, 2, ["skewers", "grill"], 8 + (seed % 5), [1], [{ id: id("paneer"), amount: 200 }], "Marinate paneer and grill or roast until charred."),
    ],
  },
  "Biryani": {
    keys: ["basmati rice", "onion", "garam masala", "cardamom", "ghee"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 10, [], [{ id: id("basmati rice"), amount: 250 }], "Parboil basmati rice; drain."),
      makeStep(2, 2, ["kadai"], 8, [1], [{ id: id("ghee"), amount: 1 }, { id: id("onion"), amount: 1 }], "Fry onions in ghee until browned."),
      makeStep(3, 3, ["pot", "lid"], 15 + (seed % 10), [2], [{ id: id("garam masala"), amount: 1 }, { id: id("cardamom"), amount: 1 }], "Layer masala and rice; steam on low heat (dum)."),
    ],
  },
  "Dal Tadka": {
    keys: ["lentils", "mustard seeds", "curry leaves", "tomatoes", "ginger", "garlic"],
    build: (id, seed) => [
      makeStep(1, 1, ["pressure cooker"], 12, [], [{ id: id("lentils"), amount: 200 }], "Cook lentils until soft."),
      makeStep(2, 2, ["pan"], 3, [1], [{ id: id("ghee"), amount: 1 }, { id: id("mustard seeds"), amount: 1 }, { id: id("curry leaves"), amount: 1 }], "Temper mustard seeds and curry leaves in ghee."),
      makeStep(3, 3, ["pan"], 5, [2], [{ id: id("tomatoes"), amount: 200 }, { id: id("ginger"), amount: 1 }, { id: id("garlic"), amount: 1 }], "Add tomatoes and aromatics; mix into dal and simmer."),
    ],
  },
  "Aloo Gobi": {
    keys: ["potatoes", "cauliflower", "turmeric", "cumin", "cilantro"],
    build: (id, seed) => [
      makeStep(1, 1, ["kadai"], 6, [], [{ id: id("ghee"), amount: 1 }, { id: id("cumin"), amount: 1 }], "Heat ghee; crackle cumin."),
      makeStep(2, 2, ["kadai"], 10, [1], [{ id: id("potatoes"), amount: 2 }, { id: id("cauliflower"), amount: 1 }, { id: id("turmeric"), amount: 1 }], "Add potatoes and cauliflower; cook with turmeric."),
      makeStep(3, 3, ["kadai"], 3, [2], [{ id: id("cilantro"), amount: 1 }], "Finish with chopped cilantro."),
    ],
  },
  "Masala Dosa": {
    keys: ["potatoes", "mustard seeds", "curry leaves"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 12, [], [{ id: id("potatoes"), amount: 3 }], "Boil and mash potatoes."),
      makeStep(2, 2, ["pan"], 5, [1], [{ id: id("ghee"), amount: 1 }, { id: id("mustard seeds"), amount: 1 }, { id: id("curry leaves"), amount: 1 }], "Make a tempering; mix into potato masala."),
      makeStep(3, 3, ["tawa"], 4, [2], [], "Spread dosa batter on tawa; fill with masala and fold."),
    ],
  },
  "Sambar": {
    keys: ["lentils", "curry leaves", "mustard seeds", "tomatoes"],
    build: (id, seed) => [
      makeStep(1, 1, ["pressure cooker"], 12, [], [{ id: id("lentils"), amount: 200 }], "Cook lentils until soft."),
      makeStep(2, 2, ["pot"], 10, [1], [{ id: id("tomatoes"), amount: 200 }], "Simmer with tomatoes and sambar spices."),
      makeStep(3, 3, ["pan"], 3, [2], [{ id: id("ghee"), amount: 1 }, { id: id("mustard seeds"), amount: 1 }, { id: id("curry leaves"), amount: 1 }], "Temper mustard seeds and curry leaves; add to sambar."),
    ],
  },
  "Rogan Josh": {
    keys: ["beef", "yogurt", "garam masala", "ginger", "garlic"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 8, [], [{ id: id("beef"), amount: 300 }], "Brown meat in pot."),
      makeStep(2, 2, ["pot"], 5, [1], [{ id: id("yogurt"), amount: 1 }, { id: id("ginger"), amount: 1 }, { id: id("garlic"), amount: 1 }, { id: id("garam masala"), amount: 1 }], "Add yogurt, ginger-garlic, and spices."),
      makeStep(3, 3, ["pot"], 30 + (seed % 15), [2], [], "Simmer until tender and rich."),
    ],
  },
  "Butter Chicken": {
    keys: ["chicken", "tomatoes", "butter", "garam masala"],
    build: (id, seed) => [
      makeStep(1, 1, ["bowl"], 10, [], [{ id: id("yogurt"), amount: 1 }, { id: id("garam masala"), amount: 1 }], "Marinate chicken in yogurt and spices."),
      makeStep(2, 2, ["kadai"], 8, [1], [{ id: id("butter"), amount: 1 }, { id: id("tomatoes"), amount: 300 }], "Cook butter-tomato sauce until smooth."),
      makeStep(3, 3, ["kadai"], 10 + (seed % 5), [2], [{ id: id("chicken"), amount: 400 }], "Add chicken; simmer until cooked."),
    ],
  },
  "Palak Paneer": {
    keys: ["paneer"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 5, [], [], "Blanch spinach; puree."),
      makeStep(2, 2, ["kadai"], 6, [1], [{ id: id("garlic"), amount: 1 }, { id: id("ginger"), amount: 1 }], "Sauté ginger-garlic; add spinach puree."),
      makeStep(3, 3, ["kadai"], 4, [2], [{ id: id("paneer"), amount: 200 }], "Simmer paneer cubes in palak."),
    ],
  },
  // Japanese
  "Onigiri": {
    keys: ["short-grain rice", "nori", "umeboshi", "salt"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 20 + (seed % 5), [], [{ id: id("short-grain rice"), amount: 300 }], "Cook rice; cool until warm."),
      makeStep(2, 2, ["hands", "bowl"], 5, [1], [{ id: id("salt"), amount: 1 }, { id: id("umeboshi"), amount: 1 }], "Salt hands; press rice around filling."),
      makeStep(3, 3, ["knife"], 1, [2], [{ id: id("nori"), amount: 1 }], "Wrap with nori."),
    ],
  },
  "Donburi": {
    keys: ["short-grain rice", "soy sauce", "mirin", "egg"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 20, [], [{ id: id("short-grain rice"), amount: 300 }], "Cook rice."),
      makeStep(2, 2, ["pan"], 5 + (seed % 3), [1], [{ id: id("soy sauce"), amount: 1 }, { id: id("mirin"), amount: 1 }], "Make a quick sauce in pan."),
      makeStep(3, 3, ["pan"], 3, [2], [{ id: id("egg"), amount: 1 }], "Gently set beaten egg in sauce and serve over rice."),
    ],
  },
  "Karaage": {
    keys: ["chicken", "soy sauce", "ginger", "garlic"],
    build: (id, seed) => [
      makeStep(1, 1, ["bowl"], 10, [], [{ id: id("chicken"), amount: 300 }, { id: id("soy sauce"), amount: 1 }, { id: id("ginger"), amount: 1 }, { id: id("garlic"), amount: 1 }], "Marinate chicken with soy, ginger, and garlic."),
      makeStep(2, 2, ["pan"], 8 + (seed % 4), [1], [], "Fry until golden and cooked through."),
    ],
  },
  "Udon Soup": {
    keys: ["dashi", "soy sauce", "scallions", "shiitake"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 10, [], [{ id: id("dashi"), amount: 400 }, { id: id("soy sauce"), amount: 1 }], "Bring dashi to a simmer and season with soy."),
      makeStep(2, 2, ["pot"], 5, [1], [{ id: id("shiitake"), amount: 1 }], "Add sliced shiitake to soften."),
      makeStep(3, 3, ["bowl"], 1, [2], [{ id: id("scallions"), amount: 1 }], "Ladle into bowl and top with scallions."),
    ],
  },
  "Miso Stir-Fry": {
    keys: ["miso", "tofu", "sesame oil", "ginger", "garlic"],
    build: (id, seed) => [
      makeStep(1, 1, ["wok"], 5, [], [{ id: id("sesame oil"), amount: 1 }, { id: id("ginger"), amount: 1 }, { id: id("garlic"), amount: 1 }], "Stir-fry aromatics in sesame oil."),
      makeStep(2, 2, ["wok"], 6 + (seed % 3), [1], [{ id: id("tofu"), amount: 200 }], "Add tofu; brown edges."),
      makeStep(3, 3, ["wok"], 2, [2], [{ id: id("miso"), amount: 1 }], "Toss with miso slurry to glaze."),
    ],
  },
  "Omelette": {
    keys: ["egg", "dashi", "soy sauce"],
    build: (id, seed) => [
      makeStep(1, 1, ["bowl"], 2, [], [{ id: id("egg"), amount: 2 }, { id: id("dashi"), amount: 1 }, { id: id("soy sauce"), amount: 1 }], "Beat eggs with dashi and a touch of soy."),
      makeStep(2, 2, ["pan"], 4, [1], [], "Cook in thin layers, rolling to form an omelette."),
    ],
  },
  "Soba Salad": {
    keys: ["tofu", "daikon", "soy sauce", "sesame oil"],
    build: (id, seed) => [
      makeStep(1, 1, ["knife"], 4, [], [{ id: id("daikon"), amount: 1 }], "Julienne daikon."),
      makeStep(2, 2, ["pan"], 5, [1], [{ id: id("tofu"), amount: 200 }], "Sear tofu until golden."),
      makeStep(3, 3, ["bowl"], 2, [2], [{ id: id("soy sauce"), amount: 1 }, { id: id("sesame oil"), amount: 1 }], "Toss together with dressing."),
    ],
  },
  "Teriyaki Bowl": {
    keys: ["short-grain rice", "soy sauce", "mirin", "ginger"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 20, [], [{ id: id("short-grain rice"), amount: 300 }], "Cook rice."),
      makeStep(2, 2, ["pan"], 6, [1], [{ id: id("soy sauce"), amount: 1 }, { id: id("mirin"), amount: 1 }, { id: id("ginger"), amount: 1 }], "Reduce soy-mirin-ginger into a glossy sauce."),
      makeStep(3, 3, ["bowl"], 1, [2], [], "Assemble bowl and drizzle with teriyaki sauce."),
    ],
  },
  "Yaki Onigiri": {
    keys: ["short-grain rice", "soy sauce"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 20, [], [{ id: id("short-grain rice"), amount: 300 }], "Cook rice and form triangles."),
      makeStep(2, 2, ["pan"], 6 + (seed % 4), [1], [{ id: id("soy sauce"), amount: 1 }], "Pan-sear onigiri; brush with soy until lightly crisp."),
    ],
  },
  "Tofu Katsu": {
    keys: ["tofu", "soy sauce"],
    build: (id, seed) => [
      makeStep(1, 1, ["knife"], 2, [], [{ id: id("tofu"), amount: 200 }], "Slice firm tofu into cutlets."),
      makeStep(2, 2, ["pan"], 6, [1], [], "Bread and shallow-fry until golden."),
      makeStep(3, 3, ["plate"], 1, [2], [{ id: id("soy sauce"), amount: 1 }], "Serve with a soy-based sauce."),
    ],
  },

  // Peruvian
  "Lomo Saltado": {
    keys: ["beef sirloin", "red onion", "tomatoes", "soy sauce", "potatoes"],
    build: (id, seed) => [
      makeStep(1, 1, ["wok"], 3, [], [{ id: id("beef sirloin"), amount: 300 }], "Sear beef over high heat."),
      makeStep(2, 2, ["wok"], 2, [1], [{ id: id("red onion"), amount: 1 }], "Add red onion; toss briefly."),
      makeStep(3, 3, ["wok"], 2, [2], [{ id: id("tomatoes"), amount: 2 }, { id: id("soy sauce"), amount: 1 }], "Add tomatoes and soy; stir-fry."),
      makeStep(4, 4, ["wok"], 1, [3], [{ id: id("potatoes"), amount: 200 }], "Fold in fries and serve."),
    ],
  },
  "Aji de Gallina": {
    keys: ["chicken", "aji amarillo", "garlic"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 15, [], [{ id: id("chicken"), amount: 300 }], "Poach or simmer shredded chicken."),
      makeStep(2, 2, ["pan"], 6, [1], [{ id: id("aji amarillo"), amount: 1 }, { id: id("garlic"), amount: 1 }], "Make a creamy aji amarillo sauce."),
      makeStep(3, 3, ["pan"], 3, [2], [], "Fold chicken into the sauce and warm through."),
    ],
  },
  "Causa": {
    keys: ["potatoes", "lime"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 15, [], [{ id: id("potatoes"), amount: 3 }], "Boil potatoes until tender; mash."),
      makeStep(2, 2, ["bowl"], 2, [1], [{ id: id("lime"), amount: 1 }], "Season mash with lime and salt."),
      makeStep(3, 3, ["mold"], 5, [2], [], "Layer and chill in a mold; serve cold."),
    ],
  },
  "Arroz Chaufa": {
    keys: ["rice", "soy sauce", "egg"],
    build: (id, seed) => [
      makeStep(1, 1, ["wok"], 5, [], [{ id: id("rice"), amount: 250 }], "Stir-fry day-old rice."),
      makeStep(2, 2, ["wok"], 2, [1], [{ id: id("egg"), amount: 1 }], "Scramble egg into the rice."),
      makeStep(3, 3, ["wok"], 1, [2], [{ id: id("soy sauce"), amount: 1 }], "Season with soy and toss."),
    ],
  },
  "Ceviche": {
    keys: ["fish", "lime", "red onion", "cilantro"],
    build: (id, seed) => [
      makeStep(1, 1, ["knife"], 5, [], [{ id: id("fish"), amount: 300 }], "Dice firm white fish."),
      makeStep(2, 2, ["bowl"], 12 + (seed % 6), [1], [{ id: id("lime"), amount: 2 }, { id: id("red onion"), amount: 1 }], "Marinate with lime and sliced onion."),
      makeStep(3, 3, ["bowl"], 1, [2], [{ id: id("cilantro"), amount: 1 }], "Finish with chopped cilantro and serve."),
    ],
  },
  "Papas Huancaina": {
    keys: ["potatoes", "aji amarillo"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 12, [], [{ id: id("potatoes"), amount: 3 }], "Boil potatoes until tender."),
      makeStep(2, 2, ["blender"], 3, [1], [{ id: id("aji amarillo"), amount: 1 }], "Blend a creamy huancaina sauce."),
      makeStep(3, 3, ["plate"], 1, [2], [], "Serve sliced potatoes with sauce."),
    ],
  },
  "Anticuchos": {
    keys: ["beef sirloin", "garlic", "aji amarillo"],
    build: (id, seed) => [
      makeStep(1, 1, ["bowl"], 10, [], [{ id: id("beef sirloin"), amount: 300 }, { id: id("garlic"), amount: 1 }, { id: id("aji amarillo"), amount: 1 }], "Marinate beef cubes."),
      makeStep(2, 2, ["grill"], 8 + (seed % 5), [1], [], "Grill skewers over high heat."),
    ],
  },
  "Seco": {
    keys: ["cilantro", "beef sirloin", "garlic"],
    build: (id, seed) => [
      makeStep(1, 1, ["pan"], 6, [], [{ id: id("beef sirloin"), amount: 300 }], "Brown beef cubes."),
      makeStep(2, 2, ["pot"], 20 + (seed % 10), [1], [{ id: id("cilantro"), amount: 1 }, { id: id("garlic"), amount: 1 }], "Simmer with cilantro puree until tender."),
    ],
  },
  "Quinoto": {
    keys: ["quinoa", "stock", "onion", "parmesan"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 4, [], [{ id: id("onion"), amount: 1 }], "Sweat onions in oil."),
      makeStep(2, 2, ["pot"], 18 + (seed % 6), [1], [{ id: id("quinoa"), amount: 200 }, { id: id("stock"), amount: 400 }], "Add quinoa; ladle in stock until creamy."),
      makeStep(3, 3, ["pot"], 1, [2], [{ id: id("parmesan"), amount: 1 }], "Finish with cheese."),
    ],
  },
  "Tacu Tacu": {
    keys: ["rice", "egg", "plantain"],
    build: (id, seed) => [
      makeStep(1, 1, ["pan"], 5, [], [{ id: id("rice"), amount: 200 }], "Combine leftover rice into a patty."),
      makeStep(2, 2, ["pan"], 6, [1], [{ id: id("plantain"), amount: 1 }], "Pan-fry with sliced plantain until crisp."),
      makeStep(3, 3, ["pan"], 3, [2], [{ id: id("egg"), amount: 1 }], "Top with a fried egg."),
    ],
  },

  // Italian
  "Pasta alla Norma": {
    keys: ["eggplant", "tomato passata", "pasta", "ricotta salata", "olive oil", "garlic"],
    build: (id, seed) => [
      makeStep(1, 1, ["pan"], 8, [], [{ id: id("olive oil"), amount: 2 }, { id: id("eggplant"), amount: 1 }], "Fry eggplant cubes until golden."),
      makeStep(2, 2, ["pot"], 10, [], [{ id: id("pasta"), amount: 250 }], "Boil pasta until al dente."),
      makeStep(3, 3, ["pan"], 8, [1], [{ id: id("garlic"), amount: 1 }, { id: id("tomato passata"), amount: 300 }], "Simmer passata with garlic."),
      makeStep(4, 4, ["pan"], 2, [2, 3], [{ id: id("ricotta salata"), amount: 1 }], "Combine pasta and sauce; finish with ricotta salata."),
    ],
  },
  "Risotto": {
    keys: ["arborio rice", "white wine", "stock", "parmesan", "onion"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 5, [], [{ id: id("onion"), amount: 1 }], "Sweat onion in butter or oil."),
      makeStep(2, 2, ["pot"], 2, [1], [{ id: id("arborio rice"), amount: 200 }], "Toast rice lightly."),
      makeStep(3, 3, ["pot"], 12 + (seed % 6), [2], [{ id: id("white wine"), amount: 1 }, { id: id("stock"), amount: 400 }], "Deglaze with wine; add warm stock gradually, stirring."),
      makeStep(4, 4, ["pot"], 1, [3], [{ id: id("parmesan"), amount: 1 }], "Finish with cheese and rest briefly."),
    ],
  },
  "Bruschetta": {
    keys: ["tomatoes", "basil", "olive oil", "garlic"],
    build: (id, seed) => [
      makeStep(1, 1, ["knife"], 5, [], [{ id: id("tomatoes"), amount: 2 }, { id: id("basil"), amount: 1 }], "Dice tomatoes and chop basil."),
      makeStep(2, 2, ["bowl"], 2, [1], [{ id: id("olive oil"), amount: 1 }], "Dress with olive oil and salt."),
      makeStep(3, 3, ["knife"], 1, [2], [{ id: id("garlic"), amount: 1 }], "Rub toast with garlic and top with mixture."),
    ],
  },
  "Ragu": {
    keys: ["beef", "tomatoes", "onion", "carrot", "celery"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 6, [], [{ id: id("onion"), amount: 1 }, { id: id("carrot"), amount: 1 }, { id: id("celery"), amount: 1 }], "Sweat soffritto of onion, carrot, celery."),
      makeStep(2, 2, ["pot"], 10, [1], [{ id: id("beef"), amount: 300 }], "Brown beef."),
      makeStep(3, 3, ["pot"], 30 + (seed % 20), [2], [{ id: id("tomatoes"), amount: 300 }], "Add tomatoes and simmer slowly."),
    ],
  },
  "Minestrone": {
    keys: ["onion", "carrot", "celery", "tomatoes"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 6, [], [{ id: id("onion"), amount: 1 }, { id: id("carrot"), amount: 1 }, { id: id("celery"), amount: 1 }], "Sweat aromatics."),
      makeStep(2, 2, ["pot"], 20 + (seed % 10), [1], [{ id: id("tomatoes"), amount: 300 }], "Add tomatoes and water; simmer with vegetables."),
    ],
  },
  "Polenta": {
    keys: ["polenta", "stock", "parmesan"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 15 + (seed % 10), [], [{ id: id("stock"), amount: 500 }, { id: id("polenta"), amount: 200 }], "Simmer polenta in stock, stirring."),
      makeStep(2, 2, ["pot"], 1, [1], [{ id: id("parmesan"), amount: 1 }], "Finish with parmesan."),
    ],
  },
  "Parmigiana": {
    keys: ["eggplant", "tomatoes", "parmesan", "olive oil"],
    build: (id, seed) => [
      makeStep(1, 1, ["pan"], 8, [], [{ id: id("olive oil"), amount: 2 }, { id: id("eggplant"), amount: 1 }], "Fry eggplant slices until golden."),
      makeStep(2, 2, ["baking dish"], 20 + (seed % 10), [1], [{ id: id("tomatoes"), amount: 300 }, { id: id("parmesan"), amount: 1 }], "Layer with tomato and cheese; bake until bubbling."),
    ],
  },
  "Gnocchi": {
    keys: ["potatoes", "flour", "parmesan"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 15, [], [{ id: id("potatoes"), amount: 3 }], "Boil potatoes; mash."),
      makeStep(2, 2, ["board"], 10, [1], [{ id: id("flour"), amount: 1 }], "Mix with flour; roll and cut gnocchi."),
      makeStep(3, 3, ["pot"], 3, [2], [], "Boil until they float; toss with butter and cheese."),
    ],
  },
  "Pesto Pasta": {
    keys: ["basil", "olive oil", "parmesan", "pasta", "garlic"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 10, [], [{ id: id("pasta"), amount: 250 }], "Boil pasta."),
      makeStep(2, 2, ["mortar"], 3, [1], [{ id: id("basil"), amount: 1 }, { id: id("garlic"), amount: 1 }, { id: id("olive oil"), amount: 2 }], "Pound basil, garlic, and oil into a paste."),
      makeStep(3, 3, ["bowl"], 1, [2], [{ id: id("parmesan"), amount: 1 }], "Toss pasta with pesto and cheese."),
    ],
  },
  "Osso Buco": {
    keys: ["beef", "onion", "carrot", "celery", "stock"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 8, [], [{ id: id("beef"), amount: 400 }], "Brown shanks or beef pieces."),
      makeStep(2, 2, ["pot"], 6, [1], [{ id: id("onion"), amount: 1 }, { id: id("carrot"), amount: 1 }, { id: id("celery"), amount: 1 }], "Add soffritto and soften."),
      makeStep(3, 3, ["pot"], 45 + (seed % 15), [2], [{ id: id("stock"), amount: 500 }], "Braise slowly in stock until tender."),
    ],
  },

  // Irish
  "Irish Stew": {
    keys: ["lamb shoulder", "potatoes", "onions", "carrots", "stock"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 6, [], [{ id: id("lamb shoulder"), amount: 400 }], "Brown lamb."),
      makeStep(2, 2, ["pot"], 5, [1], [{ id: id("onions"), amount: 2 }, { id: id("carrots"), amount: 2 }], "Add onions and carrots."),
      makeStep(3, 3, ["pot", "lid"], 60 + (seed % 20), [2], [{ id: id("stock"), amount: 600 }, { id: id("potatoes"), amount: 3 }], "Add stock and potatoes; simmer until tender."),
    ],
  },
  "Colcannon": {
    keys: ["potatoes", "cabbage", "butter"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 15, [], [{ id: id("potatoes"), amount: 4 }], "Boil potatoes and mash."),
      makeStep(2, 2, ["pan"], 5, [1], [{ id: id("cabbage"), amount: 1 }], "Sauté shredded cabbage in butter."),
      makeStep(3, 3, ["bowl"], 2, [2], [{ id: id("butter"), amount: 1 }], "Fold cabbage and butter into mash."),
    ],
  },
  "Soda Bread": {
    keys: ["flour", "buttermilk"],
    build: (id, seed) => [
      makeStep(1, 1, ["bowl"], 5, [], [{ id: id("flour"), amount: 1 }], "Mix dry ingredients."),
      makeStep(2, 2, ["bowl"], 2, [1], [{ id: id("buttermilk"), amount: 1 }], "Add buttermilk; bring together."),
      makeStep(3, 3, ["oven"], 30 + (seed % 10), [2], [], "Shape and bake until crusty."),
    ],
  },
  "Coddle": {
    keys: ["bacon", "potatoes", "onions", "stock"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 5, [], [{ id: id("bacon"), amount: 200 }], "Render bacon briefly."),
      makeStep(2, 2, ["pot"], 25 + (seed % 10), [1], [{ id: id("potatoes"), amount: 3 }, { id: id("onions"), amount: 1 }, { id: id("stock"), amount: 400 }], "Layer potatoes and onions with bacon; simmer in stock."),
    ],
  },
  "Seafood Chowder": {
    keys: ["fish", "cream", "leek", "stock"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 5, [], [{ id: id("leek"), amount: 1 }], "Sweat leeks."),
      makeStep(2, 2, ["pot"], 8, [1], [{ id: id("stock"), amount: 400 }, { id: id("fish"), amount: 300 }], "Simmer fish gently in stock."),
      makeStep(3, 3, ["pot"], 2, [2], [{ id: id("cream"), amount: 1 }], "Finish with cream."),
    ],
  },
  "Boxty": {
    keys: ["potatoes", "flour"],
    build: (id, seed) => [
      makeStep(1, 1, ["grater"], 4, [], [{ id: id("potatoes"), amount: 2 }], "Grate raw potato; squeeze out liquid."),
      makeStep(2, 2, ["bowl"], 2, [1], [{ id: id("flour"), amount: 1 }], "Mix with mash/flour to form batter."),
      makeStep(3, 3, ["pan"], 6, [2], [], "Pan-fry pancakes until golden."),
    ],
  },
  "Shepherd's Pie": {
    keys: ["beef", "onions", "carrots", "stock", "potatoes"],
    build: (id, seed) => [
      makeStep(1, 1, ["pan"], 6, [], [{ id: id("beef"), amount: 300 }], "Brown minced beef."),
      makeStep(2, 2, ["pan"], 5, [1], [{ id: id("onions"), amount: 1 }, { id: id("carrots"), amount: 1 }], "Add onions and carrots; soften."),
      makeStep(3, 3, ["pan"], 10, [2], [{ id: id("stock"), amount: 200 }], "Add stock; thicken slightly."),
      makeStep(4, 4, ["baking dish"], 20 + (seed % 10), [3], [{ id: id("potatoes"), amount: 3 }], "Top with mashed potatoes; bake until browned."),
    ],
  },
  "Bacon & Cabbage": {
    keys: ["bacon", "cabbage", "potatoes"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 10, [], [{ id: id("bacon"), amount: 300 }], "Simmer bacon joint."),
      makeStep(2, 2, ["pot"], 8, [1], [{ id: id("cabbage"), amount: 1 }], "Boil cabbage until tender."),
      makeStep(3, 3, ["pot"], 12, [1], [{ id: id("potatoes"), amount: 3 }], "Boil potatoes; serve together."),
    ],
  },
  "Brown Bread": {
    keys: ["flour", "oats"],
    build: (id, seed) => [
      makeStep(1, 1, ["bowl"], 5, [], [{ id: id("flour"), amount: 1 }, { id: id("oats"), amount: 1 }], "Mix flours and oats with raising agents."),
      makeStep(2, 2, ["oven"], 35 + (seed % 10), [1], [], "Bake until loaf sounds hollow."),
    ],
  },
  "Oat Porridge": {
    keys: ["oats", "cream"],
    build: (id, seed) => [
      makeStep(1, 1, ["pot"], 5 + (seed % 4), [], [{ id: id("oats"), amount: 1 }], "Simmer oats with water until creamy."),
      makeStep(2, 2, ["bowl"], 1, [1], [{ id: id("cream"), amount: 1 }], "Finish with a splash of cream and salt."),
    ],
  },
};

function genRecipesForCuisine(spec: CuisineSpec, count: number, cuisineLabel: string) {
  const recipes = [];
  for (let i = 0; i < count; i++) {
    const adj = adjectives[(i * 3) % adjectives.length];
    const root = spec.nameRoots[(i * 2) % spec.nameRoots.length];
    const name = `${adj} ${root}`;
    // Vary ingredients per recipe, ensuring key ingredients appear if template exists
    const tpl = TEMPLATES[root];
    const need = tpl?.keys ?? [];
    const desiredCount = 7;
    const baseSeq = pickSequence(spec.ingredientPool, i, desiredCount);
    const uniqueSet = new Set<string>([...need, ...baseSeq]);
    const ingredientNames = Array.from(uniqueSet).slice(0, desiredCount);
    const ingredients: Ingredient[] = ingredientNames.map((ing, idx) => {
      const unit = units[(idx + i) % units.length];
      const amount = unit === "unit" ? (1 + ((idx + i) % 3)) : 50 + ((idx * 13 + i * 7) % 200);
      const cost = 1 + ((idx + i) % 6);
      return makeIngredient(idx + 1, ing, cost, `${adj.toLowerCase()} ${ing}`, amount, unit);
    });

    // Steps from template if available; otherwise fallback generic but structured
    const nameToId = new Map<string, number>();
    ingredients.forEach((ing, idx) => nameToId.set(ing.name, idx + 1));
    const lookupId = (n: string) => nameToId.get(n) ?? 1;
    const steps: Step[] = tpl
      ? tpl.build(lookupId, i)
      : [
          makeStep(1, 1, ["pan"], 6, [], [{ id: 1, amount: 1 }], `Sauté aromatics for ${root}.`),
          makeStep(2, 2, ["pot"], 12, [1], [{ id: 2, amount: 1 }, { id: 3, amount: 1 }], `Add base ingredients and simmer.`),
          makeStep(3, 3, ["plate"], 2, [2], [], `Season and serve.`),
        ];

    recipes.push({
      name,
      description: `A ${adj.toLowerCase()} take on ${root} from ${spec.origin}.`,
      origin: spec.origin,
      ingredients,
      steps,
    });
  }
  return recipes;
}

const specs: Record<Cuisine, CuisineSpec> = {
  "Indian": {
    origin: "India",
    nameRoots: ["Chana Masala", "Paneer Tikka", "Biryani", "Dal Tadka", "Aloo Gobi", "Masala Dosa", "Sambar", "Rogan Josh", "Butter Chicken", "Palak Paneer"],
    ingredientPool: ["tomatoes", "onion", "garlic", "ginger", "cumin", "coriander", "turmeric", "garam masala", "chili", "cilantro", "yogurt", "paneer", "ghee", "basmati rice", "lentils", "potatoes", "cauliflower", "mustard seeds", "curry leaves", "cardamom", "butter", "spinach?"],
    tools: ["kadai", "pot", "pressure cooker", "tawa", "mortar", "pan", "skewers", "grill"],
  },
  "Japanese": {
    origin: "Japan",
    nameRoots: ["Onigiri", "Donburi", "Karaage", "Udon Soup", "Miso Stir-Fry", "Omelette", "Soba Salad", "Teriyaki Bowl", "Yaki Onigiri", "Tofu Katsu"],
    ingredientPool: ["short-grain rice", "nori", "umeboshi", "soy sauce", "mirin", "miso", "scallions", "ginger", "garlic", "tofu", "egg", "sesame oil", "daikon", "shiitake", "dashi"],
    tools: ["pot", "wok", "knife", "bowl", "pan", "steamer"],
  },
  "Peruvian": {
    origin: "Peru",
    nameRoots: ["Lomo Saltado", "Aji de Gallina", "Causa", "Arroz Chaufa", "Ceviche", "Papas Huancaina", "Anticuchos", "Seco", "Quinoto", "Tacu Tacu"],
    ingredientPool: ["beef sirloin", "chicken", "aji amarillo", "red onion", "tomatoes", "soy sauce", "potatoes", "rice", "lime", "cilantro", "garlic", "ginger", "egg", "plantain", "quinoa"],
    tools: ["wok", "pot", "knife", "bowl", "grill", "skillet"],
  },
  "Italian": {
    origin: "Italy",
    nameRoots: ["Pasta alla Norma", "Risotto", "Bruschetta", "Ragu", "Minestrone", "Polenta", "Parmigiana", "Gnocchi", "Pesto Pasta", "Osso Buco"],
    ingredientPool: ["eggplant", "tomato passata", "pasta", "ricotta salata", "olive oil", "garlic", "basil", "parmesan", "arborio rice", "white wine", "celery", "carrot", "onion", "beef", "tomatoes"],
    tools: ["pan", "pot", "ladle", "grater", "sheet pan", "knife"],
  },
  "Irish": {
    origin: "Ireland",
    nameRoots: ["Irish Stew", "Colcannon", "Soda Bread", "Coddle", "Seafood Chowder", "Boxty", "Shepherd's Pie", "Bacon & Cabbage", "Brown Bread", "Oat Porridge"],
    ingredientPool: ["lamb shoulder", "potatoes", "onions", "carrots", "stock", "butter", "cabbage", "bacon", "flour", "oats", "cream", "leek", "parsley", "thyme", "barley"],
    tools: ["pot", "lid", "baking dish", "knife", "pan", "ladle"],
  },
};

export const cuisineClusters: CuisineCluster[] = (Object.keys(specs) as Cuisine[]).map((cuisine) => {
  const spec = specs[cuisine];
  return {
    cuisine,
    recipes: genRecipesForCuisine(spec, 15, cuisine),
  };
});

// Deterministic initial progress (0..3) per recipe using a seeded PRNG
function stringToSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const initialRecipeProgress: Record<string, number> = (() => {
  const progress: Record<string, number> = {};
  for (const cluster of cuisineClusters) {
    for (const r of cluster.recipes) {
      const rng = mulberry32(stringToSeed(`${cluster.cuisine}|${r.name}`));
      progress[r.name] = Math.floor(rng() * 4); // 0..3
    }
  }
  return progress;
})();


