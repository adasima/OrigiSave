
import "./App.css";

function App() {
    return (
        <div className="popup-container">
            <h1>OrigiSave</h1>
            <p className="status">Background Service Active</p>
            <div className="features">
                <div className="feature">
                    <span className="icon">🌐</span>
                    <p>Right-click any media to save original</p>
                </div>
                <div className="feature">
                    <span className="icon">✖️</span>
                    <p>X (Twitter) Video & Images Support</p>
                </div>
            </div>
            <div className="footer">
                <small>Stable Version</small>
            </div>
        </div>
    );
}

export default App;
