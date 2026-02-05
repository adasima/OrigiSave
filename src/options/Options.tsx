import { useEffect, useState } from "react";
import { PRESET_TEMPLATES, DEFAULT_TEMPLATE } from "../common/naming";

const Options = () => {
    const [template, setTemplate] = useState<string>(DEFAULT_TEMPLATE);
    const [customTemplate, setCustomTemplate] = useState<string>("");
    const [status, setStatus] = useState<string>("");

    useEffect(() => {
        chrome.storage.local.get(["namingTemplate"], (res: { namingTemplate?: string }) => {
            if (res.namingTemplate) {
                setTemplate(res.namingTemplate);
                // If it's not a preset, it must be custom
                if (!Object.values(PRESET_TEMPLATES).includes(res.namingTemplate as any)) {
                    setCustomTemplate(res.namingTemplate);
                }
            }
        });
    }, []);


    const saveSettings = () => {
        const finalTemplate = customTemplate || template;
        chrome.storage.local.set({ namingTemplate: finalTemplate }, () => {
            setStatus("設定を保存しました。");
            setTimeout(() => setStatus(""), 2000);
        });
    };

    return (
        <div className="options-container">
            <header className="options-header">
                <h1> Twidis Settings</h1>
            </header>

            <section className="settings-section">
                <h2>📁 命名規則の設定</h2>
                <p className="description">ダウンロードするファイル名の形式を選択または入力してください。</p>

                <div className="preset-list">
                    {Object.entries(PRESET_TEMPLATES).map(([key, value]) => (
                        <label key={key} className="preset-item">
                            <input
                                type="radio"
                                name="template"
                                value={value}
                                checked={template === value && !customTemplate}
                                onChange={(e) => {
                                    setTemplate(e.target.value);
                                    setCustomTemplate("");
                                }}
                            />
                            <div className="preset-info">
                                <span className="preset-name">{key}</span>
                                <code className="preset-value">{value}</code>
                            </div>
                        </label>
                    ))}
                </div>

                <div className="custom-input-group">
                    <label htmlFor="custom-template">カスタムテンプレート:</label>
                    <input
                        id="custom-template"
                        type="text"
                        value={customTemplate}
                        onChange={(e) => setCustomTemplate(e.target.value)}
                        placeholder="{original_name}_orig.{ext}"
                    />
                </div>

                <div className="variables-hint">
                    <h3>利用可能な変数</h3>
                    <ul>
                        <li><code>{`{original_name}`}</code>: 元のファイル名 (X等)</li>
                        <li><code>{`{author}`}</code>: 投稿者</li>
                        <li><code>{`{tweet_id}`}</code>: ツイートID</li>
                        <li><code>{`{site}`}</code>: サイトドメイン</li>
                        <li><code>{`{date}`}</code>: YYYYMMDD</li>
                        <li><code>{`{id}`}</code>: ランダムID</li>
                    </ul>
                </div>
            </section>

            <footer className="options-footer">
                {status && <span className="status-msg">{status}</span>}
                <button className="save-btn" onClick={saveSettings}>保存する</button>
            </footer>

            <style>{`
                .options-container {
                    max-width: 600px;
                    margin: 40px auto;
                    padding: 30px;
                    background: #1a1a1a;
                    color: #fff;
                    border-radius: 16px;
                    font-family: 'Inter', system-ui, sans-serif;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
                .options-header h1 {
                    font-size: 24px;
                    margin-bottom: 30px;
                    background: linear-gradient(135deg, #1d9bf0, #8ecdf8);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .settings-section h2 {
                    font-size: 18px;
                    margin-bottom: 10px;
                }
                .description {
                    color: #888;
                    font-size: 14px;
                    margin-bottom: 20px;
                }
                .preset-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .preset-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 12px;
                    background: #2a2a2a;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .preset-item:hover {
                    background: #333;
                }
                .preset-name {
                    font-weight: 600;
                    font-size: 14px;
                    margin-right: 10px;
                }
                .preset-value {
                    color: #1d9bf0;
                    font-size: 12px;
                }
                .custom-input-group {
                    margin-bottom: 24px;
                }
                .custom-input-group label {
                    display: block;
                    font-size: 14px;
                    margin-bottom: 8px;
                }
                .custom-input-group input {
                    width: 100%;
                    padding: 12px;
                    background: #2a2a2a;
                    border: 1px solid #333;
                    border-radius: 8px;
                    color: #fff;
                    box-sizing: border-box;
                }
                .variables-hint ul {
                    list-style: none;
                    padding: 0;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    font-size: 12px;
                    color: #aaa;
                }
                .variables-hint code {
                    color: #8ecdf8;
                }
                .options-footer {
                    margin-top: 40px;
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 20px;
                }
                .status-msg {
                    color: #4BB543;
                    font-size: 14px;
                }
                .save-btn {
                    background: #1d9bf0;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 30px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .save-btn:hover {
                    transform: scale(1.05);
                    background: #1a8cd8;
                }
            `}</style>
        </div>
    );
};

export default Options;
