// src/components/pages/CreateModule.jsx
import React, { useState } from "react";
import { auth } from "../../firebase";
import axios from "axios";
import "./CreateModule.css";

const BASE = "http://localhost:5000";

const ICON_OPTIONS = ["📚","🌊","🏔️","🌋","🏜️","🌪️","⚡","🔥","🌍","🛡️","🧪","💧"];
const COLOR_OPTIONS = [
  "#f59e0b","#06b6d4","#8b5cf6","#10b981","#ef4444",
  "#3b82f6","#ec4899","#f97316","#84cc16","#6366f1",
];

const emptySection = () => ({ tag:"", title:"", content:"", icon:"📖", color:"#3b82f6", image_url:"" });
const emptyQuiz    = () => ({ question:"", option_a:"", option_b:"", option_c:"", option_d:"", correct_answer:"A", explanation:"" });

export default function CreateModule({ editData = null, onDone }) {
  const isEdit = !!editData;

  const [form, setForm] = useState({
    title:       editData?.title       ?? "",
    description: editData?.description ?? "",
    category:    editData?.category    ?? "Natural Disasters",
    icon:        editData?.icon        ?? "📚",
    color:       editData?.color       ?? "#3b82f6",
  });
  const [thumbnail,    setThumbnail]    = useState(null);
  const [thumbPreview, setThumbPreview] = useState(editData?.thumbnail_url ?? "");
  const [sections,     setSections]     = useState(editData?.sections?.length ? editData.sections : [emptySection()]);
  const [quizzes,      setQuizzes]      = useState(editData?.quizzes?.length  ? editData.quizzes  : [emptyQuiz()]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");
  const [activeTab,    setActiveTab]    = useState("info");

  const handleThumb = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setThumbnail(f);
    setThumbPreview(URL.createObjectURL(f));
  };

  const updSec = (i,k,v) => setSections(p => p.map((s,idx) => idx===i ? {...s,[k]:v} : s));
  const updQz  = (i,k,v) => setQuizzes(p  => p.map((q,idx) => idx===i ? {...q,[k]:v} : q));

  const handleSubmit = async (publish) => {
    setError(""); setSuccess("");
    if (!form.title.trim()) { setError("Title is required."); setActiveTab("info"); return; }

    const user = auth.currentUser;
    if (!user) { setError("Not authenticated. Please log in again."); return; }

    setLoading(true);
    const fd = new FormData();
    fd.append("title",        form.title.trim());
    fd.append("description",  form.description);
    fd.append("category",     form.category);
    fd.append("icon",         form.icon);
    fd.append("color",        form.color);
    fd.append("is_published", String(publish));   // "true" or "false"
    fd.append("created_by",   user.uid);
    fd.append("creator_name", user.displayName || user.email || "");
    fd.append("sections",     JSON.stringify(sections));
    fd.append("quizzes",      JSON.stringify(quizzes));
    if (thumbnail) fd.append("thumbnail", thumbnail);

    try {
      if (isEdit) {
        await axios.put(`${BASE}/api/modules/${editData.id}`, fd);
      } else {
        await axios.post(`${BASE}/api/modules`, fd);
      }
      setSuccess(publish ? "✅ Module published! Students can now see it." : "💾 Draft saved!");
      setTimeout(() => onDone && onDone(), 1000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cm-overlay" onClick={(e) => e.target === e.currentTarget && !loading && onDone?.()}>
      <div className="cm-modal">

        {/* ── Header ── */}
        <div className="cm-header">
          <button className="cm-back" onClick={() => !loading && onDone?.()} disabled={loading}>← Back</button>
          <h1 className="cm-title">{isEdit ? "✏️ Edit Module" : "✨ Create Module"}</h1>
          <div className="cm-actions">
            <button className="cm-btn-draft" disabled={loading} onClick={() => handleSubmit(false)}>
              💾 Save Draft
            </button>
            <button className="cm-btn-publish" disabled={loading} onClick={() => handleSubmit(true)}>
              {loading ? <span className="cm-spinner"/> : "🚀 Publish"}
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        {error   && <div className="cm-msg cm-msg-error">⚠️ {error}</div>}
        {success && <div className="cm-msg cm-msg-success">{success}</div>}

        {/* ── Tabs ── */}
        <div className="cm-tabs">
          {[["info","📋 Info"],["content","📄 Slides"],["quiz","❓ Quiz"]].map(([t,label]) => (
            <button key={t} className={`cm-tab ${activeTab===t?"active":""}`} onClick={() => setActiveTab(t)}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Scrollable body ── */}
        <div className="cm-body">

          {/* INFO */}
          {activeTab === "info" && (
            <div className="cm-panel">
              <div className="cm-row">
                <div className="cm-thumb-col">
                  <span className="cm-label">Thumbnail</span>
                  <label className="cm-thumb-upload" style={{borderColor:form.color}}>
                    {thumbPreview
                      ? <img src={thumbPreview} alt="thumb" className="cm-thumb-img"/>
                      : <div className="cm-thumb-ph">{form.icon}<br/><small>Click to upload</small></div>
                    }
                    <input type="file" accept="image/*" onChange={handleThumb} hidden/>
                  </label>
                </div>
                <div className="cm-fields-col">
                  <span className="cm-label">Title *</span>
                  <input className="cm-input" value={form.title} placeholder="e.g. Flood Preparedness"
                    onChange={e => setForm(p=>({...p,title:e.target.value}))}/>

                  <span className="cm-label">Description</span>
                  <textarea className="cm-textarea" rows={3} value={form.description}
                    placeholder="What will students learn?"
                    onChange={e => setForm(p=>({...p,description:e.target.value}))}/>

                  <span className="cm-label">Category</span>
                  <select className="cm-select" value={form.category}
                    onChange={e => setForm(p=>({...p,category:e.target.value}))}>
                    {["Natural Disasters","Climate Change","Emergency Preparedness","Environmental Science","General"]
                      .map(c => <option key={c}>{c}</option>)}
                  </select>

                  <div className="cm-row-inline">
                    <div>
                      <span className="cm-label">Icon</span>
                      <div className="cm-icon-grid">
                        {ICON_OPTIONS.map(ic => (
                          <button key={ic} type="button"
                            className={`cm-icon-btn ${form.icon===ic?"selected":""}`}
                            onClick={() => setForm(p=>({...p,icon:ic}))}>{ic}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="cm-label">Accent Color</span>
                      <div className="cm-color-grid">
                        {COLOR_OPTIONS.map(c => (
                          <button key={c} type="button"
                            className={`cm-color-btn ${form.color===c?"selected":""}`}
                            style={{background:c}}
                            onClick={() => setForm(p=>({...p,color:c}))}/>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONTENT SLIDES */}
          {activeTab === "content" && (
            <div className="cm-panel">
              <div className="cm-sec-header">
                <p className="cm-hint">Each slide is one page students will read through.</p>
                <button className="cm-add-btn" onClick={() => setSections(p=>[...p,emptySection()])}>+ Add Slide</button>
              </div>
              {sections.map((s,i) => (
                <div key={i} className="cm-sec-card" style={{borderLeftColor:s.color||form.color}}>
                  <div className="cm-sec-top">
                    <span className="cm-sec-num">Slide {i+1}</span>
                    <button className="cm-rm-btn" onClick={() => setSections(p=>p.filter((_,x)=>x!==i))}>✕</button>
                  </div>
                  <input className="cm-input" placeholder="Tag (e.g. Introduction)"
                    value={s.tag} onChange={e=>updSec(i,"tag",e.target.value)}/>
                  <input className="cm-input" placeholder="Slide Title *"
                    value={s.title} onChange={e=>updSec(i,"title",e.target.value)}/>
                  <textarea className="cm-textarea" rows={4} placeholder="Content text..."
                    value={s.content} onChange={e=>updSec(i,"content",e.target.value)}/>
                  <input className="cm-input" placeholder="Image URL (optional)"
                    value={s.image_url} onChange={e=>updSec(i,"image_url",e.target.value)}/>
                </div>
              ))}
            </div>
          )}

          {/* QUIZ */}
          {activeTab === "quiz" && (
            <div className="cm-panel">
              <div className="cm-sec-header">
                <p className="cm-hint">Quiz appears after students finish all slides.</p>
                <button className="cm-add-btn" onClick={() => setQuizzes(p=>[...p,emptyQuiz()])}>+ Add Question</button>
              </div>
              {quizzes.map((q,i) => (
                <div key={i} className="cm-quiz-card">
                  <div className="cm-sec-top">
                    <span className="cm-sec-num">Q{i+1}</span>
                    <button className="cm-rm-btn" onClick={() => setQuizzes(p=>p.filter((_,x)=>x!==i))}>✕</button>
                  </div>
                  <input className="cm-input" placeholder="Question *"
                    value={q.question} onChange={e=>updQz(i,"question",e.target.value)}/>
                  <div className="cm-opts-grid">
                    {["a","b","c","d"].map(opt => (
                      <div key={opt} className={`cm-opt ${q.correct_answer===opt.toUpperCase()?"correct":""}`}>
                        <span className="cm-opt-lbl">{opt.toUpperCase()}</span>
                        <input className="cm-input sm" placeholder={`Option ${opt.toUpperCase()}`}
                          value={q[`option_${opt}`]}
                          onChange={e=>updQz(i,`option_${opt}`,e.target.value)}/>
                        <button type="button"
                          className={`cm-chk-btn ${q.correct_answer===opt.toUpperCase()?"active":""}`}
                          onClick={() => updQz(i,"correct_answer",opt.toUpperCase())}
                          title="Mark correct">✓</button>
                      </div>
                    ))}
                  </div>
                  <input className="cm-input" placeholder="Explanation (optional)"
                    value={q.explanation} onChange={e=>updQz(i,"explanation",e.target.value)}/>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}