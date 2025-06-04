
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { getTodo } from '../handlers/get_todo';

// Test input for creating a todo
const testTodo: CreateTodoInput = {
  title: 'Test Todo',
  description: 'A todo for testing'
};

describe('getTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a todo by id', async () => {
    // Create a todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: testTodo.title,
        description: testTodo.description
      })
      .returning()
      .execute();

    const createdTodo = createResult[0];

    // Get the todo
    const result = await getTodo({ id: createdTodo.id });

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTodo.id);
    expect(result!.title).toEqual('Test Todo');
    expect(result!.description).toEqual('A todo for testing');
    expect(result!.completed).toEqual(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent todo', async () => {
    const result = await getTodo({ id: 999 });

    expect(result).toBeNull();
  });

  it('should get a todo with null description', async () => {
    // Create a todo without description
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Todo without description'
      })
      .returning()
      .execute();

    const createdTodo = createResult[0];

    // Get the todo
    const result = await getTodo({ id: createdTodo.id });

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Todo without description');
    expect(result!.description).toBeNull();
    expect(result!.completed).toEqual(false);
  });
});
