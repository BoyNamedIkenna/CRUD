import { useState, useEffect, type ChangeEvent } from 'react'
import { supabase } from '../supabase-client'
import { type Session, } from '@supabase/supabase-js';

interface Task {
  id: number;
  title: string;
  description: string;
  created_at: string;
  image_url: string;
}

function TaskManager({ session }: { session: Session }) {
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [newDescription, setNewDescription] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskImage, setTaskImage] = useState<File | null>(null);

  const fetchTasks = async () => {
    const { error, data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error inserting task: ", error.message);
      return;
    }

    setTasks(data);
  }

  const deleteTasks = async (id: number) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error("Error deleting task: ", error.message);
    }

  }

  const updateTask = async (id: number) => {
    const { error } = await supabase
      .from("tasks")
      .update({ description: newDescription })
      .eq("id", id);

    if (error) {
      console.error("Error updating task: ", error.message);
    }

  }

  const uploadImage = async (file: File): Promise<string | null> => {

    const filePath = `${file.name}-${Date.now()}`

    const { error } = await supabase.storage
      .from("tasks-images")
      .upload(filePath, file)

    if (error) {
      console.error("Error uploading images: ", error.message)
    }

    const { data } = await supabase.storage
      .from("tasks-images")
      .getPublicUrl(filePath);


    return data.publicUrl;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl: string | null = null
    if (taskImage) {
      imageUrl = await uploadImage(taskImage);
    }


    const { error } = await supabase
      .from("tasks")
      .insert({ ...newTask, email: session.user.email, image_url:imageUrl })
      .single();

    if (error) {
      console.error("Error inserting task: ", error.message);
    }
    
    setNewTask({ title: "", description: "" });
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTaskImage(e.target.files[0])
    }
  }

  useEffect(() => {
    fetchTasks();
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          const inserted = payload.new as Task;
          setTasks((prev) => {
            const exists = prev.find((t) => t.id === inserted.id);
            if (exists) return prev;
            return [inserted, ...prev];
          });

        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);








  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1rem" }}>
      <h2>Task Manager CRUD</h2>

      {/* Form to add a new task */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Task Title"
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, title: e.target.value }))
          }
          style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
        />
        <textarea
          placeholder="Task Description"
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, description: e.target.value }))
          }
          style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
        />
        <input type="file" accept='image/*' onChange={handleFileChange} />
        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Add Task
        </button>
      </form>

      {/* List of Tasks */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {tasks.map((task, key) => (

          <li
            key={key}
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "1rem",
              marginBottom: "0.5rem",
            }}
          >
            <div>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <img src={task.image_url} style={{height:70}} />
              <div>
                <textarea
                  placeholder='Updated description...'
                  onChange={(e) => { setNewDescription(e.target.value) }}
                />
                <button
                  onClick={() => updateTask(task.id)}
                  style={{ padding: "0.5rem 1rem", marginRight: "0.5rem" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTasks(task.id)}
                  style={{ padding: "0.5rem 1rem" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}

      </ul>
    </div>
  )
}

export default TaskManager
