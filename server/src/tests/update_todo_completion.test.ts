
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoCompletionInput } from '../schema';
import { updateTodoCompletion } from '../handlers/update_todo_completion';
import { eq } from 'drizzle-orm';

describe('updateTodoCompletion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo completion status to true', async () => {
    // Create a test todo directly in the database
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing',
        completed: false
      })
      .returning()
      .execute();
    
    const createdTodo = createResult[0];

    // Update completion status
    const updateInput: UpdateTodoCompletionInput = {
      id: createdTodo.id,
      completed: true
    };

    const result = await updateTodoCompletion(updateInput);

    // Verify the result
    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('A todo for testing');
    expect(result.completed).toBe(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdTodo.updated_at).toBe(true);
  });

  it('should update todo completion status to false', async () => {
    // Create a completed todo directly in the database
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        description: 'A completed todo',
        completed: true
      })
      .returning()
      .execute();
    
    const createdTodo = createResult[0];

    // Now mark as incomplete
    const updateInput: UpdateTodoCompletionInput = {
      id: createdTodo.id,
      completed: false
    };

    const result = await updateTodoCompletion(updateInput);

    // Verify the result
    expect(result.id).toEqual(createdTodo.id);
    expect(result.completed).toBe(false);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated completion status to database', async () => {
    // Create a test todo directly in the database
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Database Test Todo',
        description: null,
        completed: false
      })
      .returning()
      .execute();
    
    const createdTodo = createResult[0];

    // Update completion status
    const updateInput: UpdateTodoCompletionInput = {
      id: createdTodo.id,
      completed: true
    };

    await updateTodoCompletion(updateInput);

    // Query database directly to verify
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].completed).toBe(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
    expect(todos[0].updated_at > createdTodo.updated_at).toBe(true);
  });

  it('should throw error for non-existent todo', async () => {
    const updateInput: UpdateTodoCompletionInput = {
      id: 999,
      completed: true
    };

    await expect(updateTodoCompletion(updateInput)).rejects.toThrow(/todo with id 999 not found/i);
  });
});
