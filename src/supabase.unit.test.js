import { supabase } from './supabaseClient.js';

describe('Supabase connection', () => {
  it('should connect and fetch players table', async () => {
    const { data, error } = await supabase.from('players').select('*').limit(1);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should insert and delete a test player', async () => {
    // Insert
    const { data: insertData, error: insertError } = await supabase.from('players').insert([{ name: 'TestUser' }]).select();
    expect(insertError).toBeNull();
    expect(insertData[0].name).toBe('TestUser');
    const testId = insertData[0].id;
    // Delete
    const { error: deleteError } = await supabase.from('players').delete().eq('id', testId);
    expect(deleteError).toBeNull();
  });
});
