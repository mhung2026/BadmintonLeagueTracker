import { jest } from '@jest/globals';

// Mock createClient để tránh lỗi import.meta.env
jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ data: [{ id: 'test-id', name: 'TestUser' }], error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}));

const { createClient } = await import('@supabase/supabase-js');

describe('Supabase client mock', () => {
  it('should create a mock supabase client', () => {
    const supabase = createClient('https://test.supabase.co', 'test-key');
    expect(supabase).toBeDefined();
    expect(supabase.from).toBeDefined();
  });

  it('should mock fetch players', async () => {
    const supabase = createClient('https://test.supabase.co', 'test-key');
    const { data, error } = await supabase.from('players').select('*').limit(1);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should mock insert and delete', async () => {
    const supabase = createClient('https://test.supabase.co', 'test-key');
    const { data: insertData, error: insertError } = await supabase.from('players').insert([{ name: 'TestUser' }]).select();
    expect(insertError).toBeNull();
    expect(insertData[0].name).toBe('TestUser');
    const { error: deleteError } = await supabase.from('players').delete().eq('id', 'test-id');
    expect(deleteError).toBeNull();
  });
});
