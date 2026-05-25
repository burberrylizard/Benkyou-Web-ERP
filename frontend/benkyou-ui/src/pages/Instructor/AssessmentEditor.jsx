import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { INST_THEME, getNav, INST_STYLES as s } from "./instructorConfig";
import { useAuth } from "../../context/AuthContext";
import { getAssessmentById, addQuestion } from "../../services/assessmentService";

export default function AssessmentEditor() {
  const { id } = useParams();
  const { user: authUser } = useAuth();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ body: "", questionType: "MultipleChoice", points: 1 });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const data = await getAssessmentById(id);
      setAssessment(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      await addQuestion(parseInt(id), { ...newQuestion, sortOrder: assessment.questions.length + 1 });
      setShowAddQuestion(false);
      setNewQuestion({ body: "", questionType: "MultipleChoice", points: 1 });
      loadData();
    } catch (err) {
      alert("Failed to add question");
    }
  };

  if (loading) return <div style={{ padding: 50, textAlign: "center", background: "#0a1220", color: "#5a7a9a", minHeight: "100vh" }}>Loading editor...</div>;

  return (
    <DashboardLayout 
      theme={INST_THEME} 
      role="Instructor" 
      navGroups={getNav("Assessments")} 
      userName={authUser?.name} 
      headerTitle={assessment?.title || "Assessment Editor"} 
      headerSub="Add questions and choices"
    >
      {/* Header Info */}
      <div style={{ ...s.card, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, color: "#6b85a3" }}>{assessment?.courseTitle || "Course"}</div>
          <div style={{ fontSize: 11, color: "#5a7a9a", marginTop: 4 }}>
            {assessment?.questions?.length || 0} questions · Time: {assessment?.timeLimitMinutes || 30}min · Pass: {assessment?.passingScore || 70}%
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={s.outlineBtn}>Settings</button>
          <button style={{ ...s.primaryBtn, background: "#10b981" }}>Save & publish</button>
        </div>
      </div>

      <div style={{ maxWidth: 800 }}>
        <button 
          onClick={() => setShowAddQuestion(!showAddQuestion)}
          style={{ ...s.primaryBtn, marginBottom: 24 }}
        >
          {showAddQuestion ? "Cancel" : "+ Add Question"}
        </button>

        {showAddQuestion && (
          <div style={{ ...s.card, marginBottom: 32, border: "2px dashed #2a4060" }}>
            <form onSubmit={handleAddQuestion} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Question Body</label>
                <textarea 
                  rows="3"
                  value={newQuestion.body}
                  onChange={(e) => setNewQuestion({...newQuestion, body: e.target.value})}
                  style={inputStyle}
                  placeholder="Enter your question here..."
                />
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Points</label>
                  <input 
                    type="number"
                    value={newQuestion.points}
                    onChange={(e) => setNewQuestion({...newQuestion, points: parseFloat(e.target.value)})}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Type</label>
                  <select 
                    value={newQuestion.questionType}
                    onChange={(e) => setNewQuestion({...newQuestion, questionType: e.target.value})}
                    style={inputStyle}
                  >
                    <option>MultipleChoice</option>
                    <option>TrueFalse</option>
                  </select>
                </div>
              </div>
              <button type="submit" style={{ ...s.primaryBtn, alignSelf: "flex-end" }}>Save Question</button>
            </form>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {assessment.questions.map((q, i) => (
            <QuestionItem key={q.questionID} question={q} index={i} onUpdate={loadData} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

function QuestionItem({ question, index, onUpdate }) {
  const [newChoice, setNewChoice] = useState({ body: "", isCorrect: false });

  const handleAddChoice = async (e) => {
    e.preventDefault();
    try {
      const { apiRequest } = await import("../../api/client");
      await apiRequest("assessments/choices", { method: "POST", body: { ...newChoice, questionID: question.questionID } });
      setNewChoice({ body: "", isCorrect: false });
      onUpdate();
    } catch (err) {
      alert("Failed to add choice");
    }
  };

  return (
    <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
      {/* Question Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #1e3a5f" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#5a7a9a" }}>Question {index + 1} of {question.points || 10} pts</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ background: "transparent", color: "#5b9bd5", border: "1px solid #2a4060", padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>Edit</button>
          <button style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>Delete</button>
        </div>
      </div>

      {/* Question Body */}
      <div style={{ padding: 20 }}>
        <p style={{ fontSize: 16, color: "#e8edf4", margin: "0 0 20px 0", fontWeight: 500, lineHeight: 1.5 }}>{question.body}</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {question.choices.map((c) => (
            <div key={c.questionChoiceID} style={{ 
              padding: "12px 16px", borderRadius: 10, 
              background: c.isCorrect ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${c.isCorrect ? "rgba(16,185,129,0.3)" : "#1e3a5f"}`,
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ 
                  width: 20, height: 20, borderRadius: "50%",
                  background: c.isCorrect ? "#10b981" : "transparent",
                  border: c.isCorrect ? "none" : "2px solid #2a4060",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: "#fff"
                }}>{c.isCorrect ? "✓" : ""}</div>
                <span style={{ fontSize: 14, color: c.isCorrect ? "#10b981" : "#a0b4cb" }}>{c.body}</span>
              </div>
              {c.isCorrect && <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.12)", padding: "2px 8px", borderRadius: 4 }}>CORRECT</span>}
            </div>
          ))}
        </div>

        {/* Add Choice */}
        <form onSubmit={handleAddChoice} style={{ display: "flex", gap: 10, padding: 14, background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid #1e3a5f" }}>
          <input 
            placeholder="New choice..." 
            value={newChoice.body}
            onChange={(e) => setNewChoice({...newChoice, body: e.target.value})}
            style={{ ...inputStyle, padding: "8px 12px" }} 
          />
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "#6b85a3", whiteSpace: "nowrap" }}>
            <input 
              type="checkbox" 
              checked={newChoice.isCorrect}
              onChange={(e) => setNewChoice({...newChoice, isCorrect: e.target.checked})}
              style={{ accentColor: "#10b981" }}
            />
            Correct?
          </label>
          <button type="submit" style={{ background: "#185fa5", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>Add</button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#6b85a3", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.03em" };
const inputStyle = { width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #2a4060", fontSize: 14, outline: "none", background: "#0d1a2b", color: "#e8edf4" };
