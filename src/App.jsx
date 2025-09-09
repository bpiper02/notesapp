import { useEffect, useState } from "react";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import { generateClient } from "aws-amplify/data";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import "./App.css";

Amplify.configure(outputs);
const client = generateClient();

export default function App() {
  const [notes, setNotes] = useState([]);
  const [noteForm, setNoteForm] = useState({ name: "", description: "", image: null });

  // Fetch all notes on load
  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    try {
      const { data, errors } = await client.models.Note.list();
      if (errors) console.error(errors);
      else setNotes(data);
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
  }

  async function createNote(e) {
    e.preventDefault();
    try {
      const { data, errors } = await client.models.Note.create({
        name: noteForm.name,
        description: noteForm.description,
        image: noteForm.image ? noteForm.image.name : null,
      });

      if (errors) console.error(errors);
      else {
        // Upload image if selected
        if (noteForm.image) {
          await client.storage.put(noteForm.image.name, noteForm.image);
        }
        setNoteForm({ name: "", description: "", image: null });
        fetchNotes();
      }
    } catch (err) {
      console.error("Error creating note:", err);
    }
  }

  async function deleteNote(id) {
    try {
      await client.models.Note.delete({ id });
      fetchNotes();
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  }

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main>
          <h1>Notes App</h1>
          <p>Welcome, {user?.username}</p>

          {/* Create Note Form */}
          <form onSubmit={createNote} className="card">
            <input
              placeholder="Note name"
              value={noteForm.name}
              onChange={(e) => setNoteForm({ ...noteForm, name: e.target.value })}
            />
            <input
              placeholder="Note description"
              value={noteForm.description}
              onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNoteForm({ ...noteForm, image: e.target.files[0] })}
            />
            <button type="submit">Create Note</button>
          </form>

          {/* Notes List */}
          <div className="notes-grid">
            {notes.map((note) => (
              <div key={note.id} className="card">
                <h2>{note.name}</h2>
                <p>{note.description}</p>
                {note.image && (
                  <img
                    src={client.storage.get(note.image)}
                    alt={note.name}
                    style={{ width: "200px" }}
                  />
                )}
                <button onClick={() => deleteNote(note.id)}>Delete</button>
              </div>
            ))}
          </div>

          <button onClick={signOut} style={{ marginTop: "1rem" }}>
            Sign out
          </button>
        </main>
      )}
    </Authenticator>
  );
}
