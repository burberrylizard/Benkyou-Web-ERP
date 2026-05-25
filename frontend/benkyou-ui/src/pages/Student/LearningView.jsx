import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCourseContent, getMyCourses } from "../../services/enrollmentService";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import { getAnnouncements, replyToAnnouncement } from "../../services/announcementService";
import { getCourseRoster } from "../../services/courseService";
import Pagination from "../../components/shared/Pagination";

export default function LearningView() {
  const { id } = useParams();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const { tenantPath } = useTenant();
  const [sections, setSections] = useState([]);
  const [activeContent, setActiveContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState("");
  const [classSectionName, setClassSectionName] = useState("");

  useEffect(() => {
    loadContent();
    loadSectionName();
  }, [id]);

  const loadSectionName = async () => {
    try {
      const enrollments = await getMyCourses();
      const matching = enrollments.find(e => e.courseID === parseInt(id));
      if (matching) {
        setClassSectionName(matching.classSectionName || "Unassigned");
        setCourseName(matching.courseTitle);
      }
    } catch (err) {
      console.error("Failed to load section name", err);
    }
  };

  const loadContent = async () => {
    try {
      const data = await getCourseContent(id);
      setSections(data);
      if (data.length > 0 && data[0].contents.length > 0) {
        setActiveContent(data[0].contents[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Flatten all content items for prev/next navigation
  const allItems = sections.flatMap(sec => sec.contents || []);
  const currentIndex = activeContent ? allItems.findIndex(item => item.contentItemID === activeContent.contentItemID) : -1;
  const totalItems = allItems.length;
  const completedItems = currentIndex + 1;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const activeType = activeContent?.contentType?.toLowerCase() || "";

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a1220" }}>
      <div style={{ color: "#5a7a9a", fontSize: 16 }}>Loading course content...</div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a1220", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 4px; }
        .learning-item:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>

      {/* Sidebar */}
      <div style={{ 
        width: "320px", borderRight: "1px solid #1e3a5f", display: "flex", 
        flexDirection: "column", height: "100%", background: "#0b1929", flexShrink: 0
      }}>
        {/* Header */}
        <div style={{ padding: "20px", borderBottom: "1px solid #1e3a5f" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>ben</span>
            <span style={{ fontSize: 18, fontWeight: 600, color: "#5b9bd5" }}>kyou</span>
          </div>
          <div style={{ fontSize: 11, color: "#5a7a9a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>COURSE</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#e8edf4", marginBottom: 4 }}>{courseName || "Web Development 101"}</div>
          {classSectionName && classSectionName !== "Unassigned" && (
            <div style={{ marginBottom: 8 }}>
              <span style={{ 
                background: "rgba(91,155,213,0.12)", 
                color: "#5b9bd5", 
                border: "1px solid rgba(91,155,213,0.25)", 
                padding: "2px 8px", 
                borderRadius: 10, 
                fontSize: 11, 
                fontWeight: 600 
              }}>
                {classSectionName}
              </span>
            </div>
          )}
          <div style={{ fontSize: 12, color: "#5a7a9a", marginBottom: 12 }}>{authUser?.name || "Student"}</div>
          {/* Progress bar removed */}
        </div>

        {/* Content Navigation */}
        <div style={{ padding: "12px", flex: 1, overflowY: "auto" }}>
          <button 
            onClick={() => setActiveContent({ contentType: "announcements", title: "Announcements Board" })}
            style={{ 
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", 
              width: "100%", marginBottom: 12,
              background: activeContent?.contentType === "announcements" ? "rgba(24,95,165,0.2)" : "rgba(255,255,255,0.02)",
              border: "1px solid #1e3a5f", borderRadius: 8, cursor: "pointer", textAlign: "left",
              color: activeContent?.contentType === "announcements" ? "#fff" : "#8ea4bd", transition: "all 0.2s"
            }}
          >
            <span style={{ fontSize: 15 }}>📢</span>
            <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>Announcements Board</span>
          </button>

          <button 
            onClick={() => setActiveContent({ contentType: "roster", title: "Course Roster" })}
            style={{ 
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", 
              width: "100%", marginBottom: 12,
              background: activeContent?.contentType === "roster" ? "rgba(24,95,165,0.2)" : "rgba(255,255,255,0.02)",
              border: "1px solid #1e3a5f", borderRadius: 8, cursor: "pointer", textAlign: "left",
              color: activeContent?.contentType === "roster" ? "#fff" : "#8ea4bd", transition: "all 0.2s"
            }}
          >
            <span style={{ fontSize: 15 }}>👥</span>
            <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>Course Roster</span>
          </button>

          <div style={{ fontSize: 12, fontWeight: 600, color: "#4a7aa8", padding: "8px 12px", marginBottom: 4 }}>Course content</div>
          {sections.map((section, sIdx) => (
            <div key={section.sectionID} style={{ marginBottom: 16 }}>
              <div style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "#6b85a3", marginBottom: 4 }}>
                Section {sIdx + 1} — {section.title}
              </div>
              {(section.contents || []).map((item) => {
                const isActive = activeContent?.contentItemID === item.contentItemID;
                const itemIdx = allItems.findIndex(ai => ai.contentItemID === item.contentItemID);
                const isCompleted = itemIdx < currentIndex;
                return (
                  <button 
                    key={item.contentItemID} 
                    className="learning-item"
                    onClick={() => setActiveContent(item)}
                    style={{ 
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", 
                      width: "100%",
                      background: isActive ? "rgba(24,95,165,0.2)" : "transparent",
                      border: "none", borderRadius: 8, cursor: "pointer", textAlign: "left",
                      color: isActive ? "#fff" : "#8ea4bd", transition: "all 0.2s",
                      borderLeft: isActive ? "3px solid #185fa5" : "3px solid transparent",
                    }}
                  >
                    <span style={{ 
                      fontSize: 12, color: isActive ? "#5b9bd5" : "#5a7a9a", 
                      fontWeight: 600, flexShrink: 0, width: 20, textAlign: "center"
                    }}>
                      {itemIdx + 1}.
                    </span>
                    <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, flex: 1 }}>{item.title}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom user */}
        <div style={{ padding: 16, background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#185fa5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#fff" }}>
            {authUser?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || "S"}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{authUser?.name || "Student"}</div>
            <div style={{ fontSize: 11, color: "#5b9bd5" }}>Student</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", background: "#0d1a2b" }}>
        {/* Top breadcrumb bar */}
        <div style={{ 
          padding: "14px 32px", borderBottom: "1px solid #1e3a5f",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#5a7a9a" }}>{courseName || "Web Dev 101"}</span>
            <span style={{ color: "#2a4060" }}>/</span>
            <span style={{ fontSize: 13, color: "#8ea4bd" }}>{activeContent?.title || "Select a lesson"}</span>
          </div>
          <button 
            onClick={() => navigate(tenantPath("/student/courses"))}
            style={{ 
              background: "transparent", color: "#5b9bd5", border: "1px solid #2a4060",
              padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer"
            }}
          >Back to overview</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "40px" }}>
          {activeContent ? (
            activeContent.contentType === "announcements" ? (
              <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <AnnouncementsBoard courseId={id} />
              </div>
            ) : activeContent.contentType === "roster" ? (
              <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                <CourseRosterBoard courseId={id} />
              </div>
            ) : (
              <div style={{ maxWidth: "800px", margin: "0 auto" }}>
              {/* Tags */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <span style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{activeContent.contentType}</span>
                {sections.map((sec, i) => sec.contents?.find(c => c.contentItemID === activeContent.contentItemID) ? (
                  <span key={i} style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>Section {i + 1}</span>
                ) : null)}
              </div>

              <h1 style={{ fontSize: 28, fontWeight: 700, color: "#e8edf4", marginBottom: 8, lineHeight: 1.3 }}>{activeContent.title}</h1>
              <p style={{ fontSize: 14, color: "#5a7a9a", marginBottom: 20 }}>By {authUser?.name || "Instructor"} · Est. 8 min read</p>
              
              {activeContent.description && (
                <p style={{ 
                  fontSize: 15, color: "#8ea4bd", lineHeight: 1.6, 
                  marginBottom: 32, padding: "12px 16px", borderLeft: "4px solid #185fa5", 
                  background: "rgba(24,95,165,0.05)", borderRadius: "0 8px 8px 0"
                }}>
                  {activeContent.description}
                </p>
              )}
              
              {activeType === "video" && (
                <div style={{ 
                  width: "100%", aspectRatio: "16/9", background: "#000", 
                  borderRadius: 14, overflow: "hidden", marginBottom: 32,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
                }}>
                  <iframe 
                    width="100%" height="100%" 
                    src={activeContent.fileUrl?.includes("watch?v=") ? activeContent.fileUrl.replace("watch?v=", "embed/") : activeContent.fileUrl} 
                    title="Course Content" frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              {activeType === "link" && (
                <div style={{ 
                  padding: "32px", border: "1px solid #1e3a5f", borderRadius: 14, 
                  background: "#111c2e", marginBottom: 32, textAlign: "center"
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
                  <h3 style={{ fontSize: 20, color: "#e8edf4", marginBottom: 12 }}>External Learning Resource</h3>
                  <p style={{ color: "#8ea4bd", marginBottom: 24, fontSize: 14 }}>This lesson is hosted on an external website. Click below to open and study the resource.</p>
                  <a 
                    href={activeContent.fileUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ 
                      display: "inline-block", background: "#185fa5", color: "#fff", 
                      padding: "12px 32px", borderRadius: 8, fontSize: 14, 
                      fontWeight: 600, textDecoration: "none", transition: "background 0.2s" 
                    }}
                  >
                    Open Link Resource
                  </a>
                </div>
              )}

              {activeType === "file" && (
                <div style={{ 
                  padding: "32px", border: "1px solid #1e3a5f", borderRadius: 14, 
                  background: "#111c2e", marginBottom: 32, textAlign: "center"
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
                  <h3 style={{ fontSize: 20, color: "#e8edf4", marginBottom: 12 }}>Study Document</h3>
                  <p style={{ color: "#8ea4bd", marginBottom: 24, fontSize: 14 }}>A file (PDF, PPT, or Word document) is attached to this lesson. You can view or download it to study.</p>
                  <a 
                    href={activeContent.fileUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ 
                      display: "inline-block", background: "#10b981", color: "#fff", 
                      padding: "12px 32px", borderRadius: 8, fontSize: 14, 
                      fontWeight: 600, textDecoration: "none", transition: "background 0.2s" 
                    }}
                  >
                    View / Download File
                  </a>
                </div>
              )}

              {activeType === "text" && (
                <div style={{ 
                  padding: "32px", border: "1px solid #1e3a5f", borderRadius: 14, 
                  background: "#111c2e", marginBottom: 32
                }}>
                  <div 
                    style={{ color: "#c0cfe0", lineHeight: 1.8, fontSize: 15, whiteSpace: "pre-wrap" }}
                  >
                    {activeContent.body || "No lesson text content available."}
                  </div>
                </div>
              )}

              {activeType !== "video" && activeType !== "link" && activeType !== "file" && activeType !== "text" && (
                <div style={{ 
                  padding: "32px", border: "1px solid #1e3a5f", borderRadius: 14, 
                  background: "#111c2e", marginBottom: 32
                }}>
                  <div 
                    style={{ color: "#c0cfe0", lineHeight: 1.8, fontSize: 15 }}
                    dangerouslySetInnerHTML={{ __html: activeContent.body || "No lesson text content available." }}
                  />
                  {activeContent.fileUrl && (
                    <div style={{ marginTop: 24, padding: 20, border: "1px dashed #2a4060", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "#e8edf4" }}>Attached Resource</div>
                        <div style={{ fontSize: 13, color: "#5a7a9a" }}>Download additional materials for this lesson.</div>
                      </div>
                      <button 
                        onClick={() => window.open(activeContent.fileUrl, "_blank")}
                        style={{ background: "transparent", color: "#5b9bd5", border: "1px solid #2a4060", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                      >Download</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        ) : (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#5a7a9a" }}>
              <div style={{ fontSize: 64, marginBottom: 24 }}>🚀</div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#e8edf4" }}>Ready to learn?</h2>
              <p>Select a lesson from the curriculum to begin.</p>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div style={{ 
          padding: "16px 40px", borderTop: "1px solid #1e3a5f", 
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "#0b1929"
        }}>
          <button 
            disabled={currentIndex <= 0}
            onClick={() => currentIndex > 0 && setActiveContent(allItems[currentIndex - 1])}
            style={{ 
              background: "transparent", color: currentIndex <= 0 ? "#2a4060" : "#8ea4bd", 
              border: "1px solid #2a4060", padding: "10px 20px", borderRadius: 8, 
              fontSize: 13, fontWeight: 600, cursor: currentIndex <= 0 ? "not-allowed" : "pointer" 
            }}
          >← Previous</button>
          <button 
            disabled={currentIndex >= allItems.length - 1}
            onClick={() => {
              if (currentIndex < allItems.length - 1) {
                setActiveContent(allItems[currentIndex + 1]);
              }
            }}
            style={{ 
              background: currentIndex >= allItems.length - 1 ? "#1e3a5f" : "#185fa5", 
              color: currentIndex >= allItems.length - 1 ? "#5a7a9a" : "#fff", 
              border: "none", 
              padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600, 
              cursor: currentIndex >= allItems.length - 1 ? "not-allowed" : "pointer" 
            }}
          >Next Lesson →</button>
        </div>
      </div>
    </div>
  );
}

function AnnouncementsBoard({ courseId }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});

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
      alert("Failed to submit reply. " + (err.message || "Replies might be locked."));
    }
  };

  if (loading) return <div style={{ color: "#5a7a9a", textAlign: "center", padding: 20 }}>Loading announcements...</div>;

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#e8edf4", marginBottom: 6 }}>📢 Course Announcement Board</h2>
      <p style={{ color: "#5a7a9a", fontSize: 13, marginBottom: 24 }}>Stay updated with the latest instructions and discussions from your teachers.</p>

      {announcements.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, border: "1px dashed #2a4060", borderRadius: 12, color: "#5a7a9a" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔔</div>
          No announcements have been posted for this course yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {announcements.map((ann) => (
            <div key={ann.courseAnnouncementID} style={{ 
              background: "#111c2e", border: "1px solid #1e3a5f", borderRadius: 14, padding: 24 
            }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{ann.title}</h3>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "#5b9bd5" }}>
                    <span style={{ fontWeight: 600 }}>{ann.authorName}</span>
                    <span style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>Instructor</span>
                    <span style={{ color: "#2a4060" }}>•</span>
                    <span style={{ color: "#5a7a9a" }}>{new Date(ann.createdAt).toLocaleDateString()} {new Date(ann.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ color: "#c0cfe0", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 20, borderBottom: "1px solid rgba(30,58,95,0.4)", paddingBottom: 20 }}>
                {ann.body}
              </div>

              {/* Replies */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                <h4 style={{ fontSize: 12, fontWeight: 600, color: "#6b85a3", textTransform: "uppercase", letterSpacing: "0.05em" }}>Comments ({ann.replies.length})</h4>
                {ann.replies.map((reply) => {
                  const isInstructor = reply.userRole === "Instructor" || reply.userRole === "Admin" || reply.userRole === "SuperAdmin";
                  return (
                    <div key={reply.announcementReplyID} style={{ 
                      padding: 12, borderRadius: 8, background: isInstructor ? "rgba(24,95,165,0.06)" : "rgba(255,255,255,0.01)",
                      border: isInstructor ? "1px solid rgba(24,95,165,0.2)" : "1px solid rgba(30,58,95,0.2)",
                      marginLeft: 12
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
                          <span style={{ fontWeight: 600, color: "#e8edf4" }}>{reply.userName}</span>
                          {isInstructor && (
                            <span style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", padding: "1px 4px", borderRadius: 4, fontSize: 9, fontWeight: 700 }}>Staff</span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: "#5a7a9a" }}>{new Date(reply.createdAt).toLocaleDateString()} {new Date(reply.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div style={{ color: "#a0aec0", fontSize: 13, lineHeight: 1.4 }}>{reply.body}</div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              {ann.allowReplies ? (
                <form onSubmit={(e) => handlePostReply(e, ann.courseAnnouncementID)} style={{ display: "flex", gap: 8 }}>
                  <input 
                    type="text" 
                    placeholder="Write a comment..." 
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
                  }}>Reply</button>
                </form>
              ) : (
                <div style={{ fontSize: 12, color: "#5a7a9a", background: "rgba(255,255,255,0.01)", padding: "10px 14px", borderRadius: 8, textAlign: "center" }}>
                  🔒 Replies are disabled for this announcement.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CourseRosterBoard({ courseId }) {
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

  if (loading) return <div style={{ color: "#5a7a9a", textAlign: "center", padding: 20 }}>Loading roster...</div>;

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
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#e8edf4", marginBottom: 6 }}>👥 Course Roster</h2>
          <p style={{ color: "#5a7a9a", fontSize: 13 }}>View the directory of teaching staff and enrolled students in this course.</p>
        </div>
        <input 
          type="text" 
          placeholder="Search roster..." 
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          style={{ 
            padding: "8px 16px", borderRadius: 8, border: "1px solid #2a4060",
            background: "#111c2e", color: "#e8edf4", fontSize: 13, outline: "none",
            minWidth: "220px"
          }}
        />
      </div>

      {/* Teaching Staff Section */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#e8edf4", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span>👨‍🏫</span> Teaching Staff
        </h3>
        {filteredInstructors.length === 0 ? (
          <div style={{ padding: 16, background: "#111c2e", border: "1px solid #1e3a5f", borderRadius: 12, color: "#5a7a9a", fontSize: 13 }}>
            No instructors assigned to this course.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {filteredInstructors.map((ins, idx) => (
              <div key={idx} style={{ 
                background: "#111c2e", border: "1px solid #1e3a5f", borderRadius: 12, padding: 16,
                display: "flex", alignItems: "center", gap: 12
              }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#185fa5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#fff" }}>
                  {ins.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || "I"}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#e8edf4", fontSize: 14 }}>{ins.name}</div>
                  <div style={{ fontSize: 11, color: "#5b9bd5", marginBottom: 4 }}>Instructor</div>
                  <div style={{ fontSize: 11, color: "#5a7a9a" }}>{ins.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Classmates Section */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#e8edf4", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span>🎓</span> Classmates ({totalStudents})
        </h3>
        {totalStudents === 0 ? (
          <div style={{ padding: 16, background: "#111c2e", border: "1px solid #1e3a5f", borderRadius: 12, color: "#5a7a9a", fontSize: 13 }}>
            No classmates found.
          </div>
        ) : (
          <div style={{ background: "#111c2e", border: "1px solid #1e3a5f", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e3a5f", background: "rgba(30,58,95,0.2)" }}>
                  <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b85a3" }}>NAME</th>
                  <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b85a3" }}>EMAIL</th>
                  <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b85a3" }}>SECTION</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((stud, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < paginatedStudents.length - 1 ? "1px solid rgba(30,58,95,0.4)" : "none" }}>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#e8edf4", fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1a2c42", border: "1px solid #2a4060", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#8ea4bd" }}>
                          {stud.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || "S"}
                        </div>
                        {stud.name}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#8ea4bd" }}>{stud.email}</td>
                    <td style={{ padding: "14px 16px" }}>
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

            {/* Pagination Component */}
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
