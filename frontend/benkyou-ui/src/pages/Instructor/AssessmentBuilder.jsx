import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { INST_THEME, getNav, INST_STYLES as s } from "./instructorConfig";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import {
  getAssessmentById, updateAssessmentSettings, publishAssessment,
  addQuestion, updateQuestion, deleteQuestion
} from "../../services/assessmentService";

const toLocalDatetimeString = (utcDateString) => {
  if (!utcDateString) return "";
  let formatted = utcDateString;
  if (!formatted.endsWith("Z") && !formatted.includes("+") && !/-\d{2}:\d{2}$/.test(formatted)) {
    formatted += "Z";
  }
  const date = new Date(formatted);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function AssessmentBuilder() {
  const { id } = useParams();
  const { user: authUser } = useAuth();
  const { tenantPath } = useTenant();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", msg: "" });

  // Settings
  const [settings, setSettings] = useState({
    timeLimitMinutes: 30, maxAttempts: 1, passMarkPercent: 60,
    shuffleQuestions: false, showAnswersAfter: "Submission", dueDate: ""
  });

  // Modal
  const [modal, setModal] = useState({ open: false, editing: null });

  useEffect(() => { loadAssessment(); }, [id]);

  const loadAssessment = async () => {
    try {
      const data = await getAssessmentById(id);
      setAssessment(data);
      const limit = data.timeLimitMinutes != null ? data.timeLimitMinutes : (data.TimeLimitMinutes != null ? data.TimeLimitMinutes : 30);
      const attempts = data.maxAttempts != null ? data.maxAttempts : (data.MaxAttempts != null ? data.MaxAttempts : 1);
      const passMark = data.passingScore != null ? data.passingScore : (data.PassingScore != null ? data.PassingScore : 60);
      const shuffle = data.shuffleQuestions != null ? data.shuffleQuestions : (data.ShuffleQuestions != null ? data.ShuffleQuestions : false);
      const showAns = data.showAnswersAfter || data.ShowAnswersAfter || "Submission";
      const due = data.dueDate || data.DueDate || "";

      setSettings({
        timeLimitMinutes: limit,
        maxAttempts: attempts,
        passMarkPercent: passMark,
        shuffleQuestions: shuffle,
        showAnswersAfter: showAns,
        dueDate: toLocalDatetimeString(due)
      });
    } catch { setFeedback({ type: "error", msg: "Failed to load assessment" }); }
    finally { setLoading(false); }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateAssessmentSettings(id, {
        ...settings,
        dueDate: settings.dueDate ? new Date(settings.dueDate).toISOString() : null
      });
      setFeedback({ type: "success", msg: "Settings saved!" });
      loadAssessment();
    } catch { setFeedback({ type: "error", msg: "Failed to save settings" }); }
    finally { setSaving(false); setTimeout(() => setFeedback({ type: "", msg: "" }), 3000); }
  };

  const handlePublish = async () => {
    if (!confirm("Publish this assessment? Students will be able to take it.")) return;
    setPublishing(true);
    try {
      await publishAssessment(id);
      setFeedback({ type: "success", msg: "Assessment published!" });
      loadAssessment();
    } catch { setFeedback({ type: "error", msg: "Failed to publish" }); }
    finally { setPublishing(false); setTimeout(() => setFeedback({ type: "", msg: "" }), 3000); }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!confirm("Delete this question?")) return;
    try {
      await deleteQuestion(qId);
      loadAssessment();
    } catch { alert("Failed to delete question"); }
  };

  if (loading) return (
    <DashboardLayout theme={INST_THEME} role="Instructor" navGroups={getNav("Assessments")} headerTitle="Assessment Builder" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50, color: "#5a7a9a" }}>Loading assessment builder...</div>
    </DashboardLayout>
  );

  if (!assessment) return (
    <DashboardLayout theme={INST_THEME} role="Instructor" navGroups={getNav("Assessments")} headerTitle="Assessment Builder" headerSub="Not found">
      <div style={{ textAlign: "center", padding: 50, color: "#5a7a9a" }}>Assessment not found</div>
    </DashboardLayout>
  );

  const questions = assessment.questions || assessment.Questions || [];
  const totalPoints = questions.reduce((sum, q) => sum + (q.points != null ? q.points : q.Points || 0), 0);
  const mcCount = questions.filter(q => (q.questionType || q.QuestionType) === "MultipleChoice").length;
  const essayCount = questions.filter(q => (q.questionType || q.QuestionType) === "Essay").length;
  const status = assessment.status || assessment.Status || "Draft";

  return (
    <DashboardLayout
      theme={INST_THEME} role="Instructor" navGroups={getNav("Assessments")}
      userName={authUser?.name}
      headerTitle={assessment.title || assessment.Title || "Assessment Builder"}
      headerSub={`${questions.length} questions · ${settings.timeLimitMinutes > 0 ? settings.timeLimitMinutes + "min" : "No limit"} · ${settings.maxAttempts} attempt${settings.maxAttempts > 1 ? "s" : ""} · ${settings.passMarkPercent}% pass`}
    >
      {/* Feedback */}
      {feedback.msg && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 500,
          background: feedback.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
          color: feedback.type === "success" ? "#10b981" : "#ef4444",
          border: `1px solid ${feedback.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`
        }}>{feedback.msg}</div>
      )}

      {/* Header Actions */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <button onClick={handleSaveSettings} disabled={saving} style={s.outlineBtn}>{saving ? "Saving..." : "💾 Save Settings"}</button>
        <button onClick={handlePublish} disabled={publishing || status === "Published"}
          style={{ ...s.primaryBtn, background: status === "Published" ? "#10b981" : "#185fa5", opacity: status === "Published" ? 0.7 : 1 }}
        >{status === "Published" ? "✓ Published" : publishing ? "Publishing..." : "🚀 Save & Publish"}</button>
      </div>

      {/* Two Column: Settings + Summary */}
      <div style={s.twoCol}>
        {/* Left — Settings */}
        <div style={s.card}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: 15, color: "#e8edf4", fontWeight: 600 }}>Quiz Settings</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Time Limit (min) (0 = No limit)">
              <input type="number" min="0" value={settings.timeLimitMinutes}
                onChange={e => setSettings({ ...settings, timeLimitMinutes: Math.max(0, parseInt(e.target.value) || 0) })}
                style={fi} />
            </Field>
            <Field label="Max Attempts">
              <input type="number" min="1" value={settings.maxAttempts}
                onChange={e => setSettings({ ...settings, maxAttempts: parseInt(e.target.value) || 1 })}
                style={fi} />
            </Field>
            <Field label="Pass Mark (%)">
              <input type="number" min="0" max="100" value={settings.passMarkPercent}
                onChange={e => setSettings({ ...settings, passMarkPercent: parseInt(e.target.value) || 0 })}
                style={fi} />
            </Field>
            <Field label="Shuffle Questions">
              <select value={settings.shuffleQuestions ? "Yes" : "No"}
                onChange={e => setSettings({ ...settings, shuffleQuestions: e.target.value === "Yes" })}
                style={fi}>
                <option>No</option>
                <option>Yes</option>
              </select>
            </Field>
            <Field label="Show Answers After">
              <select value={settings.showAnswersAfter}
                onChange={e => setSettings({ ...settings, showAnswersAfter: e.target.value })}
                style={fi}>
                <option value="Submission">Submission</option>
                <option value="Never">Never</option>
              </select>
            </Field>
            <Field label="Due Date">
              <input type="datetime-local" value={settings.dueDate}
                onChange={e => setSettings({ ...settings, dueDate: e.target.value })}
                style={fi} />
            </Field>
          </div>
        </div>

        {/* Right — Summary */}
        <div style={s.card}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: 15, color: "#e8edf4", fontWeight: 600 }}>Question Summary</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SummaryRow label="Total questions" value={questions.length} />
            <SummaryRow label="Total points" value={totalPoints} />
            <div style={{ display: "flex", gap: 8 }}>
              {mcCount > 0 && <TypeBadge type="MultipleChoice" count={mcCount} />}
              {essayCount > 0 && <TypeBadge type="Essay" count={essayCount} />}
              {questions.length === 0 && <span style={{ fontSize: 12, color: "#5a7a9a" }}>No questions yet</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#6b85a3" }}>Status:</span>
              <StatusBadge status={status} />
            </div>
            {settings.dueDate && (
              <div style={{ fontSize: 12, color: "#f59e0b" }}>
                📅 Due: {new Date(settings.dueDate).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Question List */}
      <div style={s.tableCard}>
        <div style={s.cardHeader}>
          <h2 style={s.cardTitle}>Questions</h2>
          <button onClick={() => setModal({ open: true, editing: null })} style={s.primaryBtn}>+ Add new question</button>
        </div>

        {questions.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#5a7a9a" }}>
            No questions yet. Click "Add new question" to get started.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {questions.map((q, i) => {
              const qid = q.questionID || q.questionId;
              return (
                <QuestionCard key={qid} q={q} index={i}
                  onEdit={() => setModal({ open: true, editing: q })}
                  onDelete={() => handleDeleteQuestion(qid)} />
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Question Modal */}
      {modal.open && (
        <QuestionModal
          assessmentId={parseInt(id)}
          editing={modal.editing}
          onClose={() => setModal({ open: false, editing: null })}
          onSaved={() => { setModal({ open: false, editing: null }); loadAssessment(); }}
        />
      )}
    </DashboardLayout>
  );
}

// ── Subcomponents ──
function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#5a7a9a", letterSpacing: "0.05em", marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: "#6b85a3" }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color: "#e8edf4" }}>{value}</span>
    </div>
  );
}

function TypeBadge({ type, count }) {
  const isEssay = type === "Essay";
  return (
    <span style={{
      background: isEssay ? "rgba(139,92,246,0.12)" : "rgba(59,130,246,0.12)",
      color: isEssay ? "#8b5cf6" : "#3b82f6",
      border: `1px solid ${isEssay ? "rgba(139,92,246,0.3)" : "rgba(59,130,246,0.3)"}`,
      padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600
    }}>{isEssay ? "Essay" : "Multiple choice"} ({count})</span>
  );
}

function StatusBadge({ status }) {
  const isDraft = status === "Draft";
  return (
    <span style={{
      background: isDraft ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)",
      color: isDraft ? "#f59e0b" : "#10b981",
      border: `1px solid ${isDraft ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}`,
      padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600
    }}>{status}</span>
  );
}

function QuestionCard({ q, index, onEdit, onDelete }) {
  const isEssay = q.questionType === "Essay";
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(30,58,95,0.4)", borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ background: "#1a2d45", color: "#8ea4bd", width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{index + 1}</span>
          <span style={{ fontSize: 12, color: "#6b85a3", background: "rgba(59,130,246,0.08)", padding: "2px 8px", borderRadius: 6, fontWeight: 500 }}>{q.points} pts</span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
            background: isEssay ? "rgba(139,92,246,0.12)" : "rgba(59,130,246,0.12)",
            color: isEssay ? "#8b5cf6" : "#3b82f6"
          }}>{isEssay ? "Essay" : "Multiple Choice"}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onEdit} style={{ background: "transparent", border: "1px solid #2a4060", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, color: "#8ea4bd" }}>Edit</button>
          <button onClick={onDelete} style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, color: "#ef4444" }}>Delete</button>
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 500, color: "#e8edf4", marginBottom: 12, lineHeight: 1.5 }}>{q.body}</div>

      {isEssay ? (
        <div style={{ fontSize: 12, color: "#8b5cf6", fontStyle: "italic" }}>📝 Open-ended response</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {(q.choices || []).map((c, ci) => {
            const letters = ["A", "B", "C", "D"];
            const cid = c.questionChoiceID || c.questionChoiceId;
            return (
              <div key={cid} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8,
                background: c.isCorrect ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.01)",
                border: `1px solid ${c.isCorrect ? "rgba(16,185,129,0.3)" : "rgba(30,58,95,0.3)"}`
              }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, background: c.isCorrect ? "#10b981" : "#1a2d45", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: c.isCorrect ? "#fff" : "#5a7a9a" }}>{letters[ci]}</span>
                <span style={{ fontSize: 13, color: c.isCorrect ? "#10b981" : "#a0b4cb", flex: 1 }}>{c.choiceText}</span>
                {c.isCorrect && <span style={{ fontSize: 10, fontWeight: 600, color: "#10b981", background: "rgba(16,185,129,0.12)", padding: "2px 8px", borderRadius: 6 }}>Correct</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Question Add/Edit Modal ──
function QuestionModal({ assessmentId, editing, onClose, onSaved }) {
  const [type, setType] = useState(editing?.questionType || "MultipleChoice");
  const [body, setBody] = useState(editing?.body || "");
  const [points, setPoints] = useState(editing?.points || 10);
  const [gradingNotes, setGradingNotes] = useState(editing?.gradingNotes || "");
  const [options, setOptions] = useState(
    editing?.choices?.length > 0
      ? editing.choices.map(c => ({ text: c.choiceText, isCorrect: c.isCorrect }))
      : [{ text: "", isCorrect: true }, { text: "", isCorrect: false }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAddOption = () => {
    if (options.length >= 4) return;
    setOptions([...options, { text: "", isCorrect: false }]);
  };

  const handleRemoveOption = (idx) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== idx);
    if (!updated.some(o => o.isCorrect) && updated.length > 0) updated[0].isCorrect = true;
    setOptions(updated);
  };

  const handleCorrectChange = (idx) => {
    setOptions(options.map((o, i) => ({ ...o, isCorrect: i === idx })));
  };

  const handleSave = async () => {
    if (!body.trim()) { setError("Question text is required"); return; }
    if (type === "MultipleChoice") {
      if (options.some(o => !o.text.trim())) { setError("All options must have text"); return; }
      if (!options.some(o => o.isCorrect)) { setError("Select a correct answer"); return; }
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        body, questionType: type, points: parseFloat(points),
        gradingNotes: type === "Essay" ? gradingNotes : null,
        options: type === "MultipleChoice" ? options : null
      };
      if (editing) {
        await updateQuestion(editing.questionID || editing.questionId, payload);
      } else {
        await addQuestion(assessmentId, payload);
      }
      onSaved();
    } catch (err) { setError(err.message || "Failed to save question"); }
    finally { setSaving(false); }
  };

  return (
    <div style={mStyles.overlay} onClick={onClose}>
      <div style={mStyles.modal} onClick={e => e.stopPropagation()}>
        <div style={mStyles.header}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#e8edf4" }}>{editing ? "Edit Question" : "Add New Question"}</h2>
          <button onClick={onClose} style={mStyles.closeBtn}>✕</button>
        </div>
        <div style={mStyles.body}>
          {/* Type */}
          <div style={{ marginBottom: 16 }}>
            <label style={mStyles.label}>QUESTION TYPE</label>
            <select value={type} onChange={e => setType(e.target.value)} style={fi}>
              <option value="MultipleChoice">Multiple Choice</option>
              <option value="Essay">Essay</option>
            </select>
          </div>
          {/* Text */}
          <div style={{ marginBottom: 16 }}>
            <label style={mStyles.label}>QUESTION TEXT</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={3}
              placeholder="Enter the question text..."
              style={{ ...fi, minHeight: 80, resize: "vertical" }} />
          </div>
          {/* Points */}
          <div style={{ marginBottom: 16 }}>
            <label style={mStyles.label}>POINTS</label>
            <input type="number" min="1" value={points} onChange={e => setPoints(e.target.value)} style={fi} />
          </div>

          {/* MC Options */}
          {type === "MultipleChoice" && (
            <div style={{ marginBottom: 16 }}>
              <label style={mStyles.label}>ANSWER OPTIONS</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {options.map((opt, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="radio" checked={opt.isCorrect} onChange={() => handleCorrectChange(idx)}
                      style={{ accentColor: "#10b981" }} />
                    <input value={opt.text} onChange={e => {
                      const u = [...options]; u[idx].text = e.target.value; setOptions(u);
                    }} placeholder={`Option ${String.fromCharCode(65 + idx)}`} style={{ ...fi, flex: 1 }} />
                    {options.length > 2 && (
                      <button onClick={() => handleRemoveOption(idx)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16 }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 4 && (
                <button onClick={handleAddOption}
                  style={{ marginTop: 8, background: "transparent", border: "1px dashed #2a4060", color: "#5b9bd5", padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>
                  + Add option
                </button>
              )}
            </div>
          )}

          {/* Essay notes */}
          {type === "Essay" && (
            <div style={{ marginBottom: 16 }}>
              <label style={mStyles.label}>GRADING NOTES (instructor only)</label>
              <textarea value={gradingNotes} onChange={e => setGradingNotes(e.target.value)} rows={3}
                placeholder="Optional rubric or grading criteria..."
                style={{ ...fi, minHeight: 60, resize: "vertical" }} />
            </div>
          )}

          {error && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{error}</div>}
        </div>
        <div style={mStyles.footer}>
          <button onClick={onClose} style={s.outlineBtn}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={s.primaryBtn}>
            {saving ? "Saving..." : editing ? "Update" : "Add Question"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shared Styles ──
const fi = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #2a4060", outline: "none", fontSize: 14, background: "#0d1a2b", color: "#e8edf4" };

const mStyles = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#111c2e", border: "1px solid #1e3a5f", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #1e3a5f" },
  body: { padding: 24 },
  footer: { display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 24px", borderTop: "1px solid #1e3a5f" },
  closeBtn: { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#5a7a9a" },
  label: { display: "block", fontSize: 11, fontWeight: 600, color: "#5a7a9a", letterSpacing: "0.05em", marginBottom: 6, textTransform: "uppercase" },
};
