import React from 'react';
import '../styles/styles.css';

const Portfolio = () => {
    return (
        <div className="portfolio-container">
            <h1>My Projects</h1>
            <div className="CDC habitat project">
                <img src="../assets/images/CDC_Genere.png" alt="Project 1" />
                <h3>Project Title 1</h3>
                <p>A short description of the project.</p>
            </div>
            <div className="France Air project">
                <img src="../assets/images/FranceAir.png" alt="Project 2" />
                <h3>Project Title 2</h3>
                <p>A short description of the project.</p>
            </div>
            {/* Add more project cards as needed */}
        </div>
    );
};

export default Portfolio;