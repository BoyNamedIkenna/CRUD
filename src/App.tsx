import './App.css'
import { useEffect, useState } from 'react';
import { supabase } from "./supabase-client";
import { type Session } from '@supabase/supabase-js';
import TaskManager from './components/task-manager';
import Auth from './components/auth';


function App() {
  const [session, setSession] = useState<Session | null>(null);

  const fetchSession = async () => {
    const currentSession = await supabase.auth.getSession()
    console.log(currentSession.data.session);
    setSession(currentSession.data.session);
  }
  useEffect(() => {
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  const logout = async () => {
    await supabase.auth.signOut();
  }
  return (
    <>
      {session ? (
        <>
          <button onClick={logout}>Log Out</button>
          <TaskManager session={session} />
        </>

      )
        : (
          <Auth />
        )}
    </>
  )
}

export default App
