import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Portfolio from './components/Portfolio';
import About from './components/About';
import Resume from './components/Resume';
import Contact from './components/Contact';
import Home from './components/Home'; // Import Home Component

function App() {
    const basename = import.meta.env.BASE_URL;
    return (
        <Router basename={basename}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/about" element={<About />} />
                <Route path="/resume" element={<Resume />} />
                <Route path="/contact" element={<Contact />} />
            </Routes>
        </Router>
    );
}

export default App;
