const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  cooking_time: {
    type: Number,
    required: true,
  },
  servings: {
    type: Number,
    required: true,
  },
  cost_per_serving: {
    type: Number,
    required: true,
  },
  ingredients: [
    {
      raw_material_id: {
        type: Number,
        required: true,
      },
      quantity: { 
        type: Number,
        required: true,
      },
      unit: {
        type: String,
        required: true,
      },
    },
  ],
  instructions: {
    type: String,
    required: true,
  },
});

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;