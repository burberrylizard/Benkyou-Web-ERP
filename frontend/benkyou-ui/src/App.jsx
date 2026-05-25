import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Auth/Home";
import Register from "./pages/Auth/Register";
import Login from "./pages/Auth/Login";
import SuperAdminLogin from "./pages/Auth/SuperAdminLogin";
import VerifyEmail from "./pages/Auth/VerifyEmail";
import VerifyOtp from "./pages/Auth/VerifyOtp";
import ForgotPassword from "./pages/Auth/ForgotPassword";

/* Admin */
import AdminDashboard from "./pages/Admin/Dashboard";
import AdminUsers from "./pages/Admin/Users";
import AdminCourses from "./pages/Admin/Courses";
import AdminEnrollments from "./pages/Admin/Enrollments";
import AdminCategories from "./pages/Admin/Categories";
import AdminAnalytics from "./pages/Admin/Analytics";
import AdminAuditLogs from "./pages/Admin/AuditLogs";
import AdminSubscription from "./pages/Admin/Subscription";
import AdminSubscriptionSuccess from "./pages/Admin/SubscriptionSuccess";
import AdminSubscriptionCancel from "./pages/Admin/SubscriptionCancel";
import MockPayment from "./pages/Admin/MockPayment";
import AdminSettings from "./pages/Admin/Settings";

/* Super Admin */
import SuperAdminDashboard from "./pages/SuperAdmin/Dashboard";
import Organizations from "./pages/SuperAdmin/Organizations";
import Billing from "./pages/SuperAdmin/Billing";
import AllUsers from "./pages/SuperAdmin/Users";
import SystemAnalytics from "./pages/SuperAdmin/Analytics";
import SAuditLogs from "./pages/SuperAdmin/AuditLogs";
import Settings from "./pages/SuperAdmin/Settings";

/* Instructor */
import InstructorDashboard from "./pages/Instructor/Dashboard";
import InstructorCourses from "./pages/Instructor/MyCourses";
import InstructorQuizzes from "./pages/Instructor/Assessments";
import InstructorExams from "./pages/Instructor/Assessments";
import InstructorGrades from "./pages/Instructor/Grades";
import InstructorAnalytics from "./pages/Instructor/StudentProgress";
import InstructorAuditLogs from "./pages/Instructor/Submissions";
import InstructorSettings from "./pages/Instructor/Profile";
import InstructorCourseEditor from "./pages/Instructor/CourseEditor";
import InstructorAssessmentEditor from "./pages/Instructor/AssessmentEditor";
import InstructorAssessmentBuilder from "./pages/Instructor/AssessmentBuilder";
import InstructorSubmissionReview from "./pages/Instructor/SubmissionReview";

/* Operator */
import OperatorDashboard from "./pages/Operator/Dashboard";
import OperatorEnrollments from "./pages/Operator/Enrollments";
import OperatorEnrollmentRequests from "./pages/Operator/EnrollmentRequests";
import ManageStudents from "./pages/Operator/ManageStudents";
import ImportStudents from "./pages/Operator/ImportStudents";
import BatchEnroll from "./pages/Operator/BatchEnroll";
import ClassSections from "./pages/Operator/ClassSections";
import OperatorRosters from "./pages/Operator/Rosters";
import EnrollmentHistory from "./pages/Operator/EnrollmentHistory";
import EnrollmentReport from "./pages/Operator/EnrollmentReport";

/* Student */
import StudentDashboard from "./pages/Student/Dashboard";
import StudentCourses from "./pages/Student/MyCourses";
import StudentAssessments from "./pages/Student/Assessments";
import StudentGrades from "./pages/Student/Grades";
import StudentProfile from "./pages/Student/Profile";
import StudentLearningView from "./pages/Student/LearningView";
import StudentQuizPlayer from "./pages/Student/QuizPlayer";

