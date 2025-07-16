
import { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowLeft, Clock, Users, ChefHat, Search, Filter, Download, Upload, Settings } from 'lucide-react';
import { Recipe } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RecipeManagerEnhancedProps {
  onBack: () => void;
}

export function RecipeManagerEnhanced({ onBack }: RecipeManagerEnhancedProps) {
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>('recipesEnhanced', []);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRecipeId, setDeletingRecipeId] = useState<string | null>(null);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [showBulkActions, setShowBulkActions] = useState(false);

  const [newRecipe, setNewRecipe] = useState({
    name: '',
    description: '',
    ingredients: [''],
    instructions: [''],
    cookTime: 30,
    prepTime: 15,
    servings: 4,
    difficulty: 'medium' as Recipe['difficulty'],
    category: 'main-course',
    tags: [] as string[],
    rating: undefined as number | undefined,
    image: '',
    nutritionalInfo: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    }
  });

  const categories = [
    'appetizer', 'main-course', 'dessert', 'beverage', 'soup', 'salad', 
    'breakfast', 'lunch', 'dinner', 'snack', 'side-dish', 'sauce'
  ];

  const difficulties = ['easy', 'medium', 'hard'] as const;

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
      tags: newRecipe.tags,
      rating: newRecipe.rating,
      image: newRecipe.image,
      nutritionalInfo: newRecipe.nutritionalInfo,
      createdAt: new Date()
    };

    setRecipes(prev => [...prev, recipe]);
    resetForm();
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const updateRecipe = () => {
    if (!editingRecipe) return;

    setRecipes(prev =>
      prev.map(recipe =>
        recipe.id === editingRecipe.id ? editingRecipe : recipe
      )
    );
    setEditingRecipe(null);
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const confirmDeleteRecipe = (recipeId: string) => {
    setDeletingRecipeId(recipeId);
    setShowDeleteConfirm(true);
  };

  const deleteRecipe = () => {
    if (!deletingRecipeId) return;
    
    setRecipes(prev => prev.filter(recipe => recipe.id !== deletingRecipeId));
    setShowDeleteConfirm(false);
    setDeletingRecipeId(null);
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const handleBulkDelete = () => {
    if (selectedRecipes.size === 0) return;
    
    setRecipes(prev => prev.filter(recipe => !selectedRecipes.has(recipe.id)));
    setSelectedRecipes(new Set());
    setShowBulkActions(false);
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const toggleRecipeSelection = (recipeId: string) => {
    const newSelected = new Set(selectedRecipes);
    if (newSelected.has(recipeId)) {
      newSelected.delete(recipeId);
    } else {
      newSelected.add(recipeId);
    }
    setSelectedRecipes(newSelected);
  };

  const selectAllRecipes = () => {
    if (selectedRecipes.size === filteredRecipes.length) {
      setSelectedRecipes(new Set());
    } else {
      setSelectedRecipes(new Set(filteredRecipes.map(recipe => recipe.id)));
    }
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
      category: 'main-course',
      tags: [],
      rating: undefined,
      image: '',
      nutritionalInfo: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      }
    });
    setIsAddingRecipe(false);
  };

  const clearAllRecipes = () => {
    setRecipes([]);
    setSelectedRecipes(new Set());
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const exportData = () => {
    const dataStr = JSON.stringify(recipes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recipes-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const addIngredient = () => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const updateIngredient = (index: number, value: string) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => i === index ? value : ing)
    }));
  };

  const removeIngredient = (index: number) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const addInstruction = () => {
    setNewRecipe(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setNewRecipe(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => i === index ? value : inst)
    }));
  };

  const removeInstruction = (index: number) => {
    setNewRecipe(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || recipe.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || recipe.difficulty === difficultyFilter;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: Recipe['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <h2 className="text-2xl font-bold text-gray-800 flex-1">Recipe Manager Enhanced</h2>
        <div className="flex gap-2">
          <Button onClick={exportData} variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsAddingRecipe(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus size={16} className="mr-2" />
            Add Recipe
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search recipes..."
                className="pl-10"
              />
            </div>
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {difficulties.map(difficulty => (
                <SelectItem key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedRecipes.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-blue-800">
              {selectedRecipes.size} recipe(s) selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedRecipes(new Set())}>
                Clear Selection
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 size={16} className="mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Data Management */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Data Management</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedRecipes.size === filteredRecipes.length && filteredRecipes.length > 0}
                onCheckedChange={selectAllRecipes}
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
            <span className="text-sm text-gray-500">{recipes.length} recipes stored</span>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={clearAllRecipes}
              disabled={recipes.length === 0}
            >
              Clear All Data
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-600">
          All your recipes are saved locally and can be exported or managed individually.
        </p>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map(recipe => (
          <div key={recipe.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedRecipes.has(recipe.id)}
                    onCheckedChange={() => toggleRecipeSelection(recipe.id)}
                  />
                  <h3 className="font-semibold text-gray-800 line-clamp-2">{recipe.name}</h3>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditingRecipe(recipe)}>
                    <Edit2 size={12} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => confirmDeleteRecipe(recipe.id)}>
                    <Trash2 size={12} className="text-red-500" />
                  </Button>
                </div>
              </div>

              {recipe.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{recipe.description}</p>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={getDifficultyColor(recipe.difficulty)}>
                  {recipe.difficulty}
                </Badge>
                <Badge variant="outline">
                  {recipe.category.replace('-', ' ')}
                </Badge>
                {recipe.rating && (
                  <Badge variant="outline">
                    ⭐ {recipe.rating}/5
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{recipe.prepTime + recipe.cookTime}m</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>{recipe.servings}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ChefHat size={14} />
                  <span>{recipe.ingredients.length} ingredients</span>
                </div>
              </div>

              {recipe.tags.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1">
                    {recipe.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {recipe.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{recipe.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <ChefHat size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-2">No recipes found</p>
          <p className="text-sm text-gray-400">
            {recipes.length === 0 
              ? "Start by adding your first recipe!"
              : "Try adjusting your search or filters"
            }
          </p>
        </div>
      )}

      {/* Add Recipe Dialog */}
      <Dialog open={isAddingRecipe} onOpenChange={setIsAddingRecipe}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Recipe</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
              <TabsTrigger value="instructions">Instructions</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="name">Recipe Name</Label>
                <Input
                  id="name"
                  value={newRecipe.name}
                  onChange={(e) => setNewRecipe(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Chocolate Chip Cookies"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRecipe.description}
                  onChange={(e) => setNewRecipe(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the recipe"
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
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                        </SelectItem>
                      ))}
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
                      {difficulties.map(difficulty => (
                        <SelectItem key={difficulty} value={difficulty}>
                          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                        </SelectItem>
                      ))}
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
            </TabsContent>

            <TabsContent value="ingredients" className="space-y-4">
              <div className="space-y-3">
                {newRecipe.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={ingredient}
                      onChange={(e) => updateIngredient(index, e.target.value)}
                      placeholder={`Ingredient ${index + 1}`}
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeIngredient(index)}
                      disabled={newRecipe.ingredients.length <= 1}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addIngredient} className="w-full">
                  <Plus size={16} className="mr-2" />
                  Add Ingredient
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="instructions" className="space-y-4">
              <div className="space-y-3">
                {newRecipe.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <Textarea
                      value={instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      placeholder={`Step ${index + 1}`}
                      className="flex-1"
                      rows={2}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeInstruction(index)}
                      disabled={newRecipe.instructions.length <= 1}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addInstruction} className="w-full">
                  <Plus size={16} className="mr-2" />
                  Add Step
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="nutrition" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="calories">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={newRecipe.nutritionalInfo.calories}
                    onChange={(e) => setNewRecipe(prev => ({
                      ...prev,
                      nutritionalInfo: { ...prev.nutritionalInfo, calories: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={newRecipe.nutritionalInfo.protein}
                    onChange={(e) => setNewRecipe(prev => ({
                      ...prev,
                      nutritionalInfo: { ...prev.nutritionalInfo, protein: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={newRecipe.nutritionalInfo.carbs}
                    onChange={(e) => setNewRecipe(prev => ({
                      ...prev,
                      nutritionalInfo: { ...prev.nutritionalInfo, carbs: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={newRecipe.nutritionalInfo.fat}
                    onChange={(e) => setNewRecipe(prev => ({
                      ...prev,
                      nutritionalInfo: { ...prev.nutritionalInfo, fat: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  value={newRecipe.rating || ''}
                  onChange={(e) => setNewRecipe(prev => ({ ...prev, rating: parseInt(e.target.value) || undefined }))}
                />
              </div>
            </TabsContent>
          </Tabs>

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
        <DialogContent>
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
                />
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to delete this recipe? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteRecipe}>
              Delete Recipe
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
