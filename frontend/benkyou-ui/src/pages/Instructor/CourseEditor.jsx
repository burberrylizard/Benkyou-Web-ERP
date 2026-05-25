import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { INST_THEME, getNav, INST_STYLES as s } from "./instructorConfig";
import { useAuth } from "../../context/AuthContext";
import { getSections, createSection, getContentBySection, createContent, toggleContentHide, uploadContentFile, deleteContent, getCourseRoster } from "../../services/courseService";
import { getAnnouncements, createAnnouncement, replyToAnnouncement } from "../../services/announcementService";
import Pagination from "../../components/shared/Pagination";

export default function CourseEditor() {
  const { id } = useParams();
  const { user: authUser } = useAuth();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [activeTab, setActiveTab] = useState("builder");

  useEffect(() => {
    loadCourseData();
  }, [id]);

  const loadCourseData = async () => {
    try {
      const sectionsData = await getSections(id);
      
      const sectionsWithContent = await Promise.all(
        sectionsData.map(async (sec) => {
          const contents = await getContentBySection(sec.courseSectionID);
          return { ...sec, contents };
        })
      );
      
      setSections(sectionsWithContent);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!newSectionTitle) return;
    try {
      await createSection({ courseID: parseInt(id), title: newSectionTitle });
      setNewSectionTitle("");
      await loadCourseData();
    } catch (err) {
      alert("Failed to add section");
    }
  };

  if (loading) return <div style={{ padding: 50, textAlign: "center", background: "#0a1220", color: "#5a7a9a", minHeight: "100vh" }}>Loading builder...</div>;

  return (
    <DashboardLayout 
      theme={INST_THEME} 
      role="Instructor" 
      navGroups={getNav("My Courses")} 
      userName={authUser?.name} 
      headerTitle="Course Builder" 
      headerSub="Structure your course and manage lessons"
    >
      <div style={{ maxWidth: 800 }}>
        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24, borderBottom: "1px solid #1e3a5f", paddingBottom: 12 }}>
          <button 
            onClick={() => setActiveTab("builder")} 
            style={{ 
              background: "transparent", border: "none", color: activeTab === "builder" ? "#5b9bd5" : "#6b85a3", 
              fontWeight: 600, fontSize: 15, cursor: "pointer", paddingBottom: 6,
              borderBottom: activeTab === "builder" ? "2px solid #185fa5" : "2px solid transparent",
              outline: "none"
            }}
          >
            📚 Curriculum Builder
          </button>
          <button 
            onClick={() => setActiveTab("announcements")} 
            style={{ 
              background: "transparent", border: "none", color: activeTab === "announcements" ? "#5b9bd5" : "#6b85a3", 
              fontWeight: 600, fontSize: 15, cursor: "pointer", paddingBottom: 6,
              borderBottom: activeTab === "announcements" ? "2px solid #185fa5" : "2px solid transparent",
              outline: "none"
            }}
          >
            📢 Announcement Board
          </button>
          <button 
            onClick={() => setActiveTab("roster")} 
            style={{ 
              background: "transparent", border: "none", color: activeTab === "roster" ? "#5b9bd5" : "#6b85a3", 
              fontWeight: 600, fontSize: 15, cursor: "pointer", paddingBottom: 6,
              borderBottom: activeTab === "roster" ? "2px solid #185fa5" : "2px solid transparent",
              outline: "none"
            }}
          >
            👥 Course Roster
          </button>
        </div>

        {activeTab === "builder" ? (
          <>
            <div style={{ ...s.card, marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#e8edf4" }}>Add New Section</h3>
          <form onSubmit={handleAddSection} style={{ display: "flex", gap: 12 }}>
            <input 
              type="text" 
              placeholder="Section Title (e.g., Introduction)" 
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #2a4060", outline: "none", background: "#0d1a2b", color: "#e8edf4", fontSize: 14 }}
            />
            <button type="submit" style={s.primaryBtn}>Add Section</button>
          </form>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {sections.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#5a7a9a" }}>No sections yet. Add your first section above.</div>
          ) : (
            sections.map((section) => (
              <SectionItem key={section.courseSectionID} section={section} onUpdate={loadCourseData} />
            ))
          )}
        </div>
          </>
        ) : activeTab === "announcements" ? (
          <InstructorAnnouncementsBoard courseId={id} />
        ) : (
          <InstructorRosterBoard courseId={id} />
        )}
      </div>
    </DashboardLayout>
  );
}

