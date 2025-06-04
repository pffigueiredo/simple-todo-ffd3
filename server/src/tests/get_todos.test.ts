
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();
    expect(result).toEqual([]);
  });

  it('should return todos in descending order by created_at', async () => {
    // Create test todos with slight delay to ensure different timestamps
    const firstTodo = await db.insert(todosTable)
      .values({
        title: 'First Todo',
        description: 'First todo description',
        completed: false
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondTodo = await db.insert(todosTable)
      .values({
        title: 'Second Todo',
        description: 'Second todo description',
        completed: true
      })
      .returning()
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);
    // Most recent todo should be first (descending order)
    expect(result[0].title).toEqual('Second Todo');
    expect(result[0].completed).toBe(true);
    expect(result[1].title).toEqual('First Todo');
    expect(result[1].completed).toBe(false);
    
    // Verify timestamps are in descending order
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should return all todo fields correctly', async () => {
    await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'Test description',
        completed: true
      })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    const todo = result[0];
    
    expect(todo.id).toBeDefined();
    expect(todo.title).toEqual('Test Todo');
    expect(todo.description).toEqual('Test description');
    expect(todo.completed).toBe(true);
    expect(todo.created_at).toBeInstanceOf(Date);
    expect(todo.updated_at).toBeInstanceOf(Date);
  });

  it('should handle todos with null descriptions', async () => {
    await db.insert(todosTable)
      .values({
        title: 'Todo without description',
        description: null,
        completed: false
      })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Todo without description');
    expect(result[0].description).toBeNull();
    expect(result[0].completed).toBe(false);
  });
});
