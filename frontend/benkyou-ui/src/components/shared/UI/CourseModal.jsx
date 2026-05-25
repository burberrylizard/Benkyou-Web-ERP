import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { getCategories } from "../../../services/categoryService";

export default function CourseModal({ isOpen, onClose, onSave, isSubmitting, initialData = null }) {
  const [form, setForm] = useState({ title: "", description: "", categoryId: "" });
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          title: initialData.title || "",
          description: initialData.description || "",
          categoryId: initialData.categoryID || ""
        });
      } else {
        setForm({ title: "", description: "", categoryId: "" });
      }
      loadCategories();
    }
  }, [isOpen, initialData]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.categoryId) {
      setError("Title and Category are required.");
      return;
    }
    onSave(form);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialData ? "Edit course" : "Create new course"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>{initialData ? "Save changes" : "Create course"}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={f.group}>
          <label style={f.label}>COURSE TITLE</label>
          <input 
            style={f.input} 
            placeholder="e.g. Introduction to React" 
            value={form.title} 
            onChange={(e) => setForm({...form, title: e.target.value})} 
            required 
          />
        </div>
        <div style={f.group}>
          <label style={f.label}>DESCRIPTION</label>
          <textarea 
            style={{...f.input, minHeight: 100, resize: "vertical"}} 
            placeholder="What will students learn in this course?" 
            value={form.description} 
            onChange={(e) => setForm({...form, description: e.target.value})} 
          />
        </div>
        <div style={f.group}>
          <label style={f.label}>CATEGORY</label>
          <select 
            style={f.input} 
            value={form.categoryId} 
            onChange={(e) => setForm({...form, categoryId: e.target.value})} 
            required
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat.categoryID} value={cat.categoryID}>{cat.name}</option>
            ))}
          </select>
        </div>
        {error && <div style={{ color: "var(--danger)", fontSize: 13 }}>{error}</div>}
      </form>
    </Modal>
  );
}

const f = {
  group: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.05em" },
  input: { padding: "10px 14px", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", outline: "none", fontSize: 14, background: "var(--bg-card)", color: "var(--text-main)" }
};
