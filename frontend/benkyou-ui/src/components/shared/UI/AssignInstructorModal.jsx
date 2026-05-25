import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { getUsers } from "../../../services/userService";
import { apiRequest } from "../../../api/client";

export default function AssignInstructorModal({ isOpen, onClose, courseId, onAssigned }) {
  const [instructors, setInstructors] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadInstructors();
    }
  }, [isOpen]);

  const loadInstructors = async () => {
    setIsLoading(true);
    try {
      const allUsers = await getUsers();
      const mapped = allUsers.map(u => ({
        ...u,
        role: u.role === 1 || u.role === "1" ? "Admin" :
              u.role === 2 || u.role === "2" ? "Instructor" :
              u.role === 3 || u.role === "3" ? "Student" : u.role
      }));
      setInstructors(mapped.filter(u => u.role === "Instructor"));
    } catch (err) {
      setError("Failed to load instructors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedId) return;
    setIsSubmitting(true);
    setError("");
    try {
      await apiRequest(`courses/${courseId}/instructors/${selectedId}`, {
        method: "POST"
      });
      onAssigned();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to assign instructor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Instructor"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAssign} isLoading={isSubmitting} disabled={!selectedId}>Assign</Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "#64748b" }}>Select an instructor to assign to this course.</p>
        
        {isLoading ? (
          <div>Loading instructors...</div>
        ) : (
          <select 
            style={f.input} 
            value={selectedId} 
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">Select Instructor</option>
            {instructors.map(ins => (
              <option key={ins.id} value={ins.id}>{ins.firstName} {ins.lastName} ({ins.email}){!ins.isActive ? " — Disabled" : ""}</option>
            ))}
          </select>
        )}
        
        {error && <div style={{ color: "#ef4444", fontSize: 13 }}>{error}</div>}
      </div>
    </Modal>
  );
}

const f = {
  input: { padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, outline: "none", fontSize: 14, width: "100%" }
};
