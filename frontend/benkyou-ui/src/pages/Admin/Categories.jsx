import { useState } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { ADMIN_THEME, getNav, ADMIN_STYLES as s } from "./adminConfig";
import { useApiData } from "../../hooks/useApiData";
import { getCategories, createCategory } from "../../services/categoryService";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/shared/UI/Modal";
import Button from "../../components/shared/UI/Button";

export default function Categories() {
  const { user: authUser } = useAuth();
  const { data: categories, isLoading, reload } = useApiData(getCategories);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState("");

  const displayCategories = categories || [];

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setIsSubmitting(true);
    setError("");
    try {
      await createCategory({ name: newCategoryName });
      setIsModalOpen(false);
      setNewCategoryName("");
      reload();
    } catch (err) {
      setError(err.message || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6", "#10b981", "#ec4899", "#06b6d4"];

  return (
    <DashboardLayout 
      theme={ADMIN_THEME} 
      role="Admin" 
      navGroups={getNav("Categories")} 
      userName={authUser?.name} 
      headerTitle="Categories" 
      headerSub="Organize courses by category"
    >
      <div style={s.statsGrid}>
        <div style={s.card}>
          <div style={s.statLabel}>Total categories</div>
          <div style={s.statValue}>{displayCategories.length}</div>
          <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Defined</div>
        </div>
        <div style={s.card}>
          <div style={s.statLabel}>Active</div>
          <div style={s.statValue}>{displayCategories.filter(c => c.courseCount > 0).length}</div>
          <div style={{ fontSize: 12, color: "#10b981", fontWeight: 500 }}>With courses</div>
        </div>
      </div>

      <div style={s.tableCard}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>All categories</h2>
          <Button onClick={() => setIsModalOpen(true)}>+ Add category</Button>
        </div>
        
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading categories...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {displayCategories.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: "#9ca3af" }}>No categories found</div>
            ) : (
              displayCategories.map((cat, i) => {
                const color = COLORS[i % COLORS.length];
                return (
                  <div key={cat.categoryID} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, position: "relative", overflow: "hidden", background: "#fff" }}>
                    <div style={{ height: 4, background: color, position: "absolute", top: 0, left: 0, right: 0 }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: color }}>
                        {cat.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 8 }}>{cat.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>{cat.courseCount} course{cat.courseCount !== 1 ? "s" : ""}</span>
                      {cat.courseCount === 0 && <span style={{ background: "#fef3c7", color: "#b45309", padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: 500 }}>Empty</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add category"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} isLoading={isSubmitting}>Create category</Button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>CATEGORY NAME</label>
            <input 
              style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, outline: "none", fontSize: 14 }}
              placeholder="e.g. Computer Science"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              autoFocus
              required
            />
          </div>
          {error && <div style={{ color: "#ef4444", fontSize: 13 }}>{error}</div>}
        </form>
      </Modal>
    </DashboardLayout>
  );
}
