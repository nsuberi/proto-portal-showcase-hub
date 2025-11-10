export type IngredientRef = {
  id: number;
  amount: number;
};

export type Ingredient = {
  id: number;
  name: string;
  cost_dollars: number;
  known_sources: string[];
  description: string;
  amount: number;
  units_of_measurement: string;
};

export type Step = {
  id: number;
  stage: number;
  tools_required: string[];
  time_required_min: number;
  depends_on_steps: number[];
  ingredients_required: IngredientRef[];
  description: string;
};

export type Recipe = {
  name: string;
  description: string;
  origin: string;
  ingredients: Ingredient[];
  steps: Step[];
};

export type Cuisine = "Indian" | "Japanese" | "Peruvian" | "Italian" | "Irish";

export type CuisineCluster = {
  cuisine: Cuisine;
  recipes: Recipe[];
};


