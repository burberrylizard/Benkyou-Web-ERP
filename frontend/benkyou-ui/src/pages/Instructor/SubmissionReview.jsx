import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { INST_THEME, getNav, INST_STYLES as s } from "./instructorConfig";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import { getAttemptReview, gradeEssayAnswer } from "../../services/assessmentService";

export default function SubmissionReview() {
  const { user: authUser } = useAuth();
  const { attemptId } = useParams();
  const { tenantPath } = useTenant();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // local edits: { [studentAnswerId]: { score: number|string, feedback: string, saved: boolean } }
  const [gradesState, setGradesState] = useState({});
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    if (!attemptId) return;
    setIsLoading(true);
    getAttemptReview(attemptId)
      .then((data) => {
        setAttempt(data);
        const initial = {};
        (data.essayAnswers || []).forEach((ans) => {
          const ansId = ans.studentAnswerID || ans.studentAnswerId;
          initial[ansId] = {
            score: ans.manualScore !== null ? ans.manualScore.toString() : "",
            feedback: ans.instructorFeedback || "",
            saved: ans.manualScore !== null,
          };
        });
        setGradesState(initial);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [attemptId]);

  if (isLoading) return (
    <DashboardLayout theme={INST_THEME} role="Instructor" navGroups={getNav("Submissions")} headerTitle="Submission Review" headerSub="Loading...">
      <div style={{ textAlign: "center", padding: 50, color: "#5a7a9a" }}>Loading submission details...</div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout theme={INST_THEME} role="Instructor" navGroups={getNav("Submissions")} headerTitle="Submission Review" headerSub="Error">
      <div style={{ textAlign: "center", padding: 50, color: "#ef4444" }}>
        Error loading submission: {error.message}
      </div>
    </DashboardLayout>
  );

  const isReadOnly = attempt?.status === "Graded";
  const essayAnswers = attempt?.essayAnswers || [];
  const allGraded = essayAnswers.length > 0 && essayAnswers.every(ans => gradesState[ans.studentAnswerID || ans.studentAnswerId]?.saved);

  const handleScoreChange = (ansId, value) => {
    setGradesState(prev => ({
      ...prev,
      [ansId]: { ...prev[ansId], score: value, saved: false }
    }));
  };

  const handleFeedbackChange = (ansId, value) => {
    setGradesState(prev => ({
      ...prev,
      [ansId]: { ...prev[ansId], feedback: value, saved: false }
    }));
  };

  const handleSave = async (ansId, maxPoints) => {
    const stateVal = gradesState[ansId];
    const numericScore = parseFloat(stateVal.score);

    if (isNaN(numericScore) || numericScore < 0 || numericScore > maxPoints) {
      alert(`Invalid score. Please enter a value between 0 and ${maxPoints}.`);
      return;
    }

    setSavingId(ansId);
    try {
      await gradeEssayAnswer(ansId, numericScore, stateVal.feedback);
      setGradesState(prev => ({
        ...prev,
        [ansId]: { ...prev[ansId], saved: true }
      }));
    } catch (err) {
      alert(`Failed to save grade: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <DashboardLayout 
      theme={INST_THEME} 
      role="Instructor" 
      navGroups={getNav("Submissions")} 
      userName={authUser?.name} 
      headerTitle="Submission Review" 
      headerSub="Evaluate essay questions and review attempts"
    >
      {/* Top Header Card */}
      <div style={{ ...s.card, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <button onClick={() => navigate(-1)} style={{ ...s.outlineBtn, marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>
            &larr; Back
          </button>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#e8edf4", margin: "0 0 8px 0" }}>{attempt?.assessmentTitle}</h2>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 14, color: "#a0b4cb" }}>
            <span><strong>Student:</strong> {attempt?.studentName}</span>
            <span><strong>Attempt:</strong> #{attempt?.attemptNumber}</span>
            <span><strong>Submitted:</strong> {new Date(attempt?.submittedAt).toLocaleString()}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <span style={{
            background: isReadOnly ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
            color: isReadOnly ? "#10b981" : "#f59e0b",
            border: `1px solid ${isReadOnly ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
            padding: "6px 14px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600
          }}>
            {isReadOnly ? "Status: Graded" : "Status: Pending Review"}
          </span>
        </div>
      </div>

      {/* Success State Banner */}
      {allGraded && (
        <div style={{
          background: "rgba(16, 185, 129, 0.12)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          borderRadius: 12,
          padding: "16px 24px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="#10b981"/>
          </svg>
          <span style={{ color: "#10b981", fontSize: 15, fontWeight: 600 }}>
            All essays graded &mdash; student results have been updated.
          </span>
        </div>
      )}

      {/* Essay Questions List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {essayAnswers.length === 0 ? (
          <div style={s.card}>
            <div style={{ textAlign: "center", padding: 40, color: "#5a7a9a" }}>No essay questions found in this assessment attempt.</div>
          </div>
        ) : (
          essayAnswers.map((ans, idx) => {
            const ansId = ans.studentAnswerID || ans.studentAnswerId;
            const stateVal = gradesState[ansId] || { score: "", feedback: "", saved: false };
            return (
              <div key={ansId} style={s.card}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e3a5f", paddingBottom: 12, marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#e8edf4", margin: 0 }}>Question {idx + 1}</h3>
                  <span style={{ fontSize: 13, color: "#7a8ba3" }}>Points: <strong>{ans.points}</strong> max</span>
                </div>

                {/* Question body */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: "#7a8ba3", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 6 }}>Question Text</div>
                  <div style={{ fontSize: 15, color: "#e8edf4", background: "rgba(11, 25, 41, 0.4)", border: "1px solid rgba(30, 58, 95, 0.4)", borderRadius: 8, padding: 14, whiteSpace: "pre-wrap" }}>
                    {ans.questionText}
                  </div>
                </div>

                {/* Grading notes (Rubric) */}
                {ans.gradingNotes && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: "#7a8ba3", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 6 }}>Grading Notes / Rubric</div>
                    <div style={{ fontSize: 13, color: "#5b9bd5", background: "rgba(24, 95, 165, 0.08)", border: "1px solid rgba(24, 95, 165, 0.2)", borderRadius: 8, padding: 12, fontStyle: "italic" }}>
                      {ans.gradingNotes}
                    </div>
                  </div>
                )}

                {/* Student response */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, color: "#7a8ba3", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 6 }}>Student's Essay Answer</div>
                  <div style={{
                    fontSize: 15,
                    color: "#e8edf4",
                    background: "#0b1929",
                    border: "1px solid #1e3a5f",
                    borderRadius: 8,
                    padding: 16,
                    minHeight: 100,
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.6"
                  }}>
                    {ans.essayAnswer || <em style={{ color: "#5a7a9a" }}>No answer provided by the student.</em>}
                  </div>
                </div>

                {/* Interactive grading area */}
                <div style={{
                  background: "rgba(11, 25, 41, 0.3)",
                  border: "1px solid #1e3a5f",
                  borderRadius: 10,
                  padding: 18,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: 16,
                  alignItems: "flex-end"
                }}>
                  {/* Score input */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "#7a8ba3", fontWeight: 600, marginBottom: 8, textTransform: "uppercase" }}>Score (0 - {ans.points})</label>
                    {isReadOnly ? (
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#10b981", padding: "8px 0" }}>
                        {ans.manualScore} / {ans.points}
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        max={ans.points}
                        step="any"
                        placeholder="Enter score"
                        value={stateVal.score}
                        onChange={(e) => handleScoreChange(ansId, e.target.value)}
                        style={{
                          width: "100%",
                          background: "#0b1929",
                          color: "#e8edf4",
                          border: "1px solid #1e3a5f",
                          borderRadius: 8,
                          padding: "10px 12px",
                          fontSize: 14,
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                    )}
                  </div>

                  {/* Feedback text */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "#7a8ba3", fontWeight: 600, marginBottom: 8, textTransform: "uppercase" }}>Feedback</label>
                    {isReadOnly ? (
                      <div style={{ fontSize: 14, color: "#a0b4cb", padding: "8px 0", fontStyle: "italic", whiteSpace: "pre-wrap" }}>
                        {ans.instructorFeedback || "No feedback left."}
                      </div>
                    ) : (
                      <textarea
                        rows="2"
                        placeholder="Leave feedback for student..."
                        value={stateVal.feedback}
                        onChange={(e) => handleFeedbackChange(ansId, e.target.value)}
                        style={{
                          width: "100%",
                          background: "#0b1929",
                          color: "#e8edf4",
                          border: "1px solid #1e3a5f",
                          borderRadius: 8,
                          padding: "10px 12px",
                          fontSize: 14,
                          outline: "none",
                          resize: "vertical",
                          boxSizing: "border-box"
                        }}
                      />
                    )}
                  </div>

                  {/* Save button */}
                  {!isReadOnly && (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => handleSave(ansId, ans.points)}
                        disabled={savingId === ansId}
                        style={{
                          background: stateVal.saved ? "rgba(16,185,129,0.15)" : "#185fa5",
                          color: stateVal.saved ? "#10b981" : "#fff",
                          border: `1px solid ${stateVal.saved ? "rgba(16,185,129,0.3)" : "transparent"}`,
                          padding: "10px 20px",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: savingId === ansId ? "not-allowed" : "pointer",
                          transition: "all 0.2s ease",
                          width: "100%",
                          height: "42px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxSizing: "border-box"
                        }}
                      >
                        {savingId === ansId ? "Saving..." : stateVal.saved ? "Saved ✓" : "Save Grade"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