function SectionItem({ section, onUpdate }) {
  const [showAddContent, setShowAddContent] = useState(false);
  const [newContent, setNewContent] = useState({ title: "", contentType: "Link", value: "", description: "" });
  const [uploading, setUploading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate extension
    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const allowed = [".pdf", ".ppt", ".pptx", ".docx"];
    if (!allowed.includes(extension)) {
      alert("Invalid file format. Only .pdf, .ppt, .pptx, and .docx are allowed.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const res = await uploadContentFile(file);
      if (res && res.url) {
        setNewContent(prev => ({ ...prev, value: res.url }));
      } else {
        alert("Failed to get upload URL");
      }
    } catch (err) {
      alert(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleAddContent = async (e) => {
    e.preventDefault();
    if (!newContent.title) {
      alert("Title is required");
      return;
    }
    if (newContent.contentType === "Link" && !newContent.value) {
      alert("URL / Link is required");
      return;
    }
    if (newContent.contentType === "File" && !newContent.value) {
      alert("Please upload a file");
      return;
    }
    if (newContent.contentType === "Text" && !newContent.value) {
      alert("Text content is required");
      return;
    }

    const payload = {
      courseSectionID: section.courseSectionID,
      title: newContent.title,
      contentType: newContent.contentType,
      type: newContent.contentType === "Link" ? 0 : newContent.contentType === "File" ? 1 : 2,
      value: newContent.value,
      description: newContent.description || "",
      body: newContent.contentType === "Text" ? newContent.value : "",
      fileUrl: newContent.contentType !== "Text" ? newContent.value : "",
      sortOrder: section.contents.length + 1
    };

    try {
      await createContent(payload);
      setShowAddContent(false);
      setNewContent({ title: "", contentType: "Link", value: "", description: "" });
      onUpdate();
    } catch (err) {
      alert("Failed to add content");
    }
  };

  const handleToggleHide = async (contentId) => {
    setTogglingId(contentId);
    try {
      await toggleContentHide(contentId);
      onUpdate();
    } catch (err) {
      alert("Failed to toggle visibility");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteContent = async (contentId) => {
    if (!window.confirm("Are you sure you want to delete this lesson? This action cannot be undone.")) return;
    try {
      await deleteContent(contentId);
      onUpdate();
    } catch (err) {
      alert("Failed to delete lesson");
    }
  };

  return (
    <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid #1e3a5f", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h4 style={{ margin: 0, fontSize: 15, color: "#e8edf4" }}>{section.title}</h4>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#5a7a9a" }}>{section.contents.length} items</span>
          <button onClick={() => setShowAddContent(!showAddContent)} style={{ ...s.outlineBtn, fontSize: 12, padding: "4px 10px" }}>
            {showAddContent ? "Cancel" : "+ Add Content"}
          </button>
        </div>
      </div>

      <div style={{ padding: 12 }}>
        {section.contents.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, color: "#5a7a9a", fontSize: 13 }}>No content in this section yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {section.contents.map((item) => (
              <div key={item.contentItemID} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: item.isHidden ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${item.isHidden ? "rgba(239,68,68,0.2)" : "rgba(30,58,95,0.4)"}`, borderRadius: 8, transition: "all 0.2s" }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                  {item.contentType === "Link" ? "🔗" : item.contentType === "File" ? "📄" : item.contentType === "Text" ? "📝" : item.contentType === "Video" ? "📹" : "📄"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: item.isHidden ? "#6b7280" : "#e8edf4", textDecoration: item.isHidden ? "line-through" : "none" }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "#5a7a9a" }}>{item.contentType}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {/* View Button */}
                  <button
                    onClick={() => setPreviewItem(item)}
                    style={{ 
                      padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #2a4060", transition: "all 0.2s",
                      background: "rgba(24,95,165,0.12)", color: "#5b9bd5"
                    }}
                  >
                    👁 View
                  </button>
                  {/* Hide/Unhide Toggle */}
                  <button
                    onClick={() => handleToggleHide(item.contentItemID)}
                    disabled={togglingId === item.contentItemID}
                    style={{ 
                      padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", transition: "all 0.2s",
                      background: item.isHidden ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)", 
                      color: item.isHidden ? "#ef4444" : "#10b981"
                    }}
                  >
                    {togglingId === item.contentItemID ? "..." : item.isHidden ? "🔒 Hidden" : "👁 Visible"}
                  </button>
                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteContent(item.contentItemID)}
                    style={{ 
                      padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", transition: "all 0.2s",
                      background: "rgba(239,68,68,0.15)", color: "#ef4444"
                    }}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddContent && (
          <div style={{ marginTop: 16, padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px dashed #2a4060" }}>
            <form onSubmit={handleAddContent} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Content Type</label>
                <select 
                  value={newContent.contentType}
                  onChange={(e) => setNewContent({ ...newContent, contentType: e.target.value, value: "", description: "" })}
                  style={formInput}
                >
                  <option value="Link">Link</option>
                  <option value="File">File</option>
                  <option value="Text">Text</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Title</label>
                <input 
                  placeholder="e.g. Chapter 1 Overview" 
                  value={newContent.title}
                  onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                  style={formInput} 
                  required
                />
              </div>

              {newContent.contentType === "Link" && (
                <div>
                  <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>URL</label>
                  <input 
                    type="url"
                    placeholder="https://example.com/resource" 
                    value={newContent.value}
                    onChange={(e) => setNewContent({...newContent, value: e.target.value})}
                    style={formInput} 
                    required
                  />
                </div>
              )}

              {newContent.contentType === "File" && (
                <div>
                  <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Upload File (.pdf, .ppt, .pptx, .docx only)</label>
                  <input 
                    type="file" 
                    accept=".pdf,.ppt,.pptx,.docx"
                    onChange={handleFileChange}
                    style={{ ...formInput, padding: "8px 10px" }}
                  />
                  {uploading && <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 6 }}>⏳ Uploading to server...</div>}
                  {newContent.value && !uploading && (
                    <div style={{ fontSize: 12, color: "#10b981", marginTop: 6 }}>
                      ✅ Uploaded: <a href={newContent.value} target="_blank" rel="noreferrer" style={{ color: "#3b82f6", textDecoration: "underline" }}>View file</a>
                    </div>
                  )}
                </div>
              )}

              {newContent.contentType === "Text" && (
                <div>
                  <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Text Content</label>
                  <textarea 
                    placeholder="Write your text lesson content here..." 
                    value={newContent.value}
                    onChange={(e) => setNewContent({...newContent, value: e.target.value})}
                    style={{ ...formInput, height: 120, resize: "vertical", fontFamily: "inherit" }} 
                    required
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Description (Optional)</label>
                <textarea 
                  placeholder="Provide an optional description of this content..." 
                  value={newContent.description || ""}
                  onChange={(e) => setNewContent({...newContent, description: e.target.value})}
                  style={{ ...formInput, height: 60, resize: "vertical", fontFamily: "inherit" }} 
                />
              </div>

              <button type="submit" disabled={uploading} style={{ background: uploading ? "#1e3a5f" : "#185fa5", color: uploading ? "#5a7a9a" : "#fff", border: "none", padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: uploading ? "default" : "pointer", alignSelf: "flex-end" }}>
                {uploading ? "Uploading..." : "Save Lesson"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Lesson Details Preview Modal */}
      {previewItem && (
        <div style={modalOverlayStyle} onClick={() => setPreviewItem(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div>
                <span style={modalTagStyle}>{previewItem.contentType}</span>
                <h3 style={modalTitleStyle}>{previewItem.title}</h3>
              </div>
              <button onClick={() => setPreviewItem(null)} style={closeButtonStyle}>×</button>
            </div>
            
            <div style={modalBodyStyle}>
              {previewItem.description && (
                <div style={modalDescriptionStyle}>
                  {previewItem.description}
                </div>
              )}

              {previewItem.contentType?.toLowerCase() === "video" && (
                <div style={videoContainerStyle}>
                  <iframe 
                    width="100%" height="100%" 
                    src={previewItem.fileUrl?.includes("watch?v=") ? previewItem.fileUrl.replace("watch?v=", "embed/") : previewItem.fileUrl} 
                    title="Course Content" frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              {previewItem.contentType?.toLowerCase() === "link" && (
                <div style={linkContainerStyle}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
                  <h4 style={{ color: "#e8edf4", margin: "0 0 8px 0" }}>External Link Resource</h4>
                  <div style={{ color: "#8ea4bd", fontSize: 13, marginBottom: 16, wordBreak: "break-all" }}>
                    {previewItem.fileUrl}
                  </div>
                  <a href={previewItem.fileUrl} target="_blank" rel="noreferrer" style={modalLinkButtonStyle}>
                    Open Link
                  </a>
                </div>
              )}

              {previewItem.contentType?.toLowerCase() === "file" && (
                <div style={linkContainerStyle}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                  <h4 style={{ color: "#e8edf4", margin: "0 0 8px 0" }}>Study Document</h4>
                  <div style={{ color: "#8ea4bd", fontSize: 13, marginBottom: 16, wordBreak: "break-all" }}>
                    {previewItem.fileUrl}
                  </div>
                  <a href={previewItem.fileUrl} target="_blank" rel="noreferrer" style={modalFileButtonStyle}>
                    View File
                  </a>
                </div>
              )}

              {previewItem.contentType?.toLowerCase() === "text" && (
                <div style={textContainerStyle}>
                  {previewItem.body || "No text content available."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const formInput = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #2a4060", background: "#0d1a2b", color: "#e8edf4", fontSize: 14 };

const modalOverlayStyle = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(5, 10, 20, 0.85)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: 20
};

const modalContentStyle = {
  background: "#0d1a2b",
  border: "1px solid #1e3a5f",
  borderRadius: 16,
  width: "100%",
  maxWidth: 600,
  maxHeight: "85vh",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
  overflow: "hidden"
};

const modalHeaderStyle = {
  padding: "20px 24px",
  borderBottom: "1px solid #1e3a5f",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  background: "rgba(255,255,255,0.01)"
};

const modalTagStyle = {
  background: "rgba(59,130,246,0.15)",
  color: "#3b82f6",
  padding: "3px 8px",
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  display: "inline-block",
  marginBottom: 6
};

const modalTitleStyle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: "#e8edf4"
};

const closeButtonStyle = {
  background: "transparent",
  border: "none",
  color: "#5a7a9a",
  fontSize: 24,
  lineHeight: "20px",
  cursor: "pointer",
  padding: "4px 8px",
  borderRadius: 6,
  transition: "all 0.2s",
  outline: "none"
};

const modalBodyStyle = {
  padding: 24,
  overflowY: "auto",
  flex: 1
};

const modalDescriptionStyle = {
  fontSize: 14,
  color: "#8ea4bd",
  lineHeight: 1.6,
  padding: "12px 16px",
  borderLeft: "4px solid #185fa5",
  background: "rgba(24,95,165,0.05)",
  borderRadius: "0 8px 8px 0",
  marginBottom: 20
};

const videoContainerStyle = {
  width: "100%",
  aspectRatio: "16/9",
  background: "#000",
  borderRadius: 10,
  overflow: "hidden",
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
};

const linkContainerStyle = {
  padding: 24,
  border: "1px solid #1e3a5f",
  borderRadius: 12,
  background: "#111c2e",
  textAlign: "center"
};

const modalLinkButtonStyle = {
  display: "inline-block",
  background: "#185fa5",
  color: "#fff",
  padding: "10px 24px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
  transition: "background 0.2s"
};

const modalFileButtonStyle = {
  display: "inline-block",
  background: "#10b981",
  color: "#fff",
  padding: "10px 24px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
  transition: "background 0.2s"
};

const textContainerStyle = {
  padding: 20,
  border: "1px solid #1e3a5f",
  borderRadius: 12,
  background: "#111c2e",
  color: "#c0cfe0",
  lineHeight: 1.7,
  fontSize: 14,
  whiteSpace: "pre-wrap"
};

function InstructorAnnouncementsBoard({ courseId }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [allowReplies, setAllowReplies] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, [courseId]);

  const loadAnnouncements = async () => {
    try {
      const data = await getAnnouncements(courseId);
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    setSubmitting(true);
    try {
      const created = await createAnnouncement(courseId, {
        title: newTitle.trim(),
        body: newBody.trim(),
        allowReplies
      });
      setAnnouncements(prev => [created, ...prev]);
      setNewTitle("");
      setNewBody("");
      setAllowReplies(true);
      alert("Announcement posted successfully!");
    } catch (err) {
      alert("Failed to post announcement. " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostReply = async (e, annId) => {
    e.preventDefault();
    const text = replyText[annId];
    if (!text || !text.trim()) return;

    try {
      const newReply = await replyToAnnouncement(annId, text.trim());
      setAnnouncements(prev => prev.map(ann => {
        if (ann.courseAnnouncementID === annId) {
          return {
            ...ann,
            replies: [...ann.replies, newReply]
          };
        }
        return ann;
      }));
      setReplyText(prev => ({ ...prev, [annId]: "" }));
    } catch (err) {
      alert("Failed to post reply. " + (err.message || err));
    }
  };

  if (loading) return <div style={{ color: "#5a7a9a", padding: 20, textAlign: "center" }}>Loading announcements...</div>;

  return (
    <div>
      {/* Create Form */}
      <div style={{ ...s.card, marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#e8edf4", fontWeight: 600 }}>📢 Post Course Announcement</h3>
        <form onSubmit={handleCreateAnnouncement} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Title</label>
            <input 
              placeholder="e.g. Schedule for Midterm Examination" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={formInput} 
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Message Body</label>
            <textarea 
              placeholder="Write the announcement details here..." 
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              style={{ ...formInput, height: 100, resize: "vertical", fontFamily: "inherit" }} 
              required
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <input 
              type="checkbox" 
              id="allowReplies"
              checked={allowReplies}
              onChange={(e) => setAllowReplies(e.target.checked)}
              style={{ width: 16, height: 16, cursor: "pointer" }}
            />
            <label htmlFor="allowReplies" style={{ fontSize: 13, color: "#e8edf4", cursor: "pointer" }}>Allow students to reply / comment</label>
          </div>
          <button type="submit" disabled={submitting} style={{ ...s.primaryBtn, alignSelf: "flex-end", marginTop: 8 }}>
            {submitting ? "Posting..." : "Post Announcement"}
          </button>
        </form>
      </div>

      {/* Roster list */}
      <h3 style={{ fontSize: 16, color: "#e8edf4", fontWeight: 600, marginBottom: 16 }}>Announcements History</h3>
      {announcements.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, border: "1px dashed #2a4060", borderRadius: 12, color: "#5a7a9a" }}>
          No announcements posted for this course yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {announcements.map((ann) => (
            <div key={ann.courseAnnouncementID} style={{ 
              background: "#111c2e", border: "1px solid #1e3a5f", borderRadius: 14, padding: 20 
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 4px 0" }}>{ann.title}</h4>
                  <div style={{ fontSize: 12, color: "#5a7a9a" }}>
                    Posted by <span style={{ color: "#5b9bd5", fontWeight: 500 }}>{ann.authorName}</span> on {new Date(ann.createdAt).toLocaleDateString()} at {new Date(ann.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                <span style={{ 
                  background: ann.allowReplies ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", 
                  color: ann.allowReplies ? "#10b981" : "#ef4444", 
                  padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600
                }}>
                  {ann.allowReplies ? "🔓 Replies Allowed" : "🔒 Replies Closed"}
                </span>
              </div>

              <div style={{ color: "#c0cfe0", fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap", marginBottom: 16, borderBottom: "1px solid rgba(30,58,95,0.3)", paddingBottom: 16 }}>
                {ann.body}
              </div>

              {/* Replies */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b85a3" }}>Comments ({ann.replies.length})</div>
                {ann.replies.map((reply) => {
                  const isStaff = reply.userRole === "Instructor" || reply.userRole === "Admin" || reply.userRole === "SuperAdmin";
                  return (
                    <div key={reply.announcementReplyID} style={{ 
                      padding: 10, borderRadius: 8, background: isStaff ? "rgba(24,95,165,0.06)" : "rgba(255,255,255,0.01)",
                      border: isStaff ? "1px solid rgba(24,95,165,0.15)" : "1px solid rgba(30,58,95,0.15)",
                      marginLeft: 12
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
                          <span style={{ fontWeight: 600, color: "#e8edf4" }}>{reply.userName}</span>
                          {isStaff && (
                            <span style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", padding: "1px 4px", borderRadius: 4, fontSize: 9, fontWeight: 700 }}>Staff</span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: "#5a7a9a" }}>{new Date(reply.createdAt).toLocaleDateString()} {new Date(reply.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div style={{ color: "#a0aec0", fontSize: 13 }}>{reply.body}</div>
                    </div>
                  );
                })}
              </div>

              {/* Reply box for Instructor (always allowed to reply) */}
              <form onSubmit={(e) => handlePostReply(e, ann.courseAnnouncementID)} style={{ display: "flex", gap: 8 }}>
                <input 
                  type="text" 
                  placeholder="Write a staff comment..." 
                  value={replyText[ann.courseAnnouncementID] || ""}
                  onChange={(e) => setReplyText(prev => ({ ...prev, [ann.courseAnnouncementID]: e.target.value }))}
                  style={{ 
                    flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #2a4060",
                    background: "#0b1019", color: "#e8edf4", fontSize: 13, outline: "none"
                  }}
                />
                <button type="submit" style={{ 
                  background: "#185fa5", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, 
                  fontSize: 12, fontWeight: 600, cursor: "pointer" 
                }}>Comment</button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InstructorRosterBoard({ courseId }) {
  const [roster, setRoster] = useState({ instructors: [], students: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadRoster() {
      try {
        const data = await getCourseRoster(courseId);
        setRoster({
          instructors: data.instructors || data.Instructors || [],
          students: data.students || data.Students || []
        });
      } catch (err) {
        console.error("Failed to load roster", err);
      } finally {
        setLoading(false);
      }
    }
    loadRoster();
  }, [courseId]);

  if (loading) return <div style={{ color: "#5a7a9a", padding: 20, textAlign: "center" }}>Loading roster...</div>;

  const filteredInstructors = roster.instructors.filter(ins => 
    ins.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ins.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = roster.students.filter(stud => 
    stud.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stud.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stud.classSectionName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Paginated students
  const totalStudents = filteredStudents.length;
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, color: "#e8edf4" }}>👥 Course Roster</h3>
          <p style={{ color: "#5a7a9a", fontSize: 13, marginTop: 4 }}>Manage and overview all participants enrolled or teaching in this course.</p>
        </div>
        <input 
          type="text" 
          placeholder="Search roster..." 
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          style={{ 
            padding: "8px 14px", borderRadius: 8, border: "1px solid #2a4060",
            background: "#0d1a2b", color: "#e8edf4", fontSize: 13, outline: "none",
            minWidth: "200px"
          }}
        />
      </div>

      {/* Teaching Staff */}
      <div style={{ ...s.card, marginBottom: 24 }}>
        <h4 style={{ margin: "0 0 16px 0", fontSize: 15, color: "#e8edf4", display: "flex", alignItems: "center", gap: 8 }}>
          <span>👨‍🏫</span> Teaching Staff
        </h4>
        {filteredInstructors.length === 0 ? (
          <div style={{ color: "#5a7a9a", fontSize: 13 }}>No instructors assigned to this course.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredInstructors.map((ins, idx) => (
              <div key={idx} style={{ 
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", 
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(30,58,95,0.4)", borderRadius: 8 
              }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#185fa5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#fff" }}>
                  {ins.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || "I"}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#e8edf4", fontSize: 14 }}>{ins.name}</div>
                  <div style={{ fontSize: 11, color: "#5b9bd5" }}>{ins.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enrolled Students */}
      <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e3a5f" }}>
          <h4 style={{ margin: 0, fontSize: 15, color: "#e8edf4", display: "flex", alignItems: "center", gap: 8 }}>
            <span>🎓</span> Enrolled Students ({totalStudents})
          </h4>
        </div>
        
        {totalStudents === 0 ? (
          <div style={{ padding: 20, color: "#5a7a9a", fontSize: 13, textAlign: "center" }}>No students enrolled in this course yet.</div>
        ) : (
          <div>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e3a5f", background: "rgba(255,255,255,0.01)" }}>
                  <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: 600, color: "#6b85a3" }}>STUDENT NAME</th>
                  <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: 600, color: "#6b85a3" }}>EMAIL ADDRESS</th>
                  <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: 600, color: "#6b85a3" }}>SECTION ASSIGNMENT</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((stud, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < paginatedStudents.length - 1 ? "1px solid rgba(30,58,95,0.3)" : "none" }}>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#e8edf4", fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1a2c42", border: "1px solid #2a4060", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#8ea4bd" }}>
                          {stud.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || "S"}
                        </div>
                        {stud.name}
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#8ea4bd" }}>{stud.email}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ 
                        background: stud.classSectionName === "Unassigned" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.15)", 
                        color: stud.classSectionName === "Unassigned" ? "#ef4444" : "#10b981", 
                        padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 
                      }}>
                        {stud.classSectionName || "Unassigned"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination 
              totalItems={totalStudents} 
              itemsPerPage={itemsPerPage} 
              currentPage={currentPage} 
              onChange={setCurrentPage} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
