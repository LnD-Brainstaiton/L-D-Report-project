import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Users from './pages/Users';
import PreviousEmployees from './pages/PreviousEmployees';
import Mentors from './pages/Mentors';
import Reports from './pages/Reports';
import PrivateRoute from './components/PrivateRoute';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1a237e',
    },
    secondary: {
      main: '#3949ab',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout><Navigate to="/dashboard" replace /></Layout></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/courses" element={<PrivateRoute><Layout><Navigate to="/courses/onsite/planning" replace /></Layout></PrivateRoute>} />
          {/* Onsite courses */}
          <Route path="/courses/onsite/planning" element={<PrivateRoute><Layout><Courses courseType="onsite" status="planning" /></Layout></PrivateRoute>} />
          <Route path="/courses/onsite/upcoming" element={<PrivateRoute><Layout><Courses courseType="onsite" status="upcoming" /></Layout></PrivateRoute>} />
          <Route path="/courses/onsite/ongoing" element={<PrivateRoute><Layout><Courses courseType="onsite" status="ongoing" /></Layout></PrivateRoute>} />
          <Route path="/courses/onsite/completed" element={<PrivateRoute><Layout><Courses courseType="onsite" status="completed" /></Layout></PrivateRoute>} />
          {/* Online courses */}
          <Route path="/courses/online" element={<PrivateRoute><Layout><Courses courseType="online" status="all" /></Layout></PrivateRoute>} />
          {/* External courses */}
          <Route path="/courses/external" element={<PrivateRoute><Layout><Courses courseType="external" status="all" /></Layout></PrivateRoute>} />
          {/* Legacy routes for backward compatibility */}
          <Route path="/courses/planning" element={<PrivateRoute><Layout><Navigate to="/courses/onsite/planning" replace /></Layout></PrivateRoute>} />
          <Route path="/courses/ongoing" element={<PrivateRoute><Layout><Navigate to="/courses/onsite/ongoing" replace /></Layout></PrivateRoute>} />
          <Route path="/courses/completed" element={<PrivateRoute><Layout><Navigate to="/courses/onsite/completed" replace /></Layout></PrivateRoute>} />
          <Route path="/courses/upcoming" element={<PrivateRoute><Layout><Navigate to="/courses/onsite/upcoming" replace /></Layout></PrivateRoute>} />
          <Route path="/courses/:courseId" element={<PrivateRoute><Layout><CourseDetail /></Layout></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute><Layout><Users /></Layout></PrivateRoute>} />
          <Route path="/previous-employees" element={<PrivateRoute><Layout><PreviousEmployees /></Layout></PrivateRoute>} />
          <Route path="/mentors" element={<PrivateRoute><Layout><Mentors /></Layout></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><Layout><Reports /></Layout></PrivateRoute>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;

