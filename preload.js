const { contextBridge, ipcRenderer } = require('electron');
const { createClient } = require('@supabase/supabase-js');

// CREDENCIAIS DO SUPABASE AQUI
const SUPABASE_URL = "https://vbkveilhewcahbzwvozg.supabase.co";
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZia3ZlaWxoZXdjYWhiend2b3pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzgzMjgsImV4cCI6MjA3NjY1NDMyOH0.OpswO6PW71c-mOaEz4VHi9XjLu4U6lfWVX0OL_7tFQI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

contextBridge.exposeInMainWorld('api', {
  // Funções de Autenticação
  signUp: (credentials) => supabase.auth.signUp(credentials),
  signIn: (credentials) => supabase.auth.signInWithPassword(credentials),
  signOut: () => supabase.auth.signOut(),
  getUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

      // Funções de Projetos
      createProject: (project) => supabase.from('projects').insert([project]),
      getProjects: () => supabase.from('projects').select('*'),
      updateProject: (id, updates) => supabase.from('projects').update(updates).eq('id', id),
      deleteProject: (id) => supabase.from('projects').delete().eq('id', id),


  // Funções de Comunicação com o Processo Principal
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
});
