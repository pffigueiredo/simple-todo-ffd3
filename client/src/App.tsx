
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Todo, CreateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: null
  });

  const loadTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsCreating(true);
    try {
      const newTodo = await trpc.createTodo.mutate(formData);
      setTodos((prev: Todo[]) => [...prev, newTodo]);
      setFormData({
        title: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updatedTodo = await trpc.updateTodoCompletion.mutate({
        id: todo.id,
        completed: !todo.completed
      });
      setTodos((prev: Todo[]) =>
        prev.map((t: Todo) => (t.id === todo.id ? updatedTodo : t))
      );
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📝 Todo Manager
          </h1>
          <p className="text-gray-600">
            Stay organized and get things done!
          </p>
          {totalCount > 0 && (
            <div className="flex justify-center gap-2 mt-4">
              <Badge variant="secondary">
                {completedCount} of {totalCount} completed
              </Badge>
            </div>
          )}
        </div>

        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">
              ✨ Create New Todo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="What needs to be done?"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateTodoInput) => ({ 
                    ...prev, 
                    title: e.target.value 
                  }))
                }
                required
                className="text-lg"
              />
              <Textarea
                placeholder="Add some details... (optional)"
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateTodoInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                className="min-h-[80px]"
              />
              <Button 
                type="submit" 
                disabled={isCreating || !formData.title.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isCreating ? '✨ Creating...' : '🚀 Add Todo'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="text-2xl mb-2">⏳</div>
              <p className="text-gray-600">Loading your todos...</p>
            </CardContent>
          </Card>
        ) : todos.length === 0 ? (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                All caught up!
              </h3>
              <p className="text-gray-600">
                No todos yet. Create one above to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {todos.map((todo: Todo) => (
              <Card 
                key={todo.id} 
                className={`shadow-lg border-0 transition-all duration-200 hover:shadow-xl ${
                  todo.completed 
                    ? 'bg-green-50/80 backdrop-blur-sm' 
                    : 'bg-white/80 backdrop-blur-sm'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleComplete(todo)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 
                        className={`font-semibold text-lg mb-2 ${
                          todo.completed 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-800'
                        }`}
                      >
                        {todo.completed && '✅ '}{todo.title}
                      </h3>
                      {todo.description && (
                        <p 
                          className={`text-gray-600 mb-3 ${
                            todo.completed ? 'line-through' : ''
                          }`}
                        >
                          {todo.description}
                        </p>
                      )}
                      <Separator className="my-3" />
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>
                          📅 Created: {todo.created_at.toLocaleDateString()}
                        </span>
                        {todo.updated_at.getTime() !== todo.created_at.getTime() && (
                          <span>
                            🔄 Updated: {todo.updated_at.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {totalCount > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              {completedCount === totalCount 
                ? '🎊 Congratulations! All tasks completed!' 
                : `💪 Keep going! ${totalCount - completedCount} more to go!`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
