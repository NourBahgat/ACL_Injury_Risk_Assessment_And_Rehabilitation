import { Routes, Route, Navigate } from 'react-router-dom';
import ProgramSelect from '../pages/ProgramSelect';
import RiskAssessment from '../pages/RiskAssessment';
import Report from '../pages/Report';

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/program-select" replace />} />
            <Route path="/program-select" element={<ProgramSelect />} />
            <Route path="/risk" element={<RiskAssessment />} />
            <Route path="/report" element={<Report />} />
        </Routes>
    );
}

export default AppRoutes;