import { TenantProvider } from "./context/TenantContext";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import ProtectedRoute from "./components/shared/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TenantProvider>
          <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/superadmin-login" element={<SuperAdminLogin />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Super Admin (not prefixed by tenant) */}
          <Route path="/superadmin" element={<ProtectedRoute allowedRoles={["SuperAdmin"]}><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/superadmin/dashboard" element={<ProtectedRoute allowedRoles={["SuperAdmin"]}><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/superadmin/organizations" element={<ProtectedRoute allowedRoles={["SuperAdmin"]}><Organizations /></ProtectedRoute>} />
          <Route path="/superadmin/billing" element={<ProtectedRoute allowedRoles={["SuperAdmin"]}><Billing /></ProtectedRoute>} />
          <Route path="/superadmin/users" element={<ProtectedRoute allowedRoles={["SuperAdmin"]}><AllUsers /></ProtectedRoute>} />
          <Route path="/superadmin/analytics" element={<ProtectedRoute allowedRoles={["SuperAdmin"]}><SystemAnalytics /></ProtectedRoute>} />
          <Route path="/superadmin/audit-logs" element={<ProtectedRoute allowedRoles={["SuperAdmin"]}><SAuditLogs /></ProtectedRoute>} />
          <Route path="/superadmin/settings" element={<ProtectedRoute allowedRoles={["SuperAdmin"]}><Settings /></ProtectedRoute>} />

          {/* Tenant Prefixed Routes (Admin, Instructor, Student) */}
          <Route path="/:tenantCode">
            {/* Admin */}
            <Route path="admin/dashboard" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="admin/users" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminUsers /></ProtectedRoute>} />
            <Route path="admin/courses" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminCourses /></ProtectedRoute>} />
            <Route path="admin/categories" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminCategories /></ProtectedRoute>} />
            <Route path="admin/analytics" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminAnalytics /></ProtectedRoute>} />
            <Route path="admin/logs" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminAuditLogs /></ProtectedRoute>} />
            <Route path="admin/subscription" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminSubscription /></ProtectedRoute>} />
            <Route path="admin/subscription/success" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminSubscriptionSuccess /></ProtectedRoute>} />
            <Route path="admin/subscription/cancel" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminSubscriptionCancel /></ProtectedRoute>} />
            <Route path="admin/mock-payment" element={<ProtectedRoute allowedRoles={["Admin"]}><MockPayment /></ProtectedRoute>} />
            <Route path="admin/settings" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminSettings /></ProtectedRoute>} />

            {/* Instructor */}
            <Route path="instructor/dashboard" element={<ProtectedRoute allowedRoles={["Instructor"]}><InstructorDashboard /></ProtectedRoute>} />
            <Route path="instructor/courses" element={<ProtectedRoute allowedRoles={["Instructor"]}><InstructorCourses /></ProtectedRoute>} />
            <Route path="instructor/quizzes" element={<ProtectedRoute allowedRoles={["Instructor"]}><InstructorQuizzes /></ProtectedRoute>} />
            <Route path="instructor/exams" element={<ProtectedRoute allowedRoles={["Instructor"]}><InstructorExams /></ProtectedRoute>} />
            <Route path="instructor/grades" element={<ProtectedRoute allowedRoles={["Instructor"]}><InstructorGrades /></ProtectedRoute>} />
            <Route path="instructor/analytics" element={<ProtectedRoute allowedRoles={["Instructor"]}><InstructorAnalytics /></ProtectedRoute>} />
            <Route path="instructor/logs" element={<ProtectedRoute allowedRoles={["Instructor"]}><InstructorAuditLogs /></ProtectedRoute>} />
            <Route path="instructor/settings" element={<ProtectedRoute allowedRoles={["Instructor"]}><InstructorSettings /></ProtectedRoute>} />
            <Route path="instructor/courses/:id/edit" element={<ProtectedRoute allowedRoles={["Instructor"]}><InstructorCourseEditor /></ProtectedRoute>} />
            <Route path="instructor/assessments/:id/edit" element={<ProtectedRoute allowedRoles={["Instructor"]}><InstructorAssessmentEditor /></ProtectedRoute>} />
            <Route path="instructor/assessments/:id/builder" element={<ProtectedRoute allowedRoles={["Instructor"]}><InstructorAssessmentBuilder /></ProtectedRoute>} />
            <Route path="instructor/submissions/:attemptId" element={<ProtectedRoute allowedRoles={["Instructor"]}><InstructorSubmissionReview /></ProtectedRoute>} />

            {/* Operator */}
            <Route path="operator/dashboard" element={<ProtectedRoute allowedRoles={["Operator"]}><OperatorDashboard /></ProtectedRoute>} />
            <Route path="operator/students" element={<ProtectedRoute allowedRoles={["Operator"]}><ManageStudents /></ProtectedRoute>} />
            <Route path="operator/students/import" element={<ProtectedRoute allowedRoles={["Operator"]}><ImportStudents /></ProtectedRoute>} />
            <Route path="operator/batch-enroll" element={<ProtectedRoute allowedRoles={["Operator"]}><BatchEnroll /></ProtectedRoute>} />
            <Route path="operator/sections" element={<ProtectedRoute allowedRoles={["Operator"]}><ClassSections /></ProtectedRoute>} />
            <Route path="operator/rosters" element={<ProtectedRoute allowedRoles={["Operator"]}><OperatorRosters /></ProtectedRoute>} />
            <Route path="operator/batch-enroll/history" element={<ProtectedRoute allowedRoles={["Operator"]}><EnrollmentHistory /></ProtectedRoute>} />
            <Route path="operator/enrollments" element={<ProtectedRoute allowedRoles={["Operator"]}><OperatorEnrollments /></ProtectedRoute>} />
            <Route path="operator/enrollment-requests" element={<ProtectedRoute allowedRoles={["Operator"]}><OperatorEnrollmentRequests /></ProtectedRoute>} />
            <Route path="operator/reports" element={<ProtectedRoute allowedRoles={["Operator"]}><EnrollmentReport /></ProtectedRoute>} />

            {/* Student */}
            <Route path="student/dashboard" element={<ProtectedRoute allowedRoles={["Student"]}><StudentDashboard /></ProtectedRoute>} />
            <Route path="student/courses" element={<ProtectedRoute allowedRoles={["Student"]}><StudentCourses /></ProtectedRoute>} />
            <Route path="student/assessments" element={<ProtectedRoute allowedRoles={["Student"]}><StudentAssessments /></ProtectedRoute>} />
            <Route path="student/grades" element={<ProtectedRoute allowedRoles={["Student"]}><StudentGrades /></ProtectedRoute>} />
            <Route path="student/profile" element={<ProtectedRoute allowedRoles={["Student"]}><StudentProfile /></ProtectedRoute>} />
            <Route path="student/courses/:id/learn" element={<ProtectedRoute allowedRoles={["Student"]}><StudentLearningView /></ProtectedRoute>} />
            <Route path="student/assessments/:id/take" element={<ProtectedRoute allowedRoles={["Student"]}><StudentQuizPlayer /></ProtectedRoute>} />
          </Route>

          {/* Fallback for non-prefixed dashboard access (will redirect via ProtectedRoute switch) */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/subscription/success" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminSubscriptionSuccess /></ProtectedRoute>} />
          <Route path="/admin/subscription/cancel" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminSubscriptionCancel /></ProtectedRoute>} />
          </Routes>
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
