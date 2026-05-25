import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAssessmentById, startAttempt, submitAttempt, getAttemptResult } from "../../services/assessmentService";
import { useTenant } from "../../context/TenantContext";
import { parseApiDate } from "../../utils/format";

export default function QuizPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tenantPath } = useTenant();
  const [assessment, setAssessment] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [essayAnswers, setEssayAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { loadAndStart(); }, [id]);

  const loadAndStart = async () => {
    try {
      const data = await getAssessmentById(id);
      setAssessment(data);

      // Check due date
      if (data.dueDate && parseApiDate(data.dueDate) < new Date()) {
        setError("closed");
        setLoading(false);
        return;
      }

      // Start attempt
      const att = await startAttempt(id);
      setAttempt(att);
      const limit = data.timeLimitMinutes || data.TimeLimitMinutes || 0;
      setTimeLeft(limit > 0 ? limit * 60 : -1);
    } catch (err) {
      setError(err.message || "Failed to load quiz");
    } finally { setLoading(false); }
  };

  const handleSubmitQuiz = useCallback(async () => {
    const attemptId = attempt?.studentAttemptID || attempt?.studentAttemptId || attempt?.StudentAttemptID || attempt?.StudentAttemptId;
    if (submitting || !attemptId) return;
    setSubmitting(true);
    try {
      const allAnswers = [];
      const questionsList = assessment?.questions || assessment?.Questions || [];
      for (const q of questionsList) {
        const qid = q.questionID || q.questionId || q.QuestionID || q.QuestionId;
        const qType = q.questionType || q.QuestionType;
        if (qType === "MultipleChoice") {
          allAnswers.push({ questionID: qid, selectedChoiceID: answers[qid] || null, essayAnswer: null });
        } else {
          allAnswers.push({ questionID: qid, selectedChoiceID: null, essayAnswer: essayAnswers[qid] || "" });
        }
      }
      await submitAttempt(attemptId, allAnswers);
      const res = await getAttemptResult(attemptId);
      setResult(res);
    } catch { alert("Failed to submit quiz"); }
    finally { setSubmitting(false); }
  }, [submitting, attempt, assessment, answers, essayAnswers]);

  useEffect(() => {
    if (timeLeft > 0 && !result) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && assessment && attempt && !result) {
      handleSubmitQuiz();
    }
  }, [timeLeft, result, assessment, attempt, handleSubmitQuiz]);

  const handleSelect = (qId, choiceId) => setAnswers({ ...answers, [qId]: choiceId });
  const handleEssay = (qId, text) => setEssayAnswers({ ...essayAnswers, [qId]: text });

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Closed ──
  if (error === "closed") return (
    <div style={page}>
      <style>{fontImport}</style>
      <div style={{ ...centerBox, maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e8edf4", marginBottom: 8 }}>Assessment Closed</h1>
        <p style={{ color: "#6b85a3", fontSize: 14, marginBottom: 24 }}>The due date has passed. This assessment is no longer available.</p>
        <button onClick={() => navigate(-1)} style={primaryBtn}>← Go Back</button>
      </div>
    </div>
  );

  if (loading) return <div style={page}><style>{fontImport}</style><div style={centerBox}><div style={{ color: "#5a7a9a" }}>Preparing your quiz...</div></div></div>;
  if (error) return <div style={page}><style>{fontImport}</style><div style={centerBox}><div style={{ color: "#ef4444" }}>{error}</div></div></div>;
  if (!assessment) return <div style={page}><style>{fontImport}</style><div style={centerBox}><div style={{ color: "#5a7a9a" }}>Quiz not found.</div></div></div>;

  // ── Results ──
  if (result) return <ResultsView result={result} assessment={assessment} navigate={navigate} tenantPath={tenantPath} />;

  // ── Quiz ──
  const questions = assessment?.questions || assessment?.Questions || [];
  const currentQ = questions[currentIdx];
  const total = questions.length;
  const answeredCount = Object.keys(answers).length + Object.keys(essayAnswers).length;
  const dueDate = assessment?.dueDate || assessment?.DueDate;
  const parsedDue = parseApiDate(dueDate);
  const dueSoon = parsedDue && (parsedDue - new Date()) < 86400000 && (parsedDue - new Date()) > 0;
  const isEssay = currentQ?.questionType === "Essay" || currentQ?.QuestionType === "Essay";

  return (
    <div style={page}>
      <style>{fontImport}{`.quiz-choice:hover { border-color: #185fa5 !important; background: rgba(24,95,165,0.08) !important; }`}</style>

      {/* Due date warning */}
      {dueSoon && (
        <div style={{ padding: "10px 32px", background: "rgba(245,158,11,0.1)", borderBottom: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontSize: 13, textAlign: "center", fontWeight: 500 }}>
          ⚠️ Due date approaching: {parsedDue.toLocaleString()}
        </div>
      )}

      {/* Top bar */}
      <div style={{ padding: "16px 32px", borderBottom: "1px solid #1e3a5f", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0b1929" }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>ben<span style={{ color: "#5b9bd5" }}>kyou</span></div>
        <div style={{ fontSize: 14, color: "#8ea4bd" }}>{assessment.title} — {assessment.courseTitle || "Course"}</div>
        {parsedDue && <div style={{ fontSize: 12, color: "#f59e0b" }}>Due: {parsedDue.toLocaleDateString()}</div>}
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px", display: "flex", gap: 24 }}>
        {/* Left */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, color: "#6b85a3" }}>Question {currentIdx + 1} of {total}</span>
            <span style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{currentQ?.points} pts</span>
            <span style={{ background: isEssay ? "rgba(139,92,246,0.12)" : "rgba(59,130,246,0.12)", color: isEssay ? "#8b5cf6" : "#3b82f6", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
              {isEssay ? "Essay" : "MC"}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 4, background: "#1a2d45", borderRadius: 2, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${((currentIdx + 1) / total) * 100}%`, background: "#185fa5", borderRadius: 2, transition: "width 0.3s" }} />
          </div>

          <div style={{ background: "#111c2e", border: "1px solid #1e3a5f", borderRadius: 16, padding: 32, marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#e8edf4", marginBottom: 24, lineHeight: 1.5 }}>{currentQ?.body || currentQ?.Body}</h2>

            {isEssay ? (
              <textarea
                value={essayAnswers[currentQ?.questionID || currentQ?.questionId] || ""}
                onChange={e => handleEssay(currentQ?.questionID || currentQ?.questionId, e.target.value)}
                placeholder="Type your answer here..."
                rows={8}
                style={{ width: "100%", padding: "16px", borderRadius: 12, border: "1px solid #2a4060", background: "#0d1a2b", color: "#e8edf4", fontSize: 15, resize: "vertical", outline: "none", lineHeight: 1.6 }}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(currentQ?.choices || currentQ?.Choices || []).map((choice, ci) => {
                  const qid = currentQ?.questionID || currentQ?.questionId;
                  const cid = choice?.questionChoiceID || choice?.choiceId || choice?.questionChoiceId;
                  const selected = answers[qid] === cid;
                  const letters = ["A", "B", "C", "D"];
                  return (
                    <button key={cid} className="quiz-choice"
                      onClick={() => handleSelect(qid, cid)}
                      style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 12, border: `2px solid ${selected ? "#185fa5" : "#1e3a5f"}`, background: selected ? "rgba(24,95,165,0.15)" : "transparent", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${selected ? "#185fa5" : "#2a4060"}`, background: selected ? "#185fa5" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: selected ? "#fff" : "#5a7a9a", flexShrink: 0 }}>
                        {selected ? "✓" : letters[ci]}
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 500, color: selected ? "#e8edf4" : "#a0b4cb" }}>{choice.choiceText || choice.ChoiceText}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Nav */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(currentIdx - 1)}
              style={{ background: "transparent", color: currentIdx === 0 ? "#2a4060" : "#8ea4bd", border: "1px solid #2a4060", padding: "10px 20px", borderRadius: 8, fontWeight: 600, cursor: currentIdx === 0 ? "not-allowed" : "pointer", fontSize: 13 }}>
              ← Previous
            </button>
            {currentIdx === total - 1 ? (
              <button onClick={handleSubmitQuiz} disabled={submitting}
                style={{ background: "#10b981", color: "#fff", border: "none", padding: "10px 28px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                {submitting ? "Submitting..." : "Finish Attempt →"}
              </button>
            ) : (
              <button onClick={() => setCurrentIdx(currentIdx + 1)}
                style={{ background: "#185fa5", color: "#fff", border: "none", padding: "10px 28px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                Next question →
              </button>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ width: 210, flexShrink: 0 }}>
          <div style={sideCard}>
            <div style={{ fontSize: timeLeft === -1 ? 22 : 32, fontWeight: 700, fontFamily: "monospace", color: (timeLeft > 0 && timeLeft < 60) ? "#ef4444" : "#e8edf4", marginBottom: 4 }}>
              {timeLeft === -1 ? "No Limit" : formatTime(timeLeft)}
            </div>
            <div style={{ fontSize: 12, color: "#5a7a9a" }}>Time remaining</div>
          </div>

          {parsedDue && (
            <div style={{ ...sideCard, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#6b85a3", marginBottom: 4 }}>Due Date</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>{parsedDue.toLocaleDateString()}</div>
            </div>
          )}

          <div style={sideCard}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "#6b85a3" }}>Progress</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#8ea4bd" }}>{answeredCount}/{total} answered</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
              {questions.map((q, i) => {
                const qid = q.questionID || q.questionId;
                const isAnswered = answers[qid] != null || (essayAnswers[qid] && essayAnswers[qid].trim());
                return (
                  <div key={i} onClick={() => setCurrentIdx(i)}
                    style={{ width: 32, height: 32, borderRadius: 8, background: isAnswered ? "#185fa5" : currentIdx === i ? "rgba(24,95,165,0.3)" : "#1a2d45", border: currentIdx === i ? "2px solid #185fa5" : "1px solid #2a4060", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: isAnswered ? "#fff" : "#5a7a9a", cursor: "pointer", transition: "all 0.2s" }}>
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={sideCard}>
            <div style={{ fontSize: 12, color: "#5a7a9a" }}>
              Attempt {attempt?.attemptNumber || 1} of {assessment.maxAttempts}. {assessment.maxAttempts > 1 ? `You can retake ${assessment.maxAttempts - (attempt?.attemptNumber || 1)} more time(s).` : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Results View ──
function ResultsView({ result, assessment, navigate, tenantPath }) {
  const pendingCount = result.pendingCount ?? result.PendingCount ?? 0;
  const correctCount = result.correctCount ?? result.CorrectCount ?? 0;
  const wrongCount = result.wrongCount ?? result.WrongCount ?? 0;
  const totalQuestions = result.totalQuestions ?? result.TotalQuestions ?? 0;
  const timeTakenMinutes = result.timeTakenMinutes ?? result.TimeTakenMinutes ?? 0;
  const score = result.score ?? result.Score ?? 0;
  const isPassed = result.isPassed ?? result.IsPassed ?? false;
  const passMark = result.passMark ?? result.PassMark ?? 70;
  const showAnswersAfter = result.showAnswersAfter ?? result.ShowAnswersAfter ?? "Submission";
  const answers = result.answers ?? result.Answers ?? [];

  const hasPending = pendingCount > 0;
  const scoreColor = isPassed ? "#10b981" : "#ef4444";
  const scoreDisplay = score != null ? Number(score).toFixed(0) : "—";

  return (
    <div style={page}>
      <style>{fontImport}</style>
      <div style={{ width: "100%", maxWidth: 640, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>ben<span style={{ color: "#5b9bd5" }}>kyou</span></div>
        </div>

        {hasPending ? (
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e8edf4", marginBottom: 8 }}>Pending Grading</h1>
            <p style={{ color: "#6b85a3", fontSize: 14, lineHeight: 1.6 }}>
              Your essay responses are being reviewed by your instructor. Your final score will be available once all responses are graded.
            </p>
            <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, color: "#f59e0b", fontSize: 13 }}>
              {correctCount} correct · {wrongCount} wrong · {pendingCount} pending grading
            </div>
          </div>
        ) : (
          <>
            {/* Score Circle */}
            <div style={{ textAlign: "center" }}>
              <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 24px" }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="60" fill="none" stroke="#1a2d45" strokeWidth="10" />
                  <circle cx="70" cy="70" r="60" fill="none" stroke={scoreColor} strokeWidth="10"
                    strokeDasharray={`${(score / 100) * 377} 377`} strokeLinecap="round" transform="rotate(-90 70 70)"
                    style={{ transition: "stroke-dasharray 1s" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: scoreColor }}>{scoreDisplay}%</span>
                </div>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e8edf4", marginBottom: 8 }}>
                {isPassed ? "Great work!" : "Keep practicing!"}
              </h1>
              <p style={{ color: "#6b85a3", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                You {isPassed ? "passed" : "didn't pass"} with {scoreDisplay}% · {isPassed ? "above" : "below"} the {passMark}% pass mark.
              </p>
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 32 }}>
          <button onClick={() => navigate(-1)} style={{ background: "#111c2e", color: "#e8edf4", border: "1px solid #2a4060", padding: "12px 24px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
            Review answers
          </button>
          <button onClick={() => navigate(-1)} style={primaryBtn}>Continue course</button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 32 }}>
          <StatPill label="Your score" value={`${scoreDisplay}%`} color="#10b981" />
          <StatPill label="Correct" value={`${correctCount}/${totalQuestions}`} color="#3b82f6" />
          <StatPill label="Time taken" value={`${timeTakenMinutes}m`} color="#f59e0b" />
          <StatPill label="Pass mark" value={`${passMark}%`} color={isPassed ? "#10b981" : "#ef4444"} />
        </div>

        {/* Answer Review */}
        {showAnswersAfter === "Submission" && (
          <div style={{ background: "#111c2e", border: "1px solid #1e3a5f", borderRadius: 14, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#e8edf4" }}>Answer Review</h3>
              <span style={{ fontSize: 12, color: "#6b85a3" }}>
                {correctCount} correct · {wrongCount} wrong{pendingCount > 0 ? ` · ${pendingCount} pending` : ""}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {answers.map((a, i) => (
                <AnswerReviewItem key={a.studentAnswerID || a.studentAnswerId || a.StudentAnswerID || a.StudentAnswerId} a={a} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnswerReviewItem({ a, index }) {
  const qType = a.questionType ?? a.QuestionType ?? "";
  const points = a.points ?? a.Points ?? 0;
  const isCorrect = a.isCorrect ?? a.IsCorrect ?? null;
  const questionText = a.questionText ?? a.QuestionText ?? "";
  const essayAnswer = a.essayAnswer ?? a.EssayAnswer ?? "";
  const manualScore = a.manualScore ?? a.ManualScore ?? null;
  const instructorFeedback = a.instructorFeedback ?? a.InstructorFeedback ?? "";
  const choices = a.choices ?? a.Choices ?? [];
  const selectedChoiceID = a.selectedChoiceID ?? a.selectedChoiceId ?? a.SelectedChoiceID ?? a.SelectedChoiceId ?? null;

  const isEssay = qType === "Essay";
  return (
    <div style={{ padding: 16, borderRadius: 10, border: `1px solid ${isCorrect === true ? "rgba(16,185,129,0.3)" : isCorrect === false ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`, background: "rgba(255,255,255,0.01)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#8ea4bd" }}>Q{index + 1}</span>
        <span style={{ fontSize: 12, color: "#6b85a3" }}>{points} pts</span>
        {isCorrect === true && <span style={{ color: "#10b981", fontSize: 13 }}>✓ Correct</span>}
        {isCorrect === false && <span style={{ color: "#ef4444", fontSize: 13 }}>✗ Wrong</span>}
        {isCorrect === null && <span style={{ color: "#f59e0b", fontSize: 13 }}>⏳ Pending</span>}
      </div>
      <div style={{ fontSize: 14, color: "#e8edf4", marginBottom: 10 }}>{questionText}</div>

      {isEssay ? (
        <div>
          <div style={{ padding: 12, background: "#0d1a2b", borderRadius: 8, border: "1px solid #1e3a5f", fontSize: 13, color: "#a0b4cb", marginBottom: 8, whiteSpace: "pre-wrap" }}>
            {essayAnswer || "No response"}
          </div>
          {manualScore != null && (
            <div style={{ fontSize: 12, color: "#10b981", marginBottom: 4 }}>Score: {manualScore} / {points}</div>
          )}
          {instructorFeedback && (
            <div style={{ fontSize: 12, color: "#8b5cf6", padding: "8px 12px", background: "rgba(139,92,246,0.08)", borderRadius: 8, border: "1px solid rgba(139,92,246,0.2)" }}>
              💬 {instructorFeedback}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {choices.map(c => {
            const cid = c.questionChoiceID ?? c.questionChoiceId ?? c.QuestionChoiceID ?? c.QuestionChoiceId;
            const cIsCorrect = c.isCorrect ?? c.IsCorrect ?? false;
            const choiceText = c.choiceText ?? c.ChoiceText ?? "";

            const wasSelected = cid === selectedChoiceID;
            const showCorrect = cIsCorrect && isCorrect === false;
            return (
              <div key={cid} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, background: wasSelected ? (cIsCorrect ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)") : showCorrect ? "rgba(16,185,129,0.05)" : "transparent" }}>
                {wasSelected && cIsCorrect && <span style={{ color: "#10b981" }}>✓</span>}
                {wasSelected && !cIsCorrect && <span style={{ color: "#ef4444" }}>✗</span>}
                {showCorrect && !wasSelected && <span style={{ color: "#10b981" }}>✓</span>}
                {!wasSelected && !showCorrect && <span style={{ color: "#5a7a9a" }}>○</span>}
                <span style={{ fontSize: 13, color: wasSelected ? (cIsCorrect ? "#10b981" : "#ef4444") : showCorrect ? "#10b981" : "#a0b4cb" }}>{choiceText}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{ background: "#111c2e", border: "1px solid #1e3a5f", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
      <div style={{ fontSize: 16, fontWeight: 700, color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 10, color: "#5a7a9a" }}>{label}</div>
    </div>
  );
}

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); body { font-family: 'DM Sans', sans-serif; }`;
const page = { minHeight: "100vh", background: "#0a1220" };
const centerBox = { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", textAlign: "center", padding: 20 };
const primaryBtn = { background: "#185fa5", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 14 };
const sideCard = { background: "#111c2e", border: "1px solid #1e3a5f", borderRadius: 14, padding: 20, textAlign: "center", marginBottom: 16 };
