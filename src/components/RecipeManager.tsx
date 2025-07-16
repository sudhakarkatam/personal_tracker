import { useState } from 'react';
import { Plus, ArrowLeft, ChefHat, Clock, Users, Star, Edit2, Trash2 } from 'lucide-react';
import { Recipe } from '@/types';
import { useLocalStorageWithDates } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface RecipeManagerProps {
  onBack: () => void;
}

export function RecipeManager({ onBack }: RecipeManagerProps) {
  const [recipes, setRecipes] = useLocalStorageWithDates<Recipe[]>('recipes', [], ['createdAt']);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    description: '',
    ingredients: [''],
    instructions: [''],
    cookTime: 30,
    prepTime: 15,
    servings: 4,
    difficulty: 'medium' as Recipe['difficulty'],
    category: 'main',
    tags: ''
  });

  const addRecipe = () => {
    if (!newRecipe.name.trim()) return;

    const recipe: Recipe = {
      id: Date.now().toString(),
      name: newRecipe.name,
      description: newRecipe.description,
      ingredients: newRecipe.ingredients.filter(i => i.trim()),
      instructions: newRecipe.instructions.filter(i => i.trim()),
      cookTime: newRecipe.cookTime,
      prepTime: newRecipe.prepTime,
      servings: newRecipe.servings,
      difficulty: newRecipe.difficulty,
      category: newRecipe.category,
      tags: newRecipe.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      createdAt: new Date()
    };

    setRecipes(prev => [recipe, ...prev]);
    resetForm();
  };

  const updateRecipe = () => {
    if (!editingRecipe) return;

    setRecipes(prev => prev.map(recipe => recipe.id === editingRecipe.id ? editingRecipe : recipe));
    setEditingRecipe(null);
  };

  const deleteRecipe = (recipeId: string) => {
    setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
  };

  const resetForm = () => {
    setNewRecipe({
      name: '',
      description: '',
      ingredients: [''],
      instructions: [''],
      cookTime: 30,
      prepTime: 15,
      servings: 4,
      difficulty: 'medium',
      category: 'main',
      tags: ''
    });
    setIsAddingRecipe(false);
  };

  const updateIngredient = (index: number, value: string) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => i === index ? value : ing)
    }));
  };

  const addIngredient = () => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const removeIngredient = (index: number) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setNewRecipe(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => i === index ? value : inst)
    }));
  };

  const addInstruction = () => {
    setNewRecipe(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const removeInstruction = (index: number) => {
    setNewRecipe(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const toggleFavorite = (recipeId: string) => {
    setRecipes(prev =>
      prev.map(recipe =>
        recipe.id === recipeId ? { ...recipe, isFavorite: !recipe.isFavorite } : recipe
      )
    );
  };

  const getRecipesByCategory = (category: string) => {
    return recipes.filter(recipe => recipe.category === category);
  };

  const getFavoriteRecipes = () => {
    return recipes.filter(recipe => recipe.isFavorite);
  };

  const getDifficultyColor = (difficulty: Recipe['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
    }
  };

  const getRecipeStats = () => {
    return {
      total: recipes.length,
      favorites: getFavoriteRecipes().length,
      avgCookTime: recipes.length > 0 ? Math.round(recipes.reduce((sum, r) => sum + r.cookTime, 0) / recipes.length) : 0,
      categories: [...new Set(recipes.map(r => r.category))].length
    };
  };

  const stats = getRecipeStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <h2 className="text-2xl font-bold text-gray-800 flex-1">Recipe Manager</h2>
        <Button onClick={() => setIsAddingRecipe(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus size={16} className="mr-2" />
          Add Recipe
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-50 rounded-lg p-4">
          <h3 className="font-semibold text-orange-800">Total Recipes</h3>
          <p className="text-2xl font-bold text-orange-600">{stats.total}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <h3 className="font-semibold text-red-800">Favorites</h3>
          <p className="text-2xl font-bold text-red-600">{stats.favorites}</p>
        </div>
      </div>

      {/* Recipes */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({recipes.length})</TabsTrigger>
          <TabsTrigger value="favorites">Favorites ({getFavoriteRecipes().length})</TabsTrigger>
          <TabsTrigger value="main">Main ({getRecipesByCategory('main').length})</TabsTrigger>
          <TabsTrigger value="dessert">Dessert ({getRecipesByCategory('dessert').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <RecipeList recipes={recipes} onToggleFavorite={toggleFavorite} onEditRecipe={setEditingRecipe} onDeleteRecipe={deleteRecipe} />
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <RecipeList recipes={getFavoriteRecipes()} onToggleFavorite={toggleFavorite} onEditRecipe={setEditingRecipe} onDeleteRecipe={deleteRecipe} />
        </TabsContent>

        <TabsContent value="main" className="space-y-4">
          <RecipeList recipes={getRecipesByCategory('main')} onToggleFavorite={toggleFavorite} onEditRecipe={setEditingRecipe} onDeleteRecipe={deleteRecipe} />
        </TabsContent>

        <TabsContent value="dessert" className="space-y-4">
          <RecipeList recipes={getRecipesByCategory('dessert')} onToggleFavorite={toggleFavorite} onEditRecipe={setEditingRecipe} onDeleteRecipe={deleteRecipe} />
        </TabsContent>
      </Tabs>

      {/* Add Recipe Dialog */}
      <Dialog open={isAddingRecipe} onOpenChange={setIsAddingRecipe}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Recipe</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipe-name">Recipe Name</Label>
              <Input
                id="recipe-name"
                value={newRecipe.name}
                onChange={(e) => setNewRecipe(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Spaghetti Carbonara"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newRecipe.description}
                onChange={(e) => setNewRecipe(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the recipe..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newRecipe.category} onValueChange={(value) => setNewRecipe(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appetizer">Appetizer</SelectItem>
                    <SelectItem value="main">Main Course</SelectItem>
                    <SelectItem value="dessert">Dessert</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                    <SelectItem value="beverage">Beverage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={newRecipe.difficulty} onValueChange={(value: Recipe['difficulty']) => setNewRecipe(prev => ({ ...prev, difficulty: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="prepTime">Prep Time (min)</Label>
                <Input
                  id="prepTime"
                  type="number"
                  value={newRecipe.prepTime}
                  onChange={(e) => setNewRecipe(prev => ({ ...prev, prepTime: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="cookTime">Cook Time (min)</Label>
                <Input
                  id="cookTime"
                  type="number"
                  value={newRecipe.cookTime}
                  onChange={(e) => setNewRecipe(prev => ({ ...prev, cookTime: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="servings">Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  value={newRecipe.servings}
                  onChange={(e) => setNewRecipe(prev => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div>
              <Label>Ingredients</Label>
              <div className="space-y-2">
                {newRecipe.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={ingredient}
                      onChange={(e) => updateIngredient(index, e.target.value)}
                      placeholder={`Ingredient ${index + 1}`}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                      disabled={newRecipe.ingredients.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addIngredient}>
                  Add Ingredient
                </Button>
              </div>
            </div>

            <div>
              <Label>Instructions</Label>
              <div className="space-y-2">
                {newRecipe.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center mt-2 flex-shrink-0">
                      {index + 1}
                    </span>
                    <Textarea
                      value={instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      placeholder={`Step ${index + 1}`}
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeInstruction(index)}
                      disabled={newRecipe.instructions.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addInstruction}>
                  Add Step
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={newRecipe.tags}
                onChange={(e) => setNewRecipe(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="italian, pasta, comfort food"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={addRecipe}>Add Recipe</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Recipe Dialog */}
      <Dialog open={!!editingRecipe} onOpenChange={() => setEditingRecipe(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Recipe</DialogTitle>
          </DialogHeader>
          {editingRecipe && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Recipe Name</Label>
                <Input
                  id="edit-name"
                  value={editingRecipe.name}
                  onChange={(e) => setEditingRecipe(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingRecipe.description}
                  onChange={(e) => setEditingRecipe(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-prepTime">Prep Time (min)</Label>
                  <Input
                    id="edit-prepTime"
                    type="number"
                    value={editingRecipe.prepTime}
                    onChange={(e) => setEditingRecipe(prev => prev ? { ...prev, prepTime: parseInt(e.target.value) || 0 } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cookTime">Cook Time (min)</Label>
                  <Input
                    id="edit-cookTime"
                    type="number"
                    value={editingRecipe.cookTime}
                    onChange={(e) => setEditingRecipe(prev => prev ? { ...prev, cookTime: parseInt(e.target.value) || 0 } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-servings">Servings</Label>
                  <Input
                    id="edit-servings"
                    type="number"
                    value={editingRecipe.servings}
                    onChange={(e) => setEditingRecipe(prev => prev ? { ...prev, servings: parseInt(e.target.value) || 1 } : null)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingRecipe(null)}>
                  Cancel
                </Button>
                <Button onClick={updateRecipe}>Update Recipe</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecipeList({ 
  recipes, 
  onToggleFavorite,
  onEditRecipe,
  onDeleteRecipe
}: { 
  recipes: Recipe[];
  onToggleFavorite: (id: string) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (id: string) => void;
}) {
  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <ChefHat size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No recipes</h3>
        <p className="text-gray-500">Start building your recipe collection!</p>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: Recipe['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {recipes.map(recipe => (
        <Card key={recipe.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {recipe.name}
                  <button
                    onClick={() => onToggleFavorite(recipe.id)}
                    className={`${recipe.isFavorite ? 'text-red-500' : 'text-gray-300'} hover:text-red-500`}
                  >
                    <Star size={16} fill={recipe.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">{recipe.description}</p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditRecipe(recipe)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <Edit2 size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteRecipe(recipe.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{recipe.prepTime + recipe.cookTime} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>{recipe.servings} servings</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary">{recipe.category}</Badge>
                <Badge className={getDifficultyColor(recipe.difficulty)}>
                  {recipe.difficulty}
                </Badge>
              </div>

              {recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {recipe.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      #{tag}
                    </span>
                  ))}
                  {recipe.tags.length > 3 && (
                    <span className="text-xs text-gray-500">+{recipe.tags.length - 3} more</span>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-500">
                Added {format(new Date(recipe.createdAt), 'MMM d, yyyy')}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
