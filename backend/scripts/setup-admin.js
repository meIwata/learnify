const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function ensureAdminStudent() {
  try {
    // First try to get the student
    const { data: existing, error: selectError } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', 'T14004')
      .single();
      
    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }
    
    if (!existing) {
      console.log('Creating T14004 student...');
      const { error: insertError } = await supabase.from('students').insert({
        student_id: 'T14004',
        full_name: 'Admin User',
        is_admin: true
      });
      
      if (insertError) throw insertError;
    } else {
      console.log('Updating T14004 to admin...');
      const { error: updateError } = await supabase
        .from('students')
        .update({ is_admin: true })
        .eq('student_id', 'T14004');
        
      if (updateError) throw updateError;
    }
    
    console.log('T14004 is now admin');
  } catch (error) {
    console.error('Error setting up admin:', error);
  }
}

ensureAdminStudent();