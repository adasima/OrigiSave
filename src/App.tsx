import { } from "react";
import "./App.css";

function App() {
  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">OrigiSave</h1>
      </header>

      <main className="main">
        <div className="status-ready">
          <span className="icon">✅</span>
          READY
        </div>
        <p className="description">
          右クリックメニューからオリジナル画像を保存できます。
        </p>
      </main>

      <footer className="footer">
        <button className="button-link" onClick={openOptions}>⚙️ Settings</button>
      </footer>
    </div>
  );
}

export default App;

