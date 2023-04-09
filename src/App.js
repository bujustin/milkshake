import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; 
import Base from "./Base.js";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Base />} />
      </Routes>
    </Router>
  );
}

export default App;
